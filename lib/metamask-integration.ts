// Future MetaMask integration utilities
import { ethers } from "ethers"
import { METAMASK_CONFIG } from "./constants"

export interface MetaMaskProvider {
  isMetaMask?: boolean
  request: (args: { method: string; params?: any[] }) => Promise<any>
  on: (event: string, handler: (...args: any[]) => void) => void
  removeListener: (event: string, handler: (...args: any[]) => void) => void
}

export class MetaMaskConnector {
  private provider: MetaMaskProvider | null = null
  private signer: ethers.Signer | null = null

  async connect(): Promise<{ address: string; signer: ethers.Signer }> {
    if (typeof window === "undefined" || !window.ethereum) {
      throw new Error("MetaMask not installed")
    }

    this.provider = window.ethereum as MetaMaskProvider

    // Request account access
    const accounts = await this.provider.request({
      method: "eth_requestAccounts",
    })

    if (!accounts || accounts.length === 0) {
      throw new Error("No accounts found")
    }

    // Switch to Base network if needed
    await this.switchToBaseNetwork()

    // Create ethers provider and signer
    const ethersProvider = new ethers.BrowserProvider(window.ethereum)
    this.signer = await ethersProvider.getSigner()

    return {
      address: accounts[0],
      signer: this.signer,
    }
  }

  private async switchToBaseNetwork(): Promise<void> {
    if (!this.provider) throw new Error("Provider not connected")

    try {
      await this.provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: METAMASK_CONFIG.CHAIN_ID }],
      })
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        await this.provider.request({
          method: "wallet_addEthereumChain",
          params: [METAMASK_CONFIG],
        })
      } else {
        throw switchError
      }
    }
  }

  async getBalance(address: string): Promise<string> {
    if (!this.signer) throw new Error("Not connected")

    const provider = this.signer.provider
    if (!provider) throw new Error("No provider")

    const balance = await provider.getBalance(address)
    return ethers.formatEther(balance)
  }

  disconnect(): void {
    this.provider = null
    this.signer = null
  }

  isConnected(): boolean {
    return this.provider !== null && this.signer !== null
  }
}

// Future trading functions with MetaMask
export class MetaMaskTrader {
  private signer: ethers.Signer
  private routerContract: ethers.Contract

  constructor(signer: ethers.Signer) {
    this.signer = signer
    // Initialize router contract when needed
    this.routerContract = new ethers.Contract(
      "0x2626664c2603336E57B271c5C0b26F421741e481", // Base Uniswap Router
      [
        "function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountOut)",
      ],
      signer,
    )
  }

  async executeSwap(params: {
    tokenIn: string
    tokenOut: string
    fee: number
    amountIn: string
    slippage: number
  }): Promise<string> {
    // Implementation for future use
    throw new Error("Trading functionality not yet implemented")
  }
}
