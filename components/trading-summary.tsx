"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { RefreshCw, TrendingUp, TrendingDown, Activity, DollarSign, Target } from "lucide-react"

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
          <h2 className="text-2xl font-bold text-white">Trading Dashboard</h2>
          <p className="text-gray-400">Performance metrics and analytics</p>
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
              <Badge className="bg-green-500 text-white text-xs">{data.successfulTrades} Success</Badge>
              <Badge className="bg-red-500 text-white text-xs">{data.failedTrades} Failed</Badge>
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

      {/* Detailed Metrics */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Performance Metrics */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Performance Metrics</CardTitle>
            <CardDescription className="text-gray-400">Detailed trading performance</CardDescription>
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
              <span className="text-gray-300">Avg Gas Used</span>
              <span className="text-white font-bold">{data.averageGasUsed.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Avg Execution Time</span>
              <span className="text-white font-bold">{data.averageExecutionTime.toFixed(2)}s</span>
            </div>
          </CardContent>
        </Card>

        {/* Current Status */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Current Status</CardTitle>
            <CardDescription className="text-gray-400">Active positions and orders</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Active Positions</span>
              <Badge className="bg-blue-500 text-white">{data.activePositions}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Pending Orders</span>
              <Badge className="bg-yellow-500 text-white">{data.pendingOrders}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Win Rate</span>
              <div className="flex items-center gap-2">
                <Progress value={data.successRate} className="w-20 h-2" />
                <span className="text-white font-bold text-sm">{data.successRate.toFixed(0)}%</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Status</span>
              <Badge className="bg-green-500 text-white">
                <div className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse"></div>
                Active
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Quick Statistics</CardTitle>
          <CardDescription className="text-gray-400">At-a-glance performance overview</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{data.successfulTrades}</div>
              <div className="text-sm text-gray-400">Successful</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">{data.failedTrades}</div>
              <div className="text-sm text-gray-400">Failed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{data.activePositions}</div>
              <div className="text-sm text-gray-400">Active</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">{data.pendingOrders}</div>
              <div className="text-sm text-gray-400">Pending</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
