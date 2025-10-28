"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import {
  Bot,
  Settings,
  Activity,
  Wallet,
  TrendingUp,
  Zap,
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
import type { Pool, Stats, Analysis, Trade } from "@/lib/sniper"

interface Config {
  active: boolean
  rpc: string
  buy: string
  slip: string
  gas: string
  gasLimit: string
  minLiq: string
  honeypot: boolean
  mev: boolean
  autoSell: boolean
  sellPct: string
  stopLoss: string
  takeProfit: string
  pk: string
}

interface Log {
  id: string
  time: string
  msg: string
  type: "info" | "success" | "warning" | "error"
}
interface PoolEx extends Pool {
  analysis?: Analysis
  analyzing?: boolean
  trade?: Trade
}

const RPC = { "Base Mainnet": "https://mainnet.base.org", Custom: "" }

export default function Dashboard() {
  const { toast } = useToast()
  const [connected, setConnected] = useState(false)
  const [wallet, setWallet] = useState("")
  const [walletType, setWalletType] = useState<"mm" | "pk" | "ro">("mm")
  const [loading, setLoading] = useState(false)
  const [sniper, setSniper] = useState<any>(null)
  const [stats, setStats] = useState<Stats>({
    running: false,
    pools: 0,
    recent: 0,
    status: "disconnected",
    runtime: "0h 0m",
    activity: "None",
    block: 0,
    events: 0,
    newTokens: 0,
  })
  const [pools, setPools] = useState<PoolEx[]>([])
  const [logs, setLogs] = useState<Log[]>([])
  const logsEnd = useRef<HTMLDivElement>(null)
  const [config, setConfig] = useState<Config>({
    active: false,
    rpc: "https://mainnet.base.org",
    buy: "0.01",
    slip: "12",
    gas: "20",
    gasLimit: "500000",
    minLiq: "10",
    honeypot: true,
    mev: true,
    autoSell: false,
    sellPct: "100",
    stopLoss: "20",
    takeProfit: "50",
    pk: "",
  })
  const [summary, setSummary] = useState({ trades: 0, success: 0, fail: 0, vol: 0, profit: 0, loss: 0, rate: 0 })
  const [pk, setPk] = useState("")
  const [roAddr, setRoAddr] = useState("")
  const [copied, setCopied] = useState(false)
  const [advancedMode, setAdvancedMode] = useState(false)
  const [securityAlerts, setSecurityAlerts] = useState<any[]>([])
  const [portfolioData, setPortfolioData] = useState<any>(null)

  useEffect(() => {
    logsEnd.current?.scrollIntoView({ behavior: "smooth" })
  }, [logs])
  useEffect(() => {
    if (!sniper) return
    const i = setInterval(() => setStats(sniper.getStats()), 5000)
    return () => clearInterval(i)
  }, [sniper])

  const log = (msg: string, type: "info" | "success" | "warning" | "error" = "info") =>
    setLogs((p) => [
      ...p.slice(-99),
      { id: `${Date.now()}-${Math.random()}`, time: new Date().toLocaleTimeString(), msg, type },
    ])

  const copy = async (text: string, label = "Address") => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast({ title: "Copied!", description: `${label} copied` })
    } catch {
      log(`❌ Copy failed`, "error")
    }
  }

  const connectMM = async () => {
    setLoading(true)
    try {
      if (typeof window.ethereum !== "undefined") {
        const accs = await window.ethereum.request({ method: "eth_requestAccounts" })
        if (accs.length > 0) {
          setConnected(true)
          setWallet(accs[0])
          setWalletType("mm")
          log("Connected via MetaMask", "success")
        }
      } else toast({ title: "MetaMask Not Found", variant: "destructive" })
    } catch {
      toast({ title: "Connection Failed", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const connectPK = () => {
    if (!pk.trim()) return toast({ title: "Invalid Key", variant: "destructive" })
    const addr = `0x${pk.slice(-40).padStart(40, "0")}`
    setConnected(true)
    setWallet(addr)
    setWalletType("pk")
    setConfig((p) => ({ ...p, pk }))
    setPk("")
    log("Connected via Private Key", "success")
  }

  const connectRO = () => {
    if (!roAddr.trim() || !roAddr.startsWith("0x") || roAddr.length !== 42)
      return toast({ title: "Invalid Address", variant: "destructive" })
    setConnected(true)
    setWallet(roAddr)
    setWalletType("ro")
    setRoAddr("")
    log("Connected Read-Only", "success")
  }

  const disconnect = () => {
    setConnected(false)
    setWallet("")
    setConfig((p) => ({ ...p, pk: "" }))
    log("Disconnected", "info")
  }

  const start = async () => {
    if (!config.rpc) return toast({ title: "Missing RPC", variant: "destructive" })
    setLoading(true)
    log("🚀 Starting bot...", "info")
    try {
      const { Sniper } = await import("@/lib/sniper")
      const s = new Sniper(config.rpc, {
        enableAutomatedTrading: advancedMode && config.pk,
        enableSecurity: advancedMode,
        enablePortfolio: advancedMode && connected,
        enablePriceMonitor: advancedMode,
        privateKey: config.pk,
      })
      setSniper(s)
      await s.start((p: Pool) => {
        setPools((prev) => [p, ...prev.slice(0, 49)])
        log(`🎯 Pool: ${p.info0?.symbol}/${p.info1?.symbol}`, "success")
        if (p.isNew) log("🔥 NEW TOKEN!", "success")
      }, log)
      setConfig((p) => ({ ...p, active: true }))
      log("✅ Bot started!", "success")
      toast({ title: "Bot Started" })
    } catch (err) {
      log(`❌ Start failed: ${err}`, "error")
      toast({ title: "Error", description: `${err}`, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const stop = async () => {
    setLoading(true)
    log("⏹️ Stopping...", "info")
    try {
      if (sniper) {
        await sniper.stop()
        setSniper(null)
      }
      setConfig((p) => ({ ...p, active: false }))
      setStats((p) => ({ ...p, running: false, status: "disconnected" }))
      log("✅ Stopped", "success")
      toast({ title: "Bot Stopped" })
    } catch (err) {
      log(`❌ Stop error: ${err}`, "error")
    } finally {
      setLoading(false)
    }
  }

  const analyze = async (pool: PoolEx, idx: number) => {
    if (!sniper) return toast({ title: "Bot not running", variant: "destructive" })
    setPools((p) => p.map((x, i) => (i === idx ? { ...x, analyzing: true } : x)))
    log(`🔍 Analyzing ${pool.info0?.symbol}...`, "info")
    try {
      const a = await sniper.analyze(pool.token0, pool.pool, pool.age)
      setPools((p) => p.map((x, i) => (i === idx ? { ...x, analysis: a, analyzing: false } : x)))
      log(`📊 ${a.symbol}: ${a.action} (${a.confidence}%)`, "success")
      toast({ title: "Analysis Done", description: `${a.symbol}: ${a.action}` })
    } catch (err) {
      log(`❌ Analysis failed: ${err}`, "error")
      setPools((p) => p.map((x, i) => (i === idx ? { ...x, analyzing: false } : x)))
    }
  }

  const buy = async (pool: PoolEx, idx: number) => {
    if (!sniper || !connected) return toast({ title: "Not ready", variant: "destructive" })
    if (walletType === "ro") return toast({ title: "Read-only mode", variant: "destructive" })
    log(`💰 Buying ${pool.info0?.symbol}...`, "info")
    try {
      const t = await sniper.trade(pool.token0, config.buy, Number.parseFloat(config.slip), config.gas)
      setPools((p) => p.map((x, i) => (i === idx ? { ...x, trade: t } : x)))
      if (t.success) {
        log("✅ Trade successful!", "success")
        setSummary((p) => ({
          ...p,
          trades: p.trades + 1,
          success: p.success + 1,
          vol: p.vol + Number.parseFloat(config.buy),
          rate: ((p.success + 1) / (p.trades + 1)) * 100,
        }))
        toast({ title: "Trade Success!" })
      } else {
        log(`❌ Trade failed: ${t.error}`, "error")
        setSummary((p) => ({ ...p, trades: p.trades + 1, fail: p.fail + 1, rate: (p.success / (p.trades + 1)) * 100 }))
        toast({ title: "Trade Failed", description: t.error, variant: "destructive" })
      }
    } catch (err) {
      log(`❌ Trade error: ${err}`, "error")
    }
  }

  const fmt = (t: string) => {
    const d = (Date.now() - new Date(t).getTime()) / 1000
    const m = Math.floor(d / 60)
    const h = Math.floor(m / 60)
    return h > 0 ? `${h}h ago` : m > 0 ? `${m}m ago` : "Now"
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg border border-blue-400/30">
              <Bot className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Token Sniper</h1>
              <p className="text-blue-300/80">Real-time Base chain monitoring</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Badge
              variant={config.active ? "default" : "secondary"}
              className={config.active ? "bg-green-500 animate-pulse" : "bg-gray-600"}
            >
              {config.active ? (
                <>
                  <Zap className="h-3 w-3 mr-1" />
                  LIVE
                </>
              ) : (
                <>
                  <Pause className="h-3 w-3 mr-1" />
                  Off
                </>
              )}
            </Badge>
            {connected && (
              <Badge variant="outline" className="border-blue-400 text-blue-300">
                <Wallet className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            )}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm text-gray-300">Status</CardTitle>
              <div className={`w-2 h-2 rounded-full ${stats.running ? "bg-green-500 animate-pulse" : "bg-gray-500"}`} />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-white">{stats.status}</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm text-gray-300">Pools</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.pools}</div>
              <p className="text-xs text-green-400">+{stats.recent} recent</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm text-gray-300">New Tokens</CardTitle>
              <Flame className="h-4 w-4 text-orange-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.newTokens}</div>
              <p className="text-xs text-orange-400">Fresh</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm text-gray-300">Runtime</CardTitle>
              <Timer className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-white">{stats.runtime}</div>
              <p className="text-xs text-gray-400">{stats.activity}</p>
            </CardContent>
          </Card>
        </div>

        {!connected && (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Wallet className="h-5 w-5 text-blue-400" />
                Connect Wallet
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="mm" className="space-y-4">
                <TabsList className="grid w-full grid-cols-3 bg-slate-700/50">
                  <TabsTrigger value="mm">MetaMask</TabsTrigger>
                  <TabsTrigger value="pk">Private Key</TabsTrigger>
                  <TabsTrigger value="ro">Read Only</TabsTrigger>
                </TabsList>
                <TabsContent value="mm">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 mx-auto bg-orange-500/20 rounded-full flex items-center justify-center border border-orange-400/30">
                      <Wallet className="h-8 w-8 text-orange-400" />
                    </div>
                    <Button onClick={connectMM} disabled={loading} className="w-full bg-orange-600 hover:bg-orange-700">
                      Connect MetaMask
                    </Button>
                  </div>
                </TabsContent>
                <TabsContent value="pk">
                  <div className="space-y-4">
                    <Label className="text-gray-300">Private Key</Label>
                    <Input
                      type="password"
                      placeholder="0x..."
                      value={pk}
                      onChange={(e) => setPk(e.target.value)}
                      className="bg-slate-700/50 border-slate-600 text-white"
                    />
                    <Button onClick={connectPK} disabled={!pk.trim()} className="w-full bg-red-600 hover:bg-red-700">
                      Connect
                    </Button>
                  </div>
                </TabsContent>
                <TabsContent value="ro">
                  <div className="space-y-4">
                    <Label className="text-gray-300">Address</Label>
                    <Input
                      placeholder="0x..."
                      value={roAddr}
                      onChange={(e) => setRoAddr(e.target.value)}
                      className="bg-slate-700/50 border-slate-600 text-white"
                    />
                    <Button
                      onClick={connectRO}
                      disabled={!roAddr.trim()}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      Connect
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}

        {connected && (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Wallet className="h-5 w-5 text-green-400" />
                Connected
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="flex-1 p-2 bg-slate-700/50 rounded border border-slate-600">
                  <p className="text-white font-mono text-sm">
                    {wallet.slice(0, 6)}...{wallet.slice(-4)}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copy(wallet)}
                  className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
                >
                  {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <Button
                onClick={disconnect}
                variant="outline"
                size="sm"
                className="border-red-600 text-red-400 hover:bg-red-600/10 bg-transparent"
              >
                Disconnect
              </Button>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="pools" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 bg-slate-800/50 border border-slate-700">
            <TabsTrigger value="dash">
              <BarChart3 className="h-4 w-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="config">
              <Settings className="h-4 w-4 mr-2" />
              Config
            </TabsTrigger>
            <TabsTrigger value="pools">
              <Flame className="h-4 w-4 mr-2" />
              Pools
            </TabsTrigger>
            <TabsTrigger value="logs">
              <Activity className="h-4 w-4 mr-2" />
              Logs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dash">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-400" />
                  Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center">
                    <Activity className="h-6 w-6 mx-auto mb-2 text-blue-400" />
                    <p className="text-2xl font-bold text-white">{summary.trades}</p>
                    <p className="text-sm text-gray-400">Trades</p>
                  </div>
                  <div className="text-center">
                    <TrendingUp className="h-6 w-6 mx-auto mb-2 text-green-400" />
                    <p className="text-2xl font-bold text-green-400">{summary.success}</p>
                    <p className="text-sm text-gray-400">Success</p>
                  </div>
                  <div className="text-center">
                    <XCircle className="h-6 w-6 mx-auto mb-2 text-red-400" />
                    <p className="text-2xl font-bold text-red-400">{summary.fail}</p>
                    <p className="text-sm text-gray-400">Failed</p>
                  </div>
                  <div className="text-center">
                    <DollarSign className="h-6 w-6 mx-auto mb-2 text-purple-400" />
                    <p className="text-2xl font-bold text-white">{summary.vol.toFixed(3)}</p>
                    <p className="text-sm text-gray-400">Volume ETH</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-400">Success Rate</span>
                    <span className="text-sm font-semibold text-white">{summary.rate.toFixed(1)}%</span>
                  </div>
                  <Progress value={summary.rate} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="config" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Network</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-gray-300">RPC</Label>
                    <Select onValueChange={(v) => setConfig((p) => ({ ...p, rpc: v }))} defaultValue={config.rpc}>
                      <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-600">
                        {Object.entries(RPC).map(([k, v]) => (
                          <SelectItem key={k} value={v || k} className="text-white hover:bg-slate-700">
                            {k}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {config.rpc === "" && (
                    <div className="space-y-2">
                      <Label className="text-gray-300">Custom RPC</Label>
                      <Input
                        placeholder="https://..."
                        value={config.rpc}
                        onChange={(e) => setConfig((p) => ({ ...p, rpc: e.target.value }))}
                        className="bg-slate-700/50 border-slate-600 text-white"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Trading</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-gray-300">Buy (ETH)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={config.buy}
                        onChange={(e) => setConfig((p) => ({ ...p, buy: e.target.value }))}
                        className="bg-slate-700/50 border-slate-600 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-300">Slippage (%)</Label>
                      <Input
                        type="number"
                        value={config.slip}
                        onChange={(e) => setConfig((p) => ({ ...p, slip: e.target.value }))}
                        className="bg-slate-700/50 border-slate-600 text-white"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Advanced Features</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-gray-300">Enable Advanced Mode</Label>
                    <Button
                      size="sm"
                      variant={advancedMode ? "default" : "outline"}
                      onClick={() => setAdvancedMode(!advancedMode)}
                      className={advancedMode ? "bg-blue-600" : ""}
                    >
                      {advancedMode ? "ON" : "OFF"}
                    </Button>
                  </div>
                  {advancedMode && (
                    <div className="text-xs text-gray-400 space-y-1">
                      <p>✅ Automated Trading</p>
                      <p>✅ Security Manager</p>
                      <p>✅ Portfolio Tracker</p>
                      <p>✅ Price Monitor</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            <div className="flex gap-4">
              {!config.active ? (
                <Button onClick={start} disabled={loading} className="bg-green-500 hover:bg-green-600">
                  {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
                  Start
                </Button>
              ) : (
                <Button onClick={stop} disabled={loading} variant="destructive">
                  {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Pause className="h-4 w-4 mr-2" />}
                  Stop
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
          </TabsContent>

          <TabsContent value="pools">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Flame className="h-5 w-5 text-orange-400" />
                  Live Pools
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {pools.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <Flame className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No pools detected</p>
                  </div>
                ) : (
                  pools.slice(0, 10).map((p, i) => (
                    <Card key={`${p.pool}-${i}`} className="bg-slate-700/50 border-slate-600">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex gap-2">
                            <Badge className="bg-orange-500">
                              <Flame className="w-2 h-2 mr-1" />#{i + 1}
                            </Badge>
                            <Badge className="bg-purple-500">{(p.fee / 10000).toFixed(2)}%</Badge>
                            {p.isNew && (
                              <Badge className="bg-red-500 animate-pulse">
                                <Clock className="w-2 h-2 mr-1" />
                                NEW
                              </Badge>
                            )}
                            {p.analysis && (
                              <Badge
                                className={
                                  p.analysis.honeypot === "LOW"
                                    ? "bg-green-500/20 text-green-400"
                                    : p.analysis.honeypot === "MEDIUM"
                                      ? "bg-yellow-500/20 text-yellow-400"
                                      : "bg-red-500/20 text-red-400"
                                }
                              >
                                {p.analysis.honeypot}
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-gray-400">{fmt(p.time)}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-6 mb-4">
                          <div>
                            <p className="text-sm text-blue-400 mb-1">Token A</p>
                            <p className="text-white font-bold text-lg">{p.info0?.symbol || "NEW"}</p>
                          </div>
                          <div>
                            <p className="text-sm text-blue-400 mb-1">Token B</p>
                            <p className="text-white font-bold text-lg">{p.info1?.symbol || "WETH"}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mb-4">
                          <p className="text-gray-300 font-mono text-sm break-all">{p.pool}</p>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 text-blue-400"
                            onClick={() => copy(p.pool, "Pool")}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 text-blue-400"
                            onClick={() => window.open(`https://basescan.org/address/${p.pool}`, "_blank")}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>
                        {p.analysis && (
                          <div className="pt-4 border-t border-gray-600 space-y-3">
                            <div className="grid grid-cols-4 gap-3">
                              <div className="text-center p-2 bg-slate-600/50 rounded">
                                <Clock className="h-3 w-3 mx-auto mb-1 text-orange-400" />
                                <p className="text-xs text-gray-400">Age</p>
                                <p className="text-white font-bold text-sm">{p.analysis.ageMin}m</p>
                              </div>
                              <div className="text-center p-2 bg-slate-600/50 rounded">
                                <DollarSign className="h-3 w-3 mx-auto mb-1 text-green-400" />
                                <p className="text-xs text-gray-400">Price</p>
                                <p className="text-white font-bold text-sm">${p.analysis.price.toFixed(6)}</p>
                              </div>
                              <div className="text-center p-2 bg-slate-600/50 rounded">
                                <Users className="h-3 w-3 mx-auto mb-1 text-blue-400" />
                                <p className="text-xs text-gray-400">Holders</p>
                                <p className="text-white font-bold text-sm">{p.analysis.holders}</p>
                              </div>
                              <div className="text-center p-2 bg-slate-600/50 rounded">
                                <Shield className="h-3 w-3 mx-auto mb-1 text-purple-400" />
                                <p className="text-xs text-gray-400">Risk</p>
                                <p className="text-white font-bold text-sm">{p.analysis.risk}/10</p>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex gap-2">
                                <Badge
                                  className={
                                    p.analysis.action === "BUY"
                                      ? "bg-green-500"
                                      : p.analysis.action === "MONITOR"
                                        ? "bg-yellow-500"
                                        : "bg-red-500"
                                  }
                                >
                                  {p.analysis.action}
                                </Badge>
                                <span className="text-sm text-gray-300">{p.analysis.confidence}%</span>
                                {p.analysis.verified && (
                                  <Badge className="bg-green-500/20 text-green-400">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Verified
                                  </Badge>
                                )}
                                {p.analysis.lpLocked && (
                                  <Badge className="bg-blue-500/20 text-blue-400">
                                    <Lock className="h-3 w-3 mr-1" />
                                    Locked
                                  </Badge>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-gray-400">Liquidity</p>
                                <p className="text-white font-semibold">${p.analysis.liqUSD.toLocaleString()}</p>
                              </div>
                            </div>
                          </div>
                        )}
                        {p.trade && (
                          <div className="pt-4 border-t border-gray-600">
                            <div className="flex items-center gap-2 mb-2">
                              {p.trade.success ? (
                                <CheckCircle className="h-4 w-4 text-green-400" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-400" />
                              )}
                              <span className={`font-semibold ${p.trade.success ? "text-green-400" : "text-red-400"}`}>
                                {p.trade.success ? "Success" : "Failed"}
                              </span>
                            </div>
                            {p.trade.success ? (
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <p className="text-gray-400">TX</p>
                                  <p className="text-white font-mono text-xs break-all">{p.trade.tx}</p>
                                </div>
                                <div>
                                  <p className="text-gray-400">Gas</p>
                                  <p className="text-white">{p.trade.gas?.toLocaleString()}</p>
                                </div>
                              </div>
                            ) : (
                              <p className="text-red-400 text-sm">{p.trade.error}</p>
                            )}
                          </div>
                        )}
                        <div className="pt-4 border-t border-gray-600 flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => analyze(p, i)}
                            disabled={p.analyzing}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            {p.analyzing ? (
                              <Loader className="h-4 w-4 mr-1 animate-spin" />
                            ) : (
                              <BarChart3 className="h-4 w-4 mr-1" />
                            )}
                            {p.analyzing ? "Analyzing..." : "Analyze"}
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => buy(p, i)}
                            disabled={!connected || walletType === "ro"}
                            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600"
                          >
                            <TrendingUp className="h-4 w-4 mr-1" />
                            Buy {config.buy}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-slate-600 text-slate-300 hover:bg-slate-600 bg-transparent"
                            onClick={() => copy(p.token0, "Token")}
                          >
                            <Copy className="h-4 w-4 mr-1" />
                            Copy
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Logs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-96 overflow-y-auto space-y-2 bg-slate-900/50 p-4 rounded-lg border border-slate-600">
                  {logs.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No logs</p>
                    </div>
                  ) : (
                    logs.map((l) => (
                      <div key={l.id} className="flex gap-3 text-sm">
                        <span className="text-gray-500 font-mono text-xs mt-0.5 min-w-[60px]">{l.time}</span>
                        <span
                          className={
                            l.type === "success"
                              ? "text-green-400"
                              : l.type === "error"
                                ? "text-red-400"
                                : l.type === "warning"
                                  ? "text-yellow-400"
                                  : "text-blue-400"
                          }
                        >
                          {l.msg}
                        </span>
                      </div>
                    ))
                  )}
                  <div ref={logsEnd} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
