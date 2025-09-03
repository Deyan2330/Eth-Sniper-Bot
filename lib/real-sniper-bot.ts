import { ethers } from "ethers"

// VERIFIED Base Uniswap V3 Factory address
const UNISWAP_V3_FACTORY = "0x33128a8fC17869897dcE68Ed026d694621f6FDfD"

// Factory ABI for PoolCreated events
const FACTORY_ABI = [
  "event PoolCreated(address indexed token0, address indexed token1, uint24 indexed fee, int24 tickSpacing, address pool)",
  "function getPool(address tokenA, address tokenB, uint24 fee) external view returns (address pool)",
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
  currentBlock?: number
  eventsListened?: number
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
  private blockCheckInterval?: NodeJS.Timeout
  private eventsListened = 0
  private currentBlock = 0

  constructor(rpcUrl: string) {
    // Create provider without MetaMask - pure RPC connection
    this.provider = new ethers.JsonRpcProvider(rpcUrl, {
      chainId: 8453,
      name: "base",
    })

    this.factory = new ethers.Contract(UNISWAP_V3_FACTORY, FACTORY_ABI, this.provider)

    this.stats = {
      isRunning: false,
      totalPools: 0,
      recentPools: 0,
      connectionStatus: "disconnected",
      runtime: "0h 0m",
      lastActivity: "None",
      currentBlock: 0,
      eventsListened: 0,
    }
  }

  private async getTokenInfo(tokenAddress: string): Promise<TokenInfo | null> {
    try {
      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, this.provider)

      // Use Promise.race with timeout to avoid hanging
      const timeout = new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Timeout")), 3000))

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
      return {
        address: tokenAddress,
        name: "Unknown",
        symbol: "UNK",
        decimals: 18,
      }
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
        currentBlock: this.currentBlock,
        eventsListened: this.eventsListened,
      }
    }
  }

  async start(onPoolCreated: (pool: RealPoolData) => void, onLog: (message: string) => void): Promise<void> {
    try {
      // Test connection first
      onLog("🔍 Testing Base chain connection...")

      // Test basic connectivity
      const network = await this.provider.getNetwork()
      const blockNumber = await this.provider.getBlockNumber()
      this.currentBlock = blockNumber

      onLog(`✅ Connected to Base Chain (ID: ${network.chainId})`)
      onLog(`📊 Current Block: ${blockNumber?.toLocaleString() || "Unknown"}`)
      onLog(`🏭 Factory Address: ${UNISWAP_V3_FACTORY}`)

      // Test if factory contract exists
      const factoryCode = await this.provider.getCode(UNISWAP_V3_FACTORY)
      if (factoryCode === "0x") {
        throw new Error("Factory contract not found at address")
      }
      onLog(`✅ Factory contract verified`)

      this.isActive = true
      this.startTime = new Date()
      this.stats.isRunning = true
      this.stats.connectionStatus = "connected"
      this.lastActivityTime = new Date()

      onLog("👂 Setting up event listeners...")

      // Listen for PoolCreated events with better error handling
      this.factory.on("PoolCreated", async (token0, token1, fee, tickSpacing, pool, event) => {
        if (!this.isActive) return

        try {
          this.eventsListened++
          this.poolCount++
          this.recentPoolCount++
          this.lastActivityTime = new Date()

          onLog(`🎯 NEW POOL DETECTED! ${pool}`)
          onLog(`📍 Block: ${event?.blockNumber || "Unknown"}`)
          onLog(`🔗 TX: ${event?.transactionHash || "Unknown"}`)

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
            blockNumber: event?.blockNumber || 0,
            transactionHash: event?.transactionHash || "",
            timestamp: new Date().toISOString(),
            token0Info: token0Info.status === "fulfilled" ? token0Info.value || undefined : undefined,
            token1Info: token1Info.status === "fulfilled" ? token1Info.value || undefined : undefined,
          }

          onPoolCreated(poolData)

          const token0Symbol = poolData.token0Info?.symbol || token0.slice(0, 6)
          const token1Symbol = poolData.token1Info?.symbol || token1.slice(0, 6)
          onLog(`✅ Pool: ${token0Symbol}/${token1Symbol} | Fee: ${Number(fee) / 10000}%`)
        } catch (error) {
          onLog(`❌ Error processing pool: ${error}`)
        }
      })

      // Handle provider errors
      this.provider.on("error", (error) => {
        onLog(`🔌 Provider Error: ${error.message}`)
        this.stats.connectionStatus = "error"
      })

      // Monitor connection and blocks
      this.blockCheckInterval = setInterval(async () => {
        try {
          const latestBlock = await this.provider.getBlockNumber()
          if (latestBlock > this.currentBlock) {
            this.currentBlock = latestBlock
            this.lastActivityTime = new Date()
            // Only log every 10 blocks to avoid spam
            if (latestBlock % 10 === 0) {
              onLog(`📊 Block: ${latestBlock.toLocaleString()} | Events: ${this.eventsListened}`)
            }
          }
        } catch (error) {
          onLog(`❌ Block check error: ${error}`)
          this.stats.connectionStatus = "error"
        }
      }, 15000) // Check every 15 seconds

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
      onLog("🔍 Scanning for historical pools in recent blocks...")

      // Scan recent blocks for existing pools to test the system
      await this.scanRecentBlocks(onLog, onPoolCreated)
    } catch (error) {
      this.stats.connectionStatus = "error"
      this.isActive = false
      this.stats.isRunning = false
      throw new Error(`Failed to start listener: ${error}`)
    }
  }

  private async scanRecentBlocks(onLog: (message: string) => void, onPoolCreated: (pool: RealPoolData) => void) {
    try {
      const currentBlock = await this.provider.getBlockNumber()
      const fromBlock = Math.max(0, currentBlock - 1000) // Last 1000 blocks

      onLog(`🔍 Scanning blocks ${fromBlock} to ${currentBlock} for recent pools...`)

      const filter = this.factory.filters.PoolCreated()
      const events = await this.factory.queryFilter(filter, fromBlock, currentBlock)

      onLog(`📊 Found ${events.length} pool creation events in recent blocks`)

      // Process the most recent 5 events for testing
      const recentEvents = events.slice(-5)
      for (const event of recentEvents) {
        if (!this.isActive) break

        try {
          const { token0, token1, fee, tickSpacing, pool } = event.args!

          this.poolCount++
          this.eventsListened++

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
          onLog(`📜 Historical Pool: ${token0Symbol}/${token1Symbol} | Block: ${event.blockNumber}`)

          // Small delay to avoid overwhelming the UI
          await new Promise((resolve) => setTimeout(resolve, 500))
        } catch (error) {
          onLog(`❌ Error processing historical event: ${error}`)
        }
      }

      onLog(`✅ Historical scan complete. Now monitoring for new pools...`)
    } catch (error) {
      onLog(`❌ Historical scan failed: ${error}`)
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
    if (this.blockCheckInterval) {
      clearInterval(this.blockCheckInterval)
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

  isListening(): boolean {
    return this.isActive
  }
}

export function formatPoolData(pool: RealPoolData): string {
  const token0Symbol = pool.token0Info?.symbol || pool.token0.slice(0, 6)
  const token1Symbol = pool.token1Info?.symbol || pool.token1.slice(0, 6)
  return `${token0Symbol}/${token1Symbol} (${pool.fee / 10000}%)`
}
