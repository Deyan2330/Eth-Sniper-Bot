import { ethers } from "ethers"
import { BASE_RPC_URLS, UNISWAP_V3_ADDRESSES } from "../lib/constants"

async function testConnection() {
  console.log("🧪 Testing Base Chain Connection...")
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

  try {
    // Test each RPC endpoint
    const rpcUrls = [
      { name: "Base Mainnet (Official)", url: BASE_RPC_URLS.MAINNET },
      { name: "Alchemy", url: BASE_RPC_URLS.ALCHEMY + "demo" },
      { name: "Infura", url: BASE_RPC_URLS.INFURA + "demo" },
    ]

    for (const rpc of rpcUrls) {
      try {
        console.log(`\n🔍 Testing ${rpc.name}...`)

        const provider = new ethers.JsonRpcProvider(rpc.url)

        // Test basic connectivity
        const network = await provider.getNetwork()
        const blockNumber = await provider.getBlockNumber()

        console.log(`✅ ${rpc.name}: Connected`)
        console.log(`   Chain ID: ${network.chainId}`)
        console.log(`   Block: ${blockNumber.toLocaleString()}`)

        // Test Uniswap factory contract
        const factoryCode = await provider.getCode(UNISWAP_V3_ADDRESSES.FACTORY)
        if (factoryCode !== "0x") {
          console.log(`   🏭 Uniswap Factory: ✅ Found`)
        } else {
          console.log(`   🏭 Uniswap Factory: ❌ Not found`)
        }
      } catch (error) {
        console.log(`❌ ${rpc.name}: Failed - ${error}`)
      }
    }

    console.log("\n🎯 Testing Uniswap V3 Factory...")

    const provider = new ethers.JsonRpcProvider(BASE_RPC_URLS.MAINNET)
    const factoryAbi = [
      "event PoolCreated(address indexed token0, address indexed token1, uint24 indexed fee, int24 tickSpacing, address pool)",
      "function getPool(address tokenA, address tokenB, uint24 fee) external view returns (address pool)",
    ]

    const factory = new ethers.Contract(UNISWAP_V3_ADDRESSES.FACTORY, factoryAbi, provider)

    // Test recent pool events
    const currentBlock = await provider.getBlockNumber()
    const fromBlock = Math.max(0, currentBlock - 1000)

    console.log(`📊 Scanning blocks ${fromBlock} to ${currentBlock}...`)

    const filter = factory.filters.PoolCreated()
    const events = await factory.queryFilter(filter, fromBlock, currentBlock)

    console.log(`✅ Found ${events.length} pool creation events`)

    if (events.length > 0) {
      const latestEvent = events[events.length - 1]
      console.log(`📍 Latest Pool: ${latestEvent.args?.pool}`)
      console.log(`   Block: ${latestEvent.blockNumber}`)
      console.log(`   TX: ${latestEvent.transactionHash}`)
    }

    console.log("\n🎉 All tests passed! Base chain connection is working.")
  } catch (error) {
    console.error("❌ Connection test failed:", error)
    process.exit(1)
  }
}

// CLI usage
if (require.main === module) {
  testConnection()
}
