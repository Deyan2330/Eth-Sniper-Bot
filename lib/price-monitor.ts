import { ethers } from "ethers"

export interface PriceData {
  token: string
  price: number
  priceUSD: number
  change24h: number
  volume24h: number
  marketCap: number
  timestamp: number
}

export interface PriceAlert {
  id: string
  token: string
  condition: "above" | "below"
  targetPrice: number
  currentPrice: number
  isActive: boolean
  createdAt: number
  triggeredAt?: number
}

export interface TokenInfo {
  address: string
  symbol: string
  name: string
  decimals: number
  totalSupply: string
}

export class PriceMonitor {
  private provider: ethers.Provider
  private alerts: Map<string, PriceAlert> = new Map()
  private priceCache: Map<string, PriceData> = new Map()
  private updateInterval: NodeJS.Timeout | null = null
  private isMonitoring = false

  // Uniswap V3 Factory and Router addresses on Base
  private readonly UNISWAP_V3_FACTORY = "0x33128a8fC17869897dcE68Ed026d694621f6FDfD"
  private readonly UNISWAP_V3_ROUTER = "0x2626664c2603336E57B271c5C0b26F421741e481"
  private readonly WETH_ADDRESS = "0x4200000000000000000000000000000000000006" // WETH on Base

  constructor(provider: ethers.Provider) {
    this.provider = provider
  }

  async getTokenInfo(tokenAddress: string): Promise<TokenInfo> {
    try {
      const tokenContract = new ethers.Contract(
        tokenAddress,
        [
          "function symbol() view returns (string)",
          "function name() view returns (string)",
          "function decimals() view returns (uint8)",
          "function totalSupply() view returns (uint256)",
        ],
        this.provider,
      )

      const [symbol, name, decimals, totalSupply] = await Promise.all([
        tokenContract.symbol(),
        tokenContract.name(),
        tokenContract.decimals(),
        tokenContract.totalSupply(),
      ])

      return {
        address: tokenAddress,
        symbol,
        name,
        decimals,
        totalSupply: ethers.formatUnits(totalSupply, decimals),
      }
    } catch (error: any) {
      throw new Error(`Failed to get token info: ${error.message}`)
    }
  }

  async getTokenPrice(tokenAddress: string): Promise<PriceData> {
    try {
      // Check cache first
      const cached = this.priceCache.get(tokenAddress.toLowerCase())
      if (cached && Date.now() - cached.timestamp < 30000) {
        // Return cached data if less than 30 seconds old
        return cached
      }

      // Get price from Uniswap V3
      const price = await this.getUniswapV3Price(tokenAddress)
      const priceData: PriceData = {
        token: tokenAddress,
        price,
        priceUSD: price, // Assuming price is already in USD terms
        change24h: 0, // Would need historical data
        volume24h: 0, // Would need to query events
        marketCap: 0, // Would need total supply
        timestamp: Date.now(),
      }

      // Cache the result
      this.priceCache.set(tokenAddress.toLowerCase(), priceData)
      return priceData
    } catch (error: any) {
      throw new Error(`Failed to get token price: ${error.message}`)
    }
  }

  private async getUniswapV3Price(tokenAddress: string): Promise<number> {
    try {
      // This is a simplified implementation
      // In production, you'd want to use the Uniswap SDK or query multiple pools
      const factoryContract = new ethers.Contract(
        this.UNISWAP_V3_FACTORY,
        ["function getPool(address tokenA, address tokenB, uint24 fee) view returns (address pool)"],
        this.provider,
      )

      // Try different fee tiers
      const feeTiers = [500, 3000, 10000] // 0.05%, 0.3%, 1%
      let poolAddress = ethers.ZeroAddress

      for (const fee of feeTiers) {
        try {
          poolAddress = await factoryContract.getPool(tokenAddress, this.WETH_ADDRESS, fee)
          if (poolAddress !== ethers.ZeroAddress) break
        } catch (error) {
          continue
        }
      }

      if (poolAddress === ethers.ZeroAddress) {
        throw new Error("No liquidity pool found")
      }

      // Get pool data
      const poolContract = new ethers.Contract(
        poolAddress,
        [
          "function slot0() view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)",
          "function token0() view returns (address)",
          "function token1() view returns (address)",
        ],
        this.provider,
      )

      const [slot0Data, token0, token1] = await Promise.all([
        poolContract.slot0(),
        poolContract.token0(),
        poolContract.token1(),
      ])

      const sqrtPriceX96 = slot0Data[0]

      // Calculate price from sqrtPriceX96
      // Price = (sqrtPriceX96 / 2^96)^2
      const price = Math.pow(Number(sqrtPriceX96) / Math.pow(2, 96), 2)

      // Adjust for token order and decimals
      const isToken0 = token0.toLowerCase() === tokenAddress.toLowerCase()
      const adjustedPrice = isToken0 ? 1 / price : price

      return adjustedPrice
    } catch (error: any) {
      throw new Error(`Failed to get Uniswap price: ${error.message}`)
    }
  }

