import { ethers } from "ethers"
import { AutomatedTrader, type AutomatedTradingConfig, type TradingDecision } from "./automated-trader"
import { RealUniswapListener, type RealPoolData } from "./real-sniper-bot"
import { GasPriceCalculator } from "./gas-price-calculator"

export interface TradingEngineConfig extends AutomatedTradingConfig {
  rpcUrl: string
  privateKey: string
  enableRealMode: boolean
}

export class TradingEngine {
  private provider: ethers.JsonRpcProvider
  private trader: AutomatedTrader | null
  private listener: RealUniswapListener | null = null
  private gasPriceCalculator: GasPriceCalculator
  private config: TradingEngineConfig
  private isRunning = false
  private onLog: (message: string) => void
  private onPoolDetected: (pool: RealPoolData) => void
  private onTradeExecuted: (trade: any) => void

  constructor(
    config: TradingEngineConfig,
    callbacks: {
      onLog: (message: string) => void
      onPoolDetected: (pool: RealPoolData) => void
      onTradeExecuted: (trade: any) => void
    },
  ) {
    this.config = config
    this.onLog = callbacks.onLog
    this.onPoolDetected = callbacks.onPoolDetected
    this.onTradeExecuted = callbacks.onTradeExecuted

    // Use direct RPC connection, never MetaMask
    this.provider = new ethers.JsonRpcProvider(config.rpcUrl)

    // Only create trader if we have a private key and it's not empty
    if (config.privateKey && config.privateKey.trim() !== "") {
      try {
        this.trader = new AutomatedTrader(this.provider, config.privateKey, config)
      } catch (error) {
        this.onLog(`⚠️ Warning: Invalid private key provided. Trading will be disabled.`)
        this.trader = null as any
      }
    } else {
      this.onLog(`ℹ️ No private key provided. Running in monitoring mode only.`)
      this.trader = null as any
    }

    this.gasPriceCalculator = new GasPriceCalculator(this.provider)
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error("Trading engine is already running")
    }

    this.isRunning = true
    this.onLog("🚀 Starting Automated Trading Engine...")

    if (this.config.enableRealMode) {
      await this.startRealMode()
    } else {
      await this.startDemoMode()
    }

