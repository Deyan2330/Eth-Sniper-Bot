import { ethers } from "ethers"

export interface GasEstimate {
  gasLimit: string
  gasPrice: string
  gasPriceGwei: string
  totalCostETH: string
  totalCostUSD: number
  estimatedTime: string
  confidence: number
}

export interface GasPriceOptions {
  slow: GasEstimate
  standard: GasEstimate
  fast: GasEstimate
  instant: GasEstimate
}

export interface NetworkCongestion {
  level: "low" | "medium" | "high" | "extreme"
  description: string
  recommendedAction: string
}

export class GasPriceCalculator {
  private provider: ethers.Provider
  private ethPriceUSD = 2000 // Default ETH price, should be updated

  constructor(provider: ethers.Provider) {
    this.provider = provider
  }

  async updateETHPrice(priceUSD: number): Promise<void> {
    this.ethPriceUSD = priceUSD
  }

  async getCurrentGasPrices(): Promise<GasPriceOptions> {
    try {
      const feeData = await this.provider.getFeeData()
      const baseFee = feeData.gasPrice || ethers.parseUnits("20", "gwei")

      // Calculate different speed tiers
      const slowGasPrice = baseFee
      const standardGasPrice = (baseFee * BigInt(110)) / BigInt(100) // +10%
      const fastGasPrice = (baseFee * BigInt(125)) / BigInt(100) // +25%
      const instantGasPrice = (baseFee * BigInt(150)) / BigInt(100) // +50%

      // Standard gas limit for token transfers
      const standardGasLimit = "21000"

      return {
        slow: await this.createGasEstimate(slowGasPrice, standardGasLimit, "5-10 min", 70),
        standard: await this.createGasEstimate(standardGasPrice, standardGasLimit, "2-5 min", 85),
        fast: await this.createGasEstimate(fastGasPrice, standardGasLimit, "1-2 min", 95),
        instant: await this.createGasEstimate(instantGasPrice, standardGasLimit, "< 1 min", 99),
      }
    } catch (error: any) {
      throw new Error(`Failed to get gas prices: ${error.message}`)
    }
  }

  private async createGasEstimate(
    gasPrice: bigint,
    gasLimit: string,
    estimatedTime: string,
    confidence: number,
  ): Promise<GasEstimate> {
    const gasPriceGwei = ethers.formatUnits(gasPrice, "gwei")
    const totalCostWei = gasPrice * BigInt(gasLimit)
    const totalCostETH = ethers.formatEther(totalCostWei)
    const totalCostUSD = Number.parseFloat(totalCostETH) * this.ethPriceUSD

    return {
      gasLimit,
      gasPrice: gasPrice.toString(),
      gasPriceGwei,
      totalCostETH,
      totalCostUSD,
      estimatedTime,
      confidence,
    }
  }

  async estimateTransactionGas(
    transaction: ethers.TransactionRequest,
    speed: "slow" | "standard" | "fast" | "instant" = "standard",
  ): Promise<GasEstimate> {
    try {
      // Estimate gas limit for the specific transaction
      const gasLimit = await this.provider.estimateGas(transaction)
      const gasPrices = await this.getCurrentGasPrices()
      const selectedGasPrice = gasPrices[speed]

      // Recalculate with actual gas limit
      const gasPrice = BigInt(selectedGasPrice.gasPrice)
      const totalCostWei = gasPrice * gasLimit
      const totalCostETH = ethers.formatEther(totalCostWei)
      const totalCostUSD = Number.parseFloat(totalCostETH) * this.ethPriceUSD

      return {
        gasLimit: gasLimit.toString(),
        gasPrice: selectedGasPrice.gasPrice,
        gasPriceGwei: selectedGasPrice.gasPriceGwei,
        totalCostETH,
        totalCostUSD,
        estimatedTime: selectedGasPrice.estimatedTime,
        confidence: selectedGasPrice.confidence,
      }
    } catch (error: any) {
      throw new Error(`Failed to estimate transaction gas: ${error.message}`)
    }
  }

