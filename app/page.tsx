"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  Info,
  Copy,
  ExternalLink,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { RealUniswapListener, type RealPoolData, type RealTimeStats } from "@/lib/real-sniper-bot"
import { EnhancedUniswapBot, createSafeConfig, type TradingOpportunity } from "@/lib/enhanced-sniper-bot"
import { formatAddress, formatTimeAgo } from "@/lib/utils"

interface BotConfig {
  isActive: boolean
  rpcUrl: string
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
  privateKey: string
  enableRealMode: boolean
}

interface LogEntry {
  id: string
  timestamp: string
  message: string
  type: "info" | "success" | "warning" | "error"
}

const RPC_ENDPOINTS = {
  "Base Mainnet (Public)": "https://mainnet.base.org",
  "Base Mainnet (Alchemy)": "https://base-mainnet.g.alchemy.com/v2/YOUR_API_KEY",
  "Base Mainnet (Infura)": "https://base-mainnet.infura.io/v3/YOUR_API_KEY",
  "Base Mainnet (QuickNode)": "https://base-mainnet.quiknode.pro/YOUR_API_KEY",
  "Custom RPC": "",
}

export default function SniperBotDashboard() {
  const { toast } = useToast()
  const [isConnected, setIsConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState<string>("")
  const [walletType, setWalletType] = useState<"metamask" | "private-key" | "readonly">("metamask")
  const [balance, setBalance] = useState("0")
  const [isLoading, setIsLoading] = useState(false)
  const [ethPrice, setEthPrice] = useState(2000)

  // Bot instances
  const [realListener, setRealListener] = useState<RealUniswapListener | null>(null)
  const [enhancedBot, setEnhancedBot] = useState<EnhancedUniswapBot | null>(null)

  // Bot state
  const [realTimeStats, setRealTimeStats] = useState<RealTimeStats>({
    isRunning: false,
    totalPools: 0,
    recentPools: 0,
    connectionStatus: "disconnected",
    runtime: "0h 0m",
    lastActivity: "None",
    currentBlock: 0,
    eventsListened: 0,
  })

  const [poolsDetected, setPoolsDetected] = useState<RealPoolData[]>([])
  const [opportunities, setOpportunities] = useState<TradingOpportunity[]>([])
  const [logs, setLogs] = useState<LogEntry[]>([])
  const logsEndRef = useRef<HTMLDivElement>(null)

  const [config, setConfig] = useState<BotConfig>({
    isActive: false,
    rpcUrl: "https://mainnet.base.org", // Use public Base RPC by default
    targetToken: "",
    buyAmount: "0.01",
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
    privateKey: "",
    enableRealMode: true,
  })

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [logs])

  // Update stats periodically
  useEffect(() => {
    if (!realListener) return

    const interval = setInterval(() => {
      const stats = realListener.getRealTimeStats()
      setRealTimeStats(stats)
    }, 5000)

    return () => clearInterval(interval)
  }, [realListener])

  const addLog = (message: string, type: "info" | "success" | "warning" | "error" = "info") => {
    const newLog: LogEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString(),
      message,
      type,
    }
    setLogs((prev) => [...prev.slice(-99), newLog]) // Keep last 100 logs
  }

  const calculateGasPriceUSD = (gasPriceGwei: string): number => {
    const gasPriceWei = Number.parseFloat(gasPriceGwei) * 1e9
    const gasCostEth = (gasPriceWei * 21000) / 1e18
    return gasCostEth * ethPrice
  }

  const calculateMaxGasLimitUSD = (gasLimit: string, gasPriceGwei: string): number => {
    const gasPriceWei = Number.parseFloat(gasPriceGwei) * 1e9
    const gasCostEth = (gasPriceWei * Number.parseFloat(gasLimit)) / 1e18
    return gasCostEth * ethPrice
  }

  const handleConfigChange = (key: keyof BotConfig, value: string | boolean) => {
    setConfig((prev) => ({ ...prev, [key]: value }))
  }

  const handleRpcEndpointChange = (value: string) => {
    if (value === "Custom RPC") {
      setConfig((prev) => ({ ...prev, rpcUrl: "" }))
    } else if (value === "Base Mainnet (Public)") {
      setConfig((prev) => ({ ...prev, rpcUrl: "https://mainnet.base.org" }))
    } else if (value.includes("YOUR_API_KEY")) {
      // Don't set URLs that contain placeholder API keys
      setConfig((prev) => ({ ...prev, rpcUrl: "" }))
    } else {
      setConfig((prev) => ({ ...prev, rpcUrl: value }))
    }
  }

  const handleWalletConnect = (connection: { type: "metamask" | "private-key"; address: string; signer?: any }) => {
    setIsConnected(true)
    setWalletAddress(connection.address)
    setWalletType(connection.type)
    setBalance("1.234") // Mock balance

    // If private key connection, update config
    if (connection.type === "private-key" && connection.signer) {
      setConfig((prev) => ({ ...prev, privateKey: connection.signer.privateKey }))
    }

    addLog(`Wallet connected via ${connection.type === "metamask" ? "MetaMask" : "Private Key"}`, "success")
    toast({
      title: "Wallet Connected",
      description: `Connected via ${connection.type === "metamask" ? "MetaMask" : "Private Key"}`,
    })
  }

  const handleWalletDisconnect = () => {
    setIsConnected(false)
    setWalletAddress("")
    setBalance("0")
    setConfig((prev) => ({ ...prev, privateKey: "" }))

    addLog("Wallet disconnected", "info")
    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected",
    })
  }

  const handleStartBot = async () => {
    if (!config.rpcUrl) {
      toast({
        title: "Missing RPC URL",
        description: "Please select or enter an RPC endpoint",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    addLog("🚀 Starting Uniswap Sniper Bot...", "info")

    try {
      // Create enhanced bot for analysis
      const safeConfig = createSafeConfig(config.rpcUrl, config.privateKey)
      const enhanced = new EnhancedUniswapBot(safeConfig)
      setEnhancedBot(enhanced)

      // Create real listener
      const listener = new RealUniswapListener(config.rpcUrl)
      setRealListener(listener)

      // Start listening for pools
      await listener.start(async (pool: RealPoolData) => {
        setPoolsDetected((prev) => [pool, ...prev.slice(0, 49)]) // Keep last 50 pools
        addLog(
          `🎯 New pool detected: ${pool.token0Info?.symbol || "UNK"}/${pool.token1Info?.symbol || "UNK"}`,
          "success",
        )

        // Analyze with enhanced bot
        try {
          const opportunity = await enhanced.analyzeNewPool(pool, addLog)
          setOpportunities((prev) => [opportunity, ...prev.slice(0, 19)]) // Keep last 20 opportunities

          if (opportunity.recommendation === "BUY" && opportunity.confidence > 70) {
            addLog(`💰 BUY opportunity: ${opportunity.confidence}% confidence`, "success")
          }
        } catch (error) {
          addLog(`❌ Analysis failed: ${error}`, "error")
        }
      }, addLog)

      setConfig((prev) => ({ ...prev, isActive: true }))
      addLog("✅ Bot started successfully!", "success")

      toast({
        title: "Bot Started",
        description: "Sniper bot is now active and monitoring for opportunities",
      })
    } catch (error) {
      addLog(`❌ Failed to start bot: ${error}`, "error")
      toast({
        title: "Error",
        description: `Failed to start bot: ${error}`,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleStopBot = async () => {
    setIsLoading(true)
    addLog("⏹️ Stopping bot...", "info")

    try {
      if (realListener) {
        await realListener.stop()
        setRealListener(null)
      }

      setConfig((prev) => ({ ...prev, isActive: false }))
      setRealTimeStats((prev) => ({ ...prev, isRunning: false, connectionStatus: "disconnected" }))

      addLog("✅ Bot stopped successfully", "success")
      toast({
        title: "Bot Stopped",
        description: "Sniper bot has been deactivated",
      })
    } catch (error) {
      addLog(`❌ Error stopping bot: ${error}`, "error")
      toast({
        title: "Error",
        description: "Failed to stop bot. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied",
      description: "Address copied to clipboard",
    })
  }

  const openInExplorer = (address: string) => {
    window.open(`https://basescan.org/address/${address}`, "_blank")
  }

  // Mock trading summary data
  const tradingSummaryData: TradingSummaryData = {
    totalTrades: opportunities.filter((o) => o.recommendation === "BUY").length,
    successfulTrades: Math.floor(opportunities.filter((o) => o.recommendation === "BUY").length * 0.7),
    failedTrades: Math.floor(opportunities.filter((o) => o.recommendation === "BUY").length * 0.3),
    totalVolume: Number.parseFloat(config.buyAmount) * opportunities.filter((o) => o.recommendation === "BUY").length,
    totalProfit: 0.05,
    totalLoss: 0.02,
    averageGasUsed: 250000,
    averageExecutionTime: 2.5,
    successRate: 70,
    profitFactor: 2.5,
    largestWin: 0.02,
    largestLoss: 0.008,
    activePositions: 0,
    pendingOrders: 0,
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg border border-blue-400/30">
              <Bot className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white">Uniswap Sniper Bot</h1>
              <p className="text-blue-300/80">Advanced MEV-protected trading automation</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant={config.isActive ? "default" : "secondary"}
              className={`px-3 py-1 ${config.isActive ? "bg-green-500 text-white" : "bg-gray-600 text-gray-200"}`}
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
              <Badge variant="outline" className="px-3 py-1 border-blue-400 text-blue-300">
                <Wallet className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            )}
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">System Status</CardTitle>
              <div
                className={`w-2 h-2 rounded-full ${realTimeStats.isRunning ? "bg-green-500 animate-pulse" : "bg-gray-500"}`}
              ></div>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-white flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${realTimeStats.isRunning ? "bg-green-500" : "bg-gray-500"}`}
                ></div>
                {realTimeStats.connectionStatus}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Pools Detected</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{realTimeStats.totalPools}</div>
              <p className="text-xs text-green-400">+{realTimeStats.recentPools} recent</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Network</CardTitle>
              <Globe className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-white">Base Mainnet</div>
              <p className="text-xs text-blue-400">Block: {realTimeStats.currentBlock?.toLocaleString()}</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Runtime</CardTitle>
              <Timer className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-white">{realTimeStats.runtime}</div>
              <p className="text-xs text-gray-400">{realTimeStats.lastActivity}</p>
            </CardContent>
          </Card>
        </div>

        {/* Wallet Connection */}
        <WalletConnector
          isConnected={isConnected}
          walletAddress={walletAddress}
          walletType={walletType}
          onConnect={handleWalletConnect}
          onDisconnect={handleWalletDisconnect}
        />

        {/* Main Content */}
        <Tabs defaultValue="live-pools" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 bg-slate-800/50 border border-slate-700">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <BarChart3 className="h-4 w-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="config" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Settings className="h-4 w-4 mr-2" />
              Configuration
            </TabsTrigger>
            <TabsTrigger value="live-pools" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Database className="h-4 w-4 mr-2" />
              Live Pools
            </TabsTrigger>
            <TabsTrigger value="activity" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Activity className="h-4 w-4 mr-2" />
              System Logs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="live-pools" className="space-y-4">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Database className="h-5 w-5 text-blue-400" />
                  <div>
                    <CardTitle className="text-white">Live Pool Detection System</CardTitle>
                    <CardDescription className="text-gray-400">
                      Real-time Uniswap V3 pool discovery and analysis
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {poolsDetected.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No pools detected yet</p>
                    <p className="text-sm">Start the bot to begin monitoring</p>
                  </div>
                ) : (
                  poolsDetected.slice(0, 10).map((pool, index) => (
                    <Card key={pool.poolAddress} className="bg-slate-700/50 border-slate-600">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-green-500 text-white">
                              <div className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse"></div>
                              LIVE #{index + 1}
                            </Badge>
                            <Badge className="bg-purple-500 text-white">{(pool.fee / 10000).toFixed(2)}% Fee</Badge>
                          </div>
                          <span className="text-xs text-gray-400">{formatTimeAgo(pool.timestamp)}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <p className="text-sm text-blue-400 font-medium mb-1">Token A:</p>
                            <p className="text-white font-bold text-lg">{pool.token0Info?.symbol || "UNKNOWN"}</p>
                            <p className="text-xs text-gray-400">{pool.token0Info?.name || "Unknown Token"}</p>
                          </div>
                          <div>
                            <p className="text-sm text-blue-400 font-medium mb-1">Token B:</p>
                            <p className="text-white font-bold text-lg">{pool.token1Info?.symbol || "UNKNOWN"}</p>
                            <p className="text-xs text-gray-400">{pool.token1Info?.name || "Unknown Token"}</p>
                          </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-600">
                          <div className="grid grid-cols-2 gap-6">
                            <div>
                              <p className="text-sm text-blue-400 font-medium mb-1">Pool Address:</p>
                              <div className="flex items-center gap-2">
                                <p className="text-gray-300 font-mono text-sm">{formatAddress(pool.poolAddress)}</p>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0 text-blue-400 hover:bg-blue-500/20"
                                  onClick={() => copyToClipboard(pool.poolAddress)}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0 text-blue-400 hover:bg-blue-500/20"
                                  onClick={() => openInExplorer(pool.poolAddress)}
                                >
                                  <ExternalLink className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            <div>
                              <p className="text-sm text-blue-400 font-medium mb-1">Block Height:</p>
                              <p className="text-white font-bold">#{pool.blockNumber.toLocaleString()}</p>
                            </div>
                          </div>
                        </div>

                        {/* Show analysis if available */}
                        {opportunities.find((o) => o.pool.poolAddress === pool.poolAddress) && (
                          <div className="mt-4 pt-4 border-t border-gray-600">
                            {(() => {
                              const opp = opportunities.find((o) => o.pool.poolAddress === pool.poolAddress)!
                              return (
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Badge
                                      className={
                                        opp.recommendation === "BUY"
                                          ? "bg-green-500 text-white"
                                          : opp.recommendation === "MONITOR"
                                            ? "bg-yellow-500 text-white"
                                            : "bg-red-500 text-white"
                                      }
                                    >
                                      {opp.recommendation}
                                    </Badge>
                                    <span className="text-sm text-gray-300">{opp.confidence}% confidence</span>
                                  </div>
                                  <Badge
                                    variant="outline"
                                    className={
                                      opp.riskLevel === "LOW"
                                        ? "border-green-400 text-green-400"
                                        : opp.riskLevel === "MEDIUM"
                                          ? "border-yellow-400 text-yellow-400"
                                          : opp.riskLevel === "HIGH"
                                            ? "border-orange-400 text-orange-400"
                                            : "border-red-400 text-red-400"
                                    }
                                  >
                                    {opp.riskLevel} Risk
                                  </Badge>
                                </div>
                              )
                            })()}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dashboard" className="space-y-4">
            <TradingSummary data={tradingSummaryData} isLoading={isLoading} onRefresh={() => {}} />
          </TabsContent>

          <TabsContent value="config" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2">
              {/* RPC Configuration */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Network Configuration</CardTitle>
                  <CardDescription className="text-gray-400">Select your RPC endpoint</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="rpcEndpoint" className="text-gray-300">
                      RPC Endpoint
                    </Label>
                    <Select onValueChange={handleRpcEndpointChange} defaultValue="Base Mainnet (Public)">
                      <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                        <SelectValue placeholder="Select RPC endpoint" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-600">
                        {Object.entries(RPC_ENDPOINTS).map(([name, url]) => (
                          <SelectItem key={name} value={url || name} className="text-white hover:bg-slate-700">
                            {name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {config.rpcUrl === "" && (
                    <div className="space-y-2">
                      <Label htmlFor="customRpc" className="text-gray-300">
                        Custom RPC URL
                      </Label>
                      <Input
                        id="customRpc"
                        placeholder="https://your-custom-rpc-url.com"
                        value={config.rpcUrl}
                        onChange={(e) => handleConfigChange("rpcUrl", e.target.value)}
                        className="bg-slate-700/50 border-slate-600 text-white placeholder:text-gray-500"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="privateKey" className="text-gray-300">
                      Private Key (Optional)
                    </Label>
                    <Input
                      id="privateKey"
                      type="password"
                      placeholder="0x... (leave empty for monitoring only)"
                      value={config.privateKey}
                      onChange={(e) => handleConfigChange("privateKey", e.target.value)}
                      className="bg-slate-700/50 border-slate-600 text-white placeholder:text-gray-500"
                    />
                    <p className="text-xs text-gray-500">
                      Required for trading. Leave empty to run in monitoring mode only.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Trading Configuration */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Trading Settings</CardTitle>
                  <CardDescription className="text-gray-400">Configure your trading parameters</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="targetToken" className="text-gray-300">
                        Target Token Address
                      </Label>
                      <div className="group relative">
                        <Info className="h-4 w-4 text-blue-400 cursor-help" />
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none w-64 z-10">
                          <div className="text-center">
                            <p className="font-semibold mb-1">What is a Target Token Address?</p>
                            <p className="text-xs">
                              This is the contract address of the specific token you want to snipe. Leave empty to snipe
                              any new token that meets your criteria.
                            </p>
                          </div>
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                        </div>
                      </div>
                    </div>
                    <Input
                      id="targetToken"
                      placeholder="0x... (leave empty to snipe any new token)"
                      value={config.targetToken}
                      onChange={(e) => handleConfigChange("targetToken", e.target.value)}
                      className="bg-slate-700/50 border-slate-600 text-white placeholder:text-gray-500"
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
                        className="bg-slate-700/50 border-slate-600 text-white"
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
                        className="bg-slate-700/50 border-slate-600 text-white"
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
                        className="bg-slate-700/50 border-slate-600 text-white"
                      />
                      <p className="text-xs text-green-400">
                        ≈ ${calculateGasPriceUSD(config.gasPrice).toFixed(2)} USD per transaction
                      </p>
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
                        className="bg-slate-700/50 border-slate-600 text-white"
                      />
                      <p className="text-xs text-green-400">
                        ≈ ${calculateMaxGasLimitUSD(config.maxGasLimit, config.gasPrice).toFixed(2)} USD max cost
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Security & Protection */}
              <Card className="bg-slate-800/50 border-slate-700">
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
                      className="bg-slate-700/50 border-slate-600 text-white"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Auto-Sell Configuration */}
              <Card className="bg-slate-800/50 border-slate-700">
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
                          className="bg-slate-700/50 border-slate-600 text-white"
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
                          className="bg-slate-700/50 border-slate-600 text-white"
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
                          className="bg-slate-700/50 border-slate-600 text-white"
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
                  disabled={isLoading}
                  className="bg-green-500 hover:bg-green-600 text-white"
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
                onClick={() => setLogs([])}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Clear Logs
              </Button>
            </div>

            {!config.rpcUrl && (
              <Alert className="border-yellow-500/50 bg-yellow-500/10">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                <AlertDescription className="text-yellow-200">
                  Please select an RPC endpoint to connect to the Base network.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">System Logs</CardTitle>
                <CardDescription className="text-gray-400">Latest bot actions and system events</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-96 overflow-y-auto space-y-2 bg-slate-900/50 p-4 rounded-lg border border-slate-600">
                  {logs.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No recent activity</p>
                      <p className="text-sm">Start the bot to see system logs here</p>
                    </div>
                  ) : (
                    logs.map((log) => (
                      <div key={log.id} className="flex items-start gap-3 text-sm">
                        <span className="text-gray-500 font-mono text-xs mt-0.5 min-w-[60px]">{log.timestamp}</span>
                        <span
                          className={`
                          ${log.type === "success" ? "text-green-400" : ""}
                          ${log.type === "error" ? "text-red-400" : ""}
                          ${log.type === "warning" ? "text-yellow-400" : ""}
                          ${log.type === "info" ? "text-blue-400" : ""}
                        `}
                        >
                          {log.message}
                        </span>
                      </div>
                    ))
                  )}
                  <div ref={logsEndRef} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
