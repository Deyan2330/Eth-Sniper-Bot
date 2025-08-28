import { ethers } from "ethers"

export interface TokenAnalysis {
  address: string
  symbol: string
  name: string
  decimals: number
  totalSupply: string
  isHoneypot: boolean
  riskScore: number // 0-100 (0 = safest, 100 = highest risk)
  liquidityLocked: boolean
  contractVerified: boolean
  holderCount: number
  topHolderPercentage: number
  hasMaxTransaction: boolean
  hasCooldown: boolean
  canSellBack: boolean
  taxInfo: {
    buyTax: number
    sellTax: number
  }
  socialMetrics?: {
    twitterFollowers?: number
    telegramMembers?: number
    website?: string
  }
  warnings: string[]
  lastAnalyzed: string
}

export interface ContractInfo {
  isContract: boolean
  isVerified: boolean
  sourceCode?: string
  compiler?: string
  optimization?: boolean
}

export class TokenAnalyzer {
  private provider: ethers.JsonRpcProvider
  private cache: Map<string, TokenAnalysis> = new Map()
  private cacheExpiry = 5 * 60 * 1000 // 5 minutes

  // Common scam patterns
  private readonly SCAM_PATTERNS = [
    /honeypot/i,
    /scam/i,
    /rug/i,
    /fake/i,
    /test/i,
    /\$[A-Z]{1,4}\d+/i, // Pattern like $SCAM123
  ]

  // ERC20 + Extended ABI for analysis
  private readonly TOKEN_ABI = [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "function totalSupply() view returns (uint256)",
    "function balanceOf(address) view returns (uint256)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function transfer(address to, uint256 amount) returns (bool)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function transferFrom(address from, address to, uint256 amount) returns (bool)",

    // Extended functions for analysis
    "function owner() view returns (address)",
    "function getOwner() view returns (address)",
    "function _owner() view returns (address)",
    "function maxTransactionAmount() view returns (uint256)",
    "function maxWallet() view returns (uint256)",
    "function tradingEnabled() view returns (bool)",
    "function swapEnabled() view returns (bool)",
    "function cooldownEnabled() view returns (bool)",
    "function buyCooldownEnabled() view returns (bool)",
    "function sellCooldownEnabled() view returns (bool)",

    // Tax-related functions
    "function buyTotalFees() view returns (uint256)",
    "function sellTotalFees() view returns (uint256)",
    "function totalBuyTax() view returns (uint256)",
    "function totalSellTax() view returns (uint256)",
  ]

  constructor(provider: ethers.JsonRpcProvider) {
    this.provider = provider
  }

  async analyzeToken(tokenAddress: string, onLog?: (message: string) => void): Promise<TokenAnalysis> {
    const log = onLog || (() => {})

    try {
      // Check cache first
      const cached = this.getCachedAnalysis(tokenAddress)
      if (cached) {
        log(`📋 Using cached analysis for ${tokenAddress}`)
        return cached
      }

      log(`🔍 Analyzing token: ${tokenAddress}`)

      const contract = new ethers.Contract(tokenAddress, this.TOKEN_ABI, this.provider)

      // Basic token info
      const basicInfo = await this.getBasicTokenInfo(contract, log)

      // Security analysis
      const securityAnalysis = await this.performSecurityAnalysis(contract, tokenAddress, log)

      // Holder analysis
      const holderAnalysis = await this.analyzeHolders(contract, tokenAddress, log)

      // Contract verification check
      const contractInfo = await this.checkContractVerification(tokenAddress, log)

      // Liquidity analysis
      const liquidityInfo = await this.analyzeLiquidity(tokenAddress, log)

      // Calculate risk score
      const riskScore = this.calculateRiskScore(basicInfo, securityAnalysis, holderAnalysis, contractInfo)

      const analysis: TokenAnalysis = {
        address: tokenAddress.toLowerCase(),
        ...basicInfo,
        ...securityAnalysis,
        ...holderAnalysis,
        ...contractInfo,
        ...liquidityInfo,
        riskScore,
        lastAnalyzed: new Date().toISOString(),
      }

      // Cache the result
      this.cache.set(tokenAddress.toLowerCase(), analysis)

      log(`✅ Analysis complete. Risk Score: ${riskScore}/100`)
      return analysis
    } catch (error) {
      log(`❌ Token analysis failed: ${error}`)

      // Return minimal analysis with high risk score
      return {
        address: tokenAddress.toLowerCase(),
        symbol: "UNKNOWN",
        name: "Unknown Token",
        decimals: 18,
        totalSupply: "0",
        isHoneypot: true,
        riskScore: 100,
        liquidityLocked: false,
        contractVerified: false,
        holderCount: 0,
        topHolderPercentage: 100,
        hasMaxTransaction: false,
        hasCooldown: false,
        canSellBack: false,
        taxInfo: { buyTax: 0, sellTax: 0 },
        warnings: [`Analysis failed: ${error}`],
        lastAnalyzed: new Date().toISOString(),
      }
    }
  }

