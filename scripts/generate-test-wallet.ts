import { ethers } from "ethers"
import { writeFileSync, existsSync, mkdirSync } from "fs"

interface TestWallet {
  address: string
  privateKey: string
  mnemonic: string
  createdAt: string
  network: string
}

function generateTestWallet(): TestWallet {
  // Generate a random wallet
  const wallet = ethers.Wallet.createRandom()

  const testWallet: TestWallet = {
    address: wallet.address,
    privateKey: wallet.privateKey,
    mnemonic: wallet.mnemonic?.phrase || "",
    createdAt: new Date().toISOString(),
    network: "Base Mainnet",
  }

  return testWallet
}

function saveWallet(wallet: TestWallet): void {
  // Create data directory if it doesn't exist
  if (!existsSync("./data")) {
    mkdirSync("./data", { recursive: true })
  }

  // Save wallet info
  const walletData = {
    ...wallet,
    warning: "⚠️ TEST WALLET ONLY - DO NOT USE FOR REAL TRADING ⚠️",
    instructions: [
      "1. Send 0.001-0.01 ETH to this address on Base chain",
      "2. Copy the private key to bot configuration",
      "3. Enable 'Real Mode' in the bot",
      "4. Start the bot to test live pool detection",
      "5. DELETE this wallet after testing",
    ],
  }

  writeFileSync("./data/test_wallet.json", JSON.stringify(walletData, null, 2))

  console.log("🎯 TEST WALLET GENERATED")
  console.log("========================")
  console.log(`Address: ${wallet.address}`)
  console.log(`Private Key: ${wallet.privateKey}`)
  console.log(`Mnemonic: ${wallet.mnemonic}`)
  console.log("")
  console.log("⚠️  IMPORTANT SECURITY NOTES:")
  console.log("• This is a TEST wallet only")
  console.log("• Only send small amounts (0.001-0.01 ETH)")
  console.log("• Never use for real trading")
  console.log("• Delete after testing")
  console.log("")
  console.log("📋 NEXT STEPS:")
  console.log("1. Send 0.001 ETH to the address above on Base chain")
  console.log("2. Copy the private key to bot configuration")
  console.log("3. Enable 'Real Mode' and start the bot")
  console.log("")
  console.log("💾 Wallet saved to: ./data/test_wallet.json")
}

// Generate and save the test wallet
const testWallet = generateTestWallet()
saveWallet(testWallet)
