"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TrendingUp, TrendingDown, DollarSign, Wallet, Activity, RefreshCw, Download, Eye, EyeOff } from "lucide-react"
import type { PortfolioTracker, Position, Transaction, PortfolioSummary } from "@/lib/portfolio-tracker"

interface PortfolioDashboardProps {
  portfolioTracker: PortfolioTracker | null
  isConnected: boolean
}

export function PortfolioDashboard({ portfolioTracker, isConnected }: PortfolioDashboardProps) {
  const [positions, setPositions] = useState<Position[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [summary, setSummary] = useState<PortfolioSummary | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showBalances, setShowBalances] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  // Helper function to safely format numbers
  const safeValue = (value: number | undefined | null): number => {
    return value && !isNaN(value) ? value : 0
  }

  // Helper function to format percentage
  const formatPercentage = (value: number | undefined | null): string => {
    const safeVal = safeValue(value)
    return safeVal.toFixed(2)
  }

  // Helper function to format currency
  const formatCurrency = (value: number | undefined | null): string => {
    const safeVal = safeValue(value)
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(safeVal)
  }

  // Helper function to format token amount
  const formatTokenAmount = (value: string | number | undefined | null): string => {
    if (!value) return "0.00"
    const numValue = typeof value === "string" ? Number.parseFloat(value) : value
    return isNaN(numValue) ? "0.00" : numValue.toFixed(6)
  }

  const refreshData = async () => {
    if (!portfolioTracker || !isConnected) return

    setIsLoading(true)
    try {
      await portfolioTracker.syncWithBlockchain()
      setPositions(portfolioTracker.getPositions())
      setTransactions(portfolioTracker.getTransactions())
      setSummary(portfolioTracker.getPortfolioSummary())
      setLastUpdated(new Date())
    } catch (error) {
      console.error("Failed to refresh portfolio data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const exportTransactions = () => {
    if (!portfolioTracker) return

    const csvData = portfolioTracker.exportToCSV()
    const blob = new Blob([csvData], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `portfolio_transactions_${new Date().toISOString().split("T")[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  useEffect(() => {
    if (portfolioTracker && isConnected) {
      refreshData()
    }
  }, [portfolioTracker, isConnected])

  if (!isConnected) {
    return (
      <Card className="bg-slate-900 border-slate-700">
        <CardContent className="p-8 text-center">
          <Wallet className="h-12 w-12 text-slate-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Connect Your Wallet</h3>
          <p className="text-slate-400">Connect your wallet to view your portfolio and trading history.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-900 to-blue-800 border-blue-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-200 text-sm font-medium">Total Value</p>
                <p className="text-2xl font-bold text-white">
                  {showBalances ? formatCurrency(summary?.totalValueUSD) : "••••••"}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-900 to-green-800 border-green-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-200 text-sm font-medium">Unrealized P&L</p>
                <p className="text-2xl font-bold text-white">
                  {showBalances ? formatCurrency(summary?.totalUnrealizedPnL) : "••••••"}
                </p>
                <p className="text-sm text-green-300">{formatPercentage(summary?.totalUnrealizedPnLPercent)}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-900 to-purple-800 border-purple-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-200 text-sm font-medium">Total Invested</p>
                <p className="text-2xl font-bold text-white">
                  {showBalances ? formatCurrency(summary?.totalInvestedUSD) : "••••••"}
                </p>
              </div>
              <Wallet className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-900 to-orange-800 border-orange-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-200 text-sm font-medium">Gas Fees</p>
                <p className="text-2xl font-bold text-white">
                  {showBalances ? formatCurrency(summary?.totalGasFeesUSD) : "••••••"}
                </p>
              </div>
              <Activity className="h-8 w-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card className="bg-slate-900 border-slate-700">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={refreshData}
                disabled={isLoading}
                variant="outline"
                size="sm"
                className="border-slate-600 text-slate-300 bg-transparent"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                Refresh
              </Button>

              <Button
                onClick={() => setShowBalances(!showBalances)}
                variant="outline"
                size="sm"
                className="border-slate-600 text-slate-300"
              >
                {showBalances ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                {showBalances ? "Hide" : "Show"} Balances
              </Button>

              <Button
                onClick={exportTransactions}
                variant="outline"
                size="sm"
                className="border-slate-600 text-slate-300 bg-transparent"
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>

            {lastUpdated && <p className="text-sm text-slate-400">Last updated: {lastUpdated.toLocaleTimeString()}</p>}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="positions" className="space-y-4">
        <TabsList className="bg-slate-800 border-slate-700">
          <TabsTrigger value="positions" className="data-[state=active]:bg-slate-700">
            Positions ({positions.length})
          </TabsTrigger>
          <TabsTrigger value="transactions" className="data-[state=active]:bg-slate-700">
            Transactions ({transactions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="positions">
          <Card className="bg-slate-900 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Current Positions</CardTitle>
              <CardDescription className="text-slate-400">
                Your current token holdings and their performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              {positions.length === 0 ? (
                <div className="text-center py-8">
                  <Wallet className="h-12 w-12 text-slate-500 mx-auto mb-4" />
                  <p className="text-slate-400">No positions found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700">
                      <TableHead className="text-slate-300">Token</TableHead>
                      <TableHead className="text-slate-300">Balance</TableHead>
                      <TableHead className="text-slate-300">Value</TableHead>
                      <TableHead className="text-slate-300">Avg Buy Price</TableHead>
                      <TableHead className="text-slate-300">Current Price</TableHead>
                      <TableHead className="text-slate-300">P&L</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {positions.map((position) => (
                      <TableRow key={position.tokenAddress} className="border-slate-700">
                        <TableCell>
                          <div>
                            <p className="font-medium text-white">{position.tokenSymbol}</p>
                            <p className="text-sm text-slate-400">{position.tokenName}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {showBalances ? formatTokenAmount(position.balance) : "••••••"}
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {showBalances ? formatCurrency(position.balanceUSD) : "••••••"}
                        </TableCell>
                        <TableCell className="text-slate-300">{formatCurrency(position.averageBuyPrice)}</TableCell>
                        <TableCell className="text-slate-300">{formatCurrency(position.currentPrice)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={safeValue(position.unrealizedPnL) >= 0 ? "default" : "destructive"}
                              className={
                                safeValue(position.unrealizedPnL) >= 0
                                  ? "bg-green-900 text-green-200 border-green-700"
                                  : "bg-red-900 text-red-200 border-red-700"
                              }
                            >
                              {safeValue(position.unrealizedPnL) >= 0 ? (
                                <TrendingUp className="h-3 w-3 mr-1" />
                              ) : (
                                <TrendingDown className="h-3 w-3 mr-1" />
                              )}
                              {showBalances ? formatCurrency(position.unrealizedPnL) : "••••••"}
                            </Badge>
                            <span className="text-sm text-slate-400">
                              ({formatPercentage(position.unrealizedPnLPercent)}%)
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions">
          <Card className="bg-slate-900 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Transaction History</CardTitle>
              <CardDescription className="text-slate-400">Your recent trading activity and transfers</CardDescription>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-slate-500 mx-auto mb-4" />
                  <p className="text-slate-400">No transactions found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700">
                      <TableHead className="text-slate-300">Type</TableHead>
                      <TableHead className="text-slate-300">Token</TableHead>
                      <TableHead className="text-slate-300">Amount</TableHead>
                      <TableHead className="text-slate-300">Price</TableHead>
                      <TableHead className="text-slate-300">Value</TableHead>
                      <TableHead className="text-slate-300">Gas</TableHead>
                      <TableHead className="text-slate-300">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.slice(0, 50).map((tx) => (
                      <TableRow key={tx.hash} className="border-slate-700">
                        <TableCell>
                          <Badge
                            variant={tx.type === "buy" || tx.type === "transfer_in" ? "default" : "secondary"}
                            className={
                              tx.type === "buy" || tx.type === "transfer_in"
                                ? "bg-green-900 text-green-200 border-green-700"
                                : "bg-red-900 text-red-200 border-red-700"
                            }
                          >
                            {tx.type.replace("_", " ").toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-300">{tx.tokenSymbol}</TableCell>
                        <TableCell className="text-slate-300">{formatTokenAmount(tx.amount)}</TableCell>
                        <TableCell className="text-slate-300">{formatCurrency(tx.pricePerToken)}</TableCell>
                        <TableCell className="text-slate-300">
                          {showBalances ? formatCurrency(tx.totalValue) : "••••••"}
                        </TableCell>
                        <TableCell className="text-slate-300">{formatCurrency(tx.gasFeesUSD)}</TableCell>
                        <TableCell className="text-slate-300">{new Date(tx.timestamp).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
