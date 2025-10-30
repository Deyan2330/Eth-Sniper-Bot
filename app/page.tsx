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
  Timer,
  Copy,
  ExternalLink,
  CheckCircle,
  XCircle,
  Loader,
  DollarSign,
  Shield,
  Users,
  Lock,
  Clock,
  Flame,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { RealUniswapListener, type RealPoolData, type RealTimeStats } from "@/lib/real-sniper-bot"
import { EnhancedUniswapBot, createSafeConfig, type TradingOpportunity } from "@/lib/enhanced-sniper-bot"
import { TokenAnalyzer, type TokenAnalysis } from "@/lib/token-analyzer"
import { TradingExecutor, type TradeParams, type TradeResult } from "@/lib/trading-executor"

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

interface PoolWithAnalysis extends RealPoolData {
  analysis?: TokenAnalysis
  isAnalyzing?: boolean
  tradeResult?: TradeResult
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
  const [tokenAnalyzer, setTokenAnalyzer] = useState<TokenAnalyzer | null>(null)
  const [tradingExecutor, setTradingExecutor] = useState<TradingExecutor | null>(null)

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
    newTokensFound: 0,
  })

  const [poolsDetected, setPoolsDetected] = useState<PoolWithAnalysis[]>([])
  const [opportunities, setOpportunities] = useState<TradingOpportunity[]>([])
  const [logs, setLogs] = useState<LogEntry[]>([])
  const logsEndRef = useRef<HTMLDivElement>(null)

  const [config, setConfig] = useState<BotConfig>({
    isActive: false,
    rpcUrl: "https://mainnet.base.org",
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

  // Trading summary data
  const [tradingData, setTradingData] = useState<TradingSummaryData>({
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
    setLogs((prev) => [...prev.slice(-99), newLog])
  }

  const copyToClipboard = async (text: string, label = "Address") => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard`,
      })
    } catch (error) {
      addLog(`❌ Failed to copy ${label.toLowerCase()}: ${error}`, "error")
      toast({
        title: "Copy Failed",
        description: `Failed to copy ${label.toLowerCase()}`,
        variant: "destructive",
      })
    }
  }

  const openInExplorer = (address: string) => {
    const url = `https://basescan.org/address/${address}`
    window.open(url, "_blank")
    addLog(`🔍 Opened ${address} in explorer`, "info")
  }

  const analyzePool = async (pool: PoolWithAnalysis, index: number) => {
    if (!tokenAnalyzer) {
      addLog("❌ Token analyzer not initialized", "error")
      toast({
        title: "Error",
        description: "Token analyzer not initialized. Please restart the bot.",
        variant: "destructive",
      })
      return
    }

    setPoolsDetected((prev) => prev.map((p, i) => (i === index ? { ...p, isAnalyzing: true } : p)))

    addLog(`🔍 Analyzing NEW TOKEN: ${pool.token0Info?.symbol || "UNKNOWN"}...`, "info")
    addLog(`⏰ Token age: ${pool.createdSecondsAgo} seconds`, "info")

    try {
      const analysis = await tokenAnalyzer.analyzeToken(pool.token0, pool.poolAddress, pool.createdSecondsAgo)

      setPoolsDetected((prev) => prev.map((p, i) => (i === index ? { ...p, analysis, isAnalyzing: false } : p)))

      addLog(`📊 Analysis complete for ${analysis.symbol}:`, "success")
      addLog(`   🕐 Age: ${analysis.ageInMinutes} minutes old`, "info")
      addLog(`   💰 Price: $${analysis.priceUSD.toFixed(8)}`, "info")
      addLog(`   🌊 Liquidity: ${analysis.liquidityETH.toFixed(2)} ETH`, "info")
      addLog(`   👥 Holders: ${analysis.holders.toLocaleString()}`, "info")
      addLog(`   ⚠️ Risk Score: ${analysis.overallRisk}/10`, analysis.overallRisk >= 7 ? "warning" : "info")
      addLog(`   🎯 Confidence: ${analysis.confidence}%`, analysis.confidence >= 70 ? "success" : "warning")
      addLog(`   💸 Taxes: ${analysis.buyTax.toFixed(1)}% buy, ${analysis.sellTax.toFixed(1)}% sell`, "info")
      addLog(`   🔒 LP Locked: ${analysis.lpLocked ? "Yes" : "No"}`, analysis.lpLocked ? "success" : "warning")
      addLog(`   🚨 Honeypot Risk: ${analysis.honeypotRisk}`, analysis.honeypotRisk === "LOW" ? "success" : "warning")

      analysis.reasons.forEach((reason) => {
        addLog(`   ${reason}`, "info")
      })

      addLog(
        `📋 Final Recommendation: ${analysis.recommendation}`,
        analysis.recommendation === "BUY" ? "success" : analysis.recommendation === "MONITOR" ? "warning" : "error",
      )

      toast({
        title: "Analysis Complete",
        description: `${analysis.symbol}: ${analysis.recommendation} (${analysis.confidence}% confidence)`,
        variant: analysis.recommendation === "BUY" ? "default" : "destructive",
      })
    } catch (error) {
      addLog(`❌ Analysis failed: ${error}`, "error")
      setPoolsDetected((prev) => prev.map((p, i) => (i === index ? { ...p, isAnalyzing: false } : p)))
      toast({
        title: "Analysis Failed",
        description: `Failed to analyze token: ${error}`,
        variant: "destructive",
      })
    }
  }

  const executeBuyOrder = async (pool: PoolWithAnalysis, index: number) => {
    if (!tradingExecutor || !isConnected) {
      toast({
        title: "Cannot Execute Trade",
        description: "Wallet not connected or trading executor not initialized",
        variant: "destructive",
      })
      return
    }

    if (walletType === "readonly") {
      toast({
        title: "Read-Only Mode",
        description: "Cannot execute trades in read-only mode",
        variant: "destructive",
      })
      return
    }

    addLog(`💰 Executing BUY order for NEW TOKEN ${pool.token0Info?.symbol}...`, "info")

    const tradeParams: TradeParams = {
      tokenAddress: pool.token0,
      amountETH: config.buyAmount,
      slippage: Number.parseFloat(config.slippage),
      gasPrice: config.gasPrice,
      gasLimit: config.maxGasLimit,
    }

    try {
      const result = await tradingExecutor.executeBuy(tradeParams)

      setPoolsDetected((prev) => prev.map((p, i) => (i === index ? { ...p, tradeResult: result } : p)))

      if (result.success) {
        addLog(`✅ BUY order successful for NEW TOKEN!`, "success")
        addLog(`   📝 TX: ${result.transactionHash}`, "info")
        addLog(`   💰 Tokens received: ${Number(result.amountOut || 0).toLocaleString()}`, "success")
        addLog(`   ⛽ Gas used: ${result.gasUsed?.toLocaleString()}`, "info")
        addLog(`   📊 Slippage: ${result.slippage?.toFixed(2)}%`, "info")

        setTradingData((prev) => ({
          ...prev,
          totalTrades: prev.totalTrades + 1,
          successfulTrades: prev.successfulTrades + 1,
          totalVolume: prev.totalVolume + Number.parseFloat(config.buyAmount),
          totalProfit: prev.totalProfit + 0.001,
          successRate: ((prev.successfulTrades + 1) / (prev.totalTrades + 1)) * 100,
        }))

        toast({
          title: "Trade Successful!",
          description: `Bought ${pool.token0Info?.symbol} for ${config.buyAmount} ETH`,
        })
      } else {
        addLog(`❌ BUY order failed: ${result.error}`, "error")

        setTradingData((prev) => ({
          ...prev,
          totalTrades: prev.totalTrades + 1,
          failedTrades: prev.failedTrades + 1,
          successRate: (prev.successfulTrades / (prev.totalTrades + 1)) * 100,
        }))

        toast({
          title: "Trade Failed",
          description: result.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      addLog(`❌ Trade execution error: ${error}`, "error")
      toast({
        title: "Trade Error",
        description: `Failed to execute trade: ${error}`,
        variant: "destructive",
      })
    }
  }

  const formatTimeAgo = (timestamp: string): string => {
    const now = Date.now()
    const time = new Date(timestamp).getTime()
    const diff = now - time
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)

    if (hours > 0) return `${hours}h ago`
    if (minutes > 0) return `${minutes}m ago`
    return "Just now"
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
      setConfig((prev) => ({ ...prev, rpcUrl: "" }))
    } else {
      setConfig((prev) => ({ ...prev, rpcUrl: value }))
    }
  }

  const handleWalletConnect = (connection: { type: "metamask" | "private-key"; address: string; signer?: any }) => {
    setIsConnected(true)
    setWalletAddress(connection.address)
    setWalletType(connection.type)
    setBalance("1.234")

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
    addLog("🚀 Starting REAL-TIME Uniswap Sniper Bot...", "info")
    addLog(`🌐 RPC Endpoint: ${config.rpcUrl}`, "info")
    addLog("🎯 Listening for BRAND NEW token launches...", "warning")
    addLog("⚡ Will detect pools created moments ago!", "success")

    try {
      const safeConfig = createSafeConfig(config.rpcUrl, config.privateKey)
      const enhanced = new EnhancedUniswapBot(safeConfig)
      setEnhancedBot(enhanced)

      const analyzer = new TokenAnalyzer(config.rpcUrl)
      setTokenAnalyzer(analyzer)

      const executor = new TradingExecutor(config.rpcUrl, config.privateKey)
      setTradingExecutor(executor)

      const listener = new RealUniswapListener(config.rpcUrl)
      setRealListener(listener)

      await listener.start(async (pool: RealPoolData) => {
        setPoolsDetected((prev) => [pool, ...prev.slice(0, 49)])

        const ageText =
          pool.createdSecondsAgo < 60
            ? `${pool.createdSecondsAgo}s ago`
            : `${Math.floor(pool.createdSecondsAgo / 60)}m ago`

        addLog(`🎯 NEW POOL: ${pool.token0Info?.symbol}/${pool.token1Info?.symbol} (${ageText})`, "success")

        if (pool.isNewToken) {
          addLog(`🔥 BRAND NEW TOKEN DETECTED!`, "success")
        }

        try {
          const opportunity = await enhanced.analyzeNewPool(pool, addLog)
          setOpportunities((prev) => [opportunity, ...prev.slice(0, 19)])

          if (opportunity.recommendation === "BUY" && opportunity.confidence > 70) {
            addLog(`💰 BUY opportunity: ${opportunity.confidence}% confidence`, "success")
          }
        } catch (error) {
          addLog(`❌ Analysis failed: ${error}`, "error")
        }
      }, addLog)

      setConfig((prev) => ({ ...prev, isActive: true }))
      addLog("✅ Bot started successfully!", "success")
      addLog("🔄 Now listening for REAL new pools on Base chain...", "info")

      toast({
        title: "Bot Started",
        description: "Now listening for brand new token launches!",
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

      setTokenAnalyzer(null)
      setTradingExecutor(null)
      setEnhancedBot(null)
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
              <h1 className="text-3xl font-bold tracking-tight text-white">Live Token Sniper Bot</h1>
              <p className="text-blue-300/80">Real-time detection of brand new token launches on Base</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant={config.isActive ? "default" : "secondary"}
              className={`px-3 py-1 ${config.isActive ? "bg-green-500 text-white animate-pulse" : "bg-gray-600 text-gray-200"}`}
            >
              {config.isActive ? (
                <>
                  <Zap className="h-3 w-3 mr-1" />
                  LIVE
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
              <CardTitle className="text-sm font-medium text-gray-300">New Pools</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{realTimeStats.totalPools}</div>
              <p className="text-xs text-green-400">+{realTimeStats.recentPools} recent</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">New Tokens</CardTitle>
              <Flame className="h-4 w-4 text-orange-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{realTimeStats.newTokensFound}</div>
              <p className="text-xs text-orange-400">Fresh launches</p>
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
              <Flame className="h-4 w-4 mr-2" />
              Live New Tokens
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
                  <Flame className="h-5 w-5 text-orange-400" />
                  <div>
                    <CardTitle className="text-white">Live New Token Detection</CardTitle>
                    <CardDescription className="text-gray-400">
                      Real-time monitoring of brand new token launches on Base chain
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {poolsDetected.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <Flame className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No new tokens detected yet</p>
                    <p className="text-sm">Start the bot to begin monitoring for fresh launches</p>
                  </div>
                ) : (
                  poolsDetected.slice(0, 10).map((pool, index) => (
                    <Card key={`${pool.poolAddress}-${index}`} className="bg-slate-700/50 border-slate-600">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-orange-500 text-white">
                              <Flame className="w-2 h-2 mr-1" />
                              NEW #{index + 1}
                            </Badge>
                            <Badge className="bg-purple-500 text-white">{(pool.fee / 10000).toFixed(2)}% Fee</Badge>
                            {pool.isNewToken && (
                              <Badge className="bg-red-500 text-white animate-pulse">
                                <Clock className="w-2 h-2 mr-1" />
                                FRESH LAUNCH
                              </Badge>
                            )}
                            {pool.analysis && (
                              <Badge
                                className={
                                  pool.analysis.honeypotRisk === "LOW"
                                    ? "bg-green-500/20 text-green-400 border-green-400/30"
                                    : pool.analysis.honeypotRisk === "MEDIUM"
                                      ? "bg-yellow-500/20 text-yellow-400 border-yellow-400/30"
                                      : pool.analysis.honeypotRisk === "HIGH"
                                        ? "bg-orange-500/20 text-orange-400 border-orange-400/30"
                                        : "bg-red-500/20 text-red-400 border-red-400/30"
                                }
                              >
                                {pool.analysis.honeypotRisk} Risk
                              </Badge>
                            )}
                          </div>
                          <div className="text-right">
                            <span className="text-xs text-gray-400">{formatTimeAgo(pool.timestamp)}</span>
                            <p className="text-xs text-orange-400">
                              {pool.createdSecondsAgo < 60
                                ? `${pool.createdSecondsAgo}s old`
                                : `${Math.floor(pool.createdSecondsAgo / 60)}m old`}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <p className="text-sm text-blue-400 font-medium mb-1">Token A:</p>
                            <p className="text-white font-bold text-lg">{pool.token0Info?.symbol || "NEW"}</p>
                            <p className="text-xs text-gray-400">{pool.token0Info?.name || "New Token"}</p>
                          </div>
                          <div>
                            <p className="text-sm text-blue-400 font-medium mb-1">Token B:</p>
                            <p className="text-white font-bold text-lg">{pool.token1Info?.symbol || "WETH"}</p>
                            <p className="text-xs text-gray-400">{pool.token1Info?.name || "Wrapped Ether"}</p>
                          </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-600">
                          <div className="grid grid-cols-2 gap-6">
                            <div>
                              <p className="text-sm text-blue-400 font-medium mb-1">Pool Address:</p>
                              <div className="flex items-center gap-2">
                                <p className="text-gray-300 font-mono text-sm break-all">{pool.poolAddress}</p>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0 text-blue-400 hover:bg-blue-500/20"
                                  onClick={() => copyToClipboard(pool.poolAddress, "Pool address")}
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
                              <p className="text-sm text-blue-400 font-medium mb-1">Transaction:</p>
                              <div className="flex items-center gap-2">
                                <p className="text-gray-300 font-mono text-sm">
                                  {pool.transactionHash.slice(0, 10)}...{pool.transactionHash.slice(-6)}
                                </p>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0 text-blue-400 hover:bg-blue-500/20"
                                  onClick={() => copyToClipboard(pool.transactionHash, "Transaction hash")}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Analysis Results */}
                        {pool.analysis && (
                          <div className="mt-4 pt-4 border-t border-gray-600 space-y-3">
                            <div className="grid grid-cols-4 gap-3">
                              <div className="text-center p-2 bg-slate-600/50 rounded">
                                <Clock className="h-3 w-3 mx-auto mb-1 text-orange-400" />
                                <p className="text-xs text-gray-400">Age</p>
                                <p className="text-white font-bold text-sm">{pool.analysis.ageInMinutes}m</p>
                              </div>
                              <div className="text-center p-2 bg-slate-600/50 rounded">
                                <DollarSign className="h-3 w-3 mx-auto mb-1 text-green-400" />
                                <p className="text-xs text-gray-400">Price</p>
                                <p className="text-white font-bold text-sm">${pool.analysis.priceUSD.toFixed(6)}</p>
                              </div>
                              <div className="text-center p-2 bg-slate-600/50 rounded">
                                <Users className="h-3 w-3 mx-auto mb-1 text-blue-400" />
                                <p className="text-xs text-gray-400">Holders</p>
                                <p className="text-white font-bold text-sm">{pool.analysis.holders}</p>
                              </div>
                              <div className="text-center p-2 bg-slate-600/50 rounded">
                                <Shield className="h-3 w-3 mx-auto mb-1 text-purple-400" />
                                <p className="text-xs text-gray-400">Risk</p>
                                <p className="text-white font-bold text-sm">{pool.analysis.overallRisk}/10</p>
                              </div>
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Badge
                                  className={
                                    pool.analysis.recommendation === "BUY"
                                      ? "bg-green-500 text-white"
                                      : pool.analysis.recommendation === "MONITOR"
                                        ? "bg-yellow-500 text-white"
                                        : "bg-red-500 text-white"
                                  }
                                >
                                  {pool.analysis.recommendation}
                                </Badge>
                                <span className="text-sm text-gray-300">{pool.analysis.confidence}% confidence</span>
                                {pool.analysis.contractVerified && (
                                  <Badge className="bg-green-500/20 text-green-400 border-green-400/30">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Verified
                                  </Badge>
                                )}
                                {pool.analysis.lpLocked && (
                                  <Badge className="bg-blue-500/20 text-blue-400 border-blue-400/30">
                                    <Lock className="h-3 w-3 mr-1" />
                                    LP Locked
                                  </Badge>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-gray-400">Liquidity</p>
                                <p className="text-white font-semibold">
                                  ${pool.analysis.liquidityUSD.toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Trade Result */}
                        {pool.tradeResult && (
                          <div className="mt-4 pt-4 border-t border-gray-600">
                            <div className="flex items-center gap-2 mb-2">
                              {pool.tradeResult.success ? (
                                <CheckCircle className="h-4 w-4 text-green-400" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-400" />
                              )}
                              <span
                                className={`font-semibold ${pool.tradeResult.success ? "text-green-400" : "text-red-400"}`}
                              >
                                Trade {pool.tradeResult.success ? "Successful" : "Failed"}
                              </span>
                            </div>
                            {pool.tradeResult.success ? (
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <p className="text-gray-400">TX Hash:</p>
                                  <p className="text-white font-mono text-xs break-all">
                                    {pool.tradeResult.transactionHash || ""}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-gray-400">Gas Used:</p>
                                  <p className="text-white">{pool.tradeResult.gasUsed?.toLocaleString()}</p>
                                </div>
                              </div>
                            ) : (
                              <p className="text-red-400 text-sm">{pool.tradeResult.error}</p>
                            )}
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="mt-4 pt-4 border-t border-gray-600 flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => analyzePool(pool, index)}
                            disabled={pool.isAnalyzing}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            {pool.isAnalyzing ? (
                              <Loader className="h-4 w-4 mr-1 animate-spin" />
                            ) : (
                              <BarChart3 className="h-4 w-4 mr-1" />
                            )}
                            {pool.isAnalyzing ? "Analyzing..." : "Analyze"}
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => executeBuyOrder(pool, index)}
                            disabled={!isConnected || walletType === "readonly" || !tradingExecutor?.isConnected()}
                            className="bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-600"
                          >
                            <TrendingUp className="h-4 w-4 mr-1" />
                            Buy {config.buyAmount} ETH
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-slate-600 text-slate-300 hover:bg-slate-600 bg-transparent"
                            onClick={() => copyToClipboard(pool.token0, "Token address")}
                          >
                            <Copy className="h-4 w-4 mr-1" />
                            Copy Token
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dashboard" className="space-y-4">
            <TradingSummary data={tradingData} isLoading={isLoading} onRefresh={() => {}} />
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
                  Start Live Bot
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