  async createPriceAlert(token: string, condition: "above" | "below", targetPrice: number): Promise<string> {
    const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const currentPrice = await this.getTokenPrice(token)

    const alert: PriceAlert = {
      id: alertId,
      token,
      condition,
      targetPrice,
      currentPrice: currentPrice.price,
      isActive: true,
      createdAt: Date.now(),
    }

    this.alerts.set(alertId, alert)
    return alertId
  }

  async removeAlert(alertId: string): Promise<boolean> {
    return this.alerts.delete(alertId)
  }

  getAlerts(): PriceAlert[] {
    return Array.from(this.alerts.values())
  }

  getActiveAlerts(): PriceAlert[] {
    return Array.from(this.alerts.values()).filter((alert) => alert.isActive)
  }

  async checkAlerts(): Promise<PriceAlert[]> {
    const triggeredAlerts: PriceAlert[] = []

    for (const alert of this.alerts.values()) {
      if (!alert.isActive) continue

      try {
        const currentPrice = await this.getTokenPrice(alert.token)
        alert.currentPrice = currentPrice.price

        const shouldTrigger =
          (alert.condition === "above" && currentPrice.price >= alert.targetPrice) ||
          (alert.condition === "below" && currentPrice.price <= alert.targetPrice)

        if (shouldTrigger) {
          alert.isActive = false
          alert.triggeredAt = Date.now()
          triggeredAlerts.push(alert)
        }
      } catch (error) {
        console.error(`Failed to check alert ${alert.id}:`, error)
      }
    }

    return triggeredAlerts
  }

  startMonitoring(intervalMs = 30000): void {
    if (this.isMonitoring) return

    this.isMonitoring = true
    this.updateInterval = setInterval(async () => {
      try {
        const triggeredAlerts = await this.checkAlerts()
        if (triggeredAlerts.length > 0) {
          this.onAlertsTriggered?.(triggeredAlerts)
        }
      } catch (error) {
        console.error("Error during price monitoring:", error)
      }
    }, intervalMs)
  }

  stopMonitoring(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval)
      this.updateInterval = null
    }
    this.isMonitoring = false
  }

  isActive(): boolean {
    return this.isMonitoring
  }

  clearCache(): void {
    this.priceCache.clear()
  }

  getCachedPrice(tokenAddress: string): PriceData | null {
    return this.priceCache.get(tokenAddress.toLowerCase()) || null
  }

  async getMultipleTokenPrices(tokenAddresses: string[]): Promise<Map<string, PriceData>> {
    const results = new Map<string, PriceData>()

    const promises = tokenAddresses.map(async (address) => {
      try {
        const priceData = await this.getTokenPrice(address)
        results.set(address.toLowerCase(), priceData)
      } catch (error) {
        console.error(`Failed to get price for ${address}:`, error)
      }
    })

    await Promise.allSettled(promises)
    return results
  }

  async getPriceHistory(tokenAddress: string, hours = 24): Promise<PriceData[]> {
    // This would require historical data from a service like The Graph
    // For now, return empty array
    console.warn("Price history not implemented - requires historical data service")
    return []
  }

  // Event handlers
  onAlertsTriggered?: (alerts: PriceAlert[]) => void
  onPriceUpdate?: (tokenAddress: string, priceData: PriceData) => void
  onError?: (error: Error) => void
}

export default PriceMonitor
