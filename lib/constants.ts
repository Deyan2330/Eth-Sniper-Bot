// Base Chain Configuration
export const BASE_CHAIN_ID = 8453

// Base RPC URLs
export const BASE_RPC_URLS = {
  MAINNET: "https://mainnet.base.org",
  ALCHEMY: "https://base-mainnet.g.alchemy.com/v2/",
  INFURA: "https://base-mainnet.infura.io/v3/",
  QUICKNODE: "https://base-mainnet.quiknode.pro/",
}

// CORRECT Uniswap V3 Contract Addresses on Base
export const UNISWAP_V3_ADDRESSES = {
  FACTORY: "0x33128a8fC17869897dcE68Ed026d694621f6FDfD", // Base Uniswap V3 Factory
  ROUTER: "0x2626664c2603336E57B271c5C0b26F421741e481", // Base Swap Router
  QUOTER: "0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a",
  NONFUNGIBLE_POSITION_MANAGER: "0x03a520b32C04BF3bEEf7BF5d56E39E92d51752dd",
}

// Common token addresses on Base
export const BASE_TOKENS = {
  WETH: "0x4200000000000000000000000000000000000006",
  USDC: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  DAI: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb",
  USDT: "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2",
}

// Fee tiers
export const FEE_TIERS = {
  LOWEST: 100, // 0.01%
  LOW: 500, // 0.05%
  MEDIUM: 3000, // 0.3%
  HIGH: 10000, // 1%
}

// Gas settings
export const GAS_SETTINGS = {
  MAX_GAS_PRICE: 50, // Gwei
  GAS_LIMIT: 300000,
  PRIORITY_FEE: 2, // Gwei
}

// Trading settings
export const TRADING_SETTINGS = {
  MIN_LIQUIDITY: 1000, // USD
  MAX_SLIPPAGE: 5, // %
  DEFAULT_BUY_AMOUNT: 0.01, // ETH
}
