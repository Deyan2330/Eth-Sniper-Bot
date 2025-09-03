import { ethers } from "ethers"
import { EnhancedMetaMask } from "./enhanced-metamask"

export interface WalletInfo {
  address: string
  balance: string
  chainId: number
  networkName: string
  isConnected: boolean
}

export interface TokenBalance {
  address: string
  symbol: string
  name: string
  balance: string
  decimals: number
  price?: number
  value?: number
}

export class WalletManager {
  private metaMask: EnhancedMetaMask
  private provider: ethers.Provider | null = null
  private signer: ethers.Signer | null = null
  private walletInfo: WalletInfo | null = null
  private tokenBalances: Map<string, TokenBalance> = new Map()

  constructor() {
    this.metaMask = new EnhancedMetaMask({
      onAccountChanged: this.handleAccountChanged.bind(this),
      onChainChanged: this.handleChainChanged.bind(this),
      onConnect: this.handleConnect.bind(this),
      onDisconnect: this.handleDisconnect.bind(this),
    })
  }

  async connect(): Promise<WalletInfo> {
    try {
      const account = await this.metaMask.connect()

      if (typeof window !== "undefined" && window.ethereum) {
        this.provider = new ethers.BrowserProvider(window.ethereum)
        this.signer = await this.provider.getSigner()
      }

      await this.updateWalletInfo()

      if (!this.walletInfo) {
        throw new Error("Failed to get wallet information")
      }

      return this.walletInfo
    } catch (error) {
      console.error("Error connecting wallet:", error)
      throw error
    }
  }

  async disconnect(): Promise<void> {
    this.metaMask.disconnect()
    this.provider = null
    this.signer = null
    this.walletInfo = null
    this.tokenBalances.clear()
  }

  private async handleAccountChanged(account: string | null): Promise<void> {
    if (account) {
      await this.updateWalletInfo()
    } else {
      this.walletInfo = null
      this.tokenBalances.clear()
    }
  }

  private async handleChainChanged(chainId: number): Promise<void> {
    await this.updateWalletInfo()
  }

  private async handleConnect(account: string): Promise<void> {
    await this.updateWalletInfo()
  }

  private async handleDisconnect(): Promise<void> {
    this.walletInfo = null
    this.tokenBalances.clear()
  }

  private async updateWalletInfo(): Promise<void> {
    try {
      const state = this.metaMask.getState()

      if (!state.account || !this.provider) {
        this.walletInfo = null
        return
      }

      const balance = await this.provider.getBalance(state.account)

      this.walletInfo = {
        address: state.account,
        balance: ethers.formatEther(balance),
        chainId: state.chainId || 0,
        networkName: state.networkName,
        isConnected: state.isConnected,
      }
    } catch (error) {
      console.error("Error updating wallet info:", error)
    }
  }

  async getTokenBalance(tokenAddress: string): Promise<TokenBalance | null> {
    if (!this.provider || !this.walletInfo) {
      throw new Error("Wallet not connected")
    }

    try {
      const contract = new ethers.Contract(
        tokenAddress,
        [
          "function balanceOf(address) view returns (uint256)",
          "function symbol() view returns (string)",
          "function name() view returns (string)",
          "function decimals() view returns (uint8)",
        ],
        this.provider,
      )

      const [balance, symbol, name, decimals] = await Promise.all([
        contract.balanceOf(this.walletInfo.address),
        contract.symbol(),
        contract.name(),
        contract.decimals(),
      ])

      const tokenBalance: TokenBalance = {
        address: tokenAddress,
        symbol,
        name,
        balance: ethers.formatUnits(balance, decimals),
        decimals,
      }

      this.tokenBalances.set(tokenAddress, tokenBalance)
      return tokenBalance
    } catch (error) {
      console.error(`Error getting token balance for ${tokenAddress}:`, error)
      return null
    }
  }

  async getMultipleTokenBalances(tokenAddresses: string[]): Promise<TokenBalance[]> {
    const promises = tokenAddresses.map((address) => this.getTokenBalance(address))
    const results = await Promise.allSettled(promises)

    return results
      .filter(
        (result): result is PromiseFulfilledResult<TokenBalance> =>
          result.status === "fulfilled" && result.value !== null,
      )
      .map((result) => result.value)
  }

  async sendTransaction(transaction: any): Promise<string> {
    if (!this.signer) {
      throw new Error("Wallet not connected")
    }

    try {
      const tx = await this.signer.sendTransaction(transaction)
      return tx.hash
    } catch (error) {
      console.error("Error sending transaction:", error)
      throw error
    }
  }

  async signMessage(message: string): Promise<string> {
    if (!this.signer) {
      throw new Error("Wallet not connected")
    }

    try {
      return await this.signer.signMessage(message)
    } catch (error) {
      console.error("Error signing message:", error)
      throw error
    }
  }

  async switchNetwork(chainId: number): Promise<void> {
    if (chainId === 8453) {
      await this.metaMask.switchToBase()
    } else {
      throw new Error(`Switching to chain ${chainId} not supported`)
    }
  }

  async addToken(tokenAddress: string): Promise<boolean> {
    const tokenBalance = await this.getTokenBalance(tokenAddress)

    if (!tokenBalance) {
      return false
    }

    return await this.metaMask.addTokenToWallet(tokenAddress, tokenBalance.symbol, tokenBalance.decimals)
  }

  getWalletInfo(): WalletInfo | null {
    return this.walletInfo
  }

  getProvider(): ethers.Provider | null {
    return this.provider
  }

  getSigner(): ethers.Signer | null {
    return this.signer
  }

  isConnected(): boolean {
    return this.walletInfo?.isConnected || false
  }

  isOnCorrectNetwork(): boolean {
    return this.walletInfo?.chainId === 8453 // Base mainnet
  }

  getAddress(): string | null {
    return this.walletInfo?.address || null
  }

  getBalance(): string {
    return this.walletInfo?.balance || "0"
  }

  getTokenBalances(): TokenBalance[] {
    return Array.from(this.tokenBalances.values())
  }

  async refreshBalances(): Promise<void> {
    await this.updateWalletInfo()

    // Refresh token balances
    const tokenAddresses = Array.from(this.tokenBalances.keys())
    await this.getMultipleTokenBalances(tokenAddresses)
  }

  async estimateGas(transaction: any): Promise<bigint> {
    if (!this.provider) {
      throw new Error("Wallet not connected")
    }

    return await this.provider.estimateGas(transaction)
  }

  async getGasPrice(): Promise<bigint> {
    if (!this.provider) {
      throw new Error("Wallet not connected")
    }

    const feeData = await this.provider.getFeeData()
    return feeData.gasPrice || BigInt(0)
  }

  async waitForTransaction(txHash: string): Promise<ethers.TransactionReceipt | null> {
    if (!this.provider) {
      throw new Error("Wallet not connected")
    }

    return await this.provider.waitForTransaction(txHash)
  }

  async getTransactionReceipt(txHash: string): Promise<ethers.TransactionReceipt | null> {
    if (!this.provider) {
      throw new Error("Wallet not connected")
    }

    return await this.provider.getTransactionReceipt(txHash)
  }

  formatAddress(address: string): string {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  formatBalance(balance: string, decimals = 4): string {
    const num = Number.parseFloat(balance)
    if (num === 0) return "0"
    if (num < 0.0001) return "<0.0001"
    return num.toFixed(decimals)
  }
}