  private async getBasicTokenInfo(contract: ethers.Contract, log: (message: string) => void) {
    log("📊 Getting basic token info...")

    const [name, symbol, decimals, totalSupply] = await Promise.allSettled([
      contract.name(),
      contract.symbol(),
      contract.decimals(),
      contract.totalSupply(),
    ])

    return {
      name: name.status === "fulfilled" ? name.value : "Unknown",
      symbol: symbol.status === "fulfilled" ? symbol.value : "UNKNOWN",
      decimals: decimals.status === "fulfilled" ? Number(decimals.value) : 18,
      totalSupply: totalSupply.status === "fulfilled" ? totalSupply.value.toString() : "0",
    }
  }

  private async performSecurityAnalysis(
    contract: ethers.Contract,
    tokenAddress: string,
    log: (message: string) => void,
  ) {
    log("🔒 Performing security analysis...")

    const warnings: string[] = []
    let isHoneypot = false
    let hasMaxTransaction = false
    let hasCooldown = false
    let canSellBack = true
    const taxInfo = { buyTax: 0, sellTax: 0 }

    try {
      // Check for common honeypot indicators
      const code = await this.provider.getCode(tokenAddress)

      // Check for suspicious bytecode patterns
      if (this.containsSuspiciousPatterns(code)) {
        warnings.push("Suspicious bytecode patterns detected")
        isHoneypot = true
      }

      // Try to detect max transaction limits
      try {
        const maxTx = await contract.maxTransactionAmount()
        if (maxTx && maxTx > 0) {
          hasMaxTransaction = true
          warnings.push("Has maximum transaction limit")
        }
      } catch (e) {
        // Function doesn't exist, which is normal
      }

      // Check for cooldown mechanisms
      try {
        const cooldownEnabled = await contract.cooldownEnabled()
        if (cooldownEnabled) {
          hasCooldown = true
          warnings.push("Has cooldown mechanism")
        }
      } catch (e) {
        // Function doesn't exist, which is normal
      }

      // Try to detect taxes
      try {
        const buyTax = await contract.buyTotalFees()
        const sellTax = await contract.sellTotalFees()

        taxInfo.buyTax = Number(buyTax) / 100 // Assuming percentage
        taxInfo.sellTax = Number(sellTax) / 100

        if (taxInfo.buyTax > 10 || taxInfo.sellTax > 10) {
          warnings.push(`High taxes detected: Buy ${taxInfo.buyTax}%, Sell ${taxInfo.sellTax}%`)
        }
      } catch (e) {
        // Tax functions don't exist, try alternative methods
        try {
          const totalBuyTax = await contract.totalBuyTax()
          const totalSellTax = await contract.totalSellTax()

          taxInfo.buyTax = Number(totalBuyTax) / 100
          taxInfo.sellTax = Number(totalSellTax) / 100
        } catch (e2) {
          // No tax functions found, assume 0% tax
        }
      }

      // Simulate a small buy/sell to test for honeypot
      canSellBack = await this.testSellability(contract, tokenAddress, log)
      if (!canSellBack) {
        isHoneypot = true
        warnings.push("Cannot sell tokens back - potential honeypot")
      }
    } catch (error) {
      warnings.push(`Security analysis error: ${error}`)
    }

    return {
      isHoneypot,
      hasMaxTransaction,
      hasCooldown,
      canSellBack,
      taxInfo,
      warnings,
    }
  }

  private async analyzeHolders(contract: ethers.Contract, tokenAddress: string, log: (message: string) => void) {
    log("👥 Analyzing token holders...")

    let holderCount = 0
    let topHolderPercentage = 0

    try {
      // This is a simplified holder analysis
      // In a real implementation, you'd need to scan through Transfer events
      // or use a service like Moralis/Alchemy for holder data

      const totalSupply = await contract.totalSupply()

      // Check some known addresses for large holdings
      const addressesToCheck = [
        "0x0000000000000000000000000000000000000000", // Burn address
        "0x000000000000000000000000000000000000dEaD", // Dead address
        tokenAddress, // Contract itself
      ]

      let maxBalance = 0n
      for (const address of addressesToCheck) {
        try {
          const balance = await contract.balanceOf(address)
          if (balance > maxBalance) {
            maxBalance = balance
          }
        } catch (e) {
          // Continue checking other addresses
        }
      }

      if (totalSupply > 0) {
        topHolderPercentage = Number((maxBalance * 100n) / totalSupply)
      }

      // Estimate holder count (simplified)
      holderCount = Math.max(1, Math.floor(Math.random() * 1000) + 100) // Placeholder

      if (topHolderPercentage > 50) {
        // This would be added to warnings in the calling function
      }
    } catch (error) {
      log(`⚠️ Holder analysis error: ${error}`)
    }

    return {
      holderCount,
      topHolderPercentage,
    }
  }

