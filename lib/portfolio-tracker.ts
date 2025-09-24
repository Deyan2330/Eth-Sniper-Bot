import { ethers } from "ethers"

export interface Position {
  tokenAddress: string
  tokenSymbol: string
  tokenName: string
  balance: string
  balanceUSD: number
  averageBuyPrice: number
  currentPrice: number
  totalInvested: number
  unrealizedPnL: number
  unrealizedPnLPercent: number
  firstBoughtAt: number
  lastUpdated: number
}

export interface Transaction {
  hash: string
  type: "buy" | "sell" | "transfer_in" | "transfer_out"
  tokenAddress: string
  tokenSymbol: string
  amount: string
  pricePerToken: number
  totalValue: number
  gasUsed: string
  gasPriceGwei: string
  gasFeesETH: string
  gasFeesUSD: number
  timestamp: number
  blockNumber: number
  from: string
  to: string
}

export interface PortfolioSummary {
  totalValueUSD: number
  totalInvestedUSD: number
  totalUnrealizedPnL: number
  totalUnrealizedPnLPercent: number
  totalRealizedPnL: number
  totalGasFeesUSD: number
  positionCount: number
  transactionCount: number
  lastUpdated: number
}

export class PortfolioTracker {
  private provider: ethers.Provider
  private positions: Map<string, Position> = new Map()
  private transactions: Transaction[] = []
  private walletAddress: string | null = null

  constructor(provider: ethers.Provider) {
    this.provider = provider
  }

  setWalletAddress(address: string): void {
    this.walletAddress = address
    this.positions.clear()
    this.transactions = []
  }

  async addTransaction(transaction: Transaction): Promise<void> {
    if (!this.walletAddress) {
      throw new Error("Wallet address not set")
    }

    // Add to transactions list
    this.transactions.push(transaction)

    // Sort transactions by timestamp
    this.transactions.sort((a, b) => a.timestamp - b.timestamp)

    // Update position
    await this.updatePosition(transaction)
  }

  private async updatePosition(transaction: Transaction): Promise<void> {
    const tokenAddress = transaction.tokenAddress.toLowerCase()
    let position = this.positions.get(tokenAddress)

    if (!position) {
      // Create new position
      position = {
        tokenAddress: transaction.tokenAddress,
        tokenSymbol: transaction.tokenSymbol,
        tokenName: transaction.tokenSymbol, // Would need to fetch actual name
        balance: "0",
        balanceUSD: 0,
        averageBuyPrice: 0,
        currentPrice: transaction.pricePerToken,
        totalInvested: 0,
        unrealizedPnL: 0,
        unrealizedPnLPercent: 0,
        firstBoughtAt: transaction.timestamp,
        lastUpdated: Date.now(),
      }
    }

    const currentBalance = Number.parseFloat(position.balance)
    const transactionAmount = Number.parseFloat(transaction.amount)

    if (transaction.type === "buy" || transaction.type === "transfer_in") {
      // Calculate new average buy price
      const currentInvestment = position.totalInvested
      const newInvestment = transaction.totalValue
      const newBalance = currentBalance + transactionAmount

      if (newBalance > 0) {
        position.averageBuyPrice = (currentInvestment + newInvestment) / newBalance
      }

      position.balance = newBalance.toString()
      position.totalInvested += newInvestment
    } else if (transaction.type === "sell" || transaction.type === "transfer_out") {
      const newBalance = Math.max(0, currentBalance - transactionAmount)
      position.balance = newBalance.toString()

      // Reduce total invested proportionally
      if (currentBalance > 0) {
        const sellRatio = transactionAmount / currentBalance
        position.totalInvested *= 1 - sellRatio
      }
    }

    // Update current price and P&L
    position.currentPrice = transaction.pricePerToken
    position.balanceUSD = Number.parseFloat(position.balance) * position.currentPrice
    position.unrealizedPnL = position.balanceUSD - position.totalInvested
    position.unrealizedPnLPercent =
      position.totalInvested > 0 ? (position.unrealizedPnL / position.totalInvested) * 100 : 0
    position.lastUpdated = Date.now()

    this.positions.set(tokenAddress, position)
  }

  async updatePositionPrices(priceData: Map<string, number>): Promise<void> {
    for (const [tokenAddress, position] of this.positions) {
      const currentPrice = priceData.get(tokenAddress.toLowerCase())
      if (currentPrice !== undefined) {
        position.currentPrice = currentPrice
        position.balanceUSD = Number.parseFloat(position.balance) * currentPrice
        position.unrealizedPnL = position.balanceUSD - position.totalInvested
        position.unrealizedPnLPercent =
          position.totalInvested > 0 ? (position.unrealizedPnL / position.totalInvested) * 100 : 0
        position.lastUpdated = Date.now()
      }
    }
  }

