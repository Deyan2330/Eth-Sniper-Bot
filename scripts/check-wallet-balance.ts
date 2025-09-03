import { ethers } from "ethers"
import { BASE_RPC_URLS } from "../lib/constants"

async function checkBalance(address: string, rpcUrl: string = BASE_RPC_URLS.MAINNET) {
  try {
    console.log("🔍 Checking wallet balance...")
    console.log(`📍 Address: ${address}`)
    console.log(`🌐 RPC: ${rpcUrl}`)

    const provider = new ethers.JsonRpcProvider(rpcUrl)

    // Get network info
    const network = await provider.getNetwork()
    console.log(`⛓️  Network: ${network.name} (Chain ID: ${network.chainId})`)

    // Get balance
    const balance = await provider.getBalance(address)
    const balanceEth = ethers.formatEther(balance)

    console.log("\n💰 Balance Results:")
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    console.log(`ETH Balance: ${balanceEth} ETH`)
    console.log(`Wei Balance: ${balance.toString()} wei`)
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

    if (Number.parseFloat(balanceEth) === 0) {
      console.log("\n⚠️  Wallet is empty!")
      console.log("💡 To get test ETH:")
      console.log("• Use Base testnet faucet for testing")
      console.log("• Transfer real ETH for mainnet testing")
    } else {
      console.log(`\n✅ Wallet has ${balanceEth} ETH`)
    }
  } catch (error) {
    console.error("❌ Error checking balance:", error)
    process.exit(1)
  }
}

// CLI usage
if (require.main === module) {
  const address = process.argv[2]

  if (!address) {
    console.error("❌ Please provide wallet address")
    console.log("Usage: npm run check-balance <ADDRESS>")
    process.exit(1)
  }

  if (!ethers.isAddress(address)) {
    console.error("❌ Invalid Ethereum address")
    process.exit(1)
  }

  checkBalance(address)
}
