import { ethers } from "ethers"
import { writeFileSync } from "fs"

interface TestWallet {
  address: string
  privateKey: string
  mnemonic: string
  createdAt: string
}

function generateTestWallet(): TestWallet {
  // Generate a random wallet
  const wallet = ethers.Wallet.createRandom()

  return {
    address: wallet.address,
    privateKey: wallet.privateKey,
    mnemonic: wallet.mnemonic?.phrase || "",
    createdAt: new Date().toISOString(),
  }
}

function saveWalletToFile(wallet: TestWallet): void {
  const walletData = {
    ...wallet,
    warning: "⚠️ TEST WALLET ONLY - DO NOT USE FOR REAL FUNDS ⚠️",
    instructions: [
      "1. This wallet is for TESTING ONLY",
      "2. Send only 0.001-0.01 ETH on Base chain",
      "3. Never use this wallet for real trading",
      "4. Delete this file after testing",
    ],
  }

  writeFileSync("test-wallet.json", JSON.stringify(walletData, null, 2))
}

// Generate and save test wallet
console.log("🔐 Generating Test Wallet for Base Chain...")
console.log("⚠️  WARNING: This is for TESTING ONLY!")
console.log("")

const testWallet = generateTestWallet()

console.log("✅ Test Wallet Generated:")
console.log(`📍 Address: ${testWallet.address}`)
console.log(`🔑 Private Key: ${testWallet.privateKey}`)
console.log(`🎯 Mnemonic: ${testWallet.mnemonic}`)
console.log("")

console.log("📋 Next Steps:")
console.log("1. Send 0.001-0.01 ETH to this address on Base chain")
console.log("2. Copy the private key to bot configuration")
console.log("3. Enable 'Real Mode' in the bot")
console.log("4. Start the bot to test live detection")
console.log("")

console.log("🛡️  SECURITY REMINDERS:")
console.log("- This is a TEST wallet only")
console.log("- Never use for real trading")
console.log("- Use minimal amounts (0.001-0.01 ETH)")
console.log("- Delete after testing")

// Save to file
saveWalletToFile(testWallet)
console.log("💾 Wallet saved to: test-wallet.json")