  async syncWithBlockchain(): Promise<void> {
    if (!this.walletAddress) {
      throw new Error("Wallet address not set")
    }

    try {
      // Get current block number
      const currentBlock = await this.provider.getBlockNumber()

      // This is a simplified implementation
      // In production, you'd use an indexer service like The Graph or Etherscan API
      console.log(`Syncing portfolio for ${this.walletAddress} up to block ${currentBlock}`)

      // For now, just update ETH balance
      const ethBalance = await this.provider.getBalance(this.walletAddress)
      const ethPosition: Position = {
        tokenAddress: "0x0000000000000000000000000000000000000000",
        tokenSymbol: "ETH",
        tokenName: "Ethereum",
        balance: ethers.formatEther(ethBalance),
        balanceUSD: 0, // Would need ETH price
        averageBuyPrice: 0,
        currentPrice: 0,
        totalInvested: 0,
        unrealizedPnL: 0,
        unrealizedPnLPercent: 0,
        firstBoughtAt: Date.now(),
        lastUpdated: Date.now(),
      }

      this.positions.set("0x0000000000000000000000000000000000000000", ethPosition)
    } catch (error: any) {
      throw new Error(`Failed to sync with blockchain: ${error.message}`)
    }
  }

  getPositions(): Position[] {
    return Array.from(this.positions.values())
  }

  getPosition(tokenAddress: string): Position | null {
    return this.positions.get(tokenAddress.toLowerCase()) || null
  }

  getTransactions(): Transaction[] {
    return [...this.transactions]
  }

  getTransactionsByToken(tokenAddress: string): Transaction[] {
    return this.transactions.filter((tx) => tx.tokenAddress.toLowerCase() === tokenAddress.toLowerCase())
  }

  getPortfolioSummary(): PortfolioSummary {
    const positions = this.getPositions()

    const totalValueUSD = positions.reduce((sum, pos) => sum + pos.balanceUSD, 0)
    const totalInvestedUSD = positions.reduce((sum, pos) => sum + pos.totalInvested, 0)
    const totalUnrealizedPnL = positions.reduce((sum, pos) => sum + pos.unrealizedPnL, 0)
    const totalGasFeesUSD = this.transactions.reduce((sum, tx) => sum + tx.gasFeesUSD, 0)

    // Calculate realized P&L from sell transactions
    const totalRealizedPnL = this.transactions
      .filter((tx) => tx.type === "sell")
      .reduce((sum, tx) => {
        // This is simplified - would need to track cost basis properly
        return sum + (tx.totalValue - tx.totalValue * 0.8) // Assuming 20% profit
      }, 0)

    return {
      totalValueUSD,
      totalInvestedUSD,
      totalUnrealizedPnL,
      totalUnrealizedPnLPercent: totalInvestedUSD > 0 ? (totalUnrealizedPnL / totalInvestedUSD) * 100 : 0,
      totalRealizedPnL,
      totalGasFeesUSD,
      positionCount: positions.length,
      transactionCount: this.transactions.length,
      lastUpdated: Date.now(),
    }
  }

  exportToCSV(): string {
    const headers = [
      "Hash",
      "Type",
      "Token",
      "Amount",
      "Price",
      "Total Value",
      "Gas Fees ETH",
      "Gas Fees USD",
      "Timestamp",
      "Block",
    ]

    const rows = this.transactions.map((tx) => [
      tx.hash,
      tx.type,
      tx.tokenSymbol,
      tx.amount,
      tx.pricePerToken.toString(),
      tx.totalValue.toString(),
      tx.gasFeesETH,
      tx.gasFeesUSD.toString(),
      new Date(tx.timestamp).toISOString(),
      tx.blockNumber.toString(),
    ])

    return [headers, ...rows].map((row) => row.join(",")).join("\n")
  }

  clearData(): void {
    this.positions.clear()
    this.transactions = []
  }

  async getTokenBalance(tokenAddress: string): Promise<string> {
    if (!this.walletAddress) {
      throw new Error("Wallet address not set")
    }

    try {
      if (tokenAddress === "0x0000000000000000000000000000000000000000") {
        // ETH balance
        const balance = await this.provider.getBalance(this.walletAddress)
        return ethers.formatEther(balance)
      } else {
        // ERC20 token balance
        const tokenContract = new ethers.Contract(
          tokenAddress,
          ["function balanceOf(address) view returns (uint256)", "function decimals() view returns (uint8)"],
          this.provider,
        )

        const [balance, decimals] = await Promise.all([
          tokenContract.balanceOf(this.walletAddress),
          tokenContract.decimals(),
        ])

        return ethers.formatUnits(balance, decimals)
      }
    } catch (error: any) {
      throw new Error(`Failed to get token balance: ${error.message}`)
    }
  }

  // Helper function to safely format numbers
  private safeValue(value: number | undefined | null): number {
    return value && !isNaN(value) ? value : 0
  }

  // Helper function to format percentage
  private formatPercentage(value: number | undefined | null): string {
    const safeVal = this.safeValue(value)
    return safeVal.toFixed(2)
  }
}

export default PortfolioTracker
