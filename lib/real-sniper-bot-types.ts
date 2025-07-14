// Shared types for both client and server
export interface RealPoolData {
  token0: string
  token1: string
  poolAddress: string
  fee: number
  tickSpacing: number
  blockNumber: number
  transactionHash: string
  timestamp: string
  token0Info?: TokenInfo
  token1Info?: TokenInfo
}

export interface TokenInfo {
  symbol: string
  name: string
  decimals: number
  totalSupply?: string
}

export interface BotStats {
  totalPoolsDetected: number
  startTime: string
  lastPoolTime?: string
  isRunning: boolean
}
