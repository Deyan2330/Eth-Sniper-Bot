import { ethers } from "ethers"

export interface TokenInfo {
  address: string
  symbol: string
  name: string
  decimals: number
}

export interface RealPoolData {
  poolAddress: string
  token0: string
  token1: string
  fee: number
  blockNumber: number
  timestamp: string
  transactionHash: string
  token0Info?: TokenInfo
  token1Info?: TokenInfo
  isNewToken: boolean
  createdSecondsAgo: number
}

export interface RealTimeStats {
  isRunning: boolean
  totalPools: number
  recentPools: number
  connectionStatus: string
  runtime: string
  lastActivity: string
  currentBlock: number
  eventsListened: number
  newTokensFound: number
}

// Uniswap V3 Factory on Base
const UNISWAP_V3_FACTORY_BASE = "0x33128a8fC17869897dcE68Ed026d694621f6FDfD"

// WETH address on Base (used to identify new tokens)
const WETH_BASE = "0x4200000000000000000000000000000000000006"

// Uniswap V3 Factory ABI (PoolCreated event)
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

export class RealUniswapListener {
  private provider: ethers.JsonRpcProvider
  private factoryContract: ethers.Contract
  private isRunning = false
  private stats: RealTimeStats
  private startTime = 0
  private rpcUrl: string

  constructor(rpcUrl: string) {
    this.rpcUrl = rpcUrl
    this.provider = new ethers.JsonRpcProvider(rpcUrl)
    this.factoryContract = new ethers.Contract(UNISWAP_V3_FACTORY_BASE, FACTORY_ABI, this.provider)

    this.stats = {
      isRunning: false,
      totalPools: 0,
      recentPools: 0,
      connectionStatus: "disconnected",
      runtime: "0h 0m",
      lastActivity: "None",
      currentBlock: 0,
      eventsListened: 0,
      newTokensFound: 0,
    }
  }

  async start(onPoolDetected: (pool: RealPoolData) => void, addLog: (message: string, type?: string) => void) {
    this.isRunning = true
    this.startTime = Date.now()
    this.stats.isRunning = true
    this.stats.connectionStatus = "connecting"

    try {
      // Test connection
      const network = await this.provider.getNetwork()
      const currentBlock = await this.provider.getBlockNumber()

      addLog("🔗 Connected to Base network", "success")
      addLog(`📡 Network: ${network.name} (Chain ID: ${network.chainId})`, "info")
      addLog(`📦 Current block: ${currentBlock.toLocaleString()}`, "info")
      addLog("👂 Listening for NEW pool creation events...", "info")
      addLog("🎯 Filtering for brand new tokens only", "warning")

      this.stats.connectionStatus = "connected"
      this.stats.currentBlock = currentBlock

      // Listen for new PoolCreated events in real-time
      this.factoryContract.on("PoolCreated", async (token0, token1, fee, tickSpacing, poolAddress, event) => {
        if (!this.isRunning) return

        try {
          const block = await event.getBlock()
          const currentTime = Date.now()
          const blockTime = Number(block.timestamp) * 1000
          const secondsAgo = Math.floor((currentTime - blockTime) / 1000)

          addLog(`🚨 NEW POOL CREATED! Block: ${Number(event.blockNumber)}`, "success")
          addLog(`   ⏰ Created ${secondsAgo} seconds ago`, "info")
          addLog(`   📍 Pool: ${poolAddress}`, "info")
          addLog(`   🪙 Token0: ${token0}`, "info")
          addLog(`   🪙 Token1: ${token1}`, "info")
          addLog(`   💰 Fee: ${fee / 10000}%`, "info")

          // Check if this involves a new token (not WETH)
          const isNewToken = token0 !== WETH_BASE && token1 !== WETH_BASE

          if (isNewToken) {
            addLog(`🎉 NEW TOKEN DETECTED! This is a fresh launch!`, "success")
            this.stats.newTokensFound++
          } else {
            addLog(`ℹ️ Pool with WETH - might be new token launch`, "info")
          }

          // Get token information
          const token0Info = await this.getTokenInfo(token0, addLog)
          const token1Info = await this.getTokenInfo(token1, addLog)

          const poolData: RealPoolData = {
            poolAddress,
            token0,
            token1,
            fee: Number(fee),
            blockNumber: Number(event.blockNumber),
            timestamp: blockTime.toString(),
            transactionHash: event.transactionHash,
            token0Info,
            token1Info,
            isNewToken,
            createdSecondsAgo: secondsAgo,
          }

          this.stats.totalPools++
          this.stats.recentPools++
          this.stats.lastActivity = new Date().toLocaleTimeString()
          this.stats.currentBlock = Number(event.blockNumber)
          this.stats.eventsListened++

          onPoolDetected(poolData)
        } catch (error) {
          addLog(`❌ Error processing pool event: ${error}`, "error")
        }
      })

      // Also listen for the latest few blocks to catch any recent pools
      addLog("🔍 Scanning last 10 blocks for recent pools...", "info")
      await this.scanRecentBlocks(onPoolDetected, addLog)
    } catch (error) {
      addLog(`❌ Failed to connect to Base network: ${error}`, "error")
      this.stats.connectionStatus = "error"
      throw error
    }
  }

