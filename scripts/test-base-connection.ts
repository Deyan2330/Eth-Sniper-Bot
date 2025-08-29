import { ethers } from "ethers"

const BASE_RPC_URL = "https://mainnet.base.org"
const UNISWAP_V3_FACTORY = "0x33128a8fC17869897dcE68Ed026d694621f6FDfD"

async function testConnection() {
  try {
    console.log("🔍 Testing Base Chain Connection...")
    console.log(`🌐 RPC URL: ${BASE_RPC_URL}`)

    const provider = new ethers.JsonRpcProvider(BASE_RPC_URL)

    // Test basic connection
    console.log("\n1️⃣ Testing Basic Connection...")
    const network = await provider.getNetwork()
    console.log(`✅ Connected to Chain ID: ${network.chainId}`)
    console.log(`✅ Network Name: ${network.name || "Base"}`)

    // Get current block
    console.log("\n2️⃣ Getting Current Block...")
    const blockNumber = await provider.getBlockNumber()
    console.log(`✅ Current Block: ${blockNumber.toLocaleString()}`)

    // Test gas price
    console.log("\n3️⃣ Getting Gas Price...")
    const gasPrice = await provider.getFeeData()
    console.log(`✅ Gas Price: ${ethers.formatUnits(gasPrice.gasPrice || 0n, "gwei")} Gwei`)

    // Test Uniswap V3 Factory
    console.log("\n4️⃣ Testing Uniswap V3 Factory...")
    console.log(`📍 Factory Address: ${UNISWAP_V3_FACTORY}`)

    const factoryCode = await provider.getCode(UNISWAP_V3_FACTORY)
    if (factoryCode === "0x") {
      throw new Error("Factory contract not found!")
    }
    console.log(`✅ Factory Contract Verified (${factoryCode.length} bytes)`)

    // Test factory contract call
    const factoryABI = [
      "function owner() view returns (address)",
      "function feeAmountTickSpacing(uint24) view returns (int24)",
    ]

    const factory = new ethers.Contract(UNISWAP_V3_FACTORY, factoryABI, provider)

    try {
      const tickSpacing = await factory.feeAmountTickSpacing(3000) // 0.3% fee tier
      console.log(`✅ Factory Call Success - 0.3% fee tick spacing: ${tickSpacing}`)
    } catch (error) {
      console.log(`⚠️ Factory call failed: ${error}`)
    }

    // Test event filtering
    console.log("\n5️⃣ Testing Event Filtering...")
    const eventABI = [
      "event PoolCreated(address indexed token0, address indexed token1, uint24 indexed fee, int24 tickSpacing, address pool)",
    ]
    const eventContract = new ethers.Contract(UNISWAP_V3_FACTORY, eventABI, provider)

    const currentBlock = await provider.getBlockNumber()
    const fromBlock = Math.max(0, currentBlock - 100) // Last 100 blocks

    console.log(`🔍 Scanning blocks ${fromBlock} to ${currentBlock}...`)

    const filter = eventContract.filters.PoolCreated()
    const events = await eventContract.queryFilter(filter, fromBlock, currentBlock)

    console.log(`✅ Found ${events.length} PoolCreated events in last 100 blocks`)

    if (events.length > 0) {
      const latestEvent = events[events.length - 1]
      console.log(`📊 Latest Pool: ${latestEvent.args?.pool}`)
      console.log(`📊 Block: ${latestEvent.blockNumber}`)
    }

    console.log("\n🎉 All Tests Passed!")
    console.log("✅ Base chain connection is working properly")
    console.log("✅ Uniswap V3 factory is accessible")
    console.log("✅ Event filtering is functional")

    if (events.length === 0) {
      console.log("\n⚠️  NOTE: No recent pools found in last 100 blocks")
      console.log("This is normal - new pools aren't created frequently")
      console.log("The bot will detect them when they are created")
    }
  } catch (error) {
    console.error("\n❌ Connection Test Failed:")
    console.error(error)
    process.exit(1)
  }
}

testConnection()
