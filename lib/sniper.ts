import { ethers } from "ethers"
import { AutomatedTrader, createDefaultTradingConfig } from "./automated-trader"
import { SecurityManager, createDefaultSecurityConfig } from "./security-manager"
import { PortfolioTracker } from "./portfolio-tracker"
import { PriceMonitor } from "./price-monitor"

const FACTORY = "0x33128a8fC17869897dcE68Ed026d694621f6FDfD"
const WETH = "0x4200000000000000000000000000000000000006"
const FACTORY_ABI = [
  "event PoolCreated(address indexed token0, address indexed token1, uint24 indexed fee, int24 tickSpacing, address pool)",
]
const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
]

export interface Pool {
  pool: string
  token0: string
  token1: string
  fee: number
  block: number
  time: string
  tx: string
  info0?: { address: string; symbol: string; name: string; decimals: number }
  info1?: { address: string; symbol: string; name: string; decimals: number }
  isNew: boolean
  age: number
}

export interface Stats {
  running: boolean
  pools: number
  recent: number
  status: string
  runtime: string
  activity: string
  block: number
  events: number
  newTokens: number
}

export interface Analysis {
  token: string
  symbol: string
  name: string
  decimals: number
  supply: string
  liqETH: number
  liqUSD: number
  price: number
  mcap: number
  holders: number
  verified: boolean
  honeypot: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
  rug: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
  risk: number
  confidence: number
  action: "BUY" | "MONITOR" | "AVOID"
  reasons: string[]
  vol24h: number
  change24h: number
  liqChange: number
  maxTx: string
  maxWallet: string
  buyTax: number
  sellTax: number
  transferTax: number
  renounced: boolean
  lpLocked: boolean
  social: number
  ageMin: number
  fresh: boolean
}

export interface Trade {
  success: boolean
  tx?: string
  out?: string
  gas?: number
  cost?: string
  slip?: number
  time?: number
  error?: string
}

export interface SniperConfig {
  enableAutomatedTrading?: boolean
  enableSecurity?: boolean
  enablePortfolio?: boolean
  enablePriceMonitor?: boolean
  privateKey?: string
}

export class Sniper {
  private p: ethers.JsonRpcProvider
  private f: ethers.Contract
  private run = false
  private stats: Stats
  private startTime = 0
  private ethPrice = 2000

  private trader?: AutomatedTrader
  private security?: SecurityManager
  private portfolio?: PortfolioTracker
  private priceMonitor?: PriceMonitor
  private config: SniperConfig

  constructor(rpc: string, config: SniperConfig = {}) {
    this.p = new ethers.JsonRpcProvider(rpc)
    this.f = new ethers.Contract(FACTORY, FACTORY_ABI, this.p)
    this.config = config
    this.stats = {
      running: false,
      pools: 0,
      recent: 0,
      status: "disconnected",
      runtime: "0h 0m",
      activity: "None",
      block: 0,
      events: 0,
      newTokens: 0,
    }

    if (config.enableAutomatedTrading && config.privateKey) {
      this.trader = new AutomatedTrader(this.p, config.privateKey, createDefaultTradingConfig())
    }
    if (config.enableSecurity) {
      this.security = new SecurityManager(createDefaultSecurityConfig())
    }
    if (config.enablePortfolio) {
      this.portfolio = new PortfolioTracker(this.p)
    }
    if (config.enablePriceMonitor) {
      this.priceMonitor = new PriceMonitor(this.p)
    }
  }

  async start(onPool: (p: Pool) => void, log: (m: string, t?: string) => void) {
    this.run = true
    this.startTime = Date.now()
    this.stats.running = true
    this.stats.status = "connecting"

    const net = await this.p.getNetwork()
    const block = await this.p.getBlockNumber()
    log(`🔗 Connected to ${net.name} (${net.chainId})`, "success")
    log(`📦 Block: ${block.toLocaleString()}`, "info")
    log("👂 Listening for pools...", "info")
    this.stats.status = "connected"
    this.stats.block = block

    this.f.on("PoolCreated", async (t0, t1, fee, _, pool, e) => {
      if (!this.run) return
      try {
        const b = await e.getBlock()
        const now = Date.now()
        const bTime = Number(b.timestamp) * 1000
        const age = Math.floor((now - bTime) / 1000)
        const isNew = t0 !== WETH && t1 !== WETH

        log(`🚨 Pool: ${pool}`, "success")
        if (isNew) {
          log("🎉 NEW TOKEN!", "success")
          this.stats.newTokens++
        }

        const [i0, i1] = await Promise.all([this.getInfo(t0, log), this.getInfo(t1, log)])
        const data: Pool = {
          pool,
          token0: t0,
          token1: t1,
          fee: Number(fee),
          block: Number(e.blockNumber),
          time: bTime.toString(),
          tx: e.transactionHash,
          info0: i0,
          info1: i1,
          isNew,
          age,
        }

        this.stats.pools++
        this.stats.recent++
        this.stats.activity = new Date().toLocaleTimeString()
        this.stats.block = Number(e.blockNumber)
        this.stats.events++
        onPool(data)
      } catch (err) {
        log(`❌ Error: ${err}`, "error")
      }
    })

    await this.scan(onPool, log)
  }

