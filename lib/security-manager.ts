import { ethers } from "ethers"
import CryptoJS from "crypto-js"

export interface SecurityConfig {
  maxDailyLoss: number // USD
  maxPositionSize: number // ETH
  emergencyStopEnabled: boolean
  whitelistedTokens: string[]
  blacklistedTokens: string[]
  maxSlippage: number
  requireConfirmation: boolean
}

export interface SecurityAlert {
  id: string
  type: "HIGH_RISK" | "UNUSUAL_ACTIVITY" | "LOSS_LIMIT" | "SUSPICIOUS_TOKEN"
  message: string
  timestamp: string
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
  actionRequired: boolean
}

export class SecurityManager {
  private config: SecurityConfig
  private alerts: SecurityAlert[] = []
  private dailyLoss = 0
  private lastResetDate = new Date().toDateString()
  private encryptionKey: string

  constructor(config: SecurityConfig, encryptionKey?: string) {
    this.config = config
    this.encryptionKey = encryptionKey || this.generateEncryptionKey()
  }

  // Encrypt sensitive data
  encryptPrivateKey(privateKey: string): string {
    return CryptoJS.AES.encrypt(privateKey, this.encryptionKey).toString()
  }

  // Decrypt sensitive data
  decryptPrivateKey(encryptedKey: string): string {
    const bytes = CryptoJS.AES.decrypt(encryptedKey, this.encryptionKey)
    return bytes.toString(CryptoJS.enc.Utf8)
  }

  // Validate private key format
  validatePrivateKey(privateKey: string): boolean {
    try {
      new ethers.Wallet(privateKey)
      return true
    } catch {
      return false
    }
  }

  // Check if trading should be allowed
  async validateTrade(
    tokenAddress: string,
    amount: number,
    type: "BUY" | "SELL",
  ): Promise<{ allowed: boolean; reason?: string }> {
    // Reset daily loss counter if new day
    const today = new Date().toDateString()
    if (today !== this.lastResetDate) {
      this.dailyLoss = 0
      this.lastResetDate = today
    }

    // Check emergency stop
    if (this.config.emergencyStopEnabled) {
      return { allowed: false, reason: "Emergency stop is enabled" }
    }

    // Check daily loss limit
    if (type === "BUY" && this.dailyLoss >= this.config.maxDailyLoss) {
      this.addAlert("LOSS_LIMIT", "Daily loss limit reached", "HIGH", true)
      return { allowed: false, reason: "Daily loss limit exceeded" }
    }

    // Check position size
    if (type === "BUY" && amount > this.config.maxPositionSize) {
      return { allowed: false, reason: "Position size exceeds limit" }
    }

    // Check token whitelist/blacklist
    const tokenLower = tokenAddress.toLowerCase()
    if (this.config.blacklistedTokens.includes(tokenLower)) {
      this.addAlert("SUSPICIOUS_TOKEN", `Blacklisted token detected: ${tokenAddress}`, "HIGH", true)
      return { allowed: false, reason: "Token is blacklisted" }
    }

    if (this.config.whitelistedTokens.length > 0 && !this.config.whitelistedTokens.includes(tokenLower)) {
      return { allowed: false, reason: "Token not in whitelist" }
    }

    return { allowed: true }
  }

  // Add security alert
  private addAlert(
    type: SecurityAlert["type"],
    message: string,
    severity: SecurityAlert["severity"],
    actionRequired: boolean,
  ): void {
    const alert: SecurityAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      message,
      timestamp: new Date().toISOString(),
      severity,
      actionRequired,
    }

    this.alerts.unshift(alert)

    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(0, 100)
    }
  }

  // Record trade loss for daily tracking
  recordTradeLoss(loss: number): void {
    if (loss > 0) {
      this.dailyLoss += loss
    }
  }

  // Generate secure encryption key
  private generateEncryptionKey(): string {
    return CryptoJS.lib.WordArray.random(256 / 8).toString()
  }

  // Analyze token for security risks
  async analyzeTokenSecurity(tokenAddress: string): Promise<{
    riskScore: number
    risks: string[]
    recommendations: string[]
  }> {
    const risks: string[] = []
    const recommendations: string[] = []
    let riskScore = 0

    // Simulate security analysis (in production, use real contract analysis)
    const checks = [
      { name: "Honeypot check", risk: Math.random() > 0.9, score: 30 },
      { name: "Ownership renounced", risk: Math.random() > 0.7, score: 20 },
      { name: "High tax detection", risk: Math.random() > 0.8, score: 25 },
      { name: "Liquidity locked", risk: Math.random() > 0.6, score: 15 },
      { name: "Contract verified", risk: Math.random() > 0.3, score: 10 },
    ]

    for (const check of checks) {
      if (check.risk) {
        riskScore += check.score
        risks.push(`❌ ${check.name} failed`)
        recommendations.push(`Consider avoiding due to ${check.name.toLowerCase()}`)
      } else {
        risks.push(`✅ ${check.name} passed`)
      }
    }

    if (riskScore > 50) {
      this.addAlert("HIGH_RISK", `High-risk token detected: ${tokenAddress}`, "HIGH", true)
    }

    return { riskScore, risks, recommendations }
  }

  // Get security status
  getSecurityStatus(): {
    dailyLoss: number
    dailyLossLimit: number
    emergencyStop: boolean
    alertCount: number
    criticalAlerts: number
  } {
    const criticalAlerts = this.alerts.filter((alert) => alert.severity === "CRITICAL").length

    return {
      dailyLoss: this.dailyLoss,
      dailyLossLimit: this.config.maxDailyLoss,
      emergencyStop: this.config.emergencyStopEnabled,
      alertCount: this.alerts.length,
      criticalAlerts,
    }
  }

  // Get all alerts
  getAlerts(): SecurityAlert[] {
    return [...this.alerts]
  }

  // Clear alerts
  clearAlerts(): void {
    this.alerts = []
  }

  // Update configuration
  updateConfig(newConfig: Partial<SecurityConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  // Emergency stop
  enableEmergencyStop(): void {
    this.config.emergencyStopEnabled = true
    this.addAlert("HIGH_RISK", "Emergency stop activated", "CRITICAL", true)
  }

  disableEmergencyStop(): void {
    this.config.emergencyStopEnabled = false
  }
}

// Default security configuration
export const createDefaultSecurityConfig = (): SecurityConfig => ({
  maxDailyLoss: 100, // $100 max daily loss
  maxPositionSize: 0.1, // 0.1 ETH max position
  emergencyStopEnabled: false,
  whitelistedTokens: [],
  blacklistedTokens: [],
  maxSlippage: 10, // 10% max slippage
  requireConfirmation: true,
})
