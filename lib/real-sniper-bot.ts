import { ethers } from "ethers"

// Base Uniswap V3 Factory address
const UNISWAP_V3_FACTORY = "0x33128a8fC17869897dcE68Ed026d694621f6FDfD"

// Factory ABI for PoolCreated events
const FACTORY_ABI = [
  "event PoolCreated(address indexed token0, address indexed token1, uint24 indexed fee, int24 tickSpacing, address pool)",
]

// ERC20 ABI for token info
const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
]

export interface TokenInfo {
  address: string
  name: string
  symbol: string
  decimals: number
  totalSupply?: string
}

export interface RealPoolData {
  token0: string
  token1: string
  fee: number
  tickSpacing: number
  poolAddress: string
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
  connectionStatus: string
  runtime: string
  lastActivity: string
  startTime?: Date
}

export class RealUniswapListener {
  private provider: ethers.JsonRpcProvider
  private factory: ethers.Contract
  private isActive = false
  private stats: RealTimeStats
  private startTime?: Date
  private poolCount = 0
  private recentPoolCount = 0
  private lastActivityTime?: Date
  private statsInterval?: NodeJS.Timeout
  private recentCountInterval?: NodeJS.Timeout

  constructor(rpcUrl: string) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl, undefined, {
      staticNetwork: ethers.Network.from(8453), // Base chain ID
    })
    this.factory = new ethers.Contract(UNISWAP_V3_FACTORY, FACTORY_ABI, this.provider)

    this.stats = {
      isRunning: false,
      totalPools: 0,
      recentPools: 0,
      connectionStatus: "disconnected",
      runtime: "0h 0m",
      lastActivity: "None",
    }
  }

  private async getTokenInfo(tokenAddress: string): Promise<TokenInfo | null> {
    try {
      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, this.provider)

      // Use Promise.race with timeout to avoid hanging
      const timeout = new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Timeout")), 5000))

      const [name, symbol, decimals] = await Promise.race([
        Promise.all([
          tokenContract.name().catch(() => "Unknown"),
          tokenContract.symbol().catch(() => "UNK"),
          tokenContract.decimals().catch(() => 18),
        ]),
        timeout,
      ])

      return {
        address: tokenAddress,
        name,
        symbol,
        decimals,
      }
    } catch (error) {
      console.error(`Failed to get token info for ${tokenAddress}:`, error)
      return null
    }
  }

  private updateStats() {
    if (this.startTime) {
      const now = new Date()
      const runtime = now.getTime() - this.startTime.getTime()
      const hours = Math.floor(runtime / (1000 * 60 * 60))
      const minutes = Math.floor((runtime % (1000 * 60 * 60)) / (1000 * 60))

      this.stats = {
        ...this.stats,
        totalPools: this.poolCount,
        recentPools: this.recentPoolCount,
        runtime: `${hours}h ${minutes}m`,
        lastActivity: this.lastActivityTime
          ? `${Math.floor((now.getTime() - this.lastActivityTime.getTime()) / 1000)}s ago`
          : "None",
      }
    }
  }

  async start(onPoolCreated: (pool: RealPoolData) => void, onLog: (message: string) => void): Promise<void> {
    try {
      // Test connection first
      onLog("🔍 Testing Base chain connection...")
      const network = await this.provider.getNetwork()
      const blockNumber = await this.provider.getBlockNumber()

      onLog(`✅ Connected to Base Chain (ID: ${network.chainId})`)
      onLog(`📊 Current Block: ${blockNumber.toLocaleString()}`)

      this.isActive = true
      this.startTime = new Date()
      this.stats.isRunning = true
      this.stats.connectionStatus = "connected"

      onLog("👂 Listening for Uniswap V3 pool creation events...")

      // Listen for PoolCreated events
      this.factory.on("PoolCreated", async (token0, token1, fee, tickSpacing, pool, event) => {
        if (!this.isActive) return

        try {
          this.poolCount++
          this.recentPoolCount++
          this.lastActivityTime = new Date()

          onLog(`🎯 New pool detected: ${pool}`)

          // Get token information with timeout
          const [token0Info, token1Info] = await Promise.allSettled([
            this.getTokenInfo(token0),
            this.getTokenInfo(token1),
          ])

          const poolData: RealPoolData = {
            token0,
            token1,
            fee: Number(fee),
            tickSpacing: Number(tickSpacing),
            poolAddress: pool,
            blockNumber: event.blockNumber,
            transactionHash: event.transactionHash,
            timestamp: new Date().toISOString(),
            token0Info: token0Info.status === "fulfilled" ? token0Info.value || undefined : undefined,
            token1Info: token1Info.status === "fulfilled" ? token1Info.value || undefined : undefined,
          }

          onPoolCreated(poolData)

          const token0Symbol = poolData.token0Info?.symbol || token0.slice(0, 6)
          const token1Symbol = poolData.token1Info?.symbol || token1.slice(0, 6)
          onLog(`✅ Pool: ${token0Symbol}/${token1Symbol} | Fee: ${fee / 10000}%`)
        } catch (error) {
          onLog(`❌ Error processing pool: ${error}`)
        }
      })

      // Handle provider errors
      this.provider.on("error", (error) => {
        onLog(`🔌 Provider Error: ${error.message}`)
        this.stats.connectionStatus = "error"
      })

      // Reset recent count every 5 minutes
      this.recentCountInterval = setInterval(
        () => {
          this.recentPoolCount = 0
        },
        5 * 60 * 1000,
      )

      // Update stats every 10 seconds
      this.statsInterval = setInterval(() => {
        this.updateStats()
      }, 10000)

      onLog("✅ Real-time listener is now active!")
    } catch (error) {
      this.stats.connectionStatus = "error"
      this.isActive = false
      this.stats.isRunning = false
      throw new Error(`Failed to start listener: ${error}`)
    }
  }

  async stop(): Promise<void> {
    this.isActive = false
    this.stats.isRunning = false
    this.stats.connectionStatus = "disconnected"

    // Clear intervals
    if (this.statsInterval) {
      clearInterval(this.statsInterval)
      this.statsInterval = undefined
    }
    if (this.recentCountInterval) {
      clearInterval(this.recentCountInterval)
      this.recentCountInterval = undefined
    }

    // Remove all listeners
    this.factory.removeAllListeners("PoolCreated")
    this.provider.removeAllListeners()
  }

  getRealTimeStats(): RealTimeStats {
    this.updateStats()
    return { ...this.stats }
  }

  // Fixed method name - was causing the error
  isListening(): boolean {
    return this.isActive
  }
}

export function formatPoolData(pool: RealPoolData): string {
  const token0Symbol = pool.token0Info?.symbol || pool.token0.slice(0, 6)
  const token1Symbol = pool.token1Info?.symbol || pool.token1.slice(0, 6)
  return `${token0Symbol}/${token1Symbol} (${pool.fee / 10000}%)`
}
