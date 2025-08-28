# 🧪 Uniswap Sniper Bot Testing Guide

## 🎯 Overview
This guide will help you safely test the real Base chain detection functionality using a test wallet with minimal funds.

## ⚠️ IMPORTANT SECURITY WARNINGS

- **NEVER use real trading funds for testing**
- **Only use 0.001-0.01 ETH for testing**
- **Delete test wallets after use**
- **This is for MONITORING ONLY - no actual trading**

## 🚀 Quick Start

### Step 1: Generate Test Wallet
\`\`\`bash
npm run generate-wallet
\`\`\`

This creates:
- ✅ New test wallet with private key
- ✅ Saves wallet info to `test-wallet.json`
- ✅ Displays address and private key

### Step 2: Fund Test Wallet
1. Copy the generated wallet address
2. Send **0.001-0.01 ETH** to this address on **Base chain**
3. Use a bridge like [Base Bridge](https://bridge.base.org) if needed

### Step 3: Verify Balance
\`\`\`bash
npm run check-balance YOUR_WALLET_ADDRESS
\`\`\`

Example:
\`\`\`bash
npm run check-balance 0x1234567890123456789012345678901234567890
\`\`\`

### Step 4: Test Connection
\`\`\`bash
npm run test-connection
\`\`\`

This verifies:
- ✅ Base chain connectivity
- ✅ Uniswap V3 factory access
- ✅ Recent pool activity

### Step 5: Configure Bot
1. Open the bot interface
2. Go to **Configuration** tab
3. Enable **🔴 REAL MODE**
4. Paste your test wallet's **private key**
5. Set RPC URL (default: `https://mainnet.base.org`)

### Step 6: Start Real Detection
1. Click **"Initialize System"**
2. Watch the **Live Pools** tab
3. Monitor **System Logs** for activity

## 📊 Expected Results

When working correctly, you should see:

### In System Logs:
\`\`\`
🔍 Testing Base chain connection...
✅ Connected to Base Chain (ID: 8453)
📊 Current Block: 12,345,678
👂 Listening for Uniswap V3 pool creation events...
✅ Real-time listener is now active!
🎯 New pool detected: 0xabc123...
✅ Pool: USDC/WETH | Fee: 0.3%
\`\`\`

### In Live Pools Tab:
- Real pool addresses
- Token symbols (USDC, WETH, etc.)
- Fee tiers (0.05%, 0.3%, 1%)
- Block numbers and timestamps
- Transaction hashes

## 🔧 Troubleshooting

### Connection Issues
\`\`\`bash
# Test connection first
npm run test-connection

# Check wallet balance
npm run check-balance YOUR_ADDRESS
\`\`\`

### Common Problems:

1. **"Connection failed"**
   - Check internet connection
   - Try different RPC URL
   - Verify Base chain accessibility

2. **"Insufficient balance"**
   - Send more ETH to test wallet
   - Minimum 0.001 ETH required

3. **"No pools detected"**
   - Pool creation is sporadic
   - Wait 10-30 minutes for activity
   - Check system logs for errors

## 🛡️ Security Best Practices

### ✅ DO:
- Use test wallets only
- Use minimal amounts (0.001-0.01 ETH)
- Delete test files after use
- Monitor system logs
- Test on Base mainnet only

### ❌ DON'T:
- Use real trading wallets
- Store large amounts
- Share private keys
- Use for actual trading
- Leave test files on system

## 📁 Generated Files

The testing process creates:

\`\`\`
test-wallet.json          # Test wallet info (DELETE after use)
data/detected_pools.json  # Pool detection history
data/system_logs.txt      # System activity logs
\`\`\`

## 🧹 Cleanup After Testing

1. **Stop the bot** if running
2. **Delete test wallet file:**
   \`\`\`bash
   rm test-wallet.json
   \`\`\`
3. **Clear sensitive data** from configuration
4. **Optional:** Clear detection history:
   \`\`\`bash
   rm -rf data/
   \`\`\`

## 🆘 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Verify all prerequisites are met
3. Test connection independently
4. Review system logs for errors

## 📈 Performance Expectations

- **Connection Time:** 2-5 seconds
- **Pool Detection:** Real-time (within 1-2 blocks)
- **Token Info:** 3-5 seconds per token
- **Memory Usage:** ~50-100MB
- **Network Usage:** Minimal (event-based)

## 🎯 Success Metrics

You'll know it's working when:
- ✅ Base chain connection established
- ✅ Real pool addresses appearing
- ✅ Token symbols resolved (USDC, WETH, etc.)
- ✅ Block numbers incrementing
- ✅ Timestamps showing recent activity

---

**Remember: This is for TESTING and MONITORING only. Never use for actual trading without proper security measures and testing!**
\`\`\`

Now I need to fix the main page component to handle undefined values properly:
