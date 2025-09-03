import { ethers } from "ethers"

export interface GasInfo {
  gasPrice: bigint
  gasPriceGwei: number
  gasCostUSD: number
  estimatedTime: string
  priority: "LOW" | "STANDARD" | "HIGH" | "URGENT"
}

export interface GasStrategy {
  maxGasPriceGwei: number
  maxGasCostUSD: number
  priorityLevel: "LOW" | "STANDARD" | "HIGH" | "URGENT"
  dynamicAdjustment: boolean
}

export interface GasEstimate {
  gasLimit: bigint
  gasPrice: bigint
  maxFeePerGas: bigint
  maxPriorityFeePerGas: bigint
  estimatedCost: bigint
  estimatedCostUSD: number
}

export interface GasSettings {
  speed: "slow" | "standard" | "fast" | "instant"
  customGasPrice?: bigint
  customMaxFeePerGas?: bigint
  customMaxPriorityFeePerGas?: bigint
}

export class GasPriceCalculator {
  private provider: ethers.Provider
  private ethPriceUSD = 2000 // Default ETH price, should be updated from price feed

  constructor(provider: ethers.Provider) {
    this.provider = provider
  }

  async updateETHPrice(): Promise<void> {
    try {
      // In a real implementation, fetch from a price API
      // For now, use a mock price
      this.ethPriceUSD = 2000 + (Math.random() - 0.5) * 200
    } catch (error) {
      console.error("Error updating ETH price:", error)
    }
  }

  async getCurrentGasPrice(): Promise<bigint> {
    try {
      const feeData = await this.provider.getFeeData()
      return feeData.gasPrice || BigInt(0)
    } catch (error) {
      console.error("Error getting gas price:", error)
      return BigInt(20000000000) // 20 gwei fallback
    }
  }

  async getGasPriceRecommendations(): Promise<{
    slow: bigint
    standard: bigint
    fast: bigint
    instant: bigint
  }> {
    try {
      const currentGasPrice = await this.getCurrentGasPrice()

      return {
        slow: (currentGasPrice * BigInt(80)) / BigInt(100), // 80% of current
        standard: currentGasPrice,
        fast: (currentGasPrice * BigInt(120)) / BigInt(100), // 120% of current
        instant: (currentGasPrice * BigInt(150)) / BigInt(100), // 150% of current
      }
    } catch (error) {
      console.error("Error getting gas price recommendations:", error)
      // Fallback values in gwei
      return {
        slow: BigInt(15000000000), // 15 gwei
        standard: BigInt(20000000000), // 20 gwei
        fast: BigInt(25000000000), // 25 gwei
        instant: BigInt(30000000000), // 30 gwei
      }
    }
  }

  async getEIP1559Recommendations(): Promise<{
    slow: { maxFeePerGas: bigint; maxPriorityFeePerGas: bigint }
    standard: { maxFeePerGas: bigint; maxPriorityFeePerGas: bigint }
    fast: { maxFeePerGas: bigint; maxPriorityFeePerGas: bigint }
    instant: { maxFeePerGas: bigint; maxPriorityFeePerGas: bigint }
  }> {
    try {
      const feeData = await this.provider.getFeeData()
      const baseFee = feeData.maxFeePerGas || BigInt(20000000000)

      const priorityFees = {
        slow: BigInt(1000000000), // 1 gwei
        standard: BigInt(2000000000), // 2 gwei
        fast: BigInt(3000000000), // 3 gwei
        instant: BigInt(5000000000), // 5 gwei
      }

      return {
        slow: {
          maxFeePerGas: baseFee + priorityFees.slow,
          maxPriorityFeePerGas: priorityFees.slow,
        },
        standard: {
          maxFeePerGas: baseFee + priorityFees.standard,
          maxPriorityFeePerGas: priorityFees.standard,
        },
        fast: {
          maxFeePerGas: baseFee + priorityFees.fast,
          maxPriorityFeePerGas: priorityFees.fast,
        },
        instant: {
          maxFeePerGas: baseFee + priorityFees.instant,
          maxPriorityFeePerGas: priorityFees.instant,
        },
      }
    } catch (error) {
      console.error("Error getting EIP-1559 recommendations:", error)
      // Fallback values
      return {
        slow: {
          maxFeePerGas: BigInt(20000000000),
          maxPriorityFeePerGas: BigInt(1000000000),
        },
        standard: {
          maxFeePerGas: BigInt(25000000000),
          maxPriorityFeePerGas: BigInt(2000000000),
        },
        fast: {
          maxFeePerGas: BigInt(30000000000),
          maxPriorityFeePerGas: BigInt(3000000000),
        },
        instant: {
          maxFeePerGas: BigInt(40000000000),
          maxPriorityFeePerGas: BigInt(5000000000),
        },
      }
    }
  }

