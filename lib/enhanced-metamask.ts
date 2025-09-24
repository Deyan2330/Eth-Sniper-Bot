import { ethers } from "ethers"

declare global {
  interface Window {
    ethereum?: any
  }
}

export interface MetaMaskError extends Error {
  code: number
  data?: any
}

export interface NetworkConfig {
  chainId: string
  chainName: string
  nativeCurrency: {
    name: string
    symbol: string
    decimals: number
  }
  rpcUrls: string[]
  blockExplorerUrls: string[]
}

export interface MetaMaskState {
  isInstalled: boolean
  isConnected: boolean
  account: string | null
  chainId: number | null
  balance: string
  networkName: string
}

export interface MetaMaskCallbacks {
  onAccountChanged?: (account: string | null) => void
  onChainChanged?: (chainId: number) => void
  onConnect?: (account: string) => void
  onDisconnect?: () => void
}

export const BASE_NETWORK: NetworkConfig = {
  chainId: "0x2105", // 8453 in hex
  chainName: "Base",
  nativeCurrency: {
    name: "Ethereum",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: ["https://mainnet.base.org"],
  blockExplorerUrls: ["https://basescan.org"],
}

export const BASE_SEPOLIA_NETWORK: NetworkConfig = {
  chainId: "0x14A34", // 84532 in hex
  chainName: "Base Sepolia",
  nativeCurrency: {
    name: "Ethereum",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: ["https://sepolia.base.org"],
  blockExplorerUrls: ["https://sepolia.basescan.org"],
}

export class EnhancedMetaMask {
  private provider: any = null
  private signer: ethers.Signer | null = null
  private account: string | null = null
  private chainId: number | null = null
  private balance = "0"
  private networkName = "Unknown"
  private callbacks: MetaMaskCallbacks = {}

  constructor(callbacks?: MetaMaskCallbacks) {
    this.callbacks = callbacks || {}

    if (typeof window !== "undefined" && window.ethereum) {
      this.provider = window.ethereum
      this.setupEventListeners()
      this.initializeState()
    }
  }

  private async initializeState() {
    try {
      if (this.provider) {
        // Check if already connected
        const accounts = await this.provider.request({ method: "eth_accounts" })
        if (accounts && accounts.length > 0) {
          this.account = accounts[0]
          await this.updateState()
        }
      }
    } catch (error) {
      console.error("Failed to initialize MetaMask state:", error)
    }
  }

  private async updateState() {
    if (!this.provider || !this.account) return

    try {
      // Get chain ID
      const chainId = await this.provider.request({ method: "eth_chainId" })
      this.chainId = Number.parseInt(chainId, 16)

      // Get balance
      const balance = await this.provider.request({
        method: "eth_getBalance",
        params: [this.account, "latest"],
      })
      this.balance = ethers.formatEther(balance)

      // Get network name
      this.networkName = this.getNetworkName(this.chainId)
    } catch (error) {
      console.error("Failed to update MetaMask state:", error)
    }
  }

  private getNetworkName(chainId: number): string {
    const networkNames: { [key: number]: string } = {
      1: "Ethereum Mainnet",
      5: "Goerli Testnet",
      11155111: "Sepolia Testnet",
      137: "Polygon Mainnet",
      80001: "Polygon Mumbai",
      56: "BSC Mainnet",
      97: "BSC Testnet",
      8453: "Base Mainnet",
      84531: "Base Goerli",
      84532: "Base Sepolia",
    }
    return networkNames[chainId] || `Unknown Network (${chainId})`
  }

  private setupEventListeners() {
    if (!this.provider) return

    this.provider.on("accountsChanged", async (accounts: string[]) => {
      const newAccount = accounts[0] || null
      this.account = newAccount

      if (newAccount) {
        await this.updateState()
        this.callbacks.onAccountChanged?.(newAccount)
      } else {
        this.signer = null
        this.balance = "0"
        this.callbacks.onDisconnect?.()
      }
    })

    this.provider.on("chainChanged", async (chainId: string) => {
      this.chainId = Number.parseInt(chainId, 16)
      this.networkName = this.getNetworkName(this.chainId)
      await this.updateState()
      this.callbacks.onChainChanged?.(this.chainId)
    })

    this.provider.on("connect", (connectInfo: { chainId: string }) => {
      this.chainId = Number.parseInt(connectInfo.chainId, 16)
      this.networkName = this.getNetworkName(this.chainId)
      if (this.account) {
        this.callbacks.onConnect?.(this.account)
      }
    })

    this.provider.on("disconnect", () => {
      this.account = null
      this.signer = null
      this.chainId = null
      this.balance = "0"
      this.networkName = "Unknown"
      this.callbacks.onDisconnect?.()
    })
  }

  getState(): MetaMaskState {
    return {
      isInstalled: this.isMetaMaskInstalled(),
      isConnected: !!this.account,
      account: this.account,
      chainId: this.chainId,
      balance: this.balance,
      networkName: this.networkName,
    }
  }

  isMetaMaskInstalled(): boolean {
    return typeof window !== "undefined" && !!window.ethereum && !!window.ethereum.isMetaMask
  }

  async connect(): Promise<string> {
    if (!this.isMetaMaskInstalled()) {
      throw new Error("MetaMask is not installed")
    }

    try {
      const accounts = await this.provider.request({
        method: "eth_requestAccounts",
      })

      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts found")
      }

      this.account = accounts[0]
      const ethersProvider = new ethers.BrowserProvider(this.provider)
      this.signer = await ethersProvider.getSigner()

      await this.updateState()
      this.callbacks.onConnect?.(this.account)

      return this.account
    } catch (error: any) {
      if (error.code === 4001) {
        throw new Error("User rejected the connection request")
      }
      throw new Error(`Failed to connect to MetaMask: ${error.message}`)
    }
  }

  async switchToNetwork(network: NetworkConfig): Promise<void> {
    if (!this.provider) {
      throw new Error("MetaMask is not available")
    }

    try {
      await this.provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: network.chainId }],
      })
    } catch (error: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (error.code === 4902) {
        try {
          await this.provider.request({
            method: "wallet_addEthereumChain",
            params: [network],
          })
        } catch (addError: any) {
          throw new Error(`Failed to add network: ${addError.message}`)
        }
      } else {
        throw new Error(`Failed to switch network: ${error.message}`)
      }
    }
  }

  async switchToBase(): Promise<void> {
    await this.switchToNetwork(BASE_NETWORK)
  }

  async switchToBaseSepolia(): Promise<void> {
    await this.switchToNetwork(BASE_SEPOLIA_NETWORK)
  }

  async getCurrentNetwork(): Promise<{ chainId: number; name: string }> {
    if (!this.provider) {
      throw new Error("MetaMask is not available")
    }

    const chainId = await this.provider.request({ method: "eth_chainId" })
    const chainIdNumber = Number.parseInt(chainId, 16)

    return {
      chainId: chainIdNumber,
      name: this.getNetworkName(chainIdNumber),
    }
  }

  async getBalance(address?: string): Promise<string> {
    if (!this.provider) {
      throw new Error("MetaMask is not available")
    }

    const targetAddress = address || this.account
    if (!targetAddress) {
      throw new Error("No address provided")
    }

    const balance = await this.provider.request({
      method: "eth_getBalance",
      params: [targetAddress, "latest"],
    })

    return ethers.formatEther(balance)
  }

  async addToken(tokenAddress: string, tokenSymbol: string, tokenDecimals: number): Promise<void> {
    if (!this.provider) {
      throw new Error("MetaMask is not available")
    }

    try {
      await this.provider.request({
        method: "wallet_watchAsset",
        params: {
          type: "ERC20",
          options: {
            address: tokenAddress,
            symbol: tokenSymbol,
            decimals: tokenDecimals,
          },
        },
      })
    } catch (error: any) {
      throw new Error(`Failed to add token: ${error.message}`)
    }
  }

  async signMessage(message: string): Promise<string> {
    if (!this.signer) {
      throw new Error("No signer available")
    }

    return await this.signer.signMessage(message)
  }

  async sendTransaction(transaction: any): Promise<string> {
    if (!this.signer) {
      throw new Error("No signer available")
    }

    const tx = await this.signer.sendTransaction(transaction)
    return tx.hash
  }

  getAccount(): string | null {
    return this.account
  }

  getSigner(): ethers.Signer | null {
    return this.signer
  }

  getChainId(): number | null {
    return this.chainId
  }

  isConnected(): boolean {
    return !!this.account && !!this.signer
  }

  disconnect(): void {
    this.account = null
    this.signer = null
    this.chainId = null
    this.balance = "0"
    this.networkName = "Unknown"
  }
}

// Helper functions
export function isMetaMaskInstalled(): boolean {
  return typeof window !== "undefined" && !!window.ethereum && !!window.ethereum.isMetaMask
}

export function redirectToMetaMaskInstall(): void {
  window.open("https://metamask.io/download/", "_blank")
}

export function getMetaMaskDownloadUrl(): string {
  return "https://metamask.io/download/"
}

export async function detectMetaMaskProvider(): Promise<any> {
  if (typeof window === "undefined") return null

  return new Promise((resolve) => {
    if (window.ethereum) {
      resolve(window.ethereum)
    } else {
      const handleEthereum = () => {
        if (window.ethereum) {
          resolve(window.ethereum)
        } else {
          resolve(null)
        }
      }

      window.addEventListener("ethereum#initialized", handleEthereum, { once: true })

      setTimeout(() => {
        handleEthereum()
      }, 3000)
    }
  })
}

// Create a singleton instance
export const metaMask = new EnhancedMetaMask()

// Export default
export default EnhancedMetaMask
