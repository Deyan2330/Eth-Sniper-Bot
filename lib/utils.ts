import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Utility functions for the sniper bot
export function formatAddress(address: string, length = 6): string {
  if (!address) return ""
  return `${address.slice(0, length)}...${address.slice(-4)}`
}

export function formatNumber(num: number, decimals = 2): string {
  if (num === 0) return "0"
  if (num < 0.01) return "<0.01"
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  })
}

export function formatTimeAgo(timestamp: string): string {
  const now = new Date().getTime()
  const time = new Date(timestamp).getTime()
  const diff = Math.floor((now - time) / 1000)

  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export function formatEther(wei: string, decimals = 4): string {
  try {
    const num = Number.parseFloat(wei) / Math.pow(10, 18)
    return formatNumber(num, decimals)
  } catch {
    return "0"
  }
}

export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

export function isValidPrivateKey(key: string): boolean {
  return /^0x[a-fA-F0-9]{64}$/.test(key) || /^[a-fA-F0-9]{64}$/.test(key)
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function safeParseFloat(value: string, fallback = 0): number {
  const parsed = Number.parseFloat(value)
  return isNaN(parsed) ? fallback : parsed
}

export function safeParseInt(value: string, fallback = 0): number {
  const parsed = Number.parseInt(value, 10)
  return isNaN(parsed) ? fallback : parsed
}

// Gas price utilities
export function gweiToWei(gwei: number): bigint {
  return BigInt(Math.floor(gwei * 1e9))
}

export function weiToGwei(wei: bigint): number {
  return Number(wei) / 1e9
}

// Fee tier utilities
export function formatFeeTier(fee: number): string {
  return `${(fee / 10000).toFixed(2)}%`
}

export function getFeeTierName(fee: number): string {
  switch (fee) {
    case 100:
      return "Lowest (0.01%)"
    case 500:
      return "Low (0.05%)"
    case 3000:
      return "Medium (0.30%)"
    case 10000:
      return "High (1.00%)"
    default:
      return `Custom (${formatFeeTier(fee)})`
  }
}

// Error handling utilities
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === "string") return error
  return "An unknown error occurred"
}

export function logError(context: string, error: unknown): void {
  console.error(`[${context}] ${getErrorMessage(error)}`)
}

// Validation utilities
export function validateConfig(config: any): string[] {
  const errors: string[] = []

  if (!config.rpcUrl) {
    errors.push("RPC URL is required")
  }

  if (config.privateKey && !isValidPrivateKey(config.privateKey)) {
    errors.push("Invalid private key format")
  }

  if (config.minLiquidity && safeParseFloat(config.minLiquidity) < 0) {
    errors.push("Minimum liquidity must be positive")
  }

  if (config.maxGasPrice && safeParseFloat(config.maxGasPrice) <= 0) {
    errors.push("Max gas price must be positive")
  }

  if (config.slippage && (safeParseFloat(config.slippage) < 0 || safeParseFloat(config.slippage) > 100)) {
    errors.push("Slippage must be between 0 and 100")
  }

  return errors
}
