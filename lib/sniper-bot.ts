import { ethers } from "ethers"

export interface BotConfig {
  rpcUrl: string
  privateKey: string
  minLiquidity: number
  maxGasPrice: number
  slippage: number
  buyAmount: string
  factoryAddress: string
  routerAddress: string
}

export interface PoolData {
  token0: string
  token1: string
  pool: string
  fee: number
  timestamp: string
  blockNumber: number
  txHash: string
}

export class UniswapSniperBot {
  private provider: ethers.JsonRpcProvider
  private wallet: ethers.Wallet
  private factory: ethers.Contract
  private router: ethers.Contract
  private config: BotConfig
  private isRunning = false

  // Uniswap V3 Factory ABI (minimal)
  private factoryABI = [
    "event PoolCreated(address indexed token0, address indexed token1, uint24 indexed fee, int24 tickSpacing, address pool)",
  ]

  // ERC20 ABI (minimal)
  private erc20ABI = [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "function totalSupply() view returns (uint256)",
    "function balanceOf(address) view returns (uint256)",
  ]

  constructor(config: BotConfig) {
    this.config = config
    this.provider = new ethers.JsonRpcProvider(config.rpcUrl)
    this.wallet = new ethers.Wallet(config.privateKey, this.provider)

    this.factory = new ethers.Contract(config.factoryAddress, this.factoryABI, this.provider)
  }

  async start(onPoolDetected: (pool: PoolData) => void, onLog: (message: string) => void): Promise<void> {
    if (this.isRunning) {
      throw new Error("Bot is already running")
    }

    this.isRunning = true
    onLog("🚀 Starting Uniswap Sniper Bot...")
    onLog(`📡 Connected to ${this.config.rpcUrl}`)
    onLog(`👂 Listening for PoolCreated events...`)

    // Listen for new pool creation events
    this.factory.on("PoolCreated", async (token0, token1, fee, tickSpacing, pool, event) => {
      if (!this.isRunning) return

      try {
        const poolData: PoolData = {
          token0,
          token1,
          pool,
          fee: Number(fee),
          timestamp: new Date().toISOString(),
          blockNumber: event.blockNumber,
          txHash: event.transactionHash,
        }

        onLog(`🔍 New pool detected: ${pool}`)
        onPoolDetected(poolData)

        // Analyze the new pool
        await this.analyzePool(poolData, onLog)
      } catch (error) {
        onLog(`❌ Error processing pool: ${error}`)
      }
    })
  }

  async stop(): Promise<void> {
    this.isRunning = false
    this.factory.removeAllListeners("PoolCreated")
  }

  private async analyzePool(pool: PoolData, onLog: (message: string) => void): Promise<void> {
    try {
      // Get token information
      const token0Contract = new ethers.Contract(pool.token0, this.erc20ABI, this.provider)
      const token1Contract = new ethers.Contract(pool.token1, this.erc20ABI, this.provider)

      const [token0Symbol, token1Symbol, token0Decimals, token1Decimals] = await Promise.all([
        token0Contract.symbol().catch(() => "UNKNOWN"),
        token1Contract.symbol().catch(() => "UNKNOWN"),
        token0Contract.decimals().catch(() => 18),
        token1Contract.decimals().catch(() => 18),
      ])

      onLog(`📊 Pool Analysis: ${token0Symbol}/${token1Symbol} (Fee: ${pool.fee / 10000}%)`)

      // Check if this is a potential opportunity
      const isOpportunity = await this.evaluateOpportunity(pool, onLog)

      if (isOpportunity) {
        onLog(`🎯 Potential opportunity detected in ${token0Symbol}/${token1Symbol}`)
        // In a real implementation, you would execute the trade here
        // await this.executeTrade(pool, onLog)
      }
    } catch (error) {
      onLog(`❌ Error analyzing pool: ${error}`)
    }
  }

  private async evaluateOpportunity(pool: PoolData, onLog: (message: string) => void): Promise<boolean> {
    // Implement your trading strategy here
    // This is a simplified example

    try {
      // Check gas price
      const gasPrice = await this.provider.getFeeData()
      const currentGasPrice = Number(gasPrice.gasPrice) / 1e9 // Convert to Gwei

      if (currentGasPrice > this.config.maxGasPrice) {
        onLog(`⛽ Gas price too high: ${currentGasPrice.toFixed(2)} Gwei`)
        return false
      }

      // Add more sophisticated analysis here:
      // - Liquidity checks
      // - Token contract verification
      // - Honeypot detection
      // - Social sentiment analysis
      // - Technical indicators

      return Math.random() > 0.8 // Random for demo purposes
    } catch (error) {
      onLog(`❌ Error evaluating opportunity: ${error}`)
      return false
    }
  }

  private async executeTrade(pool: PoolData, onLog: (message: string) => void): Promise<void> {
    // IMPORTANT: This is where you would implement the actual trading logic
    // This is a complex process that involves:
    // 1. Calculating optimal trade amounts
    // 2. Setting up swap parameters
    // 3. Executing the transaction with proper gas settings
    // 4. Monitoring for MEV attacks
    // 5. Implementing stop-loss mechanisms

    onLog(`🔄 Trade execution logic would go here (not implemented in demo)`)
  }
}

// Utility functions
export const validateConfig = (config: Partial<BotConfig>): string[] => {
  const errors: string[] = []

  if (!config.rpcUrl) errors.push("RPC URL is required")
  if (!config.privateKey) errors.push("Private key is required")
  if (!config.factoryAddress) errors.push("Factory address is required")
  if (!config.routerAddress) errors.push("Router address is required")

  return errors
}

export const formatAddress = (address: string): string => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export const formatNumber = (num: number, decimals = 2): string => {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num)
}
