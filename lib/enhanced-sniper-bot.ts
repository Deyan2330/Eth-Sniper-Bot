import { ethers } from "ethers"
import { type TokenAnalyzer, type TokenAnalysis, createTokenAnalyzer, formatAnalysisReport } from "./token-analyzer"
import type { RealPoolData } from "./real-sniper-bot"

export interface EnhancedBotConfig {
  rpcUrl: string
  privateKey?: string
  minLiquidity: number
  maxGasPrice: number
  slippage: number
  buyAmount: string
  factoryAddress: string
  routerAddress: string

  // New safety settings
  maxRiskScore: number // 0-100, won't trade tokens above this risk
  requireVerifiedContract: boolean
  minHolderCount: number
  maxTopHolderPercentage: number
  maxBuyTax: number
  maxSellTax: number
  enableHoneypotDetection: boolean
}

export interface TradingOpportunity {
  pool: RealPoolData
  token0Analysis: TokenAnalysis
  token1Analysis: TokenAnalysis
  recommendation: "BUY" | "AVOID" | "MONITOR"
  confidence: number // 0-100
  reasons: string[]
  estimatedProfit?: number
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "EXTREME"
}

export class EnhancedUniswapBot {
  private provider: ethers.JsonRpcProvider
  private wallet?: ethers.Wallet
  private tokenAnalyzer: TokenAnalyzer
  private config: EnhancedBotConfig
  private isRunning = false
  private opportunities: TradingOpportunity[] = []

  constructor(config: EnhancedBotConfig) {
    this.config = config
    this.provider = new ethers.JsonRpcProvider(config.rpcUrl)
    this.tokenAnalyzer = createTokenAnalyzer(this.provider)

    if (config.privateKey) {
      this.wallet = new ethers.Wallet(config.privateKey, this.provider)
    }
  }

  async analyzeNewPool(poolData: RealPoolData, onLog: (message: string) => void): Promise<TradingOpportunity> {
    onLog(`🔍 Analyzing new pool: ${poolData.poolAddress}`)

    try {
      // Analyze both tokens in parallel
      const [token0Analysis, token1Analysis] = await Promise.all([
        this.tokenAnalyzer.analyzeToken(poolData.token0, onLog),
        this.tokenAnalyzer.analyzeToken(poolData.token1, onLog),
      ])

      // Determine which token is the "new" token (higher risk usually)
      const targetToken = token0Analysis.riskScore > token1Analysis.riskScore ? token0Analysis : token1Analysis
      const baseToken = targetToken === token0Analysis ? token1Analysis : token0Analysis

      // Generate trading recommendation
      const opportunity = this.generateTradingRecommendation(
        poolData,
        token0Analysis,
        token1Analysis,
        targetToken,
        baseToken,
        onLog,
      )

      // Store opportunity
      this.opportunities.unshift(opportunity)
      if (this.opportunities.length > 100) {
        this.opportunities = this.opportunities.slice(0, 100)
      }

      // Log detailed analysis
      onLog(`📊 Token Analysis Complete:`)
      onLog(`Token 0: ${formatAnalysisReport(token0Analysis)}`)
      onLog(`Token 1: ${formatAnalysisReport(token1Analysis)}`)
      onLog(`🎯 Recommendation: ${opportunity.recommendation} (${opportunity.confidence}% confidence)`)
      onLog(`⚠️ Risk Level: ${opportunity.riskLevel}`)

      return opportunity
    } catch (error) {
      onLog(`❌ Pool analysis failed: ${error}`)

      return {
        pool: poolData,
        token0Analysis: {} as TokenAnalysis,
        token1Analysis: {} as TokenAnalysis,
        recommendation: "AVOID",
        confidence: 0,
        reasons: [`Analysis failed: ${error}`],
        riskLevel: "EXTREME",
      }
    }
  }

