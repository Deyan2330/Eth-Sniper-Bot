import type { ethers } from "ethers"

export interface PerformanceMetrics {
  rpcLatency: number
  blockSyncStatus: "SYNCED" | "SYNCING" | "BEHIND"
  memoryUsage: number
  cpuUsage: number
  networkRequests: number
  cacheHitRate: number
  errorRate: number
}

export interface OptimizationSettings {
  enableCaching: boolean
  cacheExpiry: number
  batchRequests: boolean
  maxConcurrentRequests: number
  retryAttempts: number
  requestTimeout: number
}

export class PerformanceOptimizer {
  private provider: ethers.JsonRpcProvider
  private settings: OptimizationSettings
  private cache: Map<string, { data: any; timestamp: number }> = new Map()
  private requestQueue: Array<() => Promise<any>> = []
  private activeRequests = 0
  private metrics: PerformanceMetrics = {
    rpcLatency: 0,
    blockSyncStatus: "SYNCING",
    memoryUsage: 0,
    cpuUsage: 0,
    networkRequests: 0,
    cacheHitRate: 0,
    errorRate: 0,
  }

  constructor(provider: ethers.JsonRpcProvider, settings: OptimizationSettings) {
    this.provider = provider
    this.settings = settings
    this.startMetricsCollection()
  }

  // Optimized RPC call with caching and batching
  async optimizedCall<T>(method: string, params: any[] = [], cacheKey?: string): Promise<T> {
    // Check cache first
    if (this.settings.enableCaching && cacheKey) {
      const cached = this.getCachedResult<T>(cacheKey)
      if (cached) {
        this.metrics.cacheHitRate = this.metrics.cacheHitRate * 0.9 + 1 * 0.1
        return cached
      }
    }

    // Queue request if too many active
    if (this.activeRequests >= this.settings.maxConcurrentRequests) {
      return new Promise((resolve, reject) => {
        this.requestQueue.push(async () => {
          try {
            const result = await this.executeCall<T>(method, params)
            resolve(result)
          } catch (error) {
            reject(error)
          }
        })
      })
    }

    const result = await this.executeCall<T>(method, params)

    // Cache result
    if (this.settings.enableCaching && cacheKey) {
      this.setCachedResult(cacheKey, result)
    }

    return result
  }

  private async executeCall<T>(method: string, params: any[]): Promise<T> {
    this.activeRequests++
    this.metrics.networkRequests++

    const startTime = Date.now()

    try {
      // Add timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Request timeout")), this.settings.requestTimeout)
      })

      const requestPromise = (this.provider as any).send(method, params)
      const result = await Promise.race([requestPromise, timeoutPromise])

      // Update latency metric
      const latency = Date.now() - startTime
      this.metrics.rpcLatency = this.metrics.rpcLatency * 0.9 + latency * 0.1

      return result
    } catch (error) {
      this.metrics.errorRate = this.metrics.errorRate * 0.9 + 1 * 0.1

      // Retry logic
      if (this.settings.retryAttempts > 0) {
        await this.delay(1000) // Wait 1 second before retry
        this.settings.retryAttempts--
        return this.executeCall<T>(method, params)
      }

      throw error
    } finally {
      this.activeRequests--
      this.processQueue()
    }
  }

  private processQueue(): void {
    if (this.requestQueue.length > 0 && this.activeRequests < this.settings.maxConcurrentRequests) {
      const nextRequest = this.requestQueue.shift()
      if (nextRequest) {
        nextRequest()
      }
    }
  }

  private getCachedResult<T>(key: string): T | null {
    const cached = this.cache.get(key)
    if (cached && Date.now() - cached.timestamp < this.settings.cacheExpiry) {
      return cached.data
    }
    return null
  }

  private setCachedResult<T>(key: string, data: T): void {
    this.cache.set(key, { data, timestamp: Date.now() })

    // Clean old cache entries
    if (this.cache.size > 1000) {
      const oldestKey = this.cache.keys().next().value
      this.cache.delete(oldestKey)
    }
  }

  private startMetricsCollection(): void {
    setInterval(() => {
      this.updateMetrics()
    }, 5000) // Update every 5 seconds
  }

  private async updateMetrics(): Promise<void> {
    try {
      // Check block sync status
      const latestBlock = await this.provider.getBlockNumber()
      const networkBlock = latestBlock // In production, compare with network latest

      if (Math.abs(networkBlock - latestBlock) < 5) {
        this.metrics.blockSyncStatus = "SYNCED"
      } else if (Math.abs(networkBlock - latestBlock) < 50) {
        this.metrics.blockSyncStatus = "SYNCING"
      } else {
        this.metrics.blockSyncStatus = "BEHIND"
      }

      // Update memory usage (simplified)
      if (typeof window !== "undefined" && (performance as any).memory) {
        this.metrics.memoryUsage = (performance as any).memory.usedJSHeapSize / 1024 / 1024 // MB
      }
    } catch (error) {
      console.error("Error updating metrics:", error)
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  // Batch multiple calls together
  async batchCalls(calls: Array<{ method: string; params: any[] }>): Promise<any[]> {
    if (!this.settings.batchRequests) {
      return Promise.all(calls.map((call) => this.optimizedCall(call.method, call.params)))
    }

    // Implement JSON-RPC batch request
    const batchRequest = calls.map((call, index) => ({
      jsonrpc: "2.0",
      method: call.method,
      params: call.params,
      id: index,
    }))

    const startTime = Date.now()
    this.activeRequests++
    this.metrics.networkRequests++

    try {
      const response = await fetch(this.provider._getConnection().url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(batchRequest),
      })

      const results = await response.json()

      // Update latency
      const latency = Date.now() - startTime
      this.metrics.rpcLatency = this.metrics.rpcLatency * 0.9 + latency * 0.1

      return results.map((result: any) => result.result)
    } catch (error) {
      this.metrics.errorRate = this.metrics.errorRate * 0.9 + 1 * 0.1
      throw error
    } finally {
      this.activeRequests--
    }
  }

  // Get current performance metrics
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics }
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear()
  }

  // Update settings
  updateSettings(newSettings: Partial<OptimizationSettings>): void {
    this.settings = { ...this.settings, ...newSettings }
  }
}

// Default optimization settings
export const createDefaultOptimizationSettings = (): OptimizationSettings => ({
  enableCaching: true,
  cacheExpiry: 30000, // 30 seconds
  batchRequests: true,
  maxConcurrentRequests: 10,
  retryAttempts: 3,
  requestTimeout: 10000, // 10 seconds
})
