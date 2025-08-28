# 🧪 Uniswap Sniper Bot Testing Guide

## 🚀 Quick Start Testing

### Step 1: Generate Test Wallet
\`\`\`bash
npm run generate-wallet
\`\`\`
This creates a secure test wallet with:
- ✅ New wallet address
- ✅ Private key for bot configuration  
- ✅ Mnemonic phrase for backup
- ✅ Saved to `./data/test_wallet.json`

### Step 2: Test Base Chain Connection
\`\`\`bash
npm run test-connection
\`\`\`
This verifies:
- ✅ Base chain accessibility
- ✅ Multiple RPC endpoints
- ✅ Uniswap V3 Factory contract
- ✅ Recent pool activity

### Step 3: Fund Test Wallet
Send **0.001-0.01 ETH** to your test wallet address on **Base chain**:
- 🌐 Use Base mainnet (not Ethereum)
- 💰 Small amount only (0.001-0.01 ETH)
- ⚡ Wait for confirmation

### Step 4: Check Wallet Balance
\`\`\`bash
npm run check-balance YOUR_WALLET_ADDRESS
\`\`\`
Verifies:
- ✅ Wallet has funds
- ✅ Connection to Base chain
- ✅ Ready for testing

### Step 5: Configure Bot
1. Copy private key from generated wallet
2. Paste into bot configuration
3. Enable "🔴 REAL MODE"
4. Set RPC URL: `https://mainnet.base.org`

### Step 6: Start Real Testing
1. Click "Initialize System"
2. Watch "Live Pools" tab
3. Monitor "System Logs" for activity
4. See real Uniswap V3 pools appear!

## 🛡️ Security Best Practices

### ⚠️ CRITICAL WARNINGS
- **NEVER** use test wallets for real trading
- **ONLY** send small amounts (0.001-0.01 ETH)
- **DELETE** test wallets after testing
- **NEVER** share private keys publicly

### 🔒 Safe Testing Rules
1. **Test Environment Only** - These wallets are for testing
2. **Small Amounts** - Never risk significant funds
3. **Base Chain Only** - Use correct network
4. **Temporary Use** - Delete after testing
5. **No Real Trading** - Monitoring only

## 📊 Expected Results

When working correctly, you should see:

### ✅ Connection Status
- Status: "Connected"
- Network: "Base Mainnet" 
- Runtime: Active timer
- Pools: Increasing count

### ✅ Live Pool Detection
- Real token symbols (USDC, WETH, etc.)
- Actual block numbers
- Transaction hashes
- Fee tiers (0.05%, 0.3%, 1%)

### ✅ System Logs
\`\`\`
🔗 Connected to Base mainnet
👂 Listening for Uniswap V3 pool creation events...
🎯 New pool detected: 0x1234...
✅ Pool: USDC/WETH | Fee: 0.3%
\`\`\`

## 🔧 Troubleshooting

### Connection Issues
- Try different RPC endpoints
- Check wallet has funds
- Verify Base chain (not Ethereum)
- Check internet connection

### No Pools Detected
- Pool creation is sporadic
- Wait 10-30 minutes for activity
- Check system logs for errors
- Verify Uniswap V3 Factory connection

### Balance Issues
- Ensure using Base chain
- Wait for transaction confirmation
- Check correct wallet address
- Verify sufficient gas

## 🎯 Testing Checklist

- [ ] Generated test wallet
- [ ] Tested Base connection
- [ ] Funded wallet (0.001+ ETH)
- [ ] Verified balance
- [ ] Configured bot with private key
- [ ] Enabled Real Mode
- [ ] Started bot successfully
- [ ] Seeing live pool detection
- [ ] Monitoring system logs
- [ ] Ready to delete test wallet

## 🧹 Cleanup After Testing

1. **Stop the bot**
2. **Clear private key** from configuration
3. **Delete** `./data/test_wallet.json`
4. **Transfer remaining ETH** to main wallet (optional)
5. **Never use test wallet again**

---

## 📞 Support

If you encounter issues:
1. Check this guide first
2. Verify all steps completed
3. Check system logs for errors
4. Ensure using Base chain (not Ethereum)
5. Try different RPC endpoints

**Remember: This is for testing only! Never use for real trading.**
