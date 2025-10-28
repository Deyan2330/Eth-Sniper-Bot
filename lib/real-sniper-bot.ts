import { ethers } from "ethers"

const FACTORY = "0x33128a8fC17869897dcE68Ed026d694621f6FDfD"
const WETH = "0x4200000000000000000000000000000000000006"
const FACTORY_ABI = [
  "event PoolCreated(address indexed token0, address indexed token1, uint24 indexed fee, int24 tickSpacing, address pool)",
]
const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
]

export interface RealPoolData {
  poolAddress: string
  token0: string
  token1: string
  fee: number
  timestamp: string
  blockNumber: number
  transactionHash: string
  token0Info?: {
    symbol: string
    name: string
    decimals: number
  }
  token1Info?: {
    symbol: string
    name: string
    decimals: number
  }
}

export class RealUniswapListener {
  private provider: ethers.JsonRpcProvider
  private factory: ethers.Contract
  private isRunning = false

  constructor(rpcUrl: string) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl)
    this.factory = new ethers.Contract(FACTORY, FACTORY_ABI, this.provider)
  }

  async start(onPoolDetected: (pool: RealPoolData) => void, onLog: (message: string) => void): Promise<void> {
    if (this.isRunning) {
      throw new Error("Listener is already running")
    }

    this.isRunning = true
    onLog("🚀 Starting Real Uniswap Listener...")
    onLog(`📡 Connected to Base Chain`)
    onLog(`👂 Listening for PoolCreated events...`)

    this.factory.on("PoolCreated", async (token0, token1, fee, tickSpacing, pool, event) => {
      if (!this.isRunning) return

      try {
        const block = await event.getBlock()
        const blockTime = Number(block.timestamp) * 1000

        const [info0, info1] = await Promise.all([this.getTokenInfo(token0), this.getTokenInfo(token1)])

        const poolData: RealPoolData = {
          poolAddress: pool,
          token0,
          token1,
          fee: Number(fee),
          timestamp: new Date(blockTime).toISOString(),
          blockNumber: Number(event.blockNumber),
          transactionHash: event.transactionHash,
          token0Info: info0,
          token1Info: info1,
        }

        onLog(`🎯 New pool detected: ${pool}`)
        onPoolDetected(poolData)
      } catch (error) {
        onLog(`❌ Error processing pool event: ${error}`)
      }
    })

    // Scan recent blocks
    try {
      const currentBlock = await this.provider.getBlockNumber()
      const fromBlock = currentBlock - 10
      onLog(`🔍 Scanning blocks ${fromBlock} to ${currentBlock}...`)

      const events = await this.factory.queryFilter(this.factory.filters.PoolCreated(), fromBlock, currentBlock)

      onLog(`📊 Found ${events.length} recent pools`)

      for (const event of events) {
        if (!this.isRunning) break

        const [token0, token1, fee, tickSpacing, pool] = event.args!
        const block = await event.getBlock()
        const blockTime = Number(block.timestamp) * 1000

        const [info0, info1] = await Promise.all([this.getTokenInfo(token0), this.getTokenInfo(token1)])

        const poolData: RealPoolData = {
          poolAddress: pool,
          token0,
          token1,
          fee: Number(fee),
          timestamp: new Date(blockTime).toISOString(),
          blockNumber: Number(event.blockNumber),
          transactionHash: event.transactionHash,
          token0Info: info0,
          token1Info: info1,
        }

        onPoolDetected(poolData)
        await new Promise((resolve) => setTimeout(resolve, 100))
      }
    } catch (error) {
      onLog(`⚠️ Error scanning recent blocks: ${error}`)
    }
  }

  async stop(): Promise<void> {
    this.isRunning = false
    this.factory.removeAllListeners("PoolCreated")
  }

  private async getTokenInfo(tokenAddress: string): Promise<{
    symbol: string
    name: string
    decimals: number
  }> {
    try {
      const contract = new ethers.Contract(tokenAddress, ERC20_ABI, this.provider)
      const [symbol, name, decimals] = await Promise.all([
        contract.symbol().catch(() => "UNKNOWN"),
        contract.name().catch(() => "Unknown Token"),
        contract.decimals().catch(() => 18),
      ])

      return {
        symbol,
        name,
        decimals: Number(decimals),
      }
    } catch {
      return {
        symbol: "UNKNOWN",
        name: "Unknown Token",
        decimals: 18,
      }
    }
  }
}
