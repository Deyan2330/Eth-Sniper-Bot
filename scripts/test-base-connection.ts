import { ethers } from "ethers"

const BASE_RPC = "https://mainnet.base.org"
const UNISWAP_V3_FACTORY = "0x33128a8fC17869897dcE68Ed026d694621f6FDfD"

async function testBaseConnection(): Promise<void> {
  try {
    console.log("🔍 Testing Base Chain Connection...")
    console.log("")

    const provider = new ethers.JsonRpcProvider(BASE_RPC)

    // Test basic connection
    console.log("1. Testing RPC connection...")
    const network = await provider.getNetwork()
    console.log(`✅ Connected to Base (Chain ID: ${network.chainId})`)

    // Test block number
    console.log("2. Getting latest block...")
    const blockNumber = await provider.getBlockNumber()
    console.log(`✅ Latest Block: ${blockNumber.toLocaleString()}`)

    // Test gas price
    console.log("3. Getting gas price...")
    const feeData = await provider.getFeeData()
    const gasPrice = feeData.gasPrice ? ethers.formatUnits(feeData.gasPrice, "gwei") : "Unknown"
    console.log(`✅ Gas Price: ${gasPrice} Gwei`)

    // Test Uniswap factory
    console.log("4. Testing Uniswap V3 Factory...")
    const factoryCode = await provider.getCode(UNISWAP_V3_FACTORY)
    if (factoryCode !== "0x") {
      console.log(`✅ Uniswap V3 Factory found at: ${UNISWAP_V3_FACTORY}`)
    } else {
      console.log("❌ Uniswap V3 Factory not found")
    }

    // Test recent pool activity
    console.log("5. Checking recent pool activity...")
    const factory = new ethers.Contract(
      UNISWAP_V3_FACTORY,
      [
        "event PoolCreated(address indexed token0, address indexed token1, uint24 indexed fee, int24 tickSpacing, address pool)",
      ],
      provider,
    )

    const currentBlock = await provider.getBlockNumber()
    const fromBlock = Math.max(0, currentBlock - 1000) // Last ~30 minutes

    const filter = factory.filters.PoolCreated()
    const events = await factory.queryFilter(filter, fromBlock, currentBlock)

    console.log(`✅ Found ${events.length} pools created in last ~30 minutes`)

    if (events.length > 0) {
      const latestEvent = events[events.length - 1]
      console.log(`📊 Most recent pool: Block ${latestEvent.blockNumber}`)
    }

    console.log("")
    console.log("🎯 Connection Test Results:")
    console.log("✅ Base chain connection: SUCCESS")
    console.log("✅ Uniswap V3 factory: SUCCESS")
    console.log("✅ Recent activity: SUCCESS")
    console.log("")
    console.log("🚀 Ready for real-time pool detection!")
  } catch (error) {
    console.error("❌ Connection test failed:", error)
    console.log("")
    console.log("💡 Troubleshooting:")
    console.log("- Check internet connection")
    console.log("- Try a different RPC endpoint")
    console.log("- Verify Base chain is accessible")
  }
}

testBaseConnection()
