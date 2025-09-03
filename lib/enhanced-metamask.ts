import { ethers } from "ethers"

export interface MetaMaskState {
  isInstalled: boolean
  isConnected: boolean
  account: string | null
  chainId: number | null
  balance: string
  networkName: string
}

export interface MetaMaskCallbacks {
  onAccountChanged: (account: string | null) => void
  onChainChanged: (chainId: number) => void
  onConnect: (account: string) => void
  onDisconnect: () => void
}

export class EnhancedMetaMask {
  private provider: any
  private signer: ethers.Signer | null = null
  private state: MetaMaskState = {
    isInstalled: false,
    isConnected: false,
    account: null,
    chainId: null,
    balance: "0",
    networkName: "Unknown",
  }
  private callbacks: MetaMaskCallbacks
  private connectionAttempts = 0
  private maxConnectionAttempts = 3

  constructor(callbacks: MetaMaskCallbacks) {
    this.callbacks = callbacks
    this.checkInstallation()
    this.setupEventListeners()
  }

  private checkInstallation(): void {
    this.state.isInstalled = typeof window !== "undefined" && !!window.ethereum?.isMetaMask
  }

  private setupEventListeners(): void {
    if (!this.state.isInstalled) return

    this.provider = window.ethereum

    // Account changes
    this.provider.on("accountsChanged", (accounts: string[]) => {
      const account = accounts[0] || null
      this.state.account = account
      this.state.isConnected = !!account
      this.callbacks.onAccountChanged(account)

      if (account) {
        this.updateBalance()
      }
    })

    // Chain changes
    this.provider.on("chainChanged", (chainId: string) => {
      const numericChainId = Number.parseInt(chainId, 16)
      this.state.chainId = numericChainId
      this.state.networkName = this.getNetworkName(numericChainId)
      this.callbacks.onChainChanged(numericChainId)
    })

    // Connection events
    this.provider.on("connect", (connectInfo: { chainId: string }) => {
      console.log("MetaMask connected:", connectInfo)
    })

    this.provider.on("disconnect", (error: any) => {
      console.log("MetaMask disconnected:", error)
      this.state.isConnected = false
      this.state.account = null
      this.callbacks.onDisconnect()
    })
  }

