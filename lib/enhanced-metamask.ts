import { ethers } from "ethers"

export interface MetaMaskState {
  isInstalled: boolean
  isConnected: boolean
  account: string | null
  chainId: string | null
  balance: string
  networkName: string
}

export interface MetaMaskCallbacks {
  onAccountsChanged?: (accounts: string[]) => void
  onChainChanged?: (chainId: string) => void
  onConnect?: (connectInfo: { chainId: string }) => void
  onDisconnect?: (error: { code: number; message: string }) => void
}

export class EnhancedMetaMask {
  private ethereum: any
  private provider: ethers.BrowserProvider | null = null
  private signer: ethers.JsonRpcSigner | null = null
  private state: MetaMaskState = {
    isInstalled: false,
    isConnected: false,
    account: null,
    chainId: null,
    balance: "0",
    networkName: "Unknown",
  }
  private callbacks: MetaMaskCallbacks = {}

  constructor(callbacks?: MetaMaskCallbacks) {
    this.callbacks = callbacks || {}
    this.ethereum = (window as any).ethereum
    this.state.isInstalled = !!this.ethereum
    this.initializeEventListeners()
  }

  private initializeEventListeners() {
    if (!this.ethereum) return

    this.ethereum.on("accountsChanged", (accounts: string[]) => {
      this.state.account = accounts[0] || null
      this.state.isConnected = !!accounts[0]
      if (this.callbacks.onAccountsChanged) {
        this.callbacks.onAccountsChanged(accounts)
      }
      if (accounts[0]) {
        this.updateBalance()
      }
    })

    this.ethereum.on("chainChanged", (chainId: string) => {
      this.state.chainId = chainId
      this.updateNetworkName(chainId)
      if (this.callbacks.onChainChanged) {
        this.callbacks.onChainChanged(chainId)
      }
    })

    this.ethereum.on("connect", (connectInfo: { chainId: string }) => {
      this.state.chainId = connectInfo.chainId
      this.updateNetworkName(connectInfo.chainId)
      if (this.callbacks.onConnect) {
        this.callbacks.onConnect(connectInfo)
      }
    })

    this.ethereum.on("disconnect", (error: { code: number; message: string }) => {
      this.state.isConnected = false
      this.state.account = null
      this.state.balance = "0"
      if (this.callbacks.onDisconnect) {
        this.callbacks.onDisconnect(error)
      }
    })
  }

  private updateNetworkName(chainId: string) {
    const networks: { [key: string]: string } = {
      "0x1": "Ethereum Mainnet",
      "0x89": "Polygon",
      "0xa": "Optimism",
      "0xa4b1": "Arbitrum One",
      "0x2105": "Base",
      "0x38": "BSC",
      "0x5": "Goerli Testnet",
      "0xaa36a7": "Sepolia Testnet",
    }
    this.state.networkName = networks[chainId] || `Chain ${chainId}`
  }

  private async updateBalance() {
    if (!this.provider || !this.state.account) return

    try {
      const balance = await this.provider.getBalance(this.state.account)
      this.state.balance = ethers.formatEther(balance)
    } catch (error) {
      console.error("Error updating balance:", error)
      this.state.balance = "0"
    }
  }

  async connect(): Promise<{ account: string; chainId: string; balance: string }> {
    if (!this.ethereum) {
      throw new Error("MetaMask is not installed")
    }

    try {
      const accounts = await this.ethereum.request({
        method: "eth_requestAccounts",
      })

      if (accounts.length === 0) {
        throw new Error("No accounts found")
      }

      this.provider = new ethers.BrowserProvider(this.ethereum)
      this.signer = await this.provider.getSigner()

      this.state.account = accounts[0]
      this.state.isConnected = true

      // Get chain ID
      const chainId = await this.ethereum.request({ method: "eth_chainId" })
      this.state.chainId = chainId
      this.updateNetworkName(chainId)

      // Update balance
      await this.updateBalance()

      return {
        account: this.state.account,
        chainId: this.state.chainId,
        balance: this.state.balance,
      }
    } catch (error: any) {
      console.error("Connection error:", error)
      throw new Error(`Failed to connect: ${error.message}`)
    }
  }

  async disconnect(): Promise<void> {
    this.state.isConnected = false
    this.state.account = null
    this.state.balance = "0"
    this.provider = null
    this.signer = null
  }

  async switchNetwork(chainId: string): Promise<void> {
    if (!this.ethereum) {
      throw new Error("MetaMask is not installed")
    }

    try {
      await this.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId }],
      })
    } catch (error: any) {
      if (error.code === 4902) {
        throw new Error("Network not added to MetaMask")
      }
      throw new Error(`Failed to switch network: ${error.message}`)
    }
  }

  async addNetwork(networkConfig: {
    chainId: string
    chainName: string
    nativeCurrency: { name: string; symbol: string; decimals: number }
    rpcUrls: string[]
    blockExplorerUrls?: string[]
  }): Promise<void> {
    if (!this.ethereum) {
      throw new Error("MetaMask is not installed")
    }

    try {
      await this.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [networkConfig],
      })
    } catch (error: any) {
      throw new Error(`Failed to add network: ${error.message}`)
    }
  }

  async signMessage(message: string): Promise<string> {
    if (!this.signer) {
      throw new Error("Not connected to MetaMask")
    }

    try {
      return await this.signer.signMessage(message)
    } catch (error: any) {
      throw new Error(`Failed to sign message: ${error.message}`)
    }
  }

  async sendTransaction(transaction: {
    to: string
    value?: string
    data?: string
    gasLimit?: string
    gasPrice?: string
  }): Promise<string> {
    if (!this.signer) {
      throw new Error("Not connected to MetaMask")
    }

    try {
      const tx = await this.signer.sendTransaction(transaction)
      return tx.hash
    } catch (error: any) {
      throw new Error(`Transaction failed: ${error.message}`)
    }
  }

  getState(): MetaMaskState {
    return { ...this.state }
  }

  getProvider(): ethers.BrowserProvider | null {
    return this.provider
  }

  getSigner(): ethers.JsonRpcSigner | null {
    return this.signer
  }

  isInstalled(): boolean {
    return this.state.isInstalled
  }

  isConnected(): boolean {
    return this.state.isConnected
  }

  getAccount(): string | null {
    return this.state.account
  }

  getChainId(): string | null {
    return this.state.chainId
  }

  getBalance(): string {
    return this.state.balance
  }

  getNetworkName(): string {
    return this.state.networkName
  }
}

// Utility function to redirect to MetaMask installation
export function redirectToMetaMaskInstall(): void {
  window.open("https://metamask.io/download/", "_blank")
}

// Create a singleton instance
let metaMaskInstance: EnhancedMetaMask | null = null

export function getMetaMaskInstance(callbacks?: MetaMaskCallbacks): EnhancedMetaMask {
  if (!metaMaskInstance) {
    metaMaskInstance = new EnhancedMetaMask(callbacks)
  }
  return metaMaskInstance
}

export default EnhancedMetaMask
