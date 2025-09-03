import type { ethers } from "ethers"

export interface Position {
  tokenAddress: string
  symbol: string
  name: string
  balance: string
  decimals: number
  price: number
  value: number
  costBasis: number
  unrealizedPnL: number
  unrealizedPnLPercentage: number
  averageBuyPrice: number
  totalBought: string
  totalSold: string
  firstBuyDate: number
  lastTradeDate: number
}

export interface Transaction {
  id: string
  hash: string
  type: "buy" | "sell"
  tokenAddress: string
  symbol: string
  amount: string
  price: number
  value: number
  gasUsed: string
  gasPrice: string
  timestamp: number
  blockNumber: number
}

export interface PortfolioSummary {
  totalValue: number
  totalCostBasis: number
  totalUnrealizedPnL: number
  totalUnrealizedPnLPercentage: number
  totalPositions: number
  topGainer: Position | null
  topLoser: Position | null
  dayChange: number
  dayChangePercentage: number
}

export class PortfolioTracker {
  private provider: ethers.Provider
  private walletAddress: string
  private positions: Map<string, Position> = new Map()
  private transactions: Transaction[] = []
  private isTracking = false

  constructor(provider: ethers.Provider, walletAddress: string) {
    this.provider = provider
    this.walletAddress = walletAddress.toLowerCase()
  }

  async startTracking(): Promise<void> {
    if (this.isTracking) {
      console.log("Portfolio tracking is already active")
      return
    }

    this.isTracking = true
    console.log(`Starting portfolio tracking for wallet: ${this.walletAddress}`)

    try {
      await this.loadTransactionHistory()
      await this.updatePositions()
      console.log("Portfolio tracking initialized successfully")
    } catch (error) {
      console.error("Error starting portfolio tracking:", error)
      this.isTracking = false
      throw error
    }
  }

  stopTracking(): void {
    this.isTracking = false
    console.log("Portfolio tracking stopped")
  }

  private async loadTransactionHistory(): Promise<void> {
    try {
      // This would typically load from a database or blockchain indexer
      // For demonstration, we'll create some mock transactions
      console.log("Loading transaction history...")

      // In a real implementation, you would:
      // 1. Query blockchain events for token transfers
      // 2. Load from a local database
      // 3. Use a service like Moralis, Alchemy, or The Graph

      this.transactions = []
    } catch (error) {
      console.error("Error loading transaction history:", error)
      throw error
    }
  }

  async addTransaction(transaction: Omit<Transaction, "id">): Promise<void> {
    const fullTransaction: Transaction = {
      ...transaction,
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    }

    this.transactions.push(fullTransaction)
    await this.updatePositionFromTransaction(fullTransaction)

    console.log(`Transaction added: ${transaction.type} ${transaction.amount} ${transaction.symbol}`)
  }

  private async updatePositionFromTransaction(transaction: Transaction): Promise<void> {
    const existingPosition = this.positions.get(transaction.tokenAddress)

    if (!existingPosition) {
      // Create new position
      if (transaction.type === "buy") {
        const position: Position = {
          tokenAddress: transaction.tokenAddress,
          symbol: transaction.symbol,
          name: transaction.symbol, // Would fetch from contract in real implementation
          balance: transaction.amount,
          decimals: 18, // Would fetch from contract
          price: transaction.price,
          value: transaction.value,
          costBasis: transaction.value,
          unrealizedPnL: 0,
          unrealizedPnLPercentage: 0,
          averageBuyPrice: transaction.price,
          totalBought: transaction.amount,
          totalSold: "0",
          firstBuyDate: transaction.timestamp,
          lastTradeDate: transaction.timestamp,
        }
        this.positions.set(transaction.tokenAddress, position)
      }
    } else {
      // Update existing position
      const position = existingPosition
      const currentBalance = Number.parseFloat(position.balance)
      const transactionAmount = Number.parseFloat(transaction.amount)

      if (transaction.type === "buy") {
        const newBalance = currentBalance + transactionAmount
        const newCostBasis = position.costBasis + transaction.value

        position.balance = newBalance.toString()
        position.costBasis = newCostBasis
        position.averageBuyPrice = newCostBasis / newBalance
        position.totalBought = (Number.parseFloat(position.totalBought) + transactionAmount).toString()
      } else if (transaction.type === "sell") {
        const newBalance = Math.max(0, currentBalance - transactionAmount)
        const soldRatio = transactionAmount / currentBalance
        const costBasisReduction = position.costBasis * soldRatio

        position.balance = newBalance.toString()
        position.costBasis = Math.max(0, position.costBasis - costBasisReduction)
        position.totalSold = (Number.parseFloat(position.totalSold) + transactionAmount).toString()
      }

      position.lastTradeDate = transaction.timestamp
      position.value = Number.parseFloat(position.balance) * position.price
      position.unrealizedPnL = position.value - position.costBasis
      position.unrealizedPnLPercentage =
        position.costBasis > 0 ? (position.unrealizedPnL / position.costBasis) * 100 : 0
    }
  }

  async updatePositions(): Promise<void> {
    if (!this.isTracking) return

    console.log("Updating portfolio positions...")

    for (const position of this.positions.values()) {
      try {
        // Update current price (would integrate with price feed)
        position.price = await this.getCurrentTokenPrice(position.tokenAddress)

        // Recalculate values
        const balance = Number.parseFloat(position.balance)
        position.value = balance * position.price
        position.unrealizedPnL = position.value - position.costBasis
        position.unrealizedPnLPercentage =
          position.costBasis > 0 ? (position.unrealizedPnL / position.costBasis) * 100 : 0
      } catch (error) {
        console.error(`Error updating position for ${position.symbol}:`, error)
      }
    }
  }

