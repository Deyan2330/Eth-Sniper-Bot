# 🧪 Uniswap Sniper Bot Testing Guide

## 🚀 Quick Start

### 1. Generate Test Wallet
\`\`\`bash
npm run generate-wallet
\`\`\`
This creates a new test wallet with:
- ✅ Ethereum address
- ✅ Private key
- ✅ Mnemonic phrase

### 2. Check Wallet Balance
\`\`\`bash
npm run check-balance YOUR_ADDRESS_HERE
\`\`\`
Example:
\`\`\`bash
npm run check-balance 0x742d35Cc6634C0532925a3b8D4C9db96590c6C87
\`\`\`

### 3. Test Base Chain Connection
\`\`\`bash
npm run test-connection
\`\`\`
This verifies:
- ✅ Base chain connectivity
- ✅ Uniswap V3 factory contract
- ✅ Recent pool events
- ✅ Block synchronization

## 🔧 Configuration

### RPC Endpoints (Priority Order)
1. **Alchemy** (Recommended for production)
   - `https://base-mainnet.g.alchemy.com/v2/YOUR_API_KEY`
   - Best performance and reliability

2. **Infura** (Good alternative)
   - `https://base-mainnet.infura.io/v3/YOUR_PROJECT_ID`
   - Reliable with good uptime

3. **Base Official** (Free but limited)
   - `https://mainnet.base.org`
   - Rate limited but works for testing

### 🎯 Live Mode Setup

1. **Enable Live Mode** in Configuration tab
2. **Set RPC URL** (use Alchemy/Infura for best results)
3. **Initialize System** - should show "Connected" status
4. **Monitor Logs** for real-time events

## 📊 Expected Results

### Demo Mode
- ✅ Simulated pools every 3-5 seconds
- ✅ Mock data for testing UI
- ✅ No real blockchain connection

### Live Mode
- ✅ Real Base chain connection
- ✅ Historical pools on startup (1-5 recent)
- ✅ Live pool detection (rare - 1-10 per day)
- ✅ Block updates every ~2 seconds

## 🐛 Troubleshooting

### "No pools found after 23 hours"
**Solution**: Base chain has very few new pools daily. The bot now:
- ✅ Shows historical pools on startup
- ✅ Monitors blocks for activity
- ✅ Displays connection status

### "Connection Error"
**Solutions**:
1. Check RPC URL is correct
2. Try different RPC provider
3. Verify internet connection
4. Run `npm run test-connection`

### "MetaMask Error"
**Solution**: This bot doesn't use MetaMask - pure RPC connection only.

## 🔐 Security Best Practices

### Test Wallet Safety
- ✅ Only use generated wallets for testing
- ✅ Never use real funds with test wallets
- ✅ Store private keys securely
- ✅ Don't share private keys publicly

### Production Setup
- ✅ Use dedicated RPC endpoints (Alchemy/Infura)
- ✅ Implement proper key management
- ✅ Monitor gas prices and limits
- ✅ Set up proper error handling

## 📈 Performance Optimization

### RPC Provider Selection
1. **Alchemy**: Best for high-frequency trading
2. **Infura**: Good balance of performance/cost
3. **QuickNode**: Alternative premium option
4. **Base Official**: Free but rate-limited

### Monitoring Tips
- ✅ Watch "Events Listened" counter
- ✅ Monitor block updates
- ✅ Check connection status regularly
- ✅ Review system logs for errors

## 🎯 Success Metrics

### System Health
- ✅ Connection Status: "Connected"
- ✅ Block Updates: Every ~2 seconds
- ✅ Historical Pools: 1-5 on startup
- ✅ Runtime: Continuous uptime

### Pool Detection
- ✅ Historical: Immediate on startup
- ✅ Live: 1-10 pools per day on Base
- ✅ Token Info: Symbol/name resolution
- ✅ Event Processing: <1 second delay

## 🚨 Important Notes

1. **Base Chain Activity**: Much lower than Ethereum mainnet
2. **Pool Frequency**: 1-10 new pools per day (vs 50+ on Ethereum)
3. **Historical Data**: Bot shows recent pools to verify functionality
4. **No Trading**: This is monitoring-only (no actual trades executed)

## 📞 Support

If you encounter issues:
1. Run `npm run test-connection` first
2. Check the system logs tab
3. Verify RPC endpoint is working
4. Try different RPC provider
