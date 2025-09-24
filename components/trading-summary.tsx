"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, TrendingDown, Activity, Clock, Target, Zap, BarChart3, RefreshCw, DollarSign } from "lucide-react"

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
  data?: TradingSummaryData
  isLoading?: boolean
  onRefresh?: () => void
}

const defaultData: TradingSummaryData = {
  totalTrades: 0,
  successfulTrades: 0,
  failedTrades: 0,
  totalVolume: 0,
  totalProfit: 0,
  totalLoss: 0,
  averageGasUsed: 250000,
  averageExecutionTime: 2.5,
  successRate: 0,
  profitFactor: 0,
  largestWin: 0,
  largestLoss: 0,
  activePositions: 0,
  pendingOrders: 0,
}

export function TradingSummary({ data = defaultData, isLoading = false, onRefresh }: TradingSummaryProps) {
  const safeData = { ...defaultData, ...data }
  const netProfit = safeData.totalProfit - safeData.totalLoss
  const isProfit = netProfit >= 0

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    }).format(value)
  }

  const formatETH = (value: number) => {
    return `${value.toFixed(6)} ETH`
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-400" />
              Trading Summary
            </CardTitle>
            <CardDescription className="text-gray-400">Performance metrics and trading statistics</CardDescription>
          </div>
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
              className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 bg-blue-500/20 rounded-lg border border-blue-400/30">
              <Activity className="h-6 w-6 text-blue-400" />
            </div>
            <p className="text-2xl font-bold text-white">{safeData.totalTrades}</p>
            <p className="text-sm text-gray-400">Total Trades</p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 bg-green-500/20 rounded-lg border border-green-400/30">
              <TrendingUp className="h-6 w-6 text-green-400" />
            </div>
            <p className="text-2xl font-bold text-green-400">{safeData.successfulTrades}</p>
            <p className="text-sm text-gray-400">Successful</p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 bg-red-500/20 rounded-lg border border-red-400/30">
              <TrendingDown className="h-6 w-6 text-red-400" />
            </div>
            <p className="text-2xl font-bold text-red-400">{safeData.failedTrades}</p>
            <p className="text-sm text-gray-400">Failed</p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 bg-purple-500/20 rounded-lg border border-purple-400/30">
              <Target className="h-6 w-6 text-purple-400" />
            </div>
            <p className="text-2xl font-bold text-purple-400">{safeData.activePositions}</p>
            <p className="text-sm text-gray-400">Active Positions</p>
          </div>
        </div>

        {/* Success Rate */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Success Rate</span>
            <span className="text-sm font-semibold text-white">{formatPercentage(safeData.successRate)}</span>
          </div>
          <Progress value={safeData.successRate} className="h-2" />
        </div>

        {/* Financial Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <h4 className="text-white font-semibold flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-400" />
              Financial Performance
            </h4>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Total Volume</span>
                <span className="text-sm font-semibold text-white">{formatETH(safeData.totalVolume)}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Total Profit</span>
                <span className="text-sm font-semibold text-green-400">+{formatETH(safeData.totalProfit)}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Total Loss</span>
                <span className="text-sm font-semibold text-red-400">-{formatETH(safeData.totalLoss)}</span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-600">
                <span className="text-sm font-semibold text-gray-300">Net P&L</span>
                <span className={`text-sm font-bold ${isProfit ? "text-green-400" : "text-red-400"}`}>
                  {isProfit ? "+" : ""}
                  {formatETH(netProfit)}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-white font-semibold flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-400" />
              Performance Metrics
            </h4>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Profit Factor</span>
                <span className="text-sm font-semibold text-white">{safeData.profitFactor.toFixed(2)}x</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Largest Win</span>
                <span className="text-sm font-semibold text-green-400">+{formatETH(safeData.largestWin)}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Largest Loss</span>
                <span className="text-sm font-semibold text-red-400">-{formatETH(safeData.largestLoss)}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Avg Gas Used</span>
                <span className="text-sm font-semibold text-white">{safeData.averageGasUsed.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Status Badges */}
        <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-600">
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-400/30">
            <Clock className="h-3 w-3 mr-1" />
            Avg: {safeData.averageExecutionTime}s
          </Badge>

          {safeData.pendingOrders > 0 && (
            <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-400/30">
              {safeData.pendingOrders} Pending
            </Badge>
          )}

          {safeData.activePositions > 0 && (
            <Badge className="bg-green-500/20 text-green-400 border-green-400/30">
              {safeData.activePositions} Active
            </Badge>
          )}

          <Badge
            className={`${isProfit ? "bg-green-500/20 text-green-400 border-green-400/30" : "bg-red-500/20 text-red-400 border-red-400/30"}`}
          >
            {isProfit ? "Profitable" : "Loss"}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}
