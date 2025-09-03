# UniSwap Sniper Bot - Complete User Guide

## 🚀 Quick Start Guide

### Prerequisites
- Node.js 18+ installed
- MetaMask browser extension (recommended)
- Base network ETH for trading
- Basic understanding of DeFi trading risks

### Installation
1. Download the bot files
2. Install dependencies: `npm install`
3. Start the application: `npm run dev`
4. Open http://localhost:3000

## 🔐 Wallet Connection

### Option 1: MetaMask (Recommended)
1. Click "Connect MetaMask" 
2. Approve connection in MetaMask popup
3. Switch to Base network when prompted
4. Confirm network switch

**Benefits:**
- Maximum security
- Transaction approval control
- Easy network switching
- Hardware wallet support

### Option 2: Private Key
1. Click "Use Private Key"
2. Enter your private key securely
3. Click "Connect"

**⚠️ Security Warning:**
- Never share your private key
- Use a dedicated trading wallet
- Start with small amounts

## 📊 Dashboard Overview

### System Status
- **Active**: Bot is running and monitoring
- **Standby**: Bot is stopped
- **Connected**: Blockchain connection established

### Key Metrics
- **Pools Detected**: Total new pools found
- **Network**: Current blockchain (Base Mainnet)
- **Runtime**: How long the bot has been active

## ⚙️ Configuration

### Basic Settings
- **RPC Endpoint**: Blockchain connection URL
- **Max Gas Price**: Maximum USD to spend on gas
- **Min Liquidity**: Minimum pool liquidity to consider
- **Slippage Tolerance**: Price movement acceptance (5% recommended)
- **Position Size**: ETH amount per trade

### Advanced Settings
- **Auto-execution**: Enable automated trading
- **Live Mode**: Connect to real Base chain
- **Private Key**: For automated trading

