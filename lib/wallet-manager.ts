import { ethers } from "ethers"
import { EnhancedMetaMask } from "./enhanced-metamask"

export interface WalletConfig {
  type: "metamask" | "private_key"
  privateKey?: string
  rpcUrl?: string
}

export interface WalletInfo {
  address: string
  balance: string
  chainId: number
  networkName: string
  isConnected: boolean
}

export class WalletManager {
  private provider: ethers.Provider | null = null
  private signer: ethers.Signer | null = null
  private metaMask: EnhancedMetaMask | null = null
  private walletType: "metamask" | "private_key" | null = null
  private currentAddress: string | null = null

  constructor() {
    this.metaMask = new EnhancedMetaMask()
  }

  async connectMetaMask(): Promise<WalletInfo> {
    if (!this.metaMask) {
      throw new Error("MetaMask not initialized")
    }

    try {
      const { address, signer } = await this.metaMask.connect()
      this.signer = signer
      this.walletType = "metamask"
      this.currentAddress = address

      // Get provider from MetaMask
      if (typeof window !== "undefined" && window.ethereum) {
        this.provider = new ethers.BrowserProvider(window.ethereum)
      }

      const walletInfo = await this.getWalletInfo()
      return walletInfo
    } catch (error: any) {
      throw new Error(`Failed to connect MetaMask: ${error.message}`)
    }
  }

  async connectPrivateKey(privateKey: string, rpcUrl: string): Promise<WalletInfo> {
    try {
      // Validate private key format
      if (!privateKey.startsWith("0x")) {
        privateKey = "0x" + privateKey
      }

      if (privateKey.length !== 66) {
        throw new Error("Invalid private key length")
      }

      // Create provider and signer
      this.provider = new ethers.JsonRpcProvider(rpcUrl)
      this.signer = new ethers.Wallet(privateKey, this.provider)
      this.walletType = "private_key"
      this.currentAddress = await this.signer.getAddress()

      const walletInfo = await this.getWalletInfo()
      return walletInfo
    } catch (error: any) {
      throw new Error(`Failed to connect with private key: ${error.message}`)
    }
  }

