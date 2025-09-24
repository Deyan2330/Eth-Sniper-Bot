import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatAddress(address: string): string {
  if (!address || typeof address !== "string") return "Invalid Address"
  if (address.length < 10) return address
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function formatTimeAgo(timestamp: number | string): string {
  const now = Date.now()
  const time = typeof timestamp === "string" ? Number.parseInt(timestamp) : timestamp
  const diff = now - time

  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (minutes > 0) return `${minutes}m ago`
  return `${seconds}s ago`
}

export function safeValue(value: any, defaultValue = 0): number {
  if (value === null || value === undefined) return defaultValue
  if (typeof value === "number" && !isNaN(value)) return value
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value)
    return isNaN(parsed) ? defaultValue : parsed
  }
  return defaultValue
}

export function formatNumber(num: number, decimals = 2): string {
  return num.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

export function formatEther(wei: string | number, decimals = 4): string {
  const value = typeof wei === "string" ? Number.parseFloat(wei) : wei
  return (value / 1e18).toFixed(decimals)
}

export function formatGwei(wei: string | number): string {
  const value = typeof wei === "string" ? Number.parseFloat(wei) : wei
  return (value / 1e9).toFixed(2)
}
