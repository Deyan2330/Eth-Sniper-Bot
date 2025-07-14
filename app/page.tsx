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
import { AlertCircle, Play, Square, Settings, TrendingUp, Wallet, Zap } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

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

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs((prev) => [`[${timestamp}] ${message}`, ...prev.slice(0, 99)])
  }

  const startBot = async () => {
    if (!config.privateKey) {
      addLog("❌ Private key required")
      return
    }

    setIsRunning(true)
    addLog("🚀 Starting Uniswap Sniper Bot...")
    addLog("👂 Listening for new pairs on Base chain")

    // Simulate bot activity for demo
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
        addLog(`🔍 New pool detected: ${mockPool.pool.slice(0, 8)}...`)
      }
    }, 3000)

    // Store interval for cleanup
    ;(window as any).botInterval = interval
  }

  const stopBot = () => {
    setIsRunning(false)
    if ((window as any).botInterval) {
      clearInterval((window as any).botInterval)
    }
    addLog("⏹️ Bot stopped")
  }

  useEffect(() => {
    return () => {
      if ((window as any).botInterval) {
        clearInterval((window as any).botInterval)
      }
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-900 flex items-center justify-center gap-2">
            <Zap className="h-8 w-8 text-blue-600" />
            Uniswap Sniper Bot
          </h1>
          <p className="text-gray-600">Professional DeFi Trading Bot for Base Chain</p>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${isRunning ? "bg-green-500" : "bg-red-500"}`} />
                <span className="font-medium">{isRunning ? "Running" : "Stopped"}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                <span className="font-medium">{pools.length} Pools Found</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Wallet className="h-4 w-4 text-green-600" />
                <span className="font-medium">Base Chain</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Settings className="h-4 w-4 text-gray-600" />
                <span className="font-medium">V3 Factory</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="config">Configuration</TabsTrigger>
            <TabsTrigger value="pools">Detected Pools</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Control Panel */}
              <Card>
                <CardHeader>
                  <CardTitle>Bot Control</CardTitle>
                  <CardDescription>Start or stop the sniper bot</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Button onClick={startBot} disabled={isRunning} className="flex-1">
                      <Play className="h-4 w-4 mr-2" />
                      Start Bot
                    </Button>
                    <Button onClick={stopBot} disabled={!isRunning} variant="outline" className="flex-1 bg-transparent">
                      <Square className="h-4 w-4 mr-2" />
                      Stop Bot
                    </Button>
                  </div>

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      This is a demo interface. Real implementation requires proper security measures and testing.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest bot actions and events</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {logs.slice(0, 10).map((log, index) => (
                      <div key={index} className="text-sm font-mono bg-gray-50 p-2 rounded">
                        {log}
                      </div>
                    ))}
                    {logs.length === 0 && <p className="text-gray-500 text-center py-4">No activity yet</p>}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="config" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Bot Configuration</CardTitle>
                <CardDescription>Configure your sniper bot settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="rpc">RPC URL</Label>
                    <Input
                      id="rpc"
                      value={config.rpcUrl}
                      onChange={(e) => setConfig((prev) => ({ ...prev, rpcUrl: e.target.value }))}
                      placeholder="https://mainnet.base.org"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gas">Max Gas Price (Gwei)</Label>
                    <Input
                      id="gas"
                      value={config.maxGasPrice}
                      onChange={(e) => setConfig((prev) => ({ ...prev, maxGasPrice: e.target.value }))}
                      placeholder="50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="liquidity">Min Liquidity (USD)</Label>
                    <Input
                      id="liquidity"
                      value={config.minLiquidity}
                      onChange={(e) => setConfig((prev) => ({ ...prev, minLiquidity: e.target.value }))}
                      placeholder="1000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slippage">Slippage (%)</Label>
                    <Input
                      id="slippage"
                      value={config.slippage}
                      onChange={(e) => setConfig((prev) => ({ ...prev, slippage: e.target.value }))}
                      placeholder="5"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amount">Buy Amount (ETH)</Label>
                    <Input
                      id="amount"
                      value={config.buyAmount}
                      onChange={(e) => setConfig((prev) => ({ ...prev, buyAmount: e.target.value }))}
                      placeholder="0.01"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="enabled"
                      checked={config.enabled}
                      onCheckedChange={(checked) => setConfig((prev) => ({ ...prev, enabled: checked }))}
                    />
                    <Label htmlFor="enabled">Auto-buy enabled</Label>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="private-key">Private Key</Label>
                  <Input
                    id="private-key"
                    type="password"
                    value={config.privateKey}
                    onChange={(e) => setConfig((prev) => ({ ...prev, privateKey: e.target.value }))}
                    placeholder="Your private key (keep secure!)"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pools" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Detected Pools</CardTitle>
                <CardDescription>Recently discovered Uniswap V3 pools</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pools.map((pool, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">Pool #{pools.length - index}</Badge>
                        <Badge variant={pool.fee === 3000 ? "default" : "secondary"}>{pool.fee / 10000}% Fee</Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="font-medium">Token0:</span> {pool.token0.slice(0, 10)}...
                        </div>
                        <div>
                          <span className="font-medium">Token1:</span> {pool.token1.slice(0, 10)}...
                        </div>
                        <div>
                          <span className="font-medium">Pool:</span> {pool.pool.slice(0, 10)}...
                        </div>
                        <div>
                          <span className="font-medium">Block:</span> {pool.blockNumber}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">{new Date(pool.timestamp).toLocaleString()}</div>
                    </div>
                  ))}
                  {pools.length === 0 && (
                    <p className="text-gray-500 text-center py-8">
                      No pools detected yet. Start the bot to begin monitoring.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>System Logs</CardTitle>
                <CardDescription>Detailed bot activity and debug information</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  className="min-h-96 font-mono text-sm"
                  value={logs.join("\n")}
                  readOnly
                  placeholder="Logs will appear here when the bot is running..."
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
