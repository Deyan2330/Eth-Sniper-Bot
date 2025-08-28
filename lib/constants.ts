// Base Chain Configuration
export const BASE_CONTRACTS = {
  UNISWAP_V3_FACTORY: "0x33128a8fC17869897dcE68Ed026d694621f6FDfD",
  WETH: "0x4200000000000000000000000000000000000006",
  USDC: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
}

export const BASE_RPC_URLS = {
  MAINNET: "https://mainnet.base.org",
  ALCHEMY: "https://base-mainnet.g.alchemy.com/v2/",
  INFURA: "https://base-mainnet.infura.io/v3/",
  QUICKNODE: "https://base-mainnet.quiknode.pro/",
}

export const STORAGE_SETTINGS = {
  POOLS_FILE: "./data/detected_pools.json",
  LOGS_FILE: "./data/system_logs.txt",
  MAX_POOLS_IN_MEMORY: 1000,
}