  async getWalletInfo(): Promise<WalletInfo> {
    if (!this.provider || !this.signer || !this.currentAddress) {
      throw new Error("Wallet not connected")
    }

    try {
      const [balance, network] = await Promise.all([
        this.provider.getBalance(this.currentAddress),
        this.provider.getNetwork(),
      ])

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
        address: this.currentAddress,
        balance: ethers.formatEther(balance),
        chainId: Number(network.chainId),
        networkName: networkNames[network.chainId.toString()] || `Unknown (${network.chainId})`,
        isConnected: true,
      }
    } catch (error: any) {
      throw new Error(`Failed to get wallet info: ${error.message}`)
    }
  }

  async switchNetwork(chainId: number): Promise<void> {
    if (this.walletType === "metamask" && this.metaMask) {
      await this.metaMask.switchToNetwork({
        chainId: `0x${chainId.toString(16)}`,
        chainName: "Custom Network",
        nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
        rpcUrls: [""],
        blockExplorerUrls: [""],
      })
    } else {
      throw new Error("Network switching only supported with MetaMask")
    }
  }

  async sendTransaction(transaction: ethers.TransactionRequest): Promise<string> {
    if (!this.signer) {
      throw new Error("Wallet not connected")
    }

    try {
      const tx = await this.signer.sendTransaction(transaction)
      return tx.hash
    } catch (error: any) {
      throw new Error(`Transaction failed: ${error.message}`)
    }
  }

  async signMessage(message: string): Promise<string> {
    if (!this.signer) {
      throw new Error("Wallet not connected")
    }

    try {
      return await this.signer.signMessage(message)
    } catch (error: any) {
      throw new Error(`Message signing failed: ${error.message}`)
    }
  }

  async getTokenBalance(tokenAddress: string, decimals = 18): Promise<string> {
    if (!this.provider || !this.currentAddress) {
      throw new Error("Wallet not connected")
    }

    try {
      if (tokenAddress === "0x0000000000000000000000000000000000000000") {
        const balance = await this.provider.getBalance(this.currentAddress)
        return ethers.formatEther(balance)
      }

      const tokenContract = new ethers.Contract(
        tokenAddress,
        ["function balanceOf(address) view returns (uint256)"],
        this.provider,
      )

      const balance = await tokenContract.balanceOf(this.currentAddress)
      return ethers.formatUnits(balance, decimals)
    } catch (error: any) {
      throw new Error(`Failed to get token balance: ${error.message}`)
    }
  }

  async estimateGas(transaction: ethers.TransactionRequest): Promise<string> {
    if (!this.provider) {
      throw new Error("Provider not available")
    }

    try {
      const gasEstimate = await this.provider.estimateGas(transaction)
      return gasEstimate.toString()
    } catch (error: any) {
      throw new Error(`Gas estimation failed: ${error.message}`)
    }
  }

  async getCurrentGasPrice(): Promise<string> {
    if (!this.provider) {
      throw new Error("Provider not available")
    }

    try {
      const feeData = await this.provider.getFeeData()
      const gasPrice = feeData.gasPrice || ethers.parseUnits("20", "gwei")
      return ethers.formatUnits(gasPrice, "gwei")
    } catch (error: any) {
      throw new Error(`Failed to get gas price: ${error.message}`)
    }
  }

  async waitForTransaction(txHash: string, confirmations = 1): Promise<ethers.TransactionReceipt | null> {
    if (!this.provider) {
      throw new Error("Provider not available")
    }

    try {
      return await this.provider.waitForTransaction(txHash, confirmations)
    } catch (error: any) {
      throw new Error(`Failed to wait for transaction: ${error.message}`)
    }
  }

  async addToken(tokenAddress: string, symbol: string, decimals: number): Promise<void> {
    if (this.walletType === "metamask" && this.metaMask) {
      await this.metaMask.addToken(tokenAddress, symbol, decimals)
    } else {
      throw new Error("Adding tokens only supported with MetaMask")
    }
  }

  disconnect(): void {
    this.provider = null
    this.signer = null
    this.walletType = null
    this.currentAddress = null

    if (this.metaMask) {
      this.metaMask.disconnect()
    }
  }

  isConnected(): boolean {
    return !!(this.provider && this.signer && this.currentAddress)
  }

  getWalletType(): "metamask" | "private_key" | null {
    return this.walletType
  }

  getCurrentAddress(): string | null {
    return this.currentAddress
  }

  getSigner(): ethers.Signer | null {
    return this.signer
  }

  getProvider(): ethers.Provider | null {
    return this.provider
  }

  async generateRandomWallet(): Promise<{
    address: string
    privateKey: string
    mnemonic: string
  }> {
    try {
      const wallet = ethers.Wallet.createRandom()
      return {
        address: wallet.address,
        privateKey: wallet.privateKey,
        mnemonic: wallet.mnemonic?.phrase || "",
      }
    } catch (error: any) {
      throw new Error(`Failed to generate wallet: ${error.message}`)
    }
  }

  async importFromMnemonic(
    mnemonic: string,
    index = 0,
  ): Promise<{
    address: string
    privateKey: string
  }> {
    try {
      const wallet = ethers.Wallet.fromPhrase(mnemonic, undefined, `m/44'/60'/0'/0/${index}`)
      return {
        address: wallet.address,
        privateKey: wallet.privateKey,
      }
    } catch (error: any) {
      throw new Error(`Failed to import from mnemonic: ${error.message}`)
    }
  }

  async validateAddress(address: string): Promise<boolean> {
    try {
      return ethers.isAddress(address)
    } catch {
      return false
    }
  }

  async validatePrivateKey(privateKey: string): Promise<boolean> {
    try {
      if (!privateKey.startsWith("0x")) {
        privateKey = "0x" + privateKey
      }

      if (privateKey.length !== 66) {
        return false
      }

      // Try to create a wallet with the private key
      new ethers.Wallet(privateKey)
      return true
    } catch {
      return false
    }
  }
}

export default WalletManager