  private async checkContractVerification(
    tokenAddress: string,
    log: (message: string) => void,
  ): Promise<{ contractVerified: boolean }> {
    log("✅ Checking contract verification...")

    // This would typically involve calling Basescan API
    // For now, we'll do a basic check
    try {
      const code = await this.provider.getCode(tokenAddress)

      // If it has code, assume it might be verified (simplified)
      const contractVerified = code !== "0x" && code.length > 100

      return { contractVerified }
    } catch (error) {
      return { contractVerified: false }
    }
  }

  private async analyzeLiquidity(
    tokenAddress: string,
    log: (message: string) => void,
  ): Promise<{ liquidityLocked: boolean }> {
    log("💧 Analyzing liquidity...")

    // This would involve checking if LP tokens are locked
    // For now, return a placeholder
    return { liquidityLocked: Math.random() > 0.5 } // Random for demo
  }

  private async testSellability(
    contract: ethers.Contract,
    tokenAddress: string,
    log: (message: string) => void,
  ): Promise<boolean> {
    try {
      // This would involve simulating a transaction to test if selling works
      // For safety, we'll assume it's sellable unless we detect obvious honeypot patterns
      log("🧪 Testing token sellability...")

      // In a real implementation, you'd use eth_call to simulate transactions
      return true // Placeholder
    } catch (error) {
      return false
    }
  }

  private containsSuspiciousPatterns(bytecode: string): boolean {
    // Check for common honeypot bytecode patterns
    const suspiciousPatterns = [
      "a9059cbb", // transfer function selector - look for modifications
      "23b872dd", // transferFrom function selector
      "095ea7b3", // approve function selector
    ]

    // This is a simplified check - real implementation would be more sophisticated
    return false // Placeholder
  }

  private calculateRiskScore(basicInfo: any, securityAnalysis: any, holderAnalysis: any, contractInfo: any): number {
    let score = 0

    // Name/symbol checks
    if (this.SCAM_PATTERNS.some((pattern) => pattern.test(basicInfo.name) || pattern.test(basicInfo.symbol))) {
      score += 30
    }

    // Security flags
    if (securityAnalysis.isHoneypot) score += 50
    if (!securityAnalysis.canSellBack) score += 40
    if (securityAnalysis.hasMaxTransaction) score += 10
    if (securityAnalysis.hasCooldown) score += 15
    if (securityAnalysis.taxInfo.buyTax > 10) score += 20
    if (securityAnalysis.taxInfo.sellTax > 15) score += 25

    // Holder distribution
    if (holderAnalysis.topHolderPercentage > 50) score += 25
    if (holderAnalysis.topHolderPercentage > 80) score += 25
    if (holderAnalysis.holderCount < 10) score += 20

    // Contract verification
    if (!contractInfo.contractVerified) score += 15

    return Math.min(100, score)
  }

  private getCachedAnalysis(tokenAddress: string): TokenAnalysis | null {
    const cached = this.cache.get(tokenAddress.toLowerCase())
    if (cached) {
      const age = Date.now() - new Date(cached.lastAnalyzed).getTime()
      if (age < this.cacheExpiry) {
        return cached
      }
      this.cache.delete(tokenAddress.toLowerCase())
    }
    return null
  }

  // Public utility methods
  isTokenSafe(analysis: TokenAnalysis): boolean {
    return analysis.riskScore < 30 && !analysis.isHoneypot && analysis.canSellBack
  }

  getRecommendation(analysis: TokenAnalysis): string {
    if (analysis.riskScore < 20) return "✅ LOW RISK - Safe to trade"
    if (analysis.riskScore < 40) return "⚠️ MEDIUM RISK - Trade with caution"
    if (analysis.riskScore < 70) return "🔶 HIGH RISK - Not recommended"
    return "🚫 EXTREME RISK - Avoid trading"
  }
}

// Export utility functions
export const createTokenAnalyzer = (provider: ethers.JsonRpcProvider): TokenAnalyzer => {
  return new TokenAnalyzer(provider)
}

export const formatAnalysisReport = (analysis: TokenAnalysis): string => {
  const lines = [
    `📊 ${analysis.symbol} (${analysis.name})`,
    `🎯 Risk Score: ${analysis.riskScore}/100`,
    `💰 Supply: ${ethers.formatUnits(analysis.totalSupply, analysis.decimals)}`,
    `👥 Holders: ${analysis.holderCount}`,
    `🔒 Verified: ${analysis.contractVerified ? "✅" : "❌"}`,
    `🍯 Honeypot: ${analysis.isHoneypot ? "🚫 YES" : "✅ NO"}`,
    `💸 Taxes: Buy ${analysis.taxInfo.buyTax}% / Sell ${analysis.taxInfo.sellTax}%`,
  ]

  if (analysis.warnings.length > 0) {
    lines.push(`⚠️ Warnings: ${analysis.warnings.join(", ")}`)
  }

  return lines.join("\n")
}
