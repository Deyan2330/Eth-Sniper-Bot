import { ethers } from "ethers"

const BASE_RPC_URL = "https://mainnet.base.org"

async function checkBalance(address: string) {
  try {
    console.log("🔍 Checking wallet balance on Base Chain...")
    console.log(`📍 Address: ${address}`)

    const provider = new ethers.JsonRpcProvider(BASE_RPC_URL)

    // Get network info
    const network = await provider.getNetwork()
    console.log(`🌐 Network: Base (Chain ID: ${network.chainId})`)

    // Get current block
    const blockNumber = await provider.getBlockNumber()
    console.log(`📊 Current Block: ${blockNumber.toLocaleString()}`)

    // Get ETH balance
    const balance = await provider.getBalance(address)
    const ethBalance = ethers.formatEther(balance)

    console.log("\n💰 Balance Information:")
    console.log("=" * 40)
    console.log(`ETH Balance: ${ethBalance} ETH`)
    console.log(`Wei Balance: ${balance.toString()} wei`)

    // Check if wallet has any balance
    if (balance > 0n) {
      console.log("✅ Wallet has funds!")
      const usdValue = Number.parseFloat(ethBalance) * 2000 // Rough ETH price estimate
      console.log(`💵 Estimated Value: ~$${usdValue.toFixed(2)} USD`)
    } else {
      console.log("❌ Wallet is empty")
      console.log("\n💡 To fund this wallet:")
      console.log("• Send ETH to this address on Base network")
      console.log("• Use a Base-compatible wallet (MetaMask, etc.)")
      console.log("• Bridge from Ethereum mainnet to Base")
    }

    // Get transaction count (nonce)
    const txCount = await provider.getTransactionCount(address)
    console.log(`📝 Transaction Count: ${txCount}`)

    console.log("\n🔗 Useful Links:")
    console.log(`• BaseScan: https://basescan.org/address/${address}`)
    console.log(`• Base Bridge: https://bridge.base.org/`)
  } catch (error) {
    console.error("❌ Error checking balance:", error)
    process.exit(1)
  }
}

// Get address from command line arguments
const address = process.argv[2]

if (!address) {
  console.error("❌ Please provide a wallet address")
  console.log("Usage: npm run check-balance <ADDRESS>")
  process.exit(1)
}

if (!ethers.isAddress(address)) {
  console.error("❌ Invalid Ethereum address")
  process.exit(1)
}

checkBalance(address)
