"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { TradingSummary, type TradingSummaryData } from "@/components/trading-summary"
import { PortfolioDashboard } from "@/components/portfolio-dashboard"
import { WalletConnector } from "@/components/wallet-connector"
import {
  Bot,
  Settings,
  Activity,
  Wallet,
  TrendingUp,
  Zap,
  AlertTriangle,
  Play,
  Pause,
  RefreshCw,
  Target,
  DollarSign,
  Clock,
  BarChart3,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface BotConfig {
  isActive: boolean
  targetToken: string
  buyAmount: string
  slippage: string
  gasPrice: string
  maxGasLimit: string
  minLiquidity: string
  honeypotCheck: boolean
  mevProtection: boolean
  autoSell: boolean
  sellPercentage: string
  stopLoss: string
  takeProfit: string
}

interface BotStats {
  totalTrades: number
  successfulTrades: number
  totalProfit: number
  totalLoss: number
  isRunning: boolean
  lastActivity: string
  gasUsed: number
  executionTime: number
}

export default function SniperBotDashboard() {
  const { toast } = useToast()
  const [isConnected, setIsConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState("")
  const [balance, setBalance] = useState("0")
  const [isLoading, setIsLoading] = useState(false)

  const [config, setConfig] = useState<BotConfig>({
    isActive: false,
    targetToken: "",
    buyAmount: "0.1",
    slippage: "12",
    gasPrice: "20",
    maxGasLimit: "500000",
    minLiquidity: "10",
    honeypotCheck: true,
    mevProtection: true,
    autoSell: false,
    sellPercentage: "100",
    stopLoss: "20",
    takeProfit: "50",
  })

  const [stats, setStats] = useState<BotStats>({
    totalTrades: 0,
    successfulTrades: 0,
    totalProfit: 0,
    totalLoss: 0,
    isRunning: false,
    lastActivity: "Never",
    gasUsed: 0,
    executionTime: 0,
  })

  // Mock trading summary data
  const tradingSummaryData: TradingSummaryData = {
    totalTrades: stats.totalTrades,
    successfulTrades: stats.successfulTrades,
    failedTrades: stats.totalTrades - stats.successfulTrades,
    totalVolume: stats.totalProfit + stats.totalLoss,
    totalProfit: stats.totalProfit,
    totalLoss: stats.totalLoss,
    averageGasUsed: stats.gasUsed,
    averageExecutionTime: stats.executionTime,
    successRate: stats.totalTrades > 0 ? (stats.successfulTrades / stats.totalTrades) * 100 : 0,
    profitFactor: stats.totalLoss > 0 ? stats.totalProfit / stats.totalLoss : stats.totalProfit > 0 ? 2.0 : 0,
    largestWin: stats.totalProfit * 0.3,
    largestLoss: stats.totalLoss * 0.4,
    activePositions: 2,
    pendingOrders: 1,
  }

  const handleConfigChange = (key: keyof BotConfig, value: string | boolean) => {
    setConfig((prev) => ({ ...prev, [key]: value }))
  }

  const handleStartBot = async () => {
    if (!isConnected) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet first",
        variant: "destructive",
      })
      return
    }

    if (!config.targetToken) {
      toast({
        title: "Missing Configuration",
        description: "Please enter a target token address",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      // Simulate bot start
      await new Promise((resolve) => setTimeout(resolve, 2000))

      setConfig((prev) => ({ ...prev, isActive: true }))
      setStats((prev) => ({ ...prev, isRunning: true, lastActivity: new Date().toLocaleString() }))

      toast({
        title: "Bot Started",
        description: "Sniper bot is now active and monitoring for opportunities",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start bot. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleStopBot = async () => {
    setIsLoading(true)
    try {
      // Simulate bot stop
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setConfig((prev) => ({ ...prev, isActive: false }))
      setStats((prev) => ({ ...prev, isRunning: false }))

      toast({
        title: "Bot Stopped",
        description: "Sniper bot has been deactivated",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to stop bot. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefreshStats = () => {
    // Simulate stats refresh with random data
    setStats((prev) => ({
      ...prev,
      totalTrades: Math.floor(Math.random() * 50) + prev.totalTrades,
      successfulTrades: Math.floor(Math.random() * 30) + prev.successfulTrades,
      totalProfit: Math.random() * 1000 + prev.totalProfit,
      totalLoss: Math.random() * 200 + prev.totalLoss,
      gasUsed: Math.floor(Math.random() * 100000) + 200000,
      executionTime: Math.random() * 5 + 1,
      lastActivity: new Date().toLocaleString(),
    }))
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Bot className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Uniswap Sniper Bot</h1>
              <p className="text-muted-foreground">Advanced MEV-protected trading automation</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={config.isActive ? "default" : "secondary"} className="px-3 py-1">
              {config.isActive ? (
                <>
                  <Zap className="h-3 w-3 mr-1" />
                  Active
                </>
              ) : (
                <>
                  <Pause className="h-3 w-3 mr-1" />
                  Inactive
                </>
              )}
            </Badge>
            {isConnected && (
              <Badge variant="outline" className="px-3 py-1">
                <Wallet className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            )}
          </div>
        </div>

        {/* Wallet Connection */}
        <WalletConnector
          isConnected={isConnected}
          walletAddress={walletAddress}
          balance={balance}
          onConnect={(address, bal) => {
            setIsConnected(true)
            setWalletAddress(address)
            setBalance(bal)
          }}
          onDisconnect={() => {
            setIsConnected(false)
            setWalletAddress("")
            setBalance("0")
          }}
        />

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Trades</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTrades}</div>
              <p className="text-xs text-muted-foreground">{stats.successfulTrades} successful</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${(stats.totalProfit - stats.totalLoss) >= 0 ? "text-green-600" : "text-red-600"}`}
              >
                ${(stats.totalProfit - stats.totalLoss).toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">Total P&L</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalTrades > 0 ? ((stats.successfulTrades / stats.totalTrades) * 100).toFixed(1) : 0}%
              </div>
              <Progress
                value={stats.totalTrades > 0 ? (stats.successfulTrades / stats.totalTrades) * 100 : 0}
                className="mt-2"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last Activity</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium">{stats.lastActivity}</div>
              <p className="text-xs text-muted-foreground">Status: {stats.isRunning ? "Running" : "Stopped"}</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="dashboard" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard">
              <BarChart3 className="h-4 w-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="config">
              <Settings className="h-4 w-4 mr-2" />
              Configuration
            </TabsTrigger>
            <TabsTrigger value="portfolio">
              <Wallet className="h-4 w-4 mr-2" />
              Portfolio
            </TabsTrigger>
            <TabsTrigger value="activity">
              <Activity className="h-4 w-4 mr-2" />
              Activity
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-4">
            <TradingSummary data={tradingSummaryData} isLoading={isLoading} onRefresh={handleRefreshStats} />
          </TabsContent>

          <TabsContent value="config" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Trading Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle>Trading Settings</CardTitle>
                  <CardDescription>Configure your trading parameters</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="targetToken">Target Token Address</Label>
                    <Input
                      id="targetToken"
                      placeholder="0x..."
                      value={config.targetToken}
                      onChange={(e) => handleConfigChange("targetToken", e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="buyAmount">Buy Amount (ETH)</Label>
                      <Input
                        id="buyAmount"
                        type="number"
                        step="0.01"
                        value={config.buyAmount}
                        onChange={(e) => handleConfigChange("buyAmount", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="slippage">Slippage (%)</Label>
                      <Input
                        id="slippage"
                        type="number"
                        value={config.slippage}
                        onChange={(e) => handleConfigChange("slippage", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="gasPrice">Gas Price (Gwei)</Label>
                      <Input
                        id="gasPrice"
                        type="number"
                        value={config.gasPrice}
                        onChange={(e) => handleConfigChange("gasPrice", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxGasLimit">Max Gas Limit</Label>
                      <Input
                        id="maxGasLimit"
                        type="number"
                        value={config.maxGasLimit}
                        onChange={(e) => handleConfigChange("maxGasLimit", e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Security & Protection */}
              <Card>
                <CardHeader>
                  <CardTitle>Security & Protection</CardTitle>
                  <CardDescription>Enable safety features</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Honeypot Detection</Label>
                      <p className="text-sm text-muted-foreground">Automatically detect and avoid honeypot tokens</p>
                    </div>
                    <Switch
                      checked={config.honeypotCheck}
                      onCheckedChange={(checked) => handleConfigChange("honeypotCheck", checked)}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>MEV Protection</Label>
                      <p className="text-sm text-muted-foreground">Protect against MEV attacks and front-running</p>
                    </div>
                    <Switch
                      checked={config.mevProtection}
                      onCheckedChange={(checked) => handleConfigChange("mevProtection", checked)}
                    />
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor="minLiquidity">Minimum Liquidity (ETH)</Label>
                    <Input
                      id="minLiquidity"
                      type="number"
                      step="0.1"
                      value={config.minLiquidity}
                      onChange={(e) => handleConfigChange("minLiquidity", e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Auto-Sell Configuration */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Auto-Sell Settings</CardTitle>
                  <CardDescription>Configure automatic selling parameters</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Enable Auto-Sell</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically sell tokens based on profit/loss thresholds
                      </p>
                    </div>
                    <Switch
                      checked={config.autoSell}
                      onCheckedChange={(checked) => handleConfigChange("autoSell", checked)}
                    />
                  </div>

                  {config.autoSell && (
                    <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                      <div className="space-y-2">
                        <Label htmlFor="sellPercentage">Sell Percentage (%)</Label>
                        <Input
                          id="sellPercentage"
                          type="number"
                          value={config.sellPercentage}
                          onChange={(e) => handleConfigChange("sellPercentage", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="stopLoss">Stop Loss (%)</Label>
                        <Input
                          id="stopLoss"
                          type="number"
                          value={config.stopLoss}
                          onChange={(e) => handleConfigChange("stopLoss", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="takeProfit">Take Profit (%)</Label>
                        <Input
                          id="takeProfit"
                          type="number"
                          value={config.takeProfit}
                          onChange={(e) => handleConfigChange("takeProfit", e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center gap-4">
              {!config.isActive ? (
                <Button
                  onClick={handleStartBot}
                  disabled={isLoading || !isConnected}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isLoading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
                  Start Bot
                </Button>
              ) : (
                <Button onClick={handleStopBot} disabled={isLoading} variant="destructive">
                  {isLoading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Pause className="h-4 w-4 mr-2" />}
                  Stop Bot
                </Button>
              )}

              <Button variant="outline" onClick={handleRefreshStats}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Stats
              </Button>
            </div>

            {!isConnected && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Please connect your wallet to start trading. The bot requires wallet access to execute transactions.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="portfolio" className="space-y-4">
            <PortfolioDashboard />
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest bot actions and transactions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No recent activity</p>
                  <p className="text-sm">Start the bot to see trading activity here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