  async getNetworkCongestion(): Promise<NetworkCongestion> {
    try {
      const feeData = await this.provider.getFeeData()
      const gasPrice = feeData.gasPrice || ethers.parseUnits("20", "gwei")
      const gasPriceGwei = Number.parseFloat(ethers.formatUnits(gasPrice, "gwei"))

      // Determine congestion level based on gas price
      if (gasPriceGwei < 20) {
        return {
          level: "low",
          description: "Network is running smoothly with low gas prices",
          recommendedAction: "Good time to make transactions",
        }
      } else if (gasPriceGwei < 50) {
        return {
          level: "medium",
          description: "Moderate network activity with average gas prices",
          recommendedAction: "Consider waiting for lower fees if not urgent",
        }
      } else if (gasPriceGwei < 100) {
        return {
          level: "high",
          description: "High network congestion with elevated gas prices",
          recommendedAction: "Wait for congestion to decrease unless urgent",
        }
      } else {
        return {
          level: "extreme",
          description: "Extreme network congestion with very high gas prices",
          recommendedAction: "Strongly recommend waiting for better conditions",
        }
      }
    } catch (error: any) {
      throw new Error(`Failed to get network congestion: ${error.message}`)
    }
  }

  async optimizeGasPrice(transaction: ethers.TransactionRequest, maxWaitTimeMinutes = 10): Promise<GasEstimate> {
    try {
      const congestion = await this.getNetworkCongestion()
      const gasPrices = await this.getCurrentGasPrices()

      // Choose optimal gas price based on congestion and wait time
      if (maxWaitTimeMinutes <= 2) {
        return await this.estimateTransactionGas(transaction, "instant")
      } else if (maxWaitTimeMinutes <= 5) {
        return await this.estimateTransactionGas(transaction, "fast")
      } else if (congestion.level === "low" || congestion.level === "medium") {
        return await this.estimateTransactionGas(transaction, "standard")
      } else {
        return await this.estimateTransactionGas(transaction, "slow")
      }
    } catch (error: any) {
      throw new Error(`Failed to optimize gas price: ${error.message}`)
    }
  }

  async calculateMaxFeePerGas(baseFeeMultiplier = 2): Promise<string> {
    try {
      const block = await this.provider.getBlock("latest")
      if (!block || !block.baseFeePerGas) {
        throw new Error("Unable to get base fee")
      }

      const maxFeePerGas = block.baseFeePerGas * BigInt(baseFeeMultiplier)
      return maxFeePerGas.toString()
    } catch (error: any) {
      throw new Error(`Failed to calculate max fee per gas: ${error.message}`)
    }
  }

  async calculateMaxPriorityFeePerGas(): Promise<string> {
    try {
      // This is a simplified implementation
      // In production, you'd want to analyze recent blocks for better estimation
      const priorityFee = ethers.parseUnits("2", "gwei") // 2 gwei priority fee
      return priorityFee.toString()
    } catch (error: any) {
      throw new Error(`Failed to calculate max priority fee per gas: ${error.message}`)
    }
  }

  async getGasHistory(blocks = 10): Promise<Array<{ blockNumber: number; gasPrice: string; baseFee?: string }>> {
    try {
      const currentBlock = await this.provider.getBlockNumber()
      const history: Array<{ blockNumber: number; gasPrice: string; baseFee?: string }> = []

      for (let i = 0; i < blocks; i++) {
        const blockNumber = currentBlock - i
        const block = await this.provider.getBlock(blockNumber)

        if (block) {
          history.push({
            blockNumber,
            gasPrice: "0", // Would need to calculate from transactions
            baseFee: block.baseFeePerGas?.toString(),
          })
        }
      }

      return history
    } catch (error: any) {
      throw new Error(`Failed to get gas history: ${error.message}`)
    }
  }

  formatGasPrice(gasPrice: string, unit: "wei" | "gwei" | "eth" = "gwei"): string {
    try {
      switch (unit) {
        case "wei":
          return gasPrice
        case "gwei":
          return ethers.formatUnits(gasPrice, "gwei")
        case "eth":
          return ethers.formatEther(gasPrice)
        default:
          return gasPrice
      }
    } catch (error: any) {
      throw new Error(`Failed to format gas price: ${error.message}`)
    }
  }

  async waitForGasPrice(targetGasPriceGwei: number, timeoutMinutes = 30): Promise<boolean> {
    const timeoutMs = timeoutMinutes * 60 * 1000
    const startTime = Date.now()

    while (Date.now() - startTime < timeoutMs) {
      try {
        const feeData = await this.provider.getFeeData()
        const currentGasPrice = feeData.gasPrice || ethers.parseUnits("20", "gwei")
        const currentGasPriceGwei = Number.parseFloat(ethers.formatUnits(currentGasPrice, "gwei"))

        if (currentGasPriceGwei <= targetGasPriceGwei) {
          return true
        }

        // Wait 30 seconds before checking again
        await new Promise((resolve) => setTimeout(resolve, 30000))
      } catch (error) {
        console.error("Error checking gas price:", error)
        await new Promise((resolve) => setTimeout(resolve, 30000))
      }
    }

    return false // Timeout reached
  }
}

export default GasPriceCalculator
