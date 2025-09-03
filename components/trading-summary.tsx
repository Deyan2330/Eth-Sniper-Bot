"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, TrendingDown, Target, Clock, DollarSign, Activity, Zap, AlertTriangle } from "lucide-react"

export interface TradingSummaryData {
  totalTrades: number
  successfulTrades: number
  failedTrades: number
  totalVolume: number
  totalProfit: number
  totalLoss: number
  averageGasUsed: number
  averageExecutionTime: number
  successRate: number
  profitFactor: number
  largestWin: number
  largestLoss: number
  activePositions: number
  pendingOrders: number
}

interface TradingSummaryProps {
  data: TradingSummaryData
  isLoading?: boolean
  onRefresh?: () => void
}

export function TradingSummary({ data, isLoading = false, onRefresh }: TradingSummaryProps) {
  const [timeframe, setTimeframe] = useState<"24h" | "7d" | "30d" | "all">("24h")

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }

  const formatPercentage = (value: number): string => {
    return `${value.toFixed(2)}%`
  }

  const formatNumber = (value: number): string => {
    return new Intl.NumberFormat("en-US").format(value)
  }

  const netProfit = data.totalProfit - data.totalLoss
  const netProfitPercentage = data.totalVolume > 0 ? (netProfit / data.totalVolume) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Trading Summary</h2>
          <p className="text-muted-foreground">Overview of your trading performance</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            {["24h", "7d", "30d", "all"].map((period) => (
              <Button
                key={period}
                variant={timeframe === period ? "default" : "outline"}
                size="sm"
                onClick={() => setTimeframe(period as any)}
              >
                {period}
              </Button>
            ))}
          </div>
          {onRefresh && (
            <Button variant="outline" size="sm" onClick={onRefresh} disabled={isLoading}>
              <Activity className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          )}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Trades</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(data.totalTrades)}</div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs">
                {formatNumber(data.successfulTrades)} successful
              </Badge>
              <Badge variant="destructive" className="text-xs">
                {formatNumber(data.failedTrades)} failed
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            {data.successRate >= 50 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${data.successRate >= 50 ? "text-green-600" : "text-red-600"}`}>
              {formatPercentage(data.successRate)}
            </div>
            <Progress
              value={data.successRate}
              className="mt-2"
              // @ts-ignore
              indicatorClassName={data.successRate >= 50 ? "bg-green-600" : "bg-red-600"}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net P&L</CardTitle>
            {netProfit >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatCurrency(netProfit)}
            </div>
            <p className={`text-xs ${netProfitPercentage >= 0 ? "text-green-600" : "text-red-600"}`}>
              {netProfitPercentage >= 0 ? "+" : ""}
              {formatPercentage(netProfitPercentage)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.totalVolume)}</div>
            <p className="text-xs text-muted-foreground">Across {formatNumber(data.totalTrades)} trades</p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Profit Factor</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-xl font-bold ${data.profitFactor >= 1 ? "text-green-600" : "text-red-600"}`}>
              {data.profitFactor.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Gross profit / Gross loss</p>
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-sm">
                <span>Gross Profit:</span>
                <span className="text-green-600">{formatCurrency(data.totalProfit)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Gross Loss:</span>
                <span className="text-red-600">{formatCurrency(data.totalLoss)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Best & Worst</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Largest Win:</span>
                <span className="font-medium text-green-600">{formatCurrency(data.largestWin)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Largest Loss:</span>
                <span className="font-medium text-red-600">{formatCurrency(data.largestLoss)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Efficiency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Avg Gas Used:</span>
                <span className="font-medium">{formatNumber(data.averageGasUsed)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Avg Execution:</span>
                <span className="font-medium">{data.averageExecutionTime.toFixed(2)}s</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Status */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Active Positions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(data.activePositions)}</div>
            <p className="text-xs text-muted-foreground">Currently held positions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pending Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(data.pendingOrders)}</div>
            <p className="text-xs text-muted-foreground">Awaiting execution</p>
            {data.pendingOrders > 0 && (
              <Badge variant="outline" className="mt-2">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Monitor closely
              </Badge>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Trading Tips */}
      {data.successRate < 50 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-yellow-800 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Performance Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-yellow-700">
              Your success rate is below 50%. Consider reviewing your trading strategy, adjusting risk parameters, or
              enabling additional safety features.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
