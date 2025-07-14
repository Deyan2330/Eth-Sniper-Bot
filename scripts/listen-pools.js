// Pure Node.js script for listening to Uniswap V3 pools
// Run with: node scripts/listen-pools.js

const { ethers } = require("ethers")
const fs = require("fs")

// Base Chain Configuration
const BASE_CONFIG = {
  RPC_URL: "https://mainnet.base.org",
  UNISWAP_V3_FACTORY: "0x33128a8fC17869897dcE68Ed026d694621f6FdF9",
  POOLS_FILE: "detected_pools.json",
}

// PoolCreated event ABI
const FACTORY_ABI = [
  "event PoolCreated(address indexed token0, address indexed token1, uint24 indexed fee, int24 tickSpacing, address pool)",
]

// ERC20 ABI for token info
const ERC20_ABI = [
  "function symbol() view returns (string)",
  "function name() view returns (string)",
  "function decimals() view returns (uint8)",
]

class PoolListener {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(BASE_CONFIG.RPC_URL)
    this.factory = new ethers.Contract(BASE_CONFIG.UNISWAP_V3_FACTORY, FACTORY_ABI, this.provider)
    this.detectedPools = []
    this.isRunning = false
  }

  async start() {
    console.log("🚀 Starting Uniswap V3 Pool Listener on Base Chain...")

    try {
      // Test connection
      const network = await this.provider.getNetwork()
      const blockNumber = await this.provider.getBlockNumber()

      console.log(`📡 Connected to Base (Chain ID: ${network.chainId})`)
      console.log(`📊 Current Block: ${blockNumber}`)
      console.log(`🏭 Factory: ${BASE_CONFIG.UNISWAP_V3_FACTORY}`)
      console.log("👂 Listening for PoolCreated events...\n")

      this.isRunning = true

      // Listen for PoolCreated events
      this.factory.on("PoolCreated", async (token0, token1, fee, tickSpacing, poolAddress, event) => {
        if (!this.isRunning) return

        const timestamp = new Date().toISOString()

        console.log(`🔍 NEW POOL DETECTED!`)
        console.log(`   Pool Address: ${poolAddress}`)
        console.log(`   Token0: ${token0}`)
        console.log(`   Token1: ${token1}`)
        console.log(`   Fee: ${fee} (${Number(fee) / 10000}%)`)
        console.log(`   Block: ${event.blockNumber}`)
        console.log(`   TX: ${event.transactionHash}`)

        // Get token symbols
        try {
          const token0Contract = new ethers.Contract(token0, ERC20_ABI, this.provider)
          const token1Contract = new ethers.Contract(token1, ERC20_ABI, this.provider)

          const [symbol0, symbol1] = await Promise.allSettled([token0Contract.symbol(), token1Contract.symbol()])

          const token0Symbol = symbol0.status === "fulfilled" ? symbol0.value : "UNKNOWN"
          const token1Symbol = symbol1.status === "fulfilled" ? symbol1.value : "UNKNOWN"

          console.log(`   Pair: ${token0Symbol}/${token1Symbol}`)
        } catch (error) {
          console.log(`   ⚠️ Could not fetch token symbols`)
        }

        // Store pool data
        const poolData = {
          poolAddress: poolAddress.toLowerCase(),
          token0: token0.toLowerCase(),
          token1: token1.toLowerCase(),
          fee: Number(fee),
          tickSpacing: Number(tickSpacing),
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash,
          timestamp,
        }

        this.detectedPools.unshift(poolData)

        // Keep only last 1000 pools
        if (this.detectedPools.length > 1000) {
          this.detectedPools = this.detectedPools.slice(0, 1000)
        }

        // Save to file
        this.saveToFile()

        console.log(`   💾 Saved to ${BASE_CONFIG.POOLS_FILE}`)
        console.log(`   📊 Total pools detected: ${this.detectedPools.length}\n`)
      })

      // Handle errors
      this.provider.on("error", (error) => {
        console.error("🔌 Provider Error:", error.message)
      })
    } catch (error) {
      console.error("❌ Failed to start listener:", error.message)
      process.exit(1)
    }
  }

  saveToFile() {
    try {
      const data = {
        totalPools: this.detectedPools.length,
        lastUpdated: new Date().toISOString(),
        pools: this.detectedPools,
      }

      fs.writeFileSync(BASE_CONFIG.POOLS_FILE, JSON.stringify(data, null, 2))
    } catch (error) {
      console.error("💾 Error saving to file:", error.message)
    }
  }

  stop() {
    console.log("\n⏹️ Stopping listener...")
    this.isRunning = false
    this.factory.removeAllListeners("PoolCreated")
    this.provider.removeAllListeners()
    console.log(`📊 Final count: ${this.detectedPools.length} pools detected`)
    process.exit(0)
  }
}

// Start the listener
const listener = new PoolListener()
listener.start()

// Handle graceful shutdown
process.on("SIGINT", () => {
  listener.stop()
})

process.on("SIGTERM", () => {
  listener.stop()
})