  private async getCurrentTokenPrice(tokenAddress: string): Promise<number> {
    // This would integrate with a price feed service
    // For demonstration, return a mock price
    return Math.random() * 100
  }

  getPositions(): Position[] {
    return Array.from(this.positions.values())
  }

  getPosition(tokenAddress: string): Position | null {
    return this.positions.get(tokenAddress) || null
  }

  getTransactions(): Transaction[] {
    return [...this.transactions].sort((a, b) => b.timestamp - a.timestamp)
  }

  getTransactionsByToken(tokenAddress: string): Transaction[] {
    return this.transactions.filter((tx) => tx.tokenAddress === tokenAddress).sort((a, b) => b.timestamp - a.timestamp)
  }

  getPortfolioSummary(): PortfolioSummary {
    const positions = this.getPositions()

    if (positions.length === 0) {
      return {
        totalValue: 0,
        totalCostBasis: 0,
        totalUnrealizedPnL: 0,
        totalUnrealizedPnLPercentage: 0,
        totalPositions: 0,
        topGainer: null,
        topLoser: null,
        dayChange: 0,
        dayChangePercentage: 0,
      }
    }

    const totalValue = positions.reduce((sum, pos) => sum + pos.value, 0)
    const totalCostBasis = positions.reduce((sum, pos) => sum + pos.costBasis, 0)
    const totalUnrealizedPnL = totalValue - totalCostBasis
    const totalUnrealizedPnLPercentage = totalCostBasis > 0 ? (totalUnrealizedPnL / totalCostBasis) * 100 : 0

    // Find top gainer and loser
    const gainers = positions.filter((pos) => pos.unrealizedPnLPercentage > 0)
    const losers = positions.filter((pos) => pos.unrealizedPnLPercentage < 0)

    const topGainer =
      gainers.length > 0
        ? gainers.reduce((max, pos) => (pos.unrealizedPnLPercentage > max.unrealizedPnLPercentage ? pos : max))
        : null

    const topLoser =
      losers.length > 0
        ? losers.reduce((min, pos) => (pos.unrealizedPnLPercentage < min.unrealizedPnLPercentage ? pos : min))
        : null

    return {
      totalValue,
      totalCostBasis,
      totalUnrealizedPnL,
      totalUnrealizedPnLPercentage,
      totalPositions: positions.length,
      topGainer,
      topLoser,
      dayChange: 0, // Would calculate from historical data
      dayChangePercentage: 0, // Would calculate from historical data
    }
  }

  getPerformanceMetrics(): {
    totalTrades: number
    winRate: number
    averageWin: number
    averageLoss: number
    profitFactor: number
    sharpeRatio: number
  } {
    const completedTrades = this.getCompletedTrades()

    if (completedTrades.length === 0) {
      return {
        totalTrades: 0,
        winRate: 0,
        averageWin: 0,
        averageLoss: 0,
        profitFactor: 0,
        sharpeRatio: 0,
      }
    }

    const wins = completedTrades.filter((trade) => trade.pnl > 0)
    const losses = completedTrades.filter((trade) => trade.pnl < 0)

    const totalWins = wins.reduce((sum, trade) => sum + trade.pnl, 0)
    const totalLosses = Math.abs(losses.reduce((sum, trade) => sum + trade.pnl, 0))

    return {
      totalTrades: completedTrades.length,
      winRate: (wins.length / completedTrades.length) * 100,
      averageWin: wins.length > 0 ? totalWins / wins.length : 0,
      averageLoss: losses.length > 0 ? totalLosses / losses.length : 0,
      profitFactor: totalLosses > 0 ? totalWins / totalLosses : 0,
      sharpeRatio: 0, // Would calculate with proper risk-free rate and volatility
    }
  }

  private getCompletedTrades(): Array<{ pnl: number; duration: number }> {
    // This would analyze buy/sell pairs to determine completed trades
    // For now, return empty array
    return []
  }

  exportData(): {
    positions: Position[]
    transactions: Transaction[]
    summary: PortfolioSummary
    exportDate: number
  } {
    return {
      positions: this.getPositions(),
      transactions: this.getTransactions(),
      summary: this.getPortfolioSummary(),
      exportDate: Date.now(),
    }
  }

  importData(data: {
    positions: Position[]
    transactions: Transaction[]
  }): void {
    this.positions.clear()
    this.transactions = []

    // Import transactions first
    data.transactions.forEach((tx) => {
      this.transactions.push(tx)
    })

    // Import positions
    data.positions.forEach((pos) => {
      this.positions.set(pos.tokenAddress, pos)
    })

    console.log(`Imported ${data.positions.length} positions and ${data.transactions.length} transactions`)
  }

  clearData(): void {
    this.positions.clear()
    this.transactions = []
    console.log("Portfolio data cleared")
  }

  isActive(): boolean {
    return this.isTracking
  }

  getWalletAddress(): string {
    return this.walletAddress
  }

  setWalletAddress(address: string): void {
    this.walletAddress = address.toLowerCase()
    this.clearData()
  }
}