  async connect(): Promise<string> {
    if (!this.state.isInstalled) {
      throw new Error("MetaMask is not installed. Please install MetaMask to continue.")
    }

    this.connectionAttempts++

    try {
      // Request account access with timeout
      const accounts = (await Promise.race([
        this.provider.request({
          method: "eth_requestAccounts",
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Connection timeout")), 10000)),
      ])) as string[]

      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts found. Please unlock MetaMask.")
      }

      const account = accounts[0]
      this.state.account = account
      this.state.isConnected = true

      // Get chain info
      const chainId = await this.provider.request({ method: "eth_chainId" })
      this.state.chainId = Number.parseInt(chainId, 16)
      this.state.networkName = this.getNetworkName(this.state.chainId)

      // Switch to Base if not already
      if (this.state.chainId !== 8453) {
        await this.switchToBase()
      }

      // Create signer
      const ethersProvider = new ethers.BrowserProvider(this.provider)
      this.signer = await ethersProvider.getSigner()

      // Update balance
      await this.updateBalance()

      // Reset connection attempts on success
      this.connectionAttempts = 0

      this.callbacks.onConnect(account)
      return account
    } catch (error: any) {
      if (error.code === 4001) {
        throw new Error("Connection rejected by user")
      }

      if (this.connectionAttempts < this.maxConnectionAttempts) {
        // Retry connection
        await new Promise((resolve) => setTimeout(resolve, 1000))
        return this.connect()
      }

      throw new Error(`Connection failed after ${this.maxConnectionAttempts} attempts: ${error.message}`)
    }
  }

  async switchToBase(): Promise<void> {
    if (!this.provider) throw new Error("MetaMask not available")

    try {
      await this.provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x2105" }], // Base mainnet
      })
    } catch (switchError: any) {
      // Chain not added, try to add it
      if (switchError.code === 4902) {
        await this.addBaseNetwork()
      } else {
        throw switchError
      }
    }
  }

  private async addBaseNetwork(): Promise<void> {
    if (!this.provider) throw new Error("MetaMask not available")

    await this.provider.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: "0x2105",
          chainName: "Base",
          nativeCurrency: {
            name: "Ethereum",
            symbol: "ETH",
            decimals: 18,
          },
          rpcUrls: ["https://mainnet.base.org"],
          blockExplorerUrls: ["https://basescan.org"],
          iconUrls: ["https://bridge.base.org/icons/base.svg"],
        },
      ],
    })
  }

  async updateBalance(): Promise<void> {
    if (!this.state.account || !this.provider) return

    try {
      const balance = await this.provider.request({
        method: "eth_getBalance",
        params: [this.state.account, "latest"],
      })

      this.state.balance = ethers.formatEther(balance)
    } catch (error) {
      console.error("Error updating balance:", error)
    }
  }

  async signMessage(message: string): Promise<string> {
    if (!this.signer) throw new Error("Not connected to MetaMask")
    return await this.signer.signMessage(message)
  }

  async sendTransaction(transaction: any): Promise<string> {
    if (!this.signer) throw new Error("Not connected to MetaMask")

    const tx = await this.signer.sendTransaction(transaction)
    return tx.hash
  }

  private getNetworkName(chainId: number): string {
    const networks: { [key: number]: string } = {
      1: "Ethereum Mainnet",
      8453: "Base",
      84531: "Base Goerli",
      5: "Goerli",
      11155111: "Sepolia",
    }
    return networks[chainId] || `Unknown (${chainId})`
  }

  disconnect(): void {
    this.state.isConnected = false
    this.state.account = null
    this.signer = null
    this.connectionAttempts = 0
    this.callbacks.onDisconnect()
  }

  getState(): MetaMaskState {
    return { ...this.state }
  }

  getSigner(): ethers.Signer | null {
    return this.signer
  }

  isOnCorrectNetwork(): boolean {
    return this.state.chainId === 8453 // Base mainnet
  }

  // Utility methods
  async addTokenToWallet(tokenAddress: string, tokenSymbol: string, tokenDecimals: number): Promise<boolean> {
    if (!this.provider) return false

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
      return true
    } catch (error) {
      console.error("Error adding token to wallet:", error)
      return false
    }
  }

  async getGasPrice(): Promise<bigint> {
    if (!this.provider) throw new Error("MetaMask not available")

    const gasPrice = await this.provider.request({
      method: "eth_gasPrice",
    })

    return BigInt(gasPrice)
  }

  async estimateGas(transaction: any): Promise<bigint> {
    if (!this.provider) throw new Error("MetaMask not available")

    const gasEstimate = await this.provider.request({
      method: "eth_estimateGas",
      params: [transaction],
    })

    return BigInt(gasEstimate)
  }

  // Enhanced connection status
  async checkConnection(): Promise<boolean> {
    if (!this.state.isInstalled) return false

    try {
      const accounts = await this.provider.request({ method: "eth_accounts" })
      const isConnected = accounts && accounts.length > 0

      if (isConnected !== this.state.isConnected) {
        this.state.isConnected = isConnected
        this.state.account = isConnected ? accounts[0] : null
      }

      return isConnected
    } catch (error) {
      return false
    }
  }

  // Auto-reconnect functionality
  async autoReconnect(): Promise<boolean> {
    try {
      const isConnected = await this.checkConnection()
      if (isConnected && this.state.account) {
        const ethersProvider = new ethers.BrowserProvider(this.provider)
        this.signer = await ethersProvider.getSigner()
        await this.updateBalance()
        return true
      }
      return false
    } catch (error) {
      return false
    }
  }
}

// Helper function to check if MetaMask is installed
export function isMetaMaskInstalled(): boolean {
  return typeof window !== "undefined" && !!window.ethereum?.isMetaMask
}

// Helper function to install MetaMask
export function redirectToMetaMaskInstall(): void {
  window.open("https://metamask.io/download/", "_blank")
}

// Helper function to detect mobile
export function isMobile(): boolean {
  return (
    typeof window !== "undefined" &&
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  )
}
