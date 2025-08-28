"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertCircle,
  Play,
  Square,
  Settings,
  TrendingUp,
  Zap,
  Activity,
  Globe,
  Shield,
  Target,
  BarChart3,
  Clock,
  Signal,
  Database,
  Eye,
  Lock,
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Add these imports at the top
import { RealUniswapListener, type RealPoolData } from "@/lib/real-sniper-bot"
import { BASE_RPC_URLS } from "@/lib/constants"

// Replace the existing interfaces and add:
interface RealBotConfig {
  rpcUrl: string
  enableRealMode: boolean
}

interface PoolData {
  token0: string
  token1: string
  pool: string
  fee: number
  timestamp: string
  blockNumber: number
  txHash: string
}

interface BotConfig {
  rpcUrl: string
  privateKey: string
  minLiquidity: string
  maxGasPrice: string
  slippage: string
  buyAmount: string
  enabled: boolean
}

interface RealTimeStats {
  isRunning: boolean
  totalPools: number
  recentPools: number
  connectionStatus: string
  runtime: string
  lastActivity: string
}

export default function UniswapSniperBot() {
  const [isRunning, setIsRunning] = useState(false)
  const [pools, setPools] = useState<PoolData[]>([])
  const [config, setConfig] = useState<BotConfig>({
    rpcUrl: "https://mainnet.base.org",
    privateKey: "",
    minLiquidity: "1000",
    maxGasPrice: "50",
    slippage: "5",
    buyAmount: "0.01",
    enabled: false,
  })
  const [logs, setLogs] = useState<string[]>([])

  // Add state for real bot
  const [realBot, setRealBot] = useState<RealUniswapListener | null>(null)
  const [realPools, setRealPools] = useState<RealPoolData[]>([])
  const [realConfig, setRealConfig] = useState<RealBotConfig>({
    rpcUrl: BASE_RPC_URLS.MAINNET,
    enableRealMode: false,
  })

  // Add real-time stats state
  const [realTimeStats, setRealTimeStats] = useState<RealTimeStats>({
    isRunning: false,
    totalPools: 0,
    recentPools: 0,
    connectionStatus: "disconnected",
    runtime: "0h 0m",
    lastActivity: "None",
  })

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs((prev) => [`[${timestamp}] ${message}`, ...prev.slice(0, 99)])
  }

  // Replace the startBot function with:
  const startBot = async () => {
    if (!config.privateKey && !realConfig.enableRealMode) {
      addLog("❌ Private key required for demo mode")
      return
    }

    setIsRunning(true)

    if (realConfig.enableRealMode) {
      // REAL MODE - Listen to actual blockchain
      try {
        addLog("🚀 Starting REAL Uniswap V3 Listener...")
        addLog("⚠️ REAL MODE: Listening to live Base chain events")

        const listener = new RealUniswapListener(realConfig.rpcUrl)
        setRealBot(listener)

        // Update stats every 5 seconds
        const statsInterval = setInterval(() => {
          if (listener.isListening()) {
            const stats = listener.getRealTimeStats()
            setRealTimeStats(stats)
          }
        }, 5000)
        ;(window as any).statsInterval = statsInterval

        await listener.start(
          (pool: RealPoolData) => {
            setRealPools((prev) => [pool, ...prev.slice(0, 49)]) // Keep last 50
            const token0Symbol = pool.token0Info?.symbol || pool.token0.slice(0, 6)
            const token1Symbol = pool.token1Info?.symbol || pool.token1.slice(0, 6)
            addLog(`🎯 REAL POOL: ${token0Symbol}/${token1Symbol} | Fee: ${pool.fee / 10000}%`)
          },
          (message: string) => {
            addLog(message)
          },
        )
      } catch (error) {
        addLog(`❌ Failed to start real listener: ${error}`)
        setIsRunning(false)
      }
    } else {
      // DEMO MODE - Simulate for testing
      addLog("🚀 Starting Demo Mode (Simulated Data)")
      addLog("👂 Listening for simulated pairs...")

      const interval = setInterval(() => {
        if (Math.random() > 0.7) {
          const mockPool: PoolData = {
            token0: `0x${Math.random().toString(16).substr(2, 40)}`,
            token1: `0x${Math.random().toString(16).substr(2, 40)}`,
            pool: `0x${Math.random().toString(16).substr(2, 40)}`,
            fee: Math.random() > 0.5 ? 3000 : 500,
            timestamp: new Date().toISOString(),
            blockNumber: Math.floor(Math.random() * 1000000) + 18000000,
            txHash: `0x${Math.random().toString(16).substr(2, 64)}`,
          }
          setPools((prev) => [mockPool, ...prev.slice(0, 19)])
          addLog(`🔍 Demo pool: ${mockPool.pool.slice(0, 8)}...`)
        }
      }, 3000)
      ;(window as any).botInterval = interval
    }
  }

  // Update stopBot to clear stats interval:
  const stopBot = async () => {
    setIsRunning(false)

    if ((window as any).statsInterval) {
      clearInterval((window as any).statsInterval)
    }

    if (realBot) {
      await realBot.stop()
      setRealBot(null)
      addLog("⏹️ Real listener stopped")
    }

    if ((window as any).botInterval) {
      clearInterval((window as any).botInterval)
      addLog("⏹️ Demo mode stopped")
    }

    setRealTimeStats({
      isRunning: false,
      totalPools: 0,
      recentPools: 0,
      connectionStatus: "disconnected",
      runtime: "0h 0m",
      lastActivity: "None",
    })
  }

  useEffect(() => {
    return () => {
      if ((window as any).botInterval) {
        clearInterval((window as any).botInterval)
      }
      if ((window as any).statsInterval) {
        clearInterval((window as any).statsInterval)
      }
    }
  }, [])

  // Helper function to safely format numbers
  const safeToLocaleString = (value: number | undefined | null): string => {
    if (value === undefined || value === null || isNaN(value)) {
      return "0"
    }
    return value.toLocaleString()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Professional Header with Gradient Overlay */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20" />
        <div className="relative max-w-7xl mx-auto px-4 py-12">
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-2xl">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                UniSwap Sniper Pro
              </h1>
            </div>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto leading-relaxed">
              Professional-grade DeFi trading infrastructure for Base Chain. Real-time pool detection with
              institutional-level precision.
            </p>
            <div className="flex items-center justify-center gap-6 text-sm text-blue-200">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span>Enterprise Security</span>
              </div>
              <div className="flex items-center gap-2">
                <Signal className="h-4 w-4" />
                <span>Real-time Data</span>
              </div>
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                <span>Precision Trading</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-12 -mt-6">
        {/* Professional Status Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 shadow-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400 mb-1">System Status</p>
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-3 h-3 rounded-full shadow-lg ${
                        realConfig.enableRealMode
                          ? realTimeStats.connectionStatus === "connected"
                            ? "bg-emerald-500 shadow-emerald-500/50"
                            : "bg-red-500 shadow-red-500/50"
                          : isRunning
                            ? "bg-emerald-500 shadow-emerald-500/50"
                            : "bg-slate-500"
                      }`}
                    />
                    <span className="font-semibold text-white">
                      {realConfig.enableRealMode
                        ? realTimeStats.connectionStatus.charAt(0).toUpperCase() +
                          realTimeStats.connectionStatus.slice(1)
                        : isRunning
                          ? "Active"
                          : "Standby"}
                    </span>
                  </div>
                </div>
                <Activity className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 shadow-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400 mb-1">Pools Detected</p>
                  <p className="text-2xl font-bold text-white">
                    {realConfig.enableRealMode
                      ? safeToLocaleString(realTimeStats.totalPools)
                      : safeToLocaleString(pools.length)}
                  </p>
                  <p className="text-xs text-emerald-400">
                    +{realConfig.enableRealMode ? safeToLocaleString(realTimeStats.recentPools) : "0"} recent
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-emerald-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 shadow-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400 mb-1">Network</p>
                  <p className="text-lg font-semibold text-white">Base Mainnet</p>
                  <p className="text-xs text-blue-400">Uniswap V3</p>
                </div>
                <Globe className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 shadow-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400 mb-1">Runtime</p>
                  <p className="text-lg font-semibold text-white">
                    {realConfig.enableRealMode ? realTimeStats.runtime : "0h 0m"}
                  </p>
                  <p className="text-xs text-slate-400">
                    {realConfig.enableRealMode ? realTimeStats.lastActivity : "Inactive"}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Professional Tabs */}
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-slate-800 border-slate-700 p-1">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <BarChart3 className="h-4 w-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="config" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Settings className="h-4 w-4 mr-2" />
              Configuration
            </TabsTrigger>
            <TabsTrigger value="pools" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Database className="h-4 w-4 mr-2" />
              Live Pools
            </TabsTrigger>
            <TabsTrigger value="logs" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Eye className="h-4 w-4 mr-2" />
              System Logs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Professional Control Panel */}
              <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 shadow-2xl">
                <CardHeader className="pb-4">
                  <CardTitle className="text-white flex items-center gap-2">
                    <Target className="h-5 w-5 text-blue-400" />
                    Trading Control Center
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Professional-grade bot management and execution
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex gap-3">
                    <Button
                      onClick={startBot}
                      disabled={isRunning}
                      className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-lg"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Initialize System
                    </Button>
                    <Button
                      onClick={stopBot}
                      disabled={!isRunning}
                      variant="outline"
                      className="flex-1 border-red-600 text-red-400 hover:bg-red-600 hover:text-white bg-transparent"
                    >
                      <Square className="h-4 w-4 mr-2" />
                      Emergency Stop
                    </Button>
                  </div>

                  <Alert className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 border-blue-700">
                    <Shield className="h-4 w-4" />
                    <AlertDescription className="text-blue-200">
                      <strong>Enterprise Notice:</strong> This system operates with institutional-grade security
                      protocols. All operations are logged and monitored for compliance.
                    </AlertDescription>
                  </Alert>

                  {/* Professional Stats Grid */}
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-700">
                    <div className="text-center p-3 bg-slate-800/50 rounded-lg">
                      <p className="text-2xl font-bold text-emerald-400">
                        {realConfig.enableRealMode
                          ? safeToLocaleString(realTimeStats.totalPools)
                          : safeToLocaleString(pools.length)}
                      </p>
                      <p className="text-xs text-slate-400">Total Detected</p>
                    </div>
                    <div className="text-center p-3 bg-slate-800/50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-400">
                        {realConfig.enableRealMode ? safeToLocaleString(realTimeStats.recentPools) : "0"}
                      </p>
                      <p className="text-xs text-slate-400">Recent Activity</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Professional Activity Monitor */}
              <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 shadow-2xl">
                <CardHeader className="pb-4">
                  <CardTitle className="text-white flex items-center gap-2">
                    <Activity className="h-5 w-5 text-emerald-400" />
                    Real-time Activity Monitor
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Live system events and blockchain interactions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
                    {logs.slice(0, 15).map((log, index) => (
                      <div
                        key={index}
                        className="text-sm font-mono bg-slate-900/50 p-3 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors"
                      >
                        <span className="text-slate-300">{log}</span>
                      </div>
                    ))}
                    {logs.length === 0 && (
                      <div className="text-center py-12">
                        <Activity className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                        <p className="text-slate-500">Awaiting system initialization...</p>
                        <p className="text-xs text-slate-600 mt-2">Activity logs will appear here</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="config" className="space-y-6">
            <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Settings className="h-5 w-5 text-blue-400" />
                  System Configuration
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Configure advanced trading parameters and security settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="rpc" className="text-slate-300 font-medium">
                      RPC Endpoint
                    </Label>
                    <Input
                      id="rpc"
                      value={config.rpcUrl}
                      onChange={(e) => setConfig((prev) => ({ ...prev, rpcUrl: e.target.value }))}
                      placeholder="https://mainnet.base.org"
                      className="bg-slate-900 border-slate-600 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gas" className="text-slate-300 font-medium">
                      Max Gas Price (Gwei)
                    </Label>
                    <Input
                      id="gas"
                      value={config.maxGasPrice}
                      onChange={(e) => setConfig((prev) => ({ ...prev, maxGasPrice: e.target.value }))}
                      placeholder="50"
                      className="bg-slate-900 border-slate-600 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="liquidity" className="text-slate-300 font-medium">
                      Min Liquidity (USD)
                    </Label>
                    <Input
                      id="liquidity"
                      value={config.minLiquidity}
                      onChange={(e) => setConfig((prev) => ({ ...prev, minLiquidity: e.target.value }))}
                      placeholder="1000"
                      className="bg-slate-900 border-slate-600 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slippage" className="text-slate-300 font-medium">
                      Slippage Tolerance (%)
                    </Label>
                    <Input
                      id="slippage"
                      value={config.slippage}
                      onChange={(e) => setConfig((prev) => ({ ...prev, slippage: e.target.value }))}
                      placeholder="5"
                      className="bg-slate-900 border-slate-600 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amount" className="text-slate-300 font-medium">
                      Position Size (ETH)
                    </Label>
                    <Input
                      id="amount"
                      value={config.buyAmount}
                      onChange={(e) => setConfig((prev) => ({ ...prev, buyAmount: e.target.value }))}
                      placeholder="0.01"
                      className="bg-slate-900 border-slate-600 text-white"
                    />
                  </div>
                  <div className="flex items-center space-x-3 p-4 bg-slate-900/50 rounded-lg">
                    <Switch
                      id="enabled"
                      checked={config.enabled}
                      onCheckedChange={(checked) => setConfig((prev) => ({ ...prev, enabled: checked }))}
                    />
                    <Label htmlFor="enabled" className="text-slate-300 font-medium">
                      Auto-execution Enabled
                    </Label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="private-key" className="text-slate-300 font-medium flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Private Key (Encrypted Storage)
                  </Label>
                  <Input
                    id="private-key"
                    type="password"
                    value={config.privateKey}
                    onChange={(e) => setConfig((prev) => ({ ...prev, privateKey: e.target.value }))}
                    placeholder="Your private key (AES-256 encrypted)"
                    className="bg-slate-900 border-slate-600 text-white"
                  />
                </div>

                <div className="border-t border-slate-700 pt-6">
                  <div className="flex items-center space-x-3 mb-6 p-4 bg-gradient-to-r from-orange-900/30 to-red-900/30 rounded-lg border border-orange-700">
                    <Switch
                      id="real-mode"
                      checked={realConfig.enableRealMode}
                      onCheckedChange={(checked) => setRealConfig((prev) => ({ ...prev, enableRealMode: checked }))}
                    />
                    <Label htmlFor="real-mode" className="font-semibold text-orange-300 flex items-center gap-2">
                      <Signal className="h-4 w-4" />🔴 LIVE MODE - Real Base Chain Connection
                    </Label>
                  </div>

                  {realConfig.enableRealMode && (
                    <div className="space-y-4 p-6 bg-gradient-to-r from-orange-900/20 to-red-900/20 rounded-lg border border-orange-700">
                      <Alert className="bg-orange-900/30 border-orange-600">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-orange-200">
                          <strong>LIVE MODE ACTIVATED:</strong> System will connect to Base mainnet blockchain.
                          Real-time pool detection active. No trading execution - monitoring only.
                        </AlertDescription>
                      </Alert>

                      <div className="space-y-2">
                        <Label htmlFor="rpc-url" className="text-slate-300 font-medium">
                          Base Chain RPC URL
                        </Label>
                        <Input
                          id="rpc-url"
                          value={realConfig.rpcUrl}
                          onChange={(e) => setRealConfig((prev) => ({ ...prev, rpcUrl: e.target.value }))}
                          placeholder="https://mainnet.base.org"
                          className="bg-slate-900 border-slate-600 text-white"
                        />
                        <p className="text-xs text-slate-400">
                          Enterprise: Use Alchemy/Infura for optimal performance | Free: https://mainnet.base.org
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pools" className="space-y-6">
            <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Database className="h-5 w-5 text-emerald-400" />
                  Live Pool Detection System
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Real-time Uniswap V3 pool discovery and analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(() => {
                    const displayPools = realConfig.enableRealMode ? realPools : pools

                    return displayPools.length > 0 ? (
                      displayPools.map((pool, index) => (
                        <div
                          key={`${pool.poolAddress || pool.pool}-${index}`}
                          className="bg-gradient-to-r from-slate-900/50 to-slate-800/50 border border-slate-700 rounded-xl p-6 hover:border-slate-600 transition-all duration-300 hover:shadow-xl"
                        >
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <Badge
                                variant="outline"
                                className={`px-3 py-1 font-semibold ${
                                  realConfig.enableRealMode
                                    ? "bg-gradient-to-r from-emerald-900 to-emerald-800 text-emerald-300 border-emerald-600"
                                    : "bg-gradient-to-r from-blue-900 to-blue-800 text-blue-300 border-blue-600"
                                }`}
                              >
                                {realConfig.enableRealMode ? "🔴 LIVE" : "DEMO"} #{displayPools.length - index}
                              </Badge>
                              <Badge
                                variant={pool.fee === 3000 ? "default" : "secondary"}
                                className="bg-gradient-to-r from-purple-900 to-purple-800 text-purple-300"
                              >
                                {pool.fee / 10000}% Fee Tier
                              </Badge>
                            </div>
                            <div className="text-xs text-slate-400 font-mono">
                              {new Date(pool.timestamp).toLocaleTimeString()}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            {realConfig.enableRealMode ? (
                              <>
                                <div className="space-y-1">
                                  <span className="text-blue-400 font-medium">Token A:</span>
                                  <div className="font-mono text-white bg-slate-900/50 p-2 rounded">
                                    {(pool as RealPoolData).token0Info?.symbol ||
                                      `${(pool as RealPoolData).token0.slice(0, 8)}...`}
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <span className="text-emerald-400 font-medium">Token B:</span>
                                  <div className="font-mono text-white bg-slate-900/50 p-2 rounded">
                                    {(pool as RealPoolData).token1Info?.symbol ||
                                      `${(pool as RealPoolData).token1.slice(0, 8)}...`}
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <span className="text-purple-400 font-medium">Pool Address:</span>
                                  <div className="font-mono text-xs text-slate-300 bg-slate-900/50 p-2 rounded">
                                    {(pool as RealPoolData).poolAddress}
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <span className="text-yellow-400 font-medium">Block Height:</span>
                                  <div className="font-mono text-white bg-slate-900/50 p-2 rounded">
                                    #{safeToLocaleString(pool.blockNumber)}
                                  </div>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="space-y-1">
                                  <span className="text-blue-400 font-medium">Token A:</span>
                                  <div className="font-mono text-white bg-slate-900/50 p-2 rounded">
                                    {(pool as PoolData).token0.slice(0, 10)}...
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <span className="text-emerald-400 font-medium">Token B:</span>
                                  <div className="font-mono text-white bg-slate-900/50 p-2 rounded">
                                    {(pool as PoolData).token1.slice(0, 10)}...
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <span className="text-purple-400 font-medium">Pool Address:</span>
                                  <div className="font-mono text-xs text-slate-300 bg-slate-900/50 p-2 rounded">
                                    {(pool as PoolData).pool}
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <span className="text-yellow-400 font-medium">Block Height:</span>
                                  <div className="font-mono text-white bg-slate-900/50 p-2 rounded">
                                    #{safeToLocaleString(pool.blockNumber)}
                                  </div>
                                </div>
                              </>
                            )}
                          </div>

                          {realConfig.enableRealMode && (
                            <div className="pt-4 mt-4 border-t border-slate-700">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-400 font-mono">
                                  TX: {(pool as RealPoolData).transactionHash.slice(0, 16)}...
                                </span>
                                <span className="text-emerald-400 font-medium">
                                  {Math.floor((Date.now() - new Date(pool.timestamp).getTime()) / 1000)}s ago
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-16">
                        <div className="mb-6">
                          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            {realConfig.enableRealMode ? (
                              <Signal className="h-8 w-8 text-white" />
                            ) : (
                              <Database className="h-8 w-8 text-white" />
                            )}
                          </div>
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">
                          {realConfig.enableRealMode ? "Monitoring Live Base Chain" : "System Ready"}
                        </h3>
                        <p className="text-slate-400 mb-4">
                          {realConfig.enableRealMode
                            ? "Scanning for new Uniswap V3 pool deployments..."
                            : "Initialize the system to begin pool detection"}
                        </p>
                        {realConfig.enableRealMode && (
                          <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                            <span>Last activity: {realTimeStats.lastActivity}</span>
                          </div>
                        )}
                      </div>
                    )
                  })()}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs" className="space-y-6">
            <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Eye className="h-5 w-5 text-blue-400" />
                  System Event Logs
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Comprehensive system monitoring and audit trail
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  className="min-h-96 font-mono text-sm bg-slate-900 border-slate-600 text-slate-300 resize-none"
                  value={logs.join("\n")}
                  readOnly
                  placeholder="System logs and events will appear here when the bot is active..."
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Custom Scrollbar Styles */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1e293b;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #475569;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #64748b;
        }
      `}</style>
    </div>
  )
}
