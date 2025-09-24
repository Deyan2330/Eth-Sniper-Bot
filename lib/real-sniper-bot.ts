import { ethers } from "ethers"

export interface TokenInfo {
  address: string
  name: string
  symbol: string
  decimals: number
  totalSupply?: string
}

export interface RealPoolData {
  poolAddress: string
  token0: string
  token1: string
  fee: number
  blockNumber: number
  transactionHash: string
  timestamp: string
  token0Info?: TokenInfo
  token1Info?: TokenInfo
}

export interface RealTimeStats {
  isRunning: boolean
  totalPools: number
  recentPools: number
  connectionStatus: "connected" | "disconnected" | "connecting" | "error"
  runtime: string
  lastActivity: string
  currentBlock: number
  eventsListened: number
}

export class RealUniswapListener {
  private provider: ethers.JsonRpcProvider
  private isRunning = false
  private startTime = 0
  private stats: RealTimeStats = {
    isRunning: false,
    totalPools: 0,
    recentPools: 0,
    connectionStatus: "disconnected",
    runtime: "0h 0m",
    lastActivity: "None",
    currentBlock: 0,
    eventsListened: 0,
  }

  // Uniswap V3 Factory address on Base
  private readonly FACTORY_ADDRESS = "0x33128a8fC17869897dcE68Ed026d694621f6FdF9"

  // Factory ABI (just the PoolCreated event)
  private readonly FACTORY_ABI = [
    "event PoolCreated(address indexed token0, address indexed token1, uint24 indexed fee, int24 tickSpacing, address pool)",
  ]

  // ERC20 ABI for token info
  private readonly ERC20_ABI = [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "function totalSupply() view returns (uint256)",
  ]

  constructor(rpcUrl: string) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl)
  }

  async start(
    onPoolDetected: (pool: RealPoolData) => void,
    onLog: (message: string, type?: string) => void,
  ): Promise<void> {
    if (this.isRunning) {
      throw new Error("Listener is already running")
    }

    try {
      onLog("🔌 Connecting to Base network...", "info")
      this.stats.connectionStatus = "connecting"

      // Test connection
      const network = await this.provider.getNetwork()
      const currentBlock = await this.provider.getBlockNumber()

      onLog(`✅ Connected to ${network.name} (Chain ID: ${network.chainId})`, "success")
      onLog(`📦 Current block: ${currentBlock.toLocaleString()}`, "info")

      this.stats.currentBlock = currentBlock
      this.stats.connectionStatus = "connected"
      this.stats.isRunning = true
      this.isRunning = true
      this.startTime = Date.now()

      // Create factory contract
      const factory = new ethers.Contract(this.FACTORY_ADDRESS, this.FACTORY_ABI, this.provider)

      onLog("👂 Listening for new pool creation events...", "info")

      // Listen for PoolCreated events
      factory.on("PoolCreated", async (token0, token1, fee, tickSpacing, poolAddress, event) => {
        try {
          this.stats.totalPools++
          this.stats.recentPools++
          this.stats.eventsListened++
          this.stats.lastActivity = new Date().toLocaleTimeString()

          onLog(`🎯 New pool detected: ${poolAddress}`, "success")

          // Get token information
          const [token0Info, token1Info] = await Promise.all([
            this.getTokenInfo(token0, onLog),
            this.getTokenInfo(token1, onLog),
          ])

          const poolData: RealPoolData = {
            poolAddress,
            token0,
            token1,
            fee,
            blockNumber: event.blockNumber,
            transactionHash: event.transactionHash,
            timestamp: new Date().toISOString(),
            token0Info,
            token1Info,
          }

          onPoolDetected(poolData)
        } catch (error) {
          onLog(`❌ Error processing pool event: ${error}`, "error")
        }
      })

      // Update runtime periodically
      const runtimeInterval = setInterval(() => {
        if (!this.isRunning) {
          clearInterval(runtimeInterval)
          return
        }

        const elapsed = Date.now() - this.startTime
        const hours = Math.floor(elapsed / (1000 * 60 * 60))
        const minutes = Math.floor((elapsed % (1000 * 60 * 60)) / (1000 * 60))
        this.stats.runtime = `${hours}h ${minutes}m`

        // Reset recent pools counter every minute
        if (minutes % 1 === 0) {
          this.stats.recentPools = 0
        }
      }, 5000)

      // Update current block periodically
      const blockInterval = setInterval(async () => {
        if (!this.isRunning) {
          clearInterval(blockInterval)
          return
        }

        try {
          const currentBlock = await this.provider.getBlockNumber()
          this.stats.currentBlock = currentBlock
        } catch (error) {
          onLog(`⚠️ Failed to update block number: ${error}`, "warning")
        }
      }, 10000)

      onLog("🚀 Pool listener started successfully!", "success")
    } catch (error) {
      this.stats.connectionStatus = "error"
      this.stats.isRunning = false
      this.isRunning = false
      throw new Error(`Failed to start listener: ${error}`)
    }
  }

  async stop(): Promise<void> {
    if (!this.isRunning) return

    this.isRunning = false
    this.stats.isRunning = false
    this.stats.connectionStatus = "disconnected"

    // Remove all listeners
    await this.provider.removeAllListeners()
  }

  private async getTokenInfo(
    tokenAddress: string,
    onLog: (message: string, type?: string) => void,
  ): Promise<TokenInfo | undefined> {
    try {
      const contract = new ethers.Contract(tokenAddress, this.ERC20_ABI, this.provider)

      const [name, symbol, decimals] = await Promise.all([
        contract.name().catch(() => "Unknown"),
        contract.symbol().catch(() => "UNK"),
        contract.decimals().catch(() => 18),
      ])

      return {
        address: tokenAddress,
        name,
        symbol,
        decimals,
      }
    } catch (error) {
      onLog(`⚠️ Failed to get token info for ${tokenAddress}: ${error}`, "warning")
      return {
        address: tokenAddress,
        name: "Unknown Token",
        symbol: "UNK",
        decimals: 18,
      }
    }
  }

  getRealTimeStats(): RealTimeStats {
    return { ...this.stats }
  }

  isListening(): boolean {
    return this.isRunning
  }
}
