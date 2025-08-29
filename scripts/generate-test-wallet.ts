import { ethers } from "ethers"
import * as fs from "fs"

interface WalletInfo {
  address: string
  privateKey: string
  mnemonic: string
  publicKey: string
}

function generateTestWallet(): WalletInfo {
  // Generate a random wallet
  const wallet = ethers.Wallet.createRandom()

  return {
    address: wallet.address,
    privateKey: wallet.privateKey,
    mnemonic: wallet.mnemonic?.phrase || "",
    publicKey: wallet.publicKey,
  }
}

function saveWalletToFile(wallet: WalletInfo) {
  const walletData = {
    ...wallet,
    network: "Base Mainnet",
    chainId: 8453,
    createdAt: new Date().toISOString(),
    warning: "⚠️ NEVER share your private key! This is for testing only.",
  }

  const filename = `test-wallet-${Date.now()}.json`
  fs.writeFileSync(filename, JSON.stringify(walletData, null, 2))
  return filename
}

// Generate and save wallet
console.log("🔐 Generating Test Wallet for Base Chain...")
const wallet = generateTestWallet()
const filename = saveWalletToFile(wallet)

console.log("\n✅ Test Wallet Generated Successfully!")
console.log("=" * 50)
console.log(`📁 Saved to: ${filename}`)
console.log(`📍 Address: ${wallet.address}`)
console.log(`🔑 Private Key: ${wallet.privateKey}`)
console.log(`🌱 Mnemonic: ${wallet.mnemonic}`)
console.log("=" * 50)
console.log("\n⚠️  SECURITY WARNING:")
console.log("• This wallet is for TESTING ONLY")
console.log("• Never use this on mainnet with real funds")
console.log("• Keep your private key secure")
console.log("• Fund with small amounts only")
console.log("\n💰 To fund this wallet:")
console.log("• Use Base testnet faucet")
console.log("• Or send small amount of ETH on Base mainnet")
console.log(`• Check balance: npm run check-balance ${wallet.address}`)
