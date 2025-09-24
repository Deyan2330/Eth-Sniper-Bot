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
  private callbacks: MetaMaskCallbacks
  private state: MetaMaskState

  constructor(callbacks: MetaMaskCallbacks = {}) {
    this.callbacks = callbacks
    this.ethereum = typeof window !== "undefined" ? (window as any).ethereum : null

    this.state = {
      isInstalled: !!this.ethereum,
      isConnected: false,
      account: null,
      chainId: null,
      balance: "0",
      networkName: "Unknown",
    }

    this.initializeEventListeners()
    this.checkConnection()
  }

  private initializeEventListeners() {
    if (!this.ethereum) return

    this.ethereum.on("accountsChanged", (accounts: string[]) => {
      this.state.account = accounts[0] || null
      this.state.isConnected = !!accounts[0]
      this.callbacks.onAccountsChanged?.(accounts)
    })

    this.ethereum.on("chainChanged", (chainId: string) => {
      this.state.chainId = chainId
      this.state.networkName = this.getNetworkName(chainId)
      this.callbacks.onChainChanged?.(chainId)
    })

    this.ethereum.on("connect", (connectInfo: { chainId: string }) => {
      this.state.chainId = connectInfo.chainId
      this.state.networkName = this.getNetworkName(connectInfo.chainId)
      this.callbacks.onConnect?.(connectInfo)
    })

    this.ethereum.on("disconnect", (error: { code: number; message: string }) => {
      this.state.isConnected = false
      this.state.account = null
      this.state.balance = "0"
      this.callbacks.onDisconnect?.(error)
    })
  }

  private async checkConnection() {
    if (!this.ethereum) return

    try {
      const accounts = await this.ethereum.request({ method: "eth_accounts" })
      if (accounts.length > 0) {
        this.state.account = accounts[0]
        this.state.isConnected = true

        const chainId = await this.ethereum.request({ method: "eth_chainId" })
        this.state.chainId = chainId
        this.state.networkName = this.getNetworkName(chainId)

        const balance = await this.ethereum.request({
          method: "eth_getBalance",
          params: [accounts[0], "latest"],
        })
        this.state.balance = (Number.parseInt(balance, 16) / 1e18).toFixed(4)
      }
    } catch (error) {
      console.error("Error checking MetaMask connection:", error)
    }
  }

  private getNetworkName(chainId: string): string {
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
    return networks[chainId] || `Chain ${chainId}`
  }

  public getState(): MetaMaskState {
    return { ...this.state }
  }

  public async connect(): Promise<{ account: string; chainId: string }> {
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

      const chainId = await this.ethereum.request({ method: "eth_chainId" })

      this.state.account = accounts[0]
      this.state.isConnected = true
      this.state.chainId = chainId
      this.state.networkName = this.getNetworkName(chainId)

      // Get balance
      const balance = await this.ethereum.request({
        method: "eth_getBalance",
        params: [accounts[0], "latest"],
      })
      this.state.balance = (Number.parseInt(balance, 16) / 1e18).toFixed(4)

      return { account: accounts[0], chainId }
    } catch (error: any) {
      throw new Error(`Failed to connect to MetaMask: ${error.message}`)
    }
  }

  public async switchNetwork(chainId: string): Promise<void> {
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

  public async addNetwork(networkConfig: {
    chainId: string
    chainName: string
    rpcUrls: string[]
    nativeCurrency: {
      name: string
      symbol: string
      decimals: number
    }
    blockExplorerUrls: string[]
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

  public async sendTransaction(transaction: {
    to: string
    value?: string
    data?: string
    gas?: string
    gasPrice?: string
  }): Promise<string> {
    if (!this.ethereum || !this.state.account) {
      throw new Error("MetaMask not connected")
    }

    try {
      const txHash = await this.ethereum.request({
        method: "eth_sendTransaction",
        params: [
          {
            from: this.state.account,
            ...transaction,
          },
        ],
      })
      return txHash
    } catch (error: any) {
      throw new Error(`Transaction failed: ${error.message}`)
    }
  }

  public async signMessage(message: string): Promise<string> {
    if (!this.ethereum || !this.state.account) {
      throw new Error("MetaMask not connected")
    }

    try {
      const signature = await this.ethereum.request({
        method: "personal_sign",
        params: [message, this.state.account],
      })
      return signature
    } catch (error: any) {
      throw new Error(`Message signing failed: ${error.message}`)
    }
  }

  public getSigner(): any {
    if (!this.ethereum || !this.state.account) {
      throw new Error("MetaMask not connected")
    }

    return {
      address: this.state.account,
      sendTransaction: this.sendTransaction.bind(this),
      signMessage: this.signMessage.bind(this),
    }
  }

  public disconnect(): void {
    this.state.isConnected = false
    this.state.account = null
    this.state.balance = "0"
  }
}

export function redirectToMetaMaskInstall(): void {
  if (typeof window !== "undefined") {
    window.open("https://metamask.io/download/", "_blank")
  }
}

export default EnhancedMetaMask
