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
import { TradingSummary, type TradingSummaryData } from "@/components/trading-summary"
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
  BarChart3,
  Globe,
  Timer,
  Database,
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

interface PoolData {
  id: string
  tokenA: string
  tokenB: string
  address: string
  blockHeight: number
  feeTier: string
  timestamp: string
  isLive: boolean
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

  // Mock pool data similar to the screenshot
  const [poolsDetected] = useState<PoolData[]>([
    {
      id: "1",
      tokenA: "MONO",
      tokenB: "INU",
      address: "0x37a4E774c01AaE120Ec82593F9167ffc0250a77b",
      blockHeight: 0,
      feeTier: "1%",
      timestamp: "11:25:45 PM",
      isLive: true,
    },
    {
      id: "2",
      tokenA: "WETH",
      tokenB: "MHC",
      address: "0x0e51bFec105be766AF1c992923F2992F83b30481C",
      blockHeight: 0,
      feeTier: "1%",
      timestamp: "11:25:31 PM",
      isLive: true,
    },
  ])

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
    <div className="min-h-screen bg-gradient-blue">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-accent/20 rounded-lg border border-blue-accent/30">
              <Bot className="h-6 w-6 text-blue-bright" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white">Uniswap Sniper Bot</h1>
              <p className="text-blue-bright/80">Advanced MEV-protected trading automation</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant={config.isActive ? "default" : "secondary"}
              className={`px-3 py-1 ${config.isActive ? "bg-green-live text-white" : "bg-gray-600 text-gray-200"}`}
            >
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
              <Badge variant="outline" className="px-3 py-1 border-blue-accent text-blue-bright">
                <Wallet className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            )}
          </div>
        </div>

        {/* Status Cards - matching the screenshot */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="status-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">System Status</CardTitle>
              <div className="w-2 h-2 bg-green-live rounded-full animate-pulse-blue"></div>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-white flex items-center gap-2">
                <div className="w-2 h-2 bg-green-live rounded-full"></div>
                Connected
              </div>
            </CardContent>
          </Card>

          <Card className="status-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Pools Detected</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-live" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{poolsDetected.length}</div>
              <p className="text-xs text-green-live">+5 recent</p>
            </CardContent>
          </Card>

          <Card className="status-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Network</CardTitle>
              <Globe className="h-4 w-4 text-blue-bright" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-white">Base Mainnet</div>
              <p className="text-xs text-blue-bright">Uniswap V3</p>
            </CardContent>
          </Card>

          <Card className="status-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Runtime</CardTitle>
              <Timer className="h-4 w-4 text-purple-fee" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-white">0h 4m</div>
              <p className="text-xs text-gray-400">3s ago</p>
            </CardContent>
          </Card>
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

        {/* Main Content */}
        <Tabs defaultValue="live-pools" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 bg-blue-card/50 border border-blue-accent/20">
            <TabsTrigger
              value="dashboard"
              className="data-[state=active]:bg-blue-accent data-[state=active]:text-white"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="config" className="data-[state=active]:bg-blue-accent data-[state=active]:text-white">
              <Settings className="h-4 w-4 mr-2" />
              Configuration
            </TabsTrigger>
            <TabsTrigger
              value="live-pools"
              className="data-[state=active]:bg-blue-accent data-[state=active]:text-white active-tab"
            >
              <Database className="h-4 w-4 mr-2" />
              Live Pools
            </TabsTrigger>
            <TabsTrigger value="activity" className="data-[state=active]:bg-blue-accent data-[state=active]:text-white">
              <Activity className="h-4 w-4 mr-2" />
              System Logs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="live-pools" className="space-y-4">
            <Card className="pool-card">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Database className="h-5 w-5 text-blue-bright" />
                  <div>
                    <CardTitle className="text-white">Live Pool Detection System</CardTitle>
                    <CardDescription className="text-gray-400">
                      Real-time Uniswap V3 pool discovery and analysis
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {poolsDetected.map((pool, index) => (
                  <Card key={pool.id} className="pool-card">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Badge className="live-badge">
                            <div className="w-2 h-2 bg-white rounded-full mr-1"></div>
                            LIVE #{index + 1}
                          </Badge>
                          <Badge className="fee-tier-badge">{pool.feeTier} Fee Tier</Badge>
                        </div>
                        <span className="text-xs text-gray-400">{pool.timestamp}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <p className="text-sm text-blue-bright font-medium mb-1">Token A:</p>
                          <p className="text-white font-bold text-lg">{pool.tokenA}</p>
                        </div>
                        <div>
                          <p className="text-sm text-blue-bright font-medium mb-1">Token B:</p>
                          <p className="text-white font-bold text-lg">{pool.tokenB}</p>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-600">
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <p className="text-sm text-blue-bright font-medium mb-1">Pool Address:</p>
                            <div className="flex items-center gap-2">
                              <p className="text-gray-300 font-mono text-sm">{pool.address}</p>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0 text-blue-bright hover:bg-blue-accent/20"
                              >
                                <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"></path>
                                  <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z"></path>
                                </svg>
                              </Button>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm text-blue-bright font-medium mb-1">Block Height:</p>
                            <p className="text-white font-bold">#{pool.blockHeight}</p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-600">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">TX: ...</span>
                          <span className="text-xs text-green-live">16s ago</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dashboard" className="space-y-4">
            <TradingSummary data={tradingSummaryData} isLoading={isLoading} onRefresh={handleRefreshStats} />
          </TabsContent>

          <TabsContent value="config" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Trading Configuration */}
              <Card className="status-card">
                <CardHeader>
                  <CardTitle className="text-white">Trading Settings</CardTitle>
                  <CardDescription className="text-gray-400">Configure your trading parameters</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="targetToken" className="text-gray-300">
                      Target Token Address
                    </Label>
                    <Input
                      id="targetToken"
                      placeholder="0x..."
                      value={config.targetToken}
                      onChange={(e) => handleConfigChange("targetToken", e.target.value)}
                      className="bg-blue-dark/50 border-blue-accent/30 text-white placeholder:text-gray-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="buyAmount" className="text-gray-300">
                        Buy Amount (ETH)
                      </Label>
                      <Input
                        id="buyAmount"
                        type="number"
                        step="0.01"
                        value={config.buyAmount}
                        onChange={(e) => handleConfigChange("buyAmount", e.target.value)}
                        className="bg-blue-dark/50 border-blue-accent/30 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="slippage" className="text-gray-300">
                        Slippage (%)
                      </Label>
                      <Input
                        id="slippage"
                        type="number"
                        value={config.slippage}
                        onChange={(e) => handleConfigChange("slippage", e.target.value)}
                        className="bg-blue-dark/50 border-blue-accent/30 text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="gasPrice" className="text-gray-300">
                        Gas Price (Gwei)
                      </Label>
                      <Input
                        id="gasPrice"
                        type="number"
                        value={config.gasPrice}
                        onChange={(e) => handleConfigChange("gasPrice", e.target.value)}
                        className="bg-blue-dark/50 border-blue-accent/30 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxGasLimit" className="text-gray-300">
                        Max Gas Limit
                      </Label>
                      <Input
                        id="maxGasLimit"
                        type="number"
                        value={config.maxGasLimit}
                        onChange={(e) => handleConfigChange("maxGasLimit", e.target.value)}
                        className="bg-blue-dark/50 border-blue-accent/30 text-white"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Security & Protection */}
              <Card className="status-card">
                <CardHeader>
                  <CardTitle className="text-white">Security & Protection</CardTitle>
                  <CardDescription className="text-gray-400">Enable safety features</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-gray-300">Honeypot Detection</Label>
                      <p className="text-sm text-gray-500">Automatically detect and avoid honeypot tokens</p>
                    </div>
                    <Switch
                      checked={config.honeypotCheck}
                      onCheckedChange={(checked) => handleConfigChange("honeypotCheck", checked)}
                    />
                  </div>

                  <Separator className="bg-gray-600" />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-gray-300">MEV Protection</Label>
                      <p className="text-sm text-gray-500">Protect against MEV attacks and front-running</p>
                    </div>
                    <Switch
                      checked={config.mevProtection}
                      onCheckedChange={(checked) => handleConfigChange("mevProtection", checked)}
                    />
                  </div>

                  <Separator className="bg-gray-600" />

                  <div className="space-y-2">
                    <Label htmlFor="minLiquidity" className="text-gray-300">
                      Minimum Liquidity (ETH)
                    </Label>
                    <Input
                      id="minLiquidity"
                      type="number"
                      step="0.1"
                      value={config.minLiquidity}
                      onChange={(e) => handleConfigChange("minLiquidity", e.target.value)}
                      className="bg-blue-dark/50 border-blue-accent/30 text-white"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Auto-Sell Configuration */}
              <Card className="md:col-span-2 status-card">
                <CardHeader>
                  <CardTitle className="text-white">Auto-Sell Settings</CardTitle>
                  <CardDescription className="text-gray-400">Configure automatic selling parameters</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-gray-300">Enable Auto-Sell</Label>
                      <p className="text-sm text-gray-500">Automatically sell tokens based on profit/loss thresholds</p>
                    </div>
                    <Switch
                      checked={config.autoSell}
                      onCheckedChange={(checked) => handleConfigChange("autoSell", checked)}
                    />
                  </div>

                  {config.autoSell && (
                    <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-600">
                      <div className="space-y-2">
                        <Label htmlFor="sellPercentage" className="text-gray-300">
                          Sell Percentage (%)
                        </Label>
                        <Input
                          id="sellPercentage"
                          type="number"
                          value={config.sellPercentage}
                          onChange={(e) => handleConfigChange("sellPercentage", e.target.value)}
                          className="bg-blue-dark/50 border-blue-accent/30 text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="stopLoss" className="text-gray-300">
                          Stop Loss (%)
                        </Label>
                        <Input
                          id="stopLoss"
                          type="number"
                          value={config.stopLoss}
                          onChange={(e) => handleConfigChange("stopLoss", e.target.value)}
                          className="bg-blue-dark/50 border-blue-accent/30 text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="takeProfit" className="text-gray-300">
                          Take Profit (%)
                        </Label>
                        <Input
                          id="takeProfit"
                          type="number"
                          value={config.takeProfit}
                          onChange={(e) => handleConfigChange("takeProfit", e.target.value)}
                          className="bg-blue-dark/50 border-blue-accent/30 text-white"
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
                  className="bg-green-live hover:bg-green-600 text-white"
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

              <Button
                variant="outline"
                onClick={handleRefreshStats}
                className="border-blue-accent text-blue-bright hover:bg-blue-accent/20 bg-transparent"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Stats
              </Button>
            </div>

            {!isConnected && (
              <Alert className="border-yellow-500/50 bg-yellow-500/10">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                <AlertDescription className="text-yellow-200">
                  Please connect your wallet to start trading. The bot requires wallet access to execute transactions.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <Card className="status-card">
              <CardHeader>
                <CardTitle className="text-white">System Logs</CardTitle>
                <CardDescription className="text-gray-400">Latest bot actions and system events</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-400">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No recent activity</p>
                  <p className="text-sm">Start the bot to see system logs here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