    // Start position monitoring
    this.startPositionMonitoring()
  }

  async stop(): Promise<void> {
    this.isRunning = false
    this.onLog("⏹️ Stopping Trading Engine...")

    if (this.listener) {
      await this.listener.stop()
      this.listener = null
    }

    this.onLog("✅ Trading Engine stopped")
  }

  private async startRealMode(): Promise<void> {
    this.onLog("🔴 REAL MODE: Connecting to Base Chain...")

    this.listener = new RealUniswapListener(this.config.rpcUrl)

    await this.listener.start(
      async (pool: RealPoolData) => {
        this.onPoolDetected(pool)

        if (this.config.enabled) {
          await this.processNewPool(pool)
        }
      },
      (message: string) => {
        this.onLog(message)
      },
    )
  }

  private async startDemoMode(): Promise<void> {
    this.onLog("🎮 DEMO MODE: Simulating pool detection...")

    // Simulate pool detection every 10-30 seconds
    const simulatePool = async () => {
      if (!this.isRunning) return

      const mockPool: RealPoolData = {
        poolAddress: `0x${Math.random().toString(16).substr(2, 40)}`,
        token0: `0x${Math.random().toString(16).substr(2, 40)}`,
        token1: `0x${Math.random().toString(16).substr(2, 40)}`,
        fee: Math.random() > 0.5 ? 3000 : 500,
        timestamp: new Date().toISOString(),
        blockNumber: Math.floor(Math.random() * 1000000) + 18000000,
        transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`,
        token0Info: {
          symbol: this.generateRandomTokenSymbol(),
          name: "Demo Token",
          decimals: 18,
        },
        token1Info: {
          symbol: "WETH",
          name: "Wrapped Ether",
          decimals: 18,
        },
      }

      this.onPoolDetected(mockPool)

      if (this.config.enabled) {
        await this.processNewPool(mockPool)
      }

      // Schedule next simulation
      setTimeout(simulatePool, Math.random() * 20000 + 10000) // 10-30 seconds
    }

    simulatePool()
  }

  private async processNewPool(pool: RealPoolData): Promise<void> {
    try {
      this.onLog(`🔍 Analyzing new pool: ${pool.token0Info?.symbol}/${pool.token1Info?.symbol}`)

      // Skip if no trader (no private key)
      if (!this.trader) {
        this.onLog(`ℹ️ Monitoring only - no private key provided for trading`)
        return
      }

      // Check gas price first
      const gasInfo = await this.gasPriceCalculator.getCurrentGasPrice()
      if (gasInfo.gasCostUSD > this.config.maxGasPriceUSD) {
        this.onLog(`⛽ Gas too expensive: $${gasInfo.gasCostUSD.toFixed(2)} > $${this.config.maxGasPriceUSD}`)
        return
      }

      // Analyze and make decision
      const decision = await this.trader.analyzeAndDecide(pool)

      this.onLog(`🎯 Decision: ${decision.action} (${decision.confidence}% confidence)`)
      this.onLog(`📊 Risk Level: ${decision.riskLevel}`)

      for (const reason of decision.reasoning) {
        this.onLog(`   ${reason}`)
      }

      // Execute trade if decision is BUY
      if (decision.action === "BUY" && decision.confidence >= this.config.minConfidenceScore) {
        await this.executeTrade(pool, decision)
      }
    } catch (error) {
      this.onLog(`❌ Error processing pool: ${error}`)
    }
  }

  private async executeTrade(pool: RealPoolData, decision: TradingDecision): Promise<void> {
    try {
      this.onLog(`💰 Executing BUY order for ${pool.token0Info?.symbol || "UNKNOWN"}`)

      const trade = await this.trader.executeBuy(pool.token0, decision)

      this.onLog(`✅ Trade executed: ${trade.id}`)
      this.onLog(`📈 Expected profit: ${decision.expectedProfit?.toFixed(4)} ETH`)

      this.onTradeExecuted(trade)
    } catch (error) {
      this.onLog(`❌ Trade execution failed: ${error}`)
    }
  }

  private startPositionMonitoring(): void {
    const monitorInterval = setInterval(async () => {
      if (!this.isRunning) {
        clearInterval(monitorInterval)
        return
      }

      try {
        if (this.trader) {
          await this.trader.monitorPositions()
        }
      } catch (error) {
        this.onLog(`⚠️ Position monitoring error: ${error}`)
      }
    }, 30000) // Check every 30 seconds
  }

  private generateRandomTokenSymbol(): string {
    const prefixes = ["MOON", "SAFE", "DOGE", "PEPE", "SHIB", "FLOKI", "BABY", "MINI"]
    const suffixes = ["INU", "COIN", "TOKEN", "SWAP", "FINANCE", "PROTOCOL", "DAO", "AI"]

    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)]

    return Math.random() > 0.5 ? `${prefix}${suffix}` : prefix
  }

  // Public getters
  getTradingSummary() {
    if (!this.trader) {
      return {
        totalTrades: 0,
        successfulTrades: 0,
        failedTrades: 0,
        totalProfitLoss: 0,
        totalGasCost: 0,
        winRate: 0,
        bestTrade: null,
        worstTrade: null,
        activePositions: 0,
      }
    }
    return this.trader.getTradingSummary()
  }

  getAllTrades() {
    return this.trader ? this.trader.getAllTrades() : []
  }

  getActivePositions() {
    return this.trader ? this.trader.getActivePositions() : []
  }

  updateConfig(newConfig: Partial<TradingEngineConfig>) {
    this.config = { ...this.config, ...newConfig }
    if (this.trader) {
      this.trader.updateConfig(newConfig)
    }
  }

  // New method to check if the engine is running
  isEngineRunning(): boolean {
    return this.isRunning
  }
}
