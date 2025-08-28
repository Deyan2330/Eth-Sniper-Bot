import { ethers } from "ethers"

async function checkWalletBalance(address: string): Promise<void> {
  try {
    console.log("🔍 Checking wallet balance on Base chain...")
    console.log(`Address: ${address}`)
    console.log("")

    // Connect to Base mainnet
    const provider = new ethers.JsonRpcProvider("https://mainnet.base.org")

    // Get network info
    const network = await provider.getNetwork()
    const blockNumber = await provider.getBlockNumber()

    console.log(`📡 Connected to Base Chain (ID: ${network.chainId})`)
    console.log(`📊 Current Block: ${blockNumber.toLocaleString()}`)
    console.log("")

    // Get balance
    const balance = await provider.getBalance(address)
    const balanceInEth = ethers.formatEther(balance)

    console.log("💰 WALLET BALANCE:")
    console.log(`ETH: ${balanceInEth}`)
    console.log(`Wei: ${balance.toString()}`)
    console.log("")

    if (Number.parseFloat(balanceInEth) > 0) {
      console.log("✅ Wallet has funds - ready for testing!")
      console.log("📋 Next steps:")
      console.log("1. Copy the private key to bot configuration")
      console.log("2. Enable 'Real Mode' in the bot")
      console.log("3. Start the bot to test live detection")
    } else {
      console.log("⚠️  Wallet is empty")
      console.log("📋 To fund the wallet:")
      console.log("1. Send 0.001-0.01 ETH to the address above")
      console.log("2. Use Base chain (not Ethereum mainnet)")
      console.log("3. Wait for confirmation, then run this script again")
    }
  } catch (error) {
    console.error("❌ Error checking balance:", error)
  }
}

// Get address from command line argument
const address = process.argv[2]

if (!address) {
  console.log("❌ Please provide a wallet address")
  console.log("Usage: npm run check-balance YOUR_WALLET_ADDRESS")
  process.exit(1)
}

if (!ethers.isAddress(address)) {
  console.log("❌ Invalid wallet address format")
  process.exit(1)
}

checkWalletBalance(address)
