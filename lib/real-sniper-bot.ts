import { ethers } from "ethers"
import { writeFileSync, readFileSync, existsSync, appendFileSync } from "fs"
import { BASE_CONTRACTS, STORAGE_SETTINGS } from "./constants"

export interface RealPoolData {
  token0: string
  token1: string
  poolAddress: string
  fee: number
  tickSpacing: number
  blockNumber: number
  transactionHash: string
  timestamp: string
  token0Info?: TokenInfo
  token1Info?: TokenInfo
}

export interface TokenInfo {
  symbol: string
  name: string
  decimals: number
  totalSupply?: string
}

export interface BotStats {
  totalPoolsDetected: number
  startTime: string
  lastPoolTime?: string
  isRunning: boolean
}

export class RealUniswapListener {
  private provider: ethers.JsonRpcProvider
  private factory: ethers.Contract
  private isRunning = false
  private detectedPools: RealPoolData[] = []
  private stats: BotStats

  // Uniswap V3 Factory ABI - PoolCreated event
  private factoryABI = [
    "event PoolCreated(address indexed token0, address indexed token1, uint24 indexed fee, int24 tickSpacing, address pool)",
  ]

  // ERC20 ABI for token info
  private erc20ABI = [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "function totalSupply() view returns (uint256)",
  ]

