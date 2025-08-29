import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Utility functions for the sniper bot
export function formatAddress(address: string, chars = 4): string {
  if (!address) return ""
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`
}

export function formatNumber(num: number, decimals = 2): string {
  if (num === 0) return "0"
  if (num < 0.01) return "<0.01"
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  })
}

export function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatTime(timestamp: string | number): string {
  const date = new Date(timestamp)
  return date.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}

export function formatDuration(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}d ${hours % 24}h`
  if (hours > 0) return `${hours}h ${minutes % 60}m`
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`
  return `${seconds}s`
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

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === "string") return error
  return "An unknown error occurred"
}

export function calculateGasPrice(baseFee: bigint, priorityFee: bigint): bigint {
  return baseFee + priorityFee
}

export function formatGwei(wei: bigint): string {
  const gwei = Number(wei) / 1e9
  return `${gwei.toFixed(2)} Gwei`
}

export function formatEther(wei: bigint, decimals = 4): string {
  const ether = Number(wei) / 1e18
  return `${ether.toFixed(decimals)} ETH`
}

export function parseEther(ether: string): bigint {
  return BigInt(Math.floor(Number.parseFloat(ether) * 1e18))
}

export function calculateSlippage(amount: bigint, slippagePercent: number): bigint {
  const slippage = BigInt(Math.floor((Number(amount) * slippagePercent) / 100))
  return amount - slippage
}

export function getPoolFeeText(fee: number): string {
  switch (fee) {
    case 100:
      return "0.01%"
    case 500:
      return "0.05%"
    case 3000:
      return "0.3%"
    case 10000:
      return "1%"
    default:
      return `${fee / 10000}%`
  }
}

export function getRiskColor(riskScore: number): string {
  if (riskScore < 20) return "text-green-400"
  if (riskScore < 40) return "text-yellow-400"
  if (riskScore < 70) return "text-orange-400"
  return "text-red-400"
}

export function getRiskBadgeColor(riskScore: number): string {
  if (riskScore < 20) return "bg-green-900 text-green-300 border-green-600"
  if (riskScore < 40) return "bg-yellow-900 text-yellow-300 border-yellow-600"
  if (riskScore < 70) return "bg-orange-900 text-orange-300 border-orange-600"
  return "bg-red-900 text-red-300 border-red-600"
}
