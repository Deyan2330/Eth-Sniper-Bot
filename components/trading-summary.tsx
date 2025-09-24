"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { RefreshCw, TrendingUp, TrendingDown, Activity, DollarSign, Zap, Target } from "lucide-react"

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
  const netProfit = data.totalProfit - data.totalLoss
  const isProfit = netProfit >= 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Trading Performance</h2>
          <p className="text-gray-400">Real-time trading statistics and analytics</p>
        </div>
        {onRefresh && (
          <Button
            variant="outline"
            onClick={onRefresh}
            disabled={isLoading}
            className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        )}
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Total Trades</CardTitle>
            <Activity className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{data.totalTrades}</div>
            <div className="flex items-center gap-2 mt-1">
              <Badge className="bg-green-500/20 text-green-400 text-xs">{data.successfulTrades} successful</Badge>
              <Badge className="bg-red-500/20 text-red-400 text-xs">{data.failedTrades} failed</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Net P&L</CardTitle>
            {isProfit ? (
              <TrendingUp className="h-4 w-4 text-green-400" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-400" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${isProfit ? "text-green-400" : "text-red-400"}`}>
              {isProfit ? "+" : ""}
              {netProfit.toFixed(4)} ETH
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Profit: {data.totalProfit.toFixed(4)} ETH | Loss: {data.totalLoss.toFixed(4)} ETH
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Success Rate</CardTitle>
            <Target className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{data.successRate.toFixed(1)}%</div>
            <Progress value={data.successRate} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Volume</CardTitle>
            <DollarSign className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{data.totalVolume.toFixed(4)} ETH</div>
            <p className="text-xs text-gray-400 mt-1">Total trading volume</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Stats */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Performance Metrics</CardTitle>
            <CardDescription className="text-gray-400">Key trading performance indicators</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Profit Factor</span>
              <span className="text-white font-bold">{data.profitFactor.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Largest Win</span>
              <span className="text-green-400 font-bold">+{data.largestWin.toFixed(4)} ETH</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Largest Loss</span>
              <span className="text-red-400 font-bold">-{data.largestLoss.toFixed(4)} ETH</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Avg. Execution Time</span>
              <span className="text-white font-bold">{data.averageExecutionTime.toFixed(2)}s</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Current Status</CardTitle>
            <CardDescription className="text-gray-400">Active positions and pending orders</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Active Positions</span>
              <Badge className="bg-blue-500/20 text-blue-400">{data.activePositions}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Pending Orders</span>
              <Badge className="bg-yellow-500/20 text-yellow-400">{data.pendingOrders}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Avg. Gas Used</span>
              <div className="flex items-center gap-1">
                <Zap className="h-3 w-3 text-orange-400" />
                <span className="text-white font-bold">{data.averageGasUsed.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