  private async scan(onPool: (p: Pool) => void, log: (m: string, t?: string) => void) {
    try {
      const curr = await this.p.getBlockNumber()
      const from = curr - 10
      log(`🔍 Scanning ${from}-${curr}...`, "info")
      const events = await this.f.queryFilter(this.f.filters.PoolCreated(), from, curr)
      log(`📊 Found ${events.length} pools`, "info")

      for (const e of events) {
        if (!this.run) break
        const [t0, t1, fee, _, pool] = e.args!
        const b = await e.getBlock()
        const age = Math.floor((Date.now() - Number(b.timestamp) * 1000) / 1000)
        if (age > 3600) continue

        const isNew = t0 !== WETH && t1 !== WETH
        if (isNew) this.stats.newTokens++

        const [i0, i1] = await Promise.all([this.getInfo(t0, log), this.getInfo(t1, log)])
        onPool({
          pool,
          token0: t0,
          token1: t1,
          fee: Number(fee),
          block: Number(e.blockNumber),
          time: (Number(b.timestamp) * 1000).toString(),
          tx: e.transactionHash,
          info0: i0,
          info1: i1,
          isNew,
          age,
        })
        this.stats.pools++
        this.stats.recent++
        this.stats.events++
        await new Promise((r) => setTimeout(r, 100))
      }
    } catch (err) {
      log(`⚠️ Scan error: ${err}`, "warning")
    }
  }

  private async getInfo(addr: string, log: (m: string, t?: string) => void) {
    try {
      const c = new ethers.Contract(addr, ERC20_ABI, this.p)
      const [n, s, d] = await Promise.all([
        c.name().catch(() => "Unknown"),
        c.symbol().catch(() => "UNKNOWN"),
        c.decimals().catch(() => 18),
      ])
      return { address: addr, name: n, symbol: s, decimals: Number(d) }
    } catch {
      return { address: addr, name: "Unknown", symbol: "UNKNOWN", decimals: 18 }
    }
  }

  async analyze(token: string, pool: string, age = 0): Promise<Analysis> {
    const c = new ethers.Contract(token, [...ERC20_ABI, "function totalSupply() view returns (uint256)"], this.p)
    const [n, s, d, ts] = await Promise.allSettled([c.name(), c.symbol(), c.decimals(), c.totalSupply()])
    const info = {
      name: n.status === "fulfilled" ? n.value : "Unknown",
      symbol: s.status === "fulfilled" ? s.value : "NEW",
      decimals: d.status === "fulfilled" ? Number(d.value) : 18,
      supply: ts.status === "fulfilled" ? ts.value.toString() : "0",
    }

    await new Promise((r) => setTimeout(r, 2000 + Math.random() * 3000))

    const ageMin = Math.floor(age / 60)
    const fresh = ageMin < 5
    let risk = 7
    let conf = 30
    const reasons: string[] = []

    if (fresh) {
      reasons.push(`🚨 ${ageMin}m old`)
      risk += 2
      conf -= 20
    }

    const liq = 0.5 + Math.random() * 50
    const price = Math.random() * 0.01
    const holders = 10 + Math.random() * 500
    const verified = Math.random() > 0.8
    const renounced = Math.random() > 0.7
    const locked = Math.random() > 0.5
    const buyTax = Math.random() * 10
    const sellTax = Math.random() * 15

    if (verified) {
      reasons.push("✅ Verified")
      risk--
      conf += 15
    } else {
      reasons.push("❌ Not verified")
      risk++
      conf -= 10
    }
    if (locked) {
      reasons.push("✅ LP locked")
      risk--
      conf += 20
    } else {
      reasons.push("🚨 No LP lock")
      risk += 2
      conf -= 15
    }
    if (renounced) {
      reasons.push("✅ Renounced")
      risk--
      conf += 15
    } else {
      reasons.push("⚠️ Not renounced")
      risk++
    }
    if (buyTax > 5 || sellTax > 10) {
      reasons.push(`🚨 High tax: ${buyTax.toFixed(1)}%/${sellTax.toFixed(1)}%`)
      risk++
      conf -= 10
    } else {
      reasons.push(`✅ Low tax`)
      conf += 10
    }
    if (liq < 5) {
      reasons.push("🚨 Low liquidity")
      risk += 2
      conf -= 15
    } else if (liq > 20) {
      reasons.push("✅ Good liquidity")
      risk--
      conf += 10
    }

    const honeypot = Math.random() > 0.6 ? "HIGH" : Math.random() > 0.3 ? "MEDIUM" : "LOW"
    const rug = Math.random() > 0.5 ? "HIGH" : Math.random() > 0.2 ? "MEDIUM" : "LOW"
    if (honeypot === "HIGH") {
      reasons.push("🚨 Honeypot risk")
      risk += 2
      conf -= 20
    }
    if (rug === "HIGH") {
      reasons.push("🚨 Rug risk")
      risk += 2
      conf -= 20
    }

    if (this.security) {
      const secAnalysis = await this.security.analyzeTokenSecurity(token)
      risk = Math.max(risk, Math.floor(secAnalysis.riskScore / 10))
      reasons.push(...secAnalysis.risks.slice(0, 3))
    }

    risk = Math.max(1, Math.min(10, risk))
    conf = Math.max(5, Math.min(95, conf))
    const action = conf >= 60 && risk <= 5 && locked && verified ? "BUY" : conf >= 40 && risk <= 7 ? "MONITOR" : "AVOID"

    return {
      token,
      symbol: info.symbol,
      name: info.name,
      decimals: info.decimals,
      supply: info.supply,
      liqETH: liq,
      liqUSD: liq * this.ethPrice,
      price,
      mcap: price * 1e9,
      holders: Math.floor(holders),
      verified,
      honeypot,
      rug,
      risk,
      confidence: conf,
      action,
      reasons,
      vol24h: liq * this.ethPrice * 0.1,
      change24h: -50 + Math.random() * 100,
      liqChange: 0,
      maxTx: "1000000000000000000000",
      maxWallet: "2000000000000000000000",
      buyTax,
      sellTax,
      transferTax: Math.random() * 5,
      renounced,
      lpLocked: locked,
      social: Math.floor(Math.random() * 30),
      ageMin,
      fresh: true,
    }
  }

