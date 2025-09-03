"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  Activity,
  RefreshCw,
  Download,
  Eye,
  EyeOff,
} from "lucide-react"
import type { PortfolioTracker, Position, PortfolioSummary } from "@/lib/portfolio-tracker"

interface PortfolioDashboardProps {
  portfolioTracker: PortfolioTracker | null
}

export function PortfolioDashboard({ portfolioTracker }: PortfolioDashboardProps) {
  const [summary, setSummary] = useState<PortfolioSummary>({
    totalValue: 0,
    totalCostBasis: 0,
    totalUnrealizedPnL: 0,
    totalUnrealizedPnLPercentage: 0,
    totalPositions: 0,
    topGainer: null,
    topLoser: null,
    dayChange: 0,
    dayChangePercentage: 0,
  })
  const [positions, setPositions] = useState<Position[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hideBalances, setHideBalances] = useState(false)

  useEffect(() => {
    if (portfolioTracker?.isActive()) {
      updatePortfolioData()

      // Set up periodic updates
      const interval = setInterval(updatePortfolioData, 30000) // Update every 30 seconds
      return () => clearInterval(interval)
    }
  }, [portfolioTracker])

  const updatePortfolioData = async () => {
    if (!portfolioTracker) return

    setIsLoading(true)
    try {
      await portfolioTracker.updatePositions()
      const newSummary = portfolioTracker.getPortfolioSummary()
      const newPositions = portfolioTracker.getPositions()

      setSummary(newSummary)
      setPositions(newPositions)
    } catch (error) {
      console.error("Error updating portfolio data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (value: number): string => {
    if (hideBalances) return "****"
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }

  const formatPercentage = (value: number): string => {
    if (hideBalances) return "**%"
    return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`
  }

  const formatTokenAmount = (amount: string, decimals = 18): string => {
    if (hideBalances) return "****"
    const value = Number.parseFloat(amount)
    if (value === 0) return "0"
    if (value < 0.001) return "<0.001"
    return value.toFixed(6)
  }

  const exportPortfolioData = () => {
    if (!portfolioTracker) return

    const data = portfolioTracker.exportData()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `portfolio-export-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (!portfolioTracker) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <PieChart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Portfolio tracker not initialized</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Portfolio Dashboard</h2>
          <p className="text-muted-foreground">Track your trading performance and positions</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setHideBalances(!hideBalances)}>
            {hideBalances ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </Button>
          <Button variant="outline" size="sm" onClick={exportPortfolioData}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={updatePortfolioData} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.totalValue)}</div>
            <p className="text-xs text-muted-foreground">Cost basis: {formatCurrency(summary.totalCostBasis)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unrealized P&L</CardTitle>
            {summary.totalUnrealizedPnL >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${summary.totalUnrealizedPnL >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              {formatCurrency(summary.totalUnrealizedPnL)}
            </div>
            <p className={`text-xs ${summary.totalUnrealizedPnLPercentage >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatPercentage(summary.totalUnrealizedPnLPercentage)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Positions</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalPositions}</div>
            <p className="text-xs text-muted-foreground">Active positions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Day Change</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${summary.dayChange >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatCurrency(summary.dayChange)}
            </div>
            <p className={`text-xs ${summary.dayChangePercentage >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatPercentage(summary.dayChangePercentage)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers */}
      {(summary.topGainer || summary.topLoser) && (
        <div className="grid gap-4 md:grid-cols-2">
          {summary.topGainer && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-green-600">Top Gainer</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{summary.topGainer.symbol}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatTokenAmount(summary.topGainer.balance)} tokens
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-green-600">
                      {formatPercentage(summary.topGainer.unrealizedPnLPercentage || 0)}
                    </p>
                    <p className="text-sm text-green-600">{formatCurrency(summary.topGainer.unrealizedPnL || 0)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {summary.topLoser && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-red-600">Top Loser</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{summary.topLoser.symbol}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatTokenAmount(summary.topLoser.balance)} tokens
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-red-600">
                      {formatPercentage(summary.topLoser.unrealizedPnLPercentage || 0)}
                    </p>
                    <p className="text-sm text-red-600">{formatCurrency(summary.topLoser.unrealizedPnL || 0)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Positions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Positions</CardTitle>
          <CardDescription>Your current token positions and performance</CardDescription>
        </CardHeader>
        <CardContent>
          {positions.length === 0 ? (
            <div className="text-center py-8">
              <PieChart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No positions found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {positions.map((position) => (
                <div key={position.tokenAddress} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{position.symbol}</h3>
                      <Badge variant="outline" className="text-xs">
                        {position.name}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatTokenAmount(position.balance, position.decimals)} tokens
                    </p>
                  </div>

                  <div className="flex-1 text-center">
                    <p className="font-medium">{formatCurrency(position.price)}</p>
                    <p className="text-sm text-muted-foreground">Current Price</p>
                  </div>

                  <div className="flex-1 text-center">
                    <p className="font-medium">{formatCurrency(position.value)}</p>
                    <p className="text-sm text-muted-foreground">Market Value</p>
                  </div>

                  <div className="flex-1 text-center">
                    <p className="font-medium">{formatCurrency(position.costBasis)}</p>
                    <p className="text-sm text-muted-foreground">Cost Basis</p>
                  </div>

                  <div className="flex-1 text-right">
                    <p
                      className={`font-medium ${
                        (position.unrealizedPnL || 0) >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {formatCurrency(position.unrealizedPnL || 0)}
                    </p>
                    <p
                      className={`text-sm ${
                        (position.unrealizedPnLPercentage || 0) >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {formatPercentage(position.unrealizedPnLPercentage || 0)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