  async estimateTransactionGas(
    transaction: {
      to: string
      data?: string
      value?: bigint
    },
    settings: GasSettings = { speed: "standard" },
  ): Promise<GasEstimate> {
    try {
      // Estimate gas limit
      const gasLimit = await this.provider.estimateGas(transaction)

      let gasPrice: bigint
      let maxFeePerGas: bigint
      let maxPriorityFeePerGas: bigint

      if (settings.customGasPrice) {
        gasPrice = settings.customGasPrice
        maxFeePerGas = settings.customMaxFeePerGas || gasPrice
        maxPriorityFeePerGas = settings.customMaxPriorityFeePerGas || BigInt(2000000000)
      } else {
        const recommendations = await this.getEIP1559Recommendations()
        const speedSettings = recommendations[settings.speed]

        gasPrice = speedSettings.maxFeePerGas
        maxFeePerGas = speedSettings.maxFeePerGas
        maxPriorityFeePerGas = speedSettings.maxPriorityFeePerGas
      }

      const estimatedCost = gasLimit * maxFeePerGas
      const estimatedCostUSD = this.weiToUSD(estimatedCost)

      return {
        gasLimit,
        gasPrice,
        maxFeePerGas,
        maxPriorityFeePerGas,
        estimatedCost,
        estimatedCostUSD,
      }
    } catch (error) {
      console.error("Error estimating gas:", error)
      throw new Error(`Gas estimation failed: ${error}`)
    }
  }

  async estimateSwapGas(
    tokenIn: string,
    tokenOut: string,
    amountIn: bigint,
    settings: GasSettings = { speed: "standard" },
  ): Promise<GasEstimate> {
    try {
      // This would typically interact with a DEX router contract
      // For demonstration, we'll use estimated values based on swap complexity

      let baseGasLimit: bigint

      if (tokenIn === ethers.ZeroAddress || tokenOut === ethers.ZeroAddress) {
        // ETH to token or token to ETH swap
        baseGasLimit = BigInt(150000)
      } else {
        // Token to token swap
        baseGasLimit = BigInt(200000)
      }

      // Add buffer for price impact and slippage
      const gasLimit = (baseGasLimit * BigInt(120)) / BigInt(100) // 20% buffer

      const recommendations = await this.getEIP1559Recommendations()
      const speedSettings = recommendations[settings.speed]

      const estimatedCost = gasLimit * speedSettings.maxFeePerGas
      const estimatedCostUSD = this.weiToUSD(estimatedCost)

      return {
        gasLimit,
        gasPrice: speedSettings.maxFeePerGas,
        maxFeePerGas: speedSettings.maxFeePerGas,
        maxPriorityFeePerGas: speedSettings.maxPriorityFeePerGas,
        estimatedCost,
        estimatedCostUSD,
      }
    } catch (error) {
      console.error("Error estimating swap gas:", error)
      throw new Error(`Swap gas estimation failed: ${error}`)
    }
  }

  private weiToUSD(wei: bigint): number {
    const eth = Number(ethers.formatEther(wei))
    return eth * this.ethPriceUSD
  }

  formatGasPrice(gasPrice: bigint): string {
    const gwei = Number(ethers.formatUnits(gasPrice, "gwei"))
    return `${gwei.toFixed(2)} gwei`
  }

  formatGasCost(cost: bigint): string {
    const eth = ethers.formatEther(cost)
    const usd = this.weiToUSD(cost)
    return `${Number.parseFloat(eth).toFixed(6)} ETH (~$${usd.toFixed(2)})`
  }

