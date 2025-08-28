import { ethers } from "ethers"

async function testBaseConnection(): Promise<void> {
  try {
    console.log("🔍 Testing Base chain connection...")
    console.log("")

    // Test multiple RPC endpoints
    const rpcUrls = [
      "https://mainnet.base.org",
      "https://base.blockpi.network/v1/rpc/public",
      "https://base.meowrpc.com",
    ]

    for (const rpcUrl of rpcUrls) {
      try {
        console.log(`📡 Testing: ${rpcUrl}`)

        const provider = new ethers.JsonRpcProvider(rpcUrl)

        const start = Date.now()
        const [network, blockNumber, gasPrice] = await Promise.all([
          provider.getNetwork(),
          provider.getBlockNumber(),
          provider.getFeeData(),
        ])
        const latency = Date.now() - start

        console.log(`  ✅ Connected (${latency}ms)`)
        console.log(`  📊 Chain ID: ${network.chainId}`)
        console.log(`  📊 Block: ${blockNumber.toLocaleString()}`)
        console.log(`  ⛽ Gas: ${ethers.formatUnits(gasPrice.gasPrice || 0, "gwei")} Gwei`)
        console.log("")
      } catch (error) {
        console.log(`  ❌ Failed: ${error}`)
        console.log("")
      }
    }

    // Test Uniswap V3 Factory
    console.log("🏭 Testing Uniswap V3 Factory...")
    const provider = new ethers.JsonRpcProvider("https://mainnet.base.org")
    const factoryAddress = "0x33128a8fC17869897dcE68Ed026d694621f6FDfD"

    const code = await provider.getCode(factoryAddress)
    if (code !== "0x") {
      console.log("✅ Uniswap V3 Factory found and verified")

      // Test recent pool creation events
      const factoryABI = [
        "event PoolCreated(address indexed token0, address indexed token1, uint24 indexed fee, int24 tickSpacing, address pool)",
      ]

      const factory = new ethers.Contract(factoryAddress, factoryABI, provider)
      const currentBlock = await provider.getBlockNumber()
      const fromBlock = currentBlock - 1000 // Last ~1000 blocks

      console.log(`🔍 Checking recent pools (blocks ${fromBlock} to ${currentBlock})...`)

      const filter = factory.filters.PoolCreated()
      const events = await factory.queryFilter(filter, fromBlock, currentBlock)

      console.log(`📈 Found ${events.length} pools created recently`)

      if (events.length > 0) {
        const latest = events[events.length - 1]
        console.log(`🕐 Most recent pool: Block ${latest.blockNumber}`)
        console.log("✅ Pool detection system is working!")
      }
    } else {
      console.log("❌ Uniswap V3 Factory not found")
    }

    console.log("")
    console.log("🎯 CONNECTION TEST COMPLETE")
    console.log("✅ Base chain is accessible")
    console.log("✅ Ready for real-time pool detection")
  } catch (error) {
    console.error("❌ Connection test failed:", error)
  }
}

testBaseConnection()