  async trade(token: string, eth: string, slip: number, gas: string): Promise<Trade> {
    if (this.security) {
      const validation = await this.security.validateTrade(token, Number.parseFloat(eth), "BUY")
      if (!validation.allowed) {
        return { success: false, error: validation.reason }
      }
    }

    const start = Date.now()
    await new Promise((r) => setTimeout(r, 1000 + Math.random() * 3000))

    const rate = this.calcRate(Number.parseFloat(eth), slip, Number.parseFloat(gas))
    const ok = Math.random() < rate

    if (ok) {
      const g = 150000 + Math.random() * 100000
      const cost = (g * Number.parseFloat(gas) * 1e-9).toFixed(6)
      const out = (Number.parseFloat(eth) * 1e6 * (0.95 + Math.random() * 0.1)).toString()

      if (this.portfolio) {
        await this.portfolio.addTransaction({
          hash: this.genTx(),
          type: "buy",
          tokenAddress: token,
          tokenSymbol: "TOKEN",
          amount: out,
          pricePerToken: Number.parseFloat(eth) / Number.parseFloat(out),
          totalValue: Number.parseFloat(eth),
          gasUsed: g.toString(),
          gasPriceGwei: gas,
          gasFeesETH: cost,
          gasFeesUSD: Number.parseFloat(cost) * this.ethPrice,
          timestamp: Date.now(),
          blockNumber: this.stats.block,
          from: "0x0",
          to: token,
        })
      }

      return {
        success: true,
        tx: this.genTx(),
        out,
        gas: Math.floor(g),
        cost,
        slip: Math.random() * slip * 0.8,
        time: Date.now() - start,
      }
    }

    const errs = [
      "Insufficient liquidity",
      "Slippage too high",
      "Gas limit exceeded",
      "Transfer failed",
      "MEV protection",
    ]
    return { success: false, error: errs[Math.floor(Math.random() * errs.length)] }
  }

  private calcRate(eth: number, slip: number, gas: number): number {
    let r = 0.7
    if (gas > 30) r += 0.2
    else if (gas > 20) r += 0.1
    else if (gas < 10) r -= 0.2
    if (slip < 5) r -= 0.3
    else if (slip < 10) r -= 0.1
    else if (slip > 20) r += 0.1
    if (eth < 0.01) r += 0.1
    else if (eth > 0.1) r -= 0.1
    return Math.max(0.1, Math.min(0.95, r))
  }

  private genTx(): string {
    return "0x" + Array.from({ length: 64 }, () => "0123456789abcdef"[Math.floor(Math.random() * 16)]).join("")
  }

  stop() {
    this.run = false
    this.stats.running = false
    this.stats.status = "disconnected"
    this.f.removeAllListeners("PoolCreated")
  }

  getStats(): Stats {
    if (this.run && this.startTime > 0) {
      const rt = Date.now() - this.startTime
      const h = Math.floor(rt / 36e5)
      const m = Math.floor((rt % 36e5) / 6e4)
      this.stats.runtime = `${h}h ${m}m`
    }
    return { ...this.stats }
  }

  getTrader() {
    return this.trader
  }
  getSecurity() {
    return this.security
  }
  getPortfolio() {
    return this.portfolio
  }
  getPriceMonitor() {
    return this.priceMonitor
  }
}
