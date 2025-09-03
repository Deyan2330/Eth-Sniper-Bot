import { ethers } from "ethers"

interface TestWallet {
  address: string
  privateKey: string
  mnemonic: string
}

function generateTestWallet(): TestWallet {
  // Generate a random wallet
  const wallet = ethers.Wallet.createRandom()

  return {
    address: wallet.address,
    privateKey: wallet.privateKey,
    mnemonic: wallet.mnemonic?.phrase || "",
  }
}

function main() {
  console.log("🔐 Generating Test Wallet for Base Chain...")

  const wallet = generateTestWallet()

  console.log("\n✅ Test Wallet Generated:")
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
  console.log(`📍 Address: ${wallet.address}`)
  console.log(`🔑 Private Key: ${wallet.privateKey}`)
  console.log(`🎯 Mnemonic: ${wallet.mnemonic}`)
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
  console.log("\n⚠️  SECURITY WARNING:")
  console.log("• This is a TEST wallet - DO NOT use for real funds")
  console.log("• Store private key securely")
  console.log("• Never share private key publicly")
  console.log("\n🧪 Testing Commands:")
  console.log(`npm run check-balance ${wallet.address}`)
  console.log("npm run test-connection")
  console.log("\n💡 Future MetaMask Integration:")
  console.log("• This wallet can be imported into MetaMask")
  console.log("• Use the private key or mnemonic phrase")
  console.log("• Add Base network to MetaMask first")
}

if (require.main === module) {
  main()
}

export { generateTestWallet }
