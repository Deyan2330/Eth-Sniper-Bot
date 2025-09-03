import { ethers } from "ethers"

export interface PriceData {
  tokenAddress: string
  symbol: string
  price: number
  priceChange24h: number
  volume24h: number
  marketCap: number
  timestamp: number
}

export interface PriceAlert {
  id: string
  tokenAddress: string
  symbol: string
  targetPrice: number
  condition: "above" | "below"
  isActive: boolean
  createdAt: number
}

export class PriceMonitor {
  private provider: ethers.Provider
  private priceCache: Map<string, PriceData> = new Map()
  private alerts: Map<string, PriceAlert> = new Map()
  private subscribers: Map<string, Function[]> = new Map()
  private updateInterval: NodeJS.Timeout | null = null
  private isRunning = false

  constructor(provider: ethers.Provider) {
    this.provider = provider
  }

  async startMonitoring(tokens: string[], intervalMs = 5000): Promise<void> {
    if (this.isRunning) {
      console.log("Price monitoring is already running")
      return
    }

    this.isRunning = true
    console.log(`Starting price monitoring for ${tokens.length} tokens`)

    // Initial price fetch
    await this.updatePrices(tokens)

    // Set up periodic updates
    this.updateInterval = setInterval(async () => {
      try {
        await this.updatePrices(tokens)
        this.checkAlerts()
      } catch (error) {
        console.error("Error updating prices:", error)
      }
    }, intervalMs)
  }

  stopMonitoring(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval)
      this.updateInterval = null
    }
    this.isRunning = false
    console.log("Price monitoring stopped")
  }

  private async updatePrices(tokens: string[]): Promise<void> {
    const promises = tokens.map(async (tokenAddress) => {
      try {
        const priceData = await this.fetchTokenPrice(tokenAddress)
        this.priceCache.set(tokenAddress, priceData)
        this.notifySubscribers(tokenAddress, priceData)
      } catch (error) {
        console.error(`Error fetching price for ${tokenAddress}:`, error)
      }
    })

    await Promise.allSettled(promises)
  }

  private async fetchTokenPrice(tokenAddress: string): Promise<PriceData> {
    // This is a simplified implementation
    // In a real application, you would integrate with a price API like CoinGecko, DexScreener, etc.

    try {
      // Mock price data for demonstration
      // Replace with actual API calls
      const mockPrice = Math.random() * 100
      const mockChange = (Math.random() - 0.5) * 20

      return {
        tokenAddress,
        symbol: await this.getTokenSymbol(tokenAddress),
        price: mockPrice,
        priceChange24h: mockChange,
        volume24h: Math.random() * 1000000,
        marketCap: Math.random() * 10000000,
        timestamp: Date.now(),
      }
    } catch (error) {
      throw new Error(`Failed to fetch price for ${tokenAddress}: ${error}`)
    }
  }

  private async getTokenSymbol(tokenAddress: string): Promise<string> {
    try {
      const contract = new ethers.Contract(tokenAddress, ["function symbol() view returns (string)"], this.provider)
      return await contract.symbol()
    } catch (error) {
      return "UNKNOWN"
    }
  }

  getCurrentPrice(tokenAddress: string): PriceData | null {
    return this.priceCache.get(tokenAddress) || null
  }

  getAllPrices(): Map<string, PriceData> {
    return new Map(this.priceCache)
  }

  subscribe(tokenAddress: string, callback: (priceData: PriceData) => void): void {
    if (!this.subscribers.has(tokenAddress)) {
      this.subscribers.set(tokenAddress, [])
    }
    this.subscribers.get(tokenAddress)!.push(callback)
  }

  unsubscribe(tokenAddress: string, callback: Function): void {
    const callbacks = this.subscribers.get(tokenAddress)
    if (callbacks) {
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  private notifySubscribers(tokenAddress: string, priceData: PriceData): void {
    const callbacks = this.subscribers.get(tokenAddress) || []
    callbacks.forEach((callback) => {
      try {
        callback(priceData)
      } catch (error) {
        console.error("Error in price subscriber callback:", error)
      }
    })
  }

  addPriceAlert(alert: Omit<PriceAlert, "id" | "createdAt">): string {
    const id = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const fullAlert: PriceAlert = {
      ...alert,
      id,
      createdAt: Date.now(),
    }

    this.alerts.set(id, fullAlert)
    console.log(`Price alert added: ${alert.symbol} ${alert.condition} $${alert.targetPrice}`)
    return id
  }

  removeAlert(alertId: string): boolean {
    return this.alerts.delete(alertId)
  }

  getAlerts(): PriceAlert[] {
    return Array.from(this.alerts.values())
  }

  private checkAlerts(): void {
    for (const alert of this.alerts.values()) {
      if (!alert.isActive) continue

      const currentPrice = this.priceCache.get(alert.tokenAddress)
      if (!currentPrice) continue

      const shouldTrigger =
        (alert.condition === "above" && currentPrice.price >= alert.targetPrice) ||
        (alert.condition === "below" && currentPrice.price <= alert.targetPrice)

      if (shouldTrigger) {
        this.triggerAlert(alert, currentPrice)
      }
    }
  }

  private triggerAlert(alert: PriceAlert, currentPrice: PriceData): void {
    console.log(
      `🚨 PRICE ALERT: ${alert.symbol} is ${alert.condition} $${alert.targetPrice}! Current price: $${currentPrice.price.toFixed(6)}`,
    )

    // Deactivate the alert to prevent spam
    alert.isActive = false

    // Notify alert subscribers
    this.notifyAlertSubscribers(alert, currentPrice)
  }

  private alertSubscribers: Function[] = []

  onAlert(callback: (alert: PriceAlert, currentPrice: PriceData) => void): void {
    this.alertSubscribers.push(callback)
  }

  private notifyAlertSubscribers(alert: PriceAlert, currentPrice: PriceData): void {
    this.alertSubscribers.forEach((callback) => {
      try {
        callback(alert, currentPrice)
      } catch (error) {
        console.error("Error in alert subscriber callback:", error)
      }
    })
  }

  getPriceHistory(tokenAddress: string, hours = 24): PriceData[] {
    // This would typically fetch from a database or API
    // For now, return empty array as this is a simplified implementation
    return []
  }

  calculatePriceChange(tokenAddress: string, timeframe: "1h" | "24h" | "7d" = "24h"): number {
    const current = this.priceCache.get(tokenAddress)
    if (!current) return 0

    // This would typically calculate based on historical data
    // For now, return the 24h change from the current data
    return current.priceChange24h
  }

  getTopGainers(limit = 10): PriceData[] {
    return Array.from(this.priceCache.values())
      .filter((data) => data.priceChange24h > 0)
      .sort((a, b) => b.priceChange24h - a.priceChange24h)
      .slice(0, limit)
  }

  getTopLosers(limit = 10): PriceData[] {
    return Array.from(this.priceCache.values())
      .filter((data) => data.priceChange24h < 0)
      .sort((a, b) => a.priceChange24h - b.priceChange24h)
      .slice(0, limit)
  }

  isMonitoring(): boolean {
    return this.isRunning
  }

  getMonitoredTokens(): string[] {
    return Array.from(this.priceCache.keys())
  }

  clearCache(): void {
    this.priceCache.clear()
    console.log("Price cache cleared")
  }

  destroy(): void {
    this.stopMonitoring()
    this.priceCache.clear()
    this.alerts.clear()
    this.subscribers.clear()
    this.alertSubscribers.length = 0
  }
}