  private async scanRecentBlocks(
    onPoolDetected: (pool: RealPoolData) => void,
    addLog: (message: string, type?: string) => void,
  ) {
    try {
      const currentBlock = await this.provider.getBlockNumber()
      const fromBlock = currentBlock - 10 // Last 10 blocks

      addLog(`🔍 Scanning blocks ${fromBlock} to ${currentBlock}...`, "info")

      // Get PoolCreated events from recent blocks
      const filter = this.factoryContract.filters.PoolCreated()
      const events = await this.factoryContract.queryFilter(filter, fromBlock, currentBlock)

      addLog(`📊 Found ${events.length} pools in last 10 blocks`, "info")

      for (const event of events) {
        if (!this.isRunning) break

        const [token0, token1, fee, tickSpacing, poolAddress] = event.args!
        const block = await event.getBlock()
        const currentTime = Date.now()
        const blockTime = Number(block.timestamp) * 1000
        const secondsAgo = Math.floor((currentTime - blockTime) / 1000)

        // Only show very recent pools (less than 1 hour old)
        if (secondsAgo > 3600) continue

        const isNewToken = token0 !== WETH_BASE && token1 !== WETH_BASE

        addLog(`🕐 Recent pool found: ${secondsAgo}s ago`, "info")

        if (isNewToken) {
          addLog(`🎯 Contains new token!`, "success")
          this.stats.newTokensFound++
        }

        const token0Info = await this.getTokenInfo(token0, addLog)
        const token1Info = await this.getTokenInfo(token1, addLog)

        const poolData: RealPoolData = {
          poolAddress,
          token0,
          token1,
          fee: Number(fee),
          blockNumber: Number(event.blockNumber),
          timestamp: blockTime.toString(),
          transactionHash: event.transactionHash,
          token0Info,
          token1Info,
          isNewToken,
          createdSecondsAgo: secondsAgo,
        }

        this.stats.totalPools++
        this.stats.recentPools++
        this.stats.eventsListened++

        onPoolDetected(poolData)

        // Small delay to avoid overwhelming
        await new Promise((resolve) => setTimeout(resolve, 100))
      }
    } catch (error) {
      addLog(`⚠️ Error scanning recent blocks: ${error}`, "warning")
    }
  }

  private async getTokenInfo(
    tokenAddress: string,
    addLog: (message: string, type?: string) => void,
  ): Promise<TokenInfo> {
    try {
      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, this.provider)

      const [name, symbol, decimals] = await Promise.all([
        tokenContract.name().catch(() => "Unknown"),
        tokenContract.symbol().catch(() => "UNKNOWN"),
        tokenContract.decimals().catch(() => 18),
      ])

      return {
        address: tokenAddress,
        name,
        symbol,
        decimals: Number(decimals),
      }
    } catch (error) {
      addLog(`⚠️ Could not fetch token info for ${tokenAddress}`, "warning")
      return {
        address: tokenAddress,
        name: "Unknown Token",
        symbol: "UNKNOWN",
        decimals: 18,
      }
    }
  }

  async stop() {
    this.isRunning = false
    this.stats.isRunning = false
    this.stats.connectionStatus = "disconnected"

    // Remove all listeners
    this.factoryContract.removeAllListeners("PoolCreated")
  }

  getRealTimeStats(): RealTimeStats {
    if (this.isRunning && this.startTime > 0) {
      const runtime = Date.now() - this.startTime
      const hours = Math.floor(runtime / (1000 * 60 * 60))
      const minutes = Math.floor((runtime % (1000 * 60 * 60)) / (1000 * 60))
      this.stats.runtime = `${hours}h ${minutes}m`
    }
    return { ...this.stats }
  }
}
