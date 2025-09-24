import { ethers } from "ethers"

declare global {
  interface Window {
    ethereum?: any
  }
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

export class EnhancedMetaMask {
  private provider: ethers.BrowserProvider | null = null
  private signer: ethers.JsonRpcSigner | null = null
  private currentAddress: string | null = null

  constructor() {
    if (typeof window !== "undefined" && window.ethereum) {
      this.provider = new ethers.BrowserProvider(window.ethereum)
    }
  }

  async isInstalled(): Promise<boolean> {
    return typeof window !== "undefined" && !!window.ethereum && !!window.ethereum.isMetaMask
  }

  async connect(): Promise<{ address: string; signer: ethers.JsonRpcSigner }> {
    if (!this.provider) {
      throw new Error("MetaMask not detected. Please install MetaMask.")
    }

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      })

      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts found. Please unlock MetaMask.")
      }

      this.signer = await this.provider.getSigner()
      this.currentAddress = accounts[0]

      // Verify we can get the address from signer
      const signerAddress = await this.signer.getAddress()
      if (signerAddress.toLowerCase() !== this.currentAddress.toLowerCase()) {
        throw new Error("Address mismatch between MetaMask and signer")
      }

      return {
        address: this.currentAddress,
        signer: this.signer,
      }
    } catch (error: any) {
      if (error.code === 4001) {
        throw new Error("User rejected the connection request")
      }
      throw new Error(`Failed to connect to MetaMask: ${error.message}`)
    }
  }

  async switchToNetwork(networkConfig: NetworkConfig): Promise<void> {
    if (!window.ethereum) {
      throw new Error("MetaMask not detected")
    }

    try {
      // Try to switch to the network
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: networkConfig.chainId }],
      })
    } catch (switchError: any) {
      // If the network doesn't exist, add it
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [networkConfig],
          })
        } catch (addError: any) {
          throw new Error(`Failed to add network: ${addError.message}`)
        }
      } else {
        throw new Error(`Failed to switch network: ${switchError.message}`)
      }
    }
  }

  async switchToBase(): Promise<void> {
    const baseConfig: NetworkConfig = {
      chainId: "0x2105", // 8453 in hex
      chainName: "Base Mainnet",
      nativeCurrency: {
        name: "Ethereum",
        symbol: "ETH",
        decimals: 18,
      },
      rpcUrls: ["https://mainnet.base.org"],
      blockExplorerUrls: ["https://basescan.org"],
    }

    await this.switchToNetwork(baseConfig)
  }

  async getCurrentNetwork(): Promise<{ chainId: number; name: string }> {
    if (!this.provider) {
      throw new Error("MetaMask not connected")
    }

    try {
      const network = await this.provider.getNetwork()
      const networkNames: { [key: string]: string } = {
        "1": "Ethereum Mainnet",
        "5": "Goerli Testnet",
        "11155111": "Sepolia Testnet",
        "137": "Polygon Mainnet",
        "80001": "Polygon Mumbai",
        "56": "BSC Mainnet",
        "97": "BSC Testnet",
        "8453": "Base Mainnet",
        "84531": "Base Goerli",
        "84532": "Base Sepolia",
      }

      return {
        chainId: Number(network.chainId),
        name: networkNames[network.chainId.toString()] || `Unknown (${network.chainId})`,
      }
    } catch (error: any) {
      throw new Error(`Failed to get network: ${error.message}`)
    }
  }

  async getBalance(address?: string): Promise<string> {
    if (!this.provider) {
      throw new Error("MetaMask not connected")
    }

    try {
      const targetAddress = address || this.currentAddress
      if (!targetAddress) {
        throw new Error("No address available")
      }

      const balance = await this.provider.getBalance(targetAddress)
      return ethers.formatEther(balance)
    } catch (error: any) {
      throw new Error(`Failed to get balance: ${error.message}`)
    }
  }

  async addToken(tokenAddress: string, symbol: string, decimals: number, image?: string): Promise<void> {
    if (!window.ethereum) {
      throw new Error("MetaMask not detected")
    }

    try {
      await window.ethereum.request({
        method: "wallet_watchAsset",
        params: {
          type: "ERC20",
          options: {
            address: tokenAddress,
            symbol: symbol,
            decimals: decimals,
            image: image,
          },
        },
      })
    } catch (error: any) {
      throw new Error(`Failed to add token: ${error.message}`)
    }
  }

  async signMessage(message: string): Promise<string> {
    if (!this.signer) {
      throw new Error("MetaMask not connected")
    }

    try {
      return await this.signer.signMessage(message)
    } catch (error: any) {
      if (error.code === 4001) {
        throw new Error("User rejected the signing request")
      }
      throw new Error(`Failed to sign message: ${error.message}`)
    }
  }

  async sendTransaction(transaction: ethers.TransactionRequest): Promise<string> {
    if (!this.signer) {
      throw new Error("MetaMask not connected")
    }

    try {
      const tx = await this.signer.sendTransaction(transaction)
      return tx.hash
    } catch (error: any) {
      if (error.code === 4001) {
        throw new Error("User rejected the transaction")
      }
      throw new Error(`Transaction failed: ${error.message}`)
    }
  }

  async estimateGas(transaction: ethers.TransactionRequest): Promise<bigint> {
    if (!this.provider) {
      throw new Error("MetaMask not connected")
    }

    try {
      return await this.provider.estimateGas(transaction)
    } catch (error: any) {
      throw new Error(`Gas estimation failed: ${error.message}`)
    }
  }

  async getCurrentGasPrice(): Promise<bigint> {
    if (!this.provider) {
      throw new Error("MetaMask not connected")
    }

    try {
      const feeData = await this.provider.getFeeData()
      return feeData.gasPrice || ethers.parseUnits("20", "gwei")
    } catch (error: any) {
      throw new Error(`Failed to get gas price: ${error.message}`)
    }
  }

  onAccountsChanged(callback: (accounts: string[]) => void): void {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", callback)
    }
  }

  onChainChanged(callback: (chainId: string) => void): void {
    if (window.ethereum) {
      window.ethereum.on("chainChanged", callback)
    }
  }

  onDisconnect(callback: () => void): void {
    if (window.ethereum) {
      window.ethereum.on("disconnect", callback)
    }
  }

  removeAllListeners(): void {
    if (window.ethereum) {
      window.ethereum.removeAllListeners("accountsChanged")
      window.ethereum.removeAllListeners("chainChanged")
      window.ethereum.removeAllListeners("disconnect")
    }
  }

  disconnect(): void {
    this.provider = null
    this.signer = null
    this.currentAddress = null
    this.removeAllListeners()
  }

  isConnected(): boolean {
    return !!(this.provider && this.signer && this.currentAddress)
  }

  getCurrentAddress(): string | null {
    return this.currentAddress
  }

  getSigner(): ethers.JsonRpcSigner | null {
    return this.signer
  }

  getProvider(): ethers.BrowserProvider | null {
    return this.provider
  }
}

// Helper function to redirect to MetaMask installation
export function redirectToMetaMaskInstall(): void {
  if (typeof window !== "undefined") {
    window.open("https://metamask.io/download/", "_blank")
  }
}

// Helper function to check if we're in a browser environment
export function isBrowser(): boolean {
  return typeof window !== "undefined"
}

// Helper function to check if MetaMask is installed
export async function isMetaMaskInstalled(): Promise<boolean> {
  return typeof window !== "undefined" && !!window.ethereum && !!window.ethereum.isMetaMask
}

export default EnhancedMetaMask