  async getOptimalGasSettings(transaction: any, maxCostUSD = 50): Promise<GasSettings> {
    try {
      const recommendations = await this.getEIP1559Recommendations()

      // Try each speed setting and find the fastest one within budget
      const speeds: Array<keyof typeof recommendations> = ["slow", "standard", "fast", "instant"]

      for (const speed of speeds.reverse()) {
        const estimate = await this.estimateTransactionGas(transaction, { speed })

        if (estimate.estimatedCostUSD <= maxCostUSD) {
          return { speed }
        }
      }

      // If all are too expensive, return slow with custom lower gas
      const slowSettings = recommendations.slow
      const reducedMaxFee = (slowSettings.maxFeePerGas * BigInt(80)) / BigInt(100)

      return {
        speed: "slow",
        customMaxFeePerGas: reducedMaxFee,
        customMaxPriorityFeePerGas: slowSettings.maxPriorityFeePerGas,
      }
    } catch (error) {
      console.error("Error getting optimal gas settings:", error)
      return { speed: "standard" }
    }
  }

  async waitForGasPrice(targetGasPrice: bigint, timeoutMs = 300000): Promise<boolean> {
    const startTime = Date.now()

    while (Date.now() - startTime < timeoutMs) {
      try {
        const currentGasPrice = await this.getCurrentGasPrice()

        if (currentGasPrice <= targetGasPrice) {
          return true
        }

        // Wait 10 seconds before checking again
        await new Promise((resolve) => setTimeout(resolve, 10000))
      } catch (error) {
        console.error("Error checking gas price:", error)
        await new Promise((resolve) => setTimeout(resolve, 10000))
      }
    }

    return false
  }

  getGasSpeedDescription(speed: GasSettings["speed"]): string {
    const descriptions = {
      slow: "Low cost, may take 5-10 minutes",
      standard: "Balanced cost and speed, ~2-5 minutes",
      fast: "Higher cost, usually under 2 minutes",
      instant: "Highest cost, priority execution",
    }

    return descriptions[speed]
  }

  async getNetworkCongestion(): Promise<{
    level: "low" | "medium" | "high" | "extreme"
    description: string
    recommendedAction: string
  }> {
    try {
      const currentGasPrice = await this.getCurrentGasPrice()
      const gweiPrice = Number(ethers.formatUnits(currentGasPrice, "gwei"))

      if (gweiPrice < 20) {
        return {
          level: "low",
          description: "Network is not congested",
          recommendedAction: "Good time to trade with standard gas settings",
        }
      } else if (gweiPrice < 50) {
        return {
          level: "medium",
          description: "Moderate network congestion",
          recommendedAction: "Consider using fast gas for time-sensitive trades",
        }
      } else if (gweiPrice < 100) {
        return {
          level: "high",
          description: "High network congestion",
          recommendedAction: "Use instant gas only for urgent trades",
        }
      } else {
        return {
          level: "extreme",
          description: "Extreme network congestion",
          recommendedAction: "Consider waiting for gas prices to decrease",
        }
      }
    } catch (error) {
      console.error("Error checking network congestion:", error)
      return {
        level: "medium",
        description: "Unable to determine congestion level",
        recommendedAction: "Use standard gas settings",
      }
    }
  }
}

// Default gas strategies
export const GAS_STRATEGIES = {
  CONSERVATIVE: {
    maxGasPriceGwei: 20,
    maxGasCostUSD: 3,
    priorityLevel: "LOW" as const,
    dynamicAdjustment: false,
  },
  BALANCED: {
    maxGasPriceGwei: 50,
    maxGasCostUSD: 8,
    priorityLevel: "STANDARD" as const,
    dynamicAdjustment: true,
  },
  AGGRESSIVE: {
    maxGasPriceGwei: 100,
    maxGasCostUSD: 20,
    priorityLevel: "HIGH" as const,
    dynamicAdjustment: true,
  },
  URGENT: {
    maxGasPriceGwei: 200,
    maxGasCostUSD: 50,
    priorityLevel: "URGENT" as const,
    dynamicAdjustment: true,
  },
} as const
