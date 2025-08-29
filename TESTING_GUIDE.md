# 🧪 Uniswap Sniper Bot Testing Guide

## 🚀 Quick Start Testing

### 1. Generate Test Wallet
\`\`\`bash
npm run generate-wallet
\`\`\`
This creates a new wallet with:
- ✅ Private key for testing
- ✅ Public address
- ✅ Mnemonic phrase
- ✅ Saved to JSON file

### 2. Test Base Chain Connection
\`\`\`bash
npm run test-connection
\`\`\`
This verifies:
- ✅ RPC connection to Base
- ✅ Current block number
- ✅ Uniswap V3 factory access
- ✅ Event filtering capability
- ✅ Recent pool detection

### 3. Check Wallet Balance
\`\`\`bash
npm run check-balance YOUR_WALLET_ADDRESS
\`\`\`
This shows:
- ✅ ETH balance on Base
- ✅ Transaction count
- ✅ USD value estimate
- ✅ BaseScan link

## 🔧 Debugging No Pools Found

### Issue: Bot runs 23+ hours with no pools detected

**Possible Causes:**
1. **Wrong Factory Address** - Verify Uniswap V3 factory
2. **RPC Connection Issues** - Test with different providers
3. **Event Listener Problems** - Check WebSocket vs HTTP
4. **Low Pool Creation Rate** - Base has fewer new pools than Ethereum

### 🔍 Diagnostic Steps:

#### Step 1: Verify Factory Address
\`\`\`bash
npm run test-connection
\`\`\`
Should show:
- ✅ Factory contract verified
- ✅ Recent events found (even if 0)

#### Step 2: Check Historical Pools
The bot now scans last 1000 blocks for existing pools to verify the system works.

#### Step 3: Monitor Connection
- Check "System Status" shows "Connected"
- Verify "Current Block" is updating
- Watch "Events Listened" counter

#### Step 4: Try Different RPC
Update in Configuration:
- **Free**: `https://mainnet.base.org`
- **Alchemy**: `https://base-mainnet.g.alchemy.com/v2/YOUR_KEY`
- **QuickNode**: `https://base-mainnet.quiknode.pro/YOUR_ENDPOINT`

## 📊 Expected Behavior

### Normal Operation:
- ✅ Connects to Base chain
- ✅ Shows current block updates
- ✅ Finds historical pools in recent blocks
- ✅ Waits for new pool creation events

### Pool Creation Frequency:
- **Ethereum**: 10-50 pools/day
- **Base**: 1-10 pools/day (much lower)
- **Peak times**: More activity during US hours

## 🚨 Troubleshooting

### Connection Issues:
\`\`\`
❌ Provider Error: network does not support ENS
\`\`\`
**Fix**: Use different RPC endpoint

### No Historical Pools:
\`\`\`
📊 Found 0 pool creation events in recent blocks
\`\`\`
**Normal**: Base has low pool creation rate

### Event Listener Silent:
\`\`\`
Events Listened: 0 (after hours)
\`\`\`
**Check**: 
1. RPC endpoint working
2. WebSocket support
3. Factory address correct

## 🎯 Success Indicators

### ✅ Working System:
- Connection Status: "Connected"
- Current Block: Updates every ~2 seconds
- Historical pools found in recent scan
- Events Listened: Increments when pools detected

### ✅ Pool Detection:
- Real-time notification in logs
- Pool data populated with token info
- Transaction hash and block number
- Token symbols resolved

## 🔗 Useful Resources

- **BaseScan**: https://basescan.org/
- **Base Bridge**: https://bridge.base.org/
- **Uniswap V3 Base**: https://app.uniswap.org/#/swap?chain=base
- **Base Docs**: https://docs.base.org/

## 📞 Support

If issues persist:
1. Check all diagnostic steps above
2. Try different RPC providers
3. Verify Base chain is operational
4. Consider pool creation is naturally infrequent on Base