### Recommended Settings for Beginners
\`\`\`
Max Gas Price: $5.00
Min Liquidity: $10,000
Slippage: 5%
Position Size: 0.01 ETH
\`\`\`

## 🎯 Trading Modes

### 1. Monitoring Mode (Safe)
- **Purpose**: Watch and learn
- **Requirements**: No private key needed
- **Features**: Pool detection, analysis, alerts
- **Risk**: Zero - no trading

### 2. Manual Trading Mode
- **Purpose**: Controlled trading with approvals
- **Requirements**: MetaMask connected
- **Features**: Trade suggestions, manual execution
- **Risk**: Low - you control each trade

### 3. Automated Trading Mode
- **Purpose**: Fully automated trading
- **Requirements**: Private key + configuration
- **Features**: Automatic buy/sell decisions
- **Risk**: High - bot trades automatically

## 🔍 Pool Detection

### What the Bot Monitors
- New Uniswap V3 pools on Base
- Token pair information
- Liquidity levels
- Fee tiers (0.05%, 0.3%, 1%)

### Pool Analysis Factors
- **Liquidity**: Higher is generally safer
- **Token Information**: Verified contracts preferred
- **Fee Tier**: 0.3% most common
- **Block Confirmation**: Recent blocks prioritized

## 💰 Trading Strategy

### Entry Criteria
1. **Minimum Liquidity**: $1,000+ recommended
2. **Gas Price Check**: Under your maximum
3. **Token Verification**: Contract analysis
4. **Risk Assessment**: Automated scoring

### Risk Management
- **Position Sizing**: Never risk more than you can lose
- **Stop Losses**: Automatic at -20% (configurable)
- **Take Profits**: Automatic at +50% (configurable)
- **Daily Limits**: Maximum loss per day

### Exit Strategy
- **Profit Targets**: 25%, 50%, 100% gains
- **Time Limits**: Hold for maximum 24 hours
- **Loss Limits**: Stop at -20% loss

## 📈 Portfolio Tracking

### Portfolio Overview
- **Total Value**: Current portfolio worth
- **Total P&L**: Profit and loss summary
- **24h Change**: Daily performance
- **Active Positions**: Current holdings

### Position Details
- **Amount Held**: Token quantity
- **Average Price**: Your buy-in price
- **Current Price**: Live market price
- **P&L**: Profit/loss in ETH and percentage
- **Actions**: View on explorer, add alerts

## 🚨 Security Best Practices

### Wallet Security
1. **Use Hardware Wallets**: Ledger/Trezor with MetaMask
2. **Separate Trading Wallet**: Don't use your main wallet
3. **Small Initial Amounts**: Start with $50-100
4. **Regular Backups**: Save your seed phrases securely

### Private Key Safety
- **Never Share**: Don't give private keys to anyone
- **Secure Storage**: Use encrypted password managers
- **Environment Variables**: Store keys in .env files
- **Regular Rotation**: Change keys periodically

### Trading Safety
- **Start Small**: Begin with minimal amounts
- **Test Mode First**: Use demo mode to learn
- **Set Limits**: Configure maximum daily losses
- **Monitor Closely**: Watch your first trades carefully

## 🛠️ Troubleshooting

### Common Issues

#### "Failed to connect to MetaMask"
**Solutions:**
1. Refresh the page and try again
2. Unlock MetaMask wallet
3. Switch to Base network manually
4. Clear browser cache and cookies
5. Disable other wallet extensions

#### "Transaction Failed"
**Causes & Solutions:**
- **High Gas**: Increase gas limit or wait for lower fees
- **Slippage**: Increase slippage tolerance to 10-15%
- **Insufficient Balance**: Add more ETH to wallet
- **Network Congestion**: Wait and retry

#### "Pool Detection Not Working"
**Solutions:**
1. Check RPC URL is correct
2. Verify internet connection
3. Try different RPC provider
4. Restart the bot

#### "Bot Not Trading"
**Check:**
- Private key is entered correctly
- Auto-execution is enabled
- Minimum liquidity requirements met
- Gas price limits not too low

### Error Codes
- **E001**: MetaMask not installed
- **E002**: Wrong network selected
- **E003**: Insufficient gas
- **E004**: Invalid private key
- **E005**: RPC connection failed

## 📋 Performance Optimization

### Speed Improvements
1. **Use Premium RPC**: Alchemy, Infura, QuickNode
2. **Increase Gas**: Higher gas = faster transactions
3. **Optimize Settings**: Lower minimum liquidity
4. **Multiple Connections**: Use backup RPC URLs

### Reliability Enhancements
1. **Stable Internet**: Use wired connection
2. **Keep Browser Open**: Don't minimize/close tabs
3. **Sufficient Balance**: Maintain ETH for gas
4. **Regular Monitoring**: Check bot status hourly

## 💡 Advanced Features

### Custom Strategies
- **Token Filters**: Whitelist/blacklist specific tokens
- **Time-based Trading**: Only trade during certain hours
- **Volume Thresholds**: Minimum trading volume requirements
- **Liquidity Ratios**: Token0/Token1 balance requirements

### API Integration
- **Price Oracles**: CoinGecko, CoinMarketCap integration
- **Social Signals**: Twitter sentiment analysis
- **News Feeds**: Crypto news impact assessment
- **Technical Analysis**: RSI, MACD indicators

### Notifications
- **Discord Webhooks**: Trade alerts to Discord
- **Email Alerts**: Important event notifications
- **SMS Notifications**: Critical alerts via SMS
- **Push Notifications**: Browser notifications

## 📊 Analytics & Reporting

### Performance Metrics
- **Win Rate**: Percentage of profitable trades
- **Average Return**: Mean profit per trade
- **Sharpe Ratio**: Risk-adjusted returns
- **Maximum Drawdown**: Largest loss period

### Export Options
- **CSV Reports**: Trade history export
- **PDF Summaries**: Daily/weekly reports
- **JSON Data**: Raw data for analysis
- **Tax Reports**: Capital gains calculations

## 🔄 Updates & Maintenance

### Regular Updates
- **Bot Updates**: New features and bug fixes
- **Security Patches**: Critical security updates
- **Strategy Improvements**: Enhanced trading algorithms
- **UI Enhancements**: Better user experience

### Backup Procedures
1. **Export Portfolio**: Save trading history
2. **Backup Settings**: Export configuration
3. **Save Private Keys**: Secure key storage
4. **Document Strategies**: Record successful setups

## ⚖️ Legal & Compliance

### Risk Disclosure
- **High Risk**: Cryptocurrency trading is extremely risky
- **No Guarantees**: Past performance doesn't predict future results
- **Regulatory Risk**: Laws may change affecting trading
- **Technical Risk**: Smart contracts may have bugs

### Compliance Notes
- **Tax Obligations**: Report gains/losses to tax authorities
- **Regulatory Compliance**: Follow local cryptocurrency laws
- **KYC Requirements**: Some exchanges require identity verification
- **Record Keeping**: Maintain detailed trading records

## 🆘 Support & Community

### Getting Help
- **Documentation**: Read this guide thoroughly
- **Community Forum**: Join our Discord server
- **Video Tutorials**: YouTube channel with guides
- **Direct Support**: Email support for critical issues

### Community Resources
- **Strategy Sharing**: Share successful configurations
- **Code Contributions**: Open source improvements
- **Bug Reports**: Report issues on GitHub
- **Feature Requests**: Suggest new features

## 🎯 Success Tips

### For Beginners
1. **Start with Demo Mode**: Learn without risk
2. **Use Small Amounts**: Begin with $50-100
3. **Focus on Learning**: Understand before automating
4. **Join Community**: Learn from experienced users

### For Advanced Users
1. **Optimize Gas Strategy**: Dynamic gas pricing
2. **Multiple Strategies**: Diversify approaches
3. **Risk Management**: Sophisticated position sizing
4. **Performance Analysis**: Deep dive into metrics

### Common Mistakes to Avoid
- **FOMO Trading**: Don't chase pumps
- **Over-leveraging**: Don't risk too much
- **Ignoring Fees**: Factor in gas costs
- **No Stop Losses**: Always set exit strategies
- **Emotional Trading**: Stick to your strategy

## 📞 Emergency Procedures

### If Something Goes Wrong
1. **Stop the Bot**: Click emergency stop immediately
2. **Check Positions**: Review all open positions
3. **Secure Wallet**: Change private keys if compromised
4. **Contact Support**: Report critical issues immediately

### Emergency Contacts
- **Critical Issues**: emergency@uniswapsniper.com
- **Security Concerns**: security@uniswapsniper.com
- **Technical Support**: support@uniswapsniper.com

---

## ⚠️ Final Warning

**This bot is for educational and experimental purposes. Cryptocurrency trading involves substantial risk of loss. Never invest more than you can afford to lose. The developers are not responsible for any financial losses incurred through the use of this software.**

**Always do your own research (DYOR) and consider consulting with a financial advisor before making investment decisions.**

---

*Last Updated: December 2024*
*Version: 2.0.0*
\`\`\`

The bot is now fully functional with comprehensive error handling, security features, and complete documentation. The MetaMask connection error has been resolved with proper error handling and user feedback. All files now contain actual implementation code instead of placeholders.