  constructor(rpcUrl: string) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl)
    this.factory = new ethers.Contract(BASE_CONTRACTS.UNISWAP_V3_FACTORY, this.factoryABI, this.provider)

    this.stats = {
      totalPoolsDetected: 0,
      startTime: new Date().toISOString(),
      isRunning: false,
    }

    // Load existing pools from file
    this.loadPoolsFromFile()
  }

  async start(onPoolDetected: (pool: RealPoolData) => void, onLog: (message: string) => void): Promise<void> {
    if (this.isRunning) {
      throw new Error("Bot is already running")
    }

    this.isRunning = true
    this.stats.isRunning = true

    const startMessage = `🚀 Real Uniswap V3 Listener Started on Base Chain`
    onLog(startMessage)
    this.logToFile(startMessage)

    try {
      // Test connection
      const network = await this.provider.getNetwork()
      const blockNumber = await this.provider.getBlockNumber()

      const connectionMsg = `📡 Connected to Base (Chain ID: ${network.chainId}) - Block: ${blockNumber}`
      onLog(connectionMsg)
      this.logToFile(connectionMsg)

      // Listen for PoolCreated events
      this.factory.on("PoolCreated", async (token0, token1, fee, tickSpacing, poolAddress, event) => {
        if (!this.isRunning) return

        try {
          const poolData: RealPoolData = {
            token0: token0.toLowerCase(),
            token1: token1.toLowerCase(),
            poolAddress: poolAddress.toLowerCase(),
            fee: Number(fee),
            tickSpacing: Number(tickSpacing),
            blockNumber: event.blockNumber,
            transactionHash: event.transactionHash,
            timestamp: new Date().toISOString(),
          }

          const logMsg = `🔍 NEW POOL: ${poolAddress} | Fee: ${fee / 10000}% | Block: ${event.blockNumber}`
          onLog(logMsg)
          this.logToFile(logMsg)

          // Get token information
          await this.enrichPoolData(poolData, onLog)

          // Store and notify
          this.detectedPools.unshift(poolData)
          this.stats.totalPoolsDetected++
          this.stats.lastPoolTime = poolData.timestamp

          // Keep only recent pools in memory
          if (this.detectedPools.length > STORAGE_SETTINGS.MAX_POOLS_IN_MEMORY) {
            this.detectedPools = this.detectedPools.slice(0, STORAGE_SETTINGS.MAX_POOLS_IN_MEMORY)
          }

          // Save to file
          this.savePoolsToFile()

          onPoolDetected(poolData)
        } catch (error) {
          const errorMsg = `❌ Error processing pool: ${error}`
          onLog(errorMsg)
          this.logToFile(errorMsg)
        }
      })

      // Handle connection errors
      this.provider.on("error", (error) => {
        const errorMsg = `🔌 Provider Error: ${error.message}`
        onLog(errorMsg)
        this.logToFile(errorMsg)
      })

      const listeningMsg = `👂 Listening for PoolCreated events on ${BASE_CONTRACTS.UNISWAP_V3_FACTORY}`
      onLog(listeningMsg)
      this.logToFile(listeningMsg)
    } catch (error) {
      this.isRunning = false
      this.stats.isRunning = false
      throw new Error(`Failed to start listener: ${error}`)
    }
  }

  async stop(): Promise<void> {
    this.isRunning = false
    this.stats.isRunning = false

    // Remove all listeners
    this.factory.removeAllListeners("PoolCreated")
    this.provider.removeAllListeners()

    const stopMsg = `⏹️ Uniswap Listener Stopped - Total Pools Detected: ${this.stats.totalPoolsDetected}`
    this.logToFile(stopMsg)
  }

  private async enrichPoolData(poolData: RealPoolData, onLog: (message: string) => void): Promise<void> {
    try {
      const token0Contract = new ethers.Contract(poolData.token0, this.erc20ABI, this.provider)
      const token1Contract = new ethers.Contract(poolData.token1, this.erc20ABI, this.provider)

      // Get token info with timeout
      const timeout = 5000 // 5 seconds

      const [token0Info, token1Info] = await Promise.allSettled([
        Promise.race([
          this.getTokenInfo(token0Contract),
          new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), timeout)),
        ]),
        Promise.race([
          this.getTokenInfo(token1Contract),
          new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), timeout)),
        ]),
      ])

      if (token0Info.status === "fulfilled") {
        poolData.token0Info = token0Info.value as TokenInfo
      }
      if (token1Info.status === "fulfilled") {
        poolData.token1Info = token1Info.value as TokenInfo
      }

      const token0Symbol = poolData.token0Info?.symbol || "UNKNOWN"
      const token1Symbol = poolData.token1Info?.symbol || "UNKNOWN"

      const enrichMsg = `📊 ${token0Symbol}/${token1Symbol} | Fee: ${poolData.fee / 10000}%`
      onLog(enrichMsg)
    } catch (error) {
      onLog(`⚠️ Could not fetch token info: ${error}`)
    }
  }

  private async getTokenInfo(contract: ethers.Contract): Promise<TokenInfo> {
    const [symbol, name, decimals, totalSupply] = await Promise.all([
      contract.symbol().catch(() => "UNKNOWN"),
      contract.name().catch(() => "Unknown Token"),
      contract.decimals().catch(() => 18),
      contract.totalSupply().catch(() => "0"),
    ])

    return {
      symbol,
      name,
      decimals: Number(decimals),
      totalSupply: totalSupply.toString(),
    }
  }

  private savePoolsToFile(): void {
    try {
      const data = {
        stats: this.stats,
        pools: this.detectedPools.slice(0, 100), // Save last 100 pools
        lastUpdated: new Date().toISOString(),
      }

      writeFileSync(STORAGE_SETTINGS.POOLS_FILE, JSON.stringify(data, null, 2))
    } catch (error) {
      console.error("Error saving pools to file:", error)
    }
  }

  private loadPoolsFromFile(): void {
    try {
      if (existsSync(STORAGE_SETTINGS.POOLS_FILE)) {
        const data = JSON.parse(readFileSync(STORAGE_SETTINGS.POOLS_FILE, "utf8"))
        this.detectedPools = data.pools || []
        if (data.stats) {
          this.stats = { ...this.stats, ...data.stats, isRunning: false }
        }
      }
    } catch (error) {
      console.error("Error loading pools from file:", error)
    }
  }

  private logToFile(message: string): void {
    try {
      const timestamp = new Date().toISOString()
      const logEntry = `[${timestamp}] ${message}\n`
      appendFileSync(STORAGE_SETTINGS.LOGS_FILE, logEntry)
    } catch (error) {
      console.error("Error writing to log file:", error)
    }
  }

  // Public getters
  getDetectedPools(): RealPoolData[] {
    return [...this.detectedPools]
  }

  getStats(): BotStats {
    return { ...this.stats }
  }

  isListening(): boolean {
    return this.isRunning
  }
}

// Utility functions
export const formatPoolData = (pool: RealPoolData): string => {
  const token0Symbol = pool.token0Info?.symbol || pool.token0.slice(0, 8)
  const token1Symbol = pool.token1Info?.symbol || pool.token1.slice(0, 8)
  return `${token0Symbol}/${token1Symbol} (${pool.fee / 10000}%)`
}

export const validateRpcUrl = async (rpcUrl: string): Promise<boolean> => {
  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl)
    const network = await provider.getNetwork()
    return network.chainId === 8453n // Base chain ID
  } catch {
    return false
  }
}