  private generateTradingRecommendation(
    poolData: RealPoolData,
    token0Analysis: TokenAnalysis,
    token1Analysis: TokenAnalysis,
    targetToken: TokenAnalysis,
    baseToken: TokenAnalysis,
    onLog: (message: string) => void,
  ): TradingOpportunity {
    const reasons: string[] = []
    let confidence = 50 // Start with neutral confidence
    let recommendation: "BUY" | "AVOID" | "MONITOR" = "MONITOR"
    let riskLevel: "LOW" | "MEDIUM" | "HIGH" | "EXTREME" = "MEDIUM"

    // Safety checks first
    if (targetToken.isHoneypot || !targetToken.canSellBack) {
      recommendation = "AVOID"
      confidence = 95
      riskLevel = "EXTREME"
      reasons.push("🚫 Honeypot detected - cannot sell back")
      return this.createOpportunity(
        poolData,
        token0Analysis,
        token1Analysis,
        recommendation,
        confidence,
        reasons,
        riskLevel,
      )
    }

    if (targetToken.riskScore > this.config.maxRiskScore) {
      recommendation = "AVOID"
      confidence = 80
      riskLevel = "HIGH"
      reasons.push(`🔴 Risk score too high: ${targetToken.riskScore}/${this.config.maxRiskScore}`)
      return this.createOpportunity(
        poolData,
        token0Analysis,
        token1Analysis,
        recommendation,
        confidence,
        reasons,
        riskLevel,
      )
    }

    // Contract verification check
    if (this.config.requireVerifiedContract && !targetToken.contractVerified) {
      recommendation = "AVOID"
      confidence = 70
      reasons.push("❌ Contract not verified")
    }

    // Holder distribution checks
    if (targetToken.holderCount < this.config.minHolderCount) {
      confidence -= 20
      reasons.push(`👥 Low holder count: ${targetToken.holderCount}`)
    }

    if (targetToken.topHolderPercentage > this.config.maxTopHolderPercentage) {
      confidence -= 25
      reasons.push(`🐋 High concentration: ${targetToken.topHolderPercentage}% held by top holder`)
    }

    // Tax checks
    if (targetToken.taxInfo.buyTax > this.config.maxBuyTax) {
      confidence -= 15
      reasons.push(`💸 High buy tax: ${targetToken.taxInfo.buyTax}%`)
    }

    if (targetToken.taxInfo.sellTax > this.config.maxSellTax) {
      confidence -= 20
      reasons.push(`💸 High sell tax: ${targetToken.taxInfo.sellTax}%`)
    }

    // Positive indicators
    if (targetToken.contractVerified) {
      confidence += 10
      reasons.push("✅ Contract verified")
    }

    if (targetToken.liquidityLocked) {
      confidence += 15
      reasons.push("🔒 Liquidity locked")
    }

    if (targetToken.holderCount > 100) {
      confidence += 10
      reasons.push("👥 Good holder distribution")
    }

    if (targetToken.taxInfo.buyTax === 0 && targetToken.taxInfo.sellTax === 0) {
      confidence += 15
      reasons.push("💰 No taxes")
    }

    // Base token quality (WETH, USDC, etc.)
    if (this.isKnownGoodToken(baseToken.address)) {
      confidence += 20
      reasons.push(`✅ Paired with ${baseToken.symbol}`)
    }

    // Pool fee analysis
    if (poolData.fee === 500) {
      // 0.05% - lowest fee tier
      confidence += 5
      reasons.push("💎 Low fee tier")
    }

    // Final recommendation logic
    if (confidence >= 75 && targetToken.riskScore < 30) {
      recommendation = "BUY"
      riskLevel = "LOW"
    } else if (confidence >= 60 && targetToken.riskScore < 50) {
      recommendation = "MONITOR"
      riskLevel = "MEDIUM"
    } else {
      recommendation = "AVOID"
      riskLevel = targetToken.riskScore > 70 ? "EXTREME" : "HIGH"
    }

    return this.createOpportunity(
      poolData,
      token0Analysis,
      token1Analysis,
      recommendation,
      confidence,
      reasons,
      riskLevel,
    )
  }

  private createOpportunity(
    poolData: RealPoolData,
    token0Analysis: TokenAnalysis,
    token1Analysis: TokenAnalysis,
    recommendation: "BUY" | "AVOID" | "MONITOR",
    confidence: number,
    reasons: string[],
    riskLevel: "LOW" | "MEDIUM" | "HIGH" | "EXTREME",
  ): TradingOpportunity {
    return {
      pool: poolData,
      token0Analysis,
      token1Analysis,
      recommendation,
      confidence: Math.max(0, Math.min(100, confidence)),
      reasons,
      riskLevel,
    }
  }

  private isKnownGoodToken(address: string): boolean {
    const knownTokens = [
      "0x4200000000000000000000000000000000000006", // WETH on Base
      "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913", // USDC on Base
      "0x50c5725949a6f0c72e6c4a641f24049a917db0cb", // DAI on Base
    ]

    return knownTokens.includes(address.toLowerCase())
  }

  // Public getters
  getOpportunities(): TradingOpportunity[] {
    return [...this.opportunities]
  }

  getGoodOpportunities(): TradingOpportunity[] {
    return this.opportunities.filter(
      (op) => op.recommendation === "BUY" && op.confidence > 70 && op.riskLevel !== "EXTREME",
    )
  }

  getConfig(): EnhancedBotConfig {
    return { ...this.config }
  }

  updateConfig(newConfig: Partial<EnhancedBotConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }
}

// Default safe configuration
export const createSafeConfig = (rpcUrl: string, privateKey?: string): EnhancedBotConfig => ({
  rpcUrl,
  privateKey,
  minLiquidity: 10000, // $10k minimum
  maxGasPrice: 50, // 50 Gwei max
  slippage: 5, // 5%
  buyAmount: "0.01", // 0.01 ETH
  factoryAddress: "0x33128a8fC17869897dcE68Ed026d694621f6FdF9",
  routerAddress: "0x2626664c2603336E57B271c5C0b26F421741e481",

  // Safety settings
  maxRiskScore: 40, // Only trade tokens with risk score < 40
  requireVerifiedContract: true,
  minHolderCount: 50,
  maxTopHolderPercentage: 30, // No single holder should own > 30%
  maxBuyTax: 5, // Max 5% buy tax
  maxSellTax: 8, // Max 8% sell tax
  enableHoneypotDetection: true,
})
