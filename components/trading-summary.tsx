"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  TrendingUp,
  TrendingDown,
  Activity,
  DollarSign,
  Target,
  Clock,
  Zap,
  RefreshCw,
  BarChart3,
  AlertCircle,
} from "lucide-react"

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

function safeValue(value: any, defaultValue = 0): number {
  if (value === null || value === undefined || isNaN(Number(value))) {
    return defaultValue
  }
  return Number(value)
}

function formatCurrency(amount: number): string {
  const safeAmount = safeValue(amount, 0)
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safeAmount)
}

function formatPercentage(value: number): string {
  const safeVal = safeValue(value, 0)
  return `${safeVal.toFixed(2)}%`
}

function formatNumber(value: number, decimals = 0): string {
  const safeVal = safeValue(value, 0)
  return safeVal.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

export function TradingSummary({ data, isLoading = false, onRefresh }: TradingSummaryProps) {
  const netProfit = safeValue(data.totalProfit, 0) - safeValue(data.totalLoss, 0)
  const netProfitPercentage =
    safeValue(data.totalVolume, 0) > 0 ? (netProfit / safeValue(data.totalVolume, 1)) * 100 : 0

  const winRate =
    safeValue(data.totalTrades, 0) > 0
      ? (safeValue(data.successfulTrades, 0) / safeValue(data.totalTrades, 1)) * 100
      : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Trading Summary</h2>
          <p className="text-muted-foreground">Overview of your trading performance</p>
        </div>
        {onRefresh && (
          <Button variant="outline" onClick={onRefresh} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        )}
      </div>

      {/* Key Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Trades</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(safeValue(data.totalTrades))}</div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <span className="text-green-600">{formatNumber(safeValue(data.successfulTrades))} wins</span>
              <span>•</span>
              <span className="text-red-600">{formatNumber(safeValue(data.failedTrades))} losses</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net P&L</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatCurrency(netProfit)}
            </div>
            <div className="flex items-center space-x-1 text-xs">
              {netProfit >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-600" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-600" />
              )}
              <span className={netProfit >= 0 ? "text-green-600" : "text-red-600"}>
                {formatPercentage(netProfitPercentage)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(winRate)}</div>
            <Progress value={winRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Execution</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(safeValue(data.averageExecutionTime), 2)}s</div>
            <p className="text-xs text-muted-foreground">Gas: {formatNumber(safeValue(data.averageGasUsed))} gwei</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Statistics */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Total Volume</span>
              <span className="font-bold">{formatCurrency(safeValue(data.totalVolume))}</span>
            </div>
            <Separator />

            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Total Profit</span>
              <span className="font-bold text-green-600">{formatCurrency(safeValue(data.totalProfit))}</span>
            </div>
            <Separator />

            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Total Loss</span>
              <span className="font-bold text-red-600">-{formatCurrency(safeValue(data.totalLoss))}</span>
            </div>
            <Separator />

            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Profit Factor</span>
              <Badge variant={safeValue(data.profitFactor) >= 1 ? "default" : "destructive"}>
                {formatNumber(safeValue(data.profitFactor), 2)}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Trade Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Largest Win</span>
              <span className="font-bold text-green-600">{formatCurrency(safeValue(data.largestWin))}</span>
            </div>
            <Separator />

            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Largest Loss</span>
              <span className="font-bold text-red-600">-{formatCurrency(Math.abs(safeValue(data.largestLoss)))}</span>
            </div>
            <Separator />

            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Active Positions</span>
              <Badge variant="outline">{formatNumber(safeValue(data.activePositions))}</Badge>
            </div>
            <Separator />

            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Pending Orders</span>
              <Badge variant="secondary">{formatNumber(safeValue(data.pendingOrders))}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Indicators */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Current Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center space-x-2">
              <div
                className={`w-2 h-2 rounded-full ${safeValue(data.activePositions) > 0 ? "bg-green-500" : "bg-gray-400"}`}
              />
              <span className="text-sm">
                {safeValue(data.activePositions) > 0 ? "Active Trading" : "No Active Positions"}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <div
                className={`w-2 h-2 rounded-full ${safeValue(data.pendingOrders) > 0 ? "bg-yellow-500" : "bg-gray-400"}`}
              />
              <span className="text-sm">
                {safeValue(data.pendingOrders) > 0 ? "Orders Pending" : "No Pending Orders"}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${winRate >= 50 ? "bg-green-500" : "bg-red-500"}`} />
              <span className="text-sm">{winRate >= 50 ? "Profitable Strategy" : "Strategy Needs Review"}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default TradingSummary
