// Base Chain Contract Addresses (REAL ADDRESSES)
export const BASE_CONTRACTS = {
  UNISWAP_V3_FACTORY: "0x33128a8fC17869897dcE68Ed026d694621f6FdF9",
  UNISWAP_V3_ROUTER: "0x2626664c2603336E57B271c5C0b26F421741e481",
  WETH: "0x4200000000000000000000000000000000000006",
  USDC: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
}

// Base Chain RPC URLs
export const BASE_RPC_URLS = {
  MAINNET: "https://mainnet.base.org",
  ALCHEMY: "https://base-mainnet.g.alchemy.com/v2/YOUR_API_KEY", // Replace with your key
  INFURA: "https://base-mainnet.infura.io/v3/YOUR_PROJECT_ID", // Replace with your key
}

// PoolCreated event topic signature
export const POOL_CREATED_TOPIC = "0x783cca1c0412dd0d695e784568c96da2e9c22ff989357a2e8b1d9b2b4e6b7118"

// Common fee tiers for Uniswap V3
export const FEE_TIERS = {
  LOW: 500, // 0.05%
  MEDIUM: 3000, // 0.3%
  HIGH: 10000, // 1%
}

// File storage settings
export const STORAGE_SETTINGS = {
  POOLS_FILE: "detected_pools.json",
  LOGS_FILE: "bot_logs.txt",
  MAX_POOLS_IN_MEMORY: 1000,
}
