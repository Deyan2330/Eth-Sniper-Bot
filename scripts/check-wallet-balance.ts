import { ethers } from "ethers"

const BASE_RPC = "https://mainnet.base.org"

async function checkWalletBalance(address: string): Promise<void> {
  try {
    console.log("🔍 Checking wallet balance on Base chain...")
    console.log(`📍 Address: ${address}`)
    console.log("")

    const provider = new ethers.JsonRpcProvider(BASE_RPC)

    // Get network info
    const network = await provider.getNetwork()
    console.log(`🌐 Network: Base (Chain ID: ${network.chainId})`)

    // Get balance
    const balance = await provider.getBalance(address)
    const balanceEth = ethers.formatEther(balance)

    console.log(`💰 Balance: ${balanceEth} ETH`)

    // Get transaction count
    const txCount = await provider.getTransactionCount(address)
    console.log(`📊 Transaction Count: ${txCount}`)

    // Check if wallet has enough for testing
    const minBalance = 0.001
    if (Number.parseFloat(balanceEth) >= minBalance) {
      console.log("✅ Wallet has sufficient balance for testing!")
    } else {
      console.log(`⚠️  Wallet needs at least ${minBalance} ETH for testing`)
      console.log("💡 Send some ETH to this address on Base chain")
    }
  } catch (error) {
    console.error("❌ Error checking balance:", error)
  }
}

// Get address from command line argument
const address = process.argv[2]

if (!address) {
  console.log("Usage: npm run check-balance <wallet-address>")
  console.log("Example: npm run check-balance 0x1234...")
  process.exit(1)
}

if (!ethers.isAddress(address)) {
  console.log("❌ Invalid Ethereum address")
  process.exit(1)
}

checkWalletBalance(address)
