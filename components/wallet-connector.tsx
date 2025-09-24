"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Wallet, ExternalLink, Shield, AlertTriangle, CheckCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { EnhancedMetaMask, redirectToMetaMaskInstall, type MetaMaskState } from "@/lib/enhanced-metamask"

interface WalletConnectorProps {
  onConnect: (connection: { type: "metamask" | "private-key"; address: string; signer?: any }) => void
  isConnected: boolean
  walletAddress?: string
  walletType?: "metamask" | "private-key" | "readonly"
}

export function WalletConnector({ onConnect, isConnected, walletAddress, walletType }: WalletConnectorProps) {
  const [isConnecting, setIsConnecting] = useState(false)
  const [showPrivateKeyInput, setShowPrivateKeyInput] = useState(false)
  const [privateKey, setPrivateKey] = useState("")
  const [metaMask, setMetaMask] = useState<EnhancedMetaMask | null>(null)
  const [metaMaskState, setMetaMaskState] = useState<MetaMaskState>({
    isInstalled: false,
    isConnected: false,
    account: null,
    chainId: null,
    balance: "0",
    networkName: "Unknown",
  })

  useEffect(() => {
    if (typeof window !== "undefined") {
      const mm = new EnhancedMetaMask({
        onAccountChanged: (account) => {
          setMetaMaskState((prev) => ({
            ...prev,
            account,
            isConnected: !!account,
          }))
        },
        onChainChanged: (chainId) => {
          setMetaMaskState((prev) => ({
            ...prev,
            chainId,
            networkName: getNetworkName(chainId),
          }))
        },
        onConnect: (account) => {
          setMetaMaskState((prev) => ({
            ...prev,
            account,
            isConnected: true,
          }))
        },
        onDisconnect: () => {
          setMetaMaskState((prev) => ({
            ...prev,
            isConnected: false,
            account: null,
            balance: "0",
          }))
        },
      })

      setMetaMask(mm)
      setMetaMaskState(mm.getState())
    }
  }, [])

  const getNetworkName = (chainId: number): string => {
    const networkNames: { [key: number]: string } = {
      1: "Ethereum Mainnet",
      5: "Goerli Testnet",
      11155111: "Sepolia Testnet",
      137: "Polygon Mainnet",
      80001: "Polygon Mumbai",
      56: "BSC Mainnet",
      97: "BSC Testnet",
      8453: "Base Mainnet",
      84531: "Base Goerli",
      84532: "Base Sepolia",
    }
    return networkNames[chainId] || `Unknown Network (${chainId})`
  }

  const handleMetaMaskConnect = async () => {
    if (!metaMask) return

    if (!metaMaskState.isInstalled) {
      redirectToMetaMaskInstall()
      return
    }

    setIsConnecting(true)
    try {
      const account = await metaMask.connect()
      const signer = metaMask.getSigner()

      onConnect({
        type: "metamask",
        address: account,
        signer,
      })
    } catch (error: any) {
      console.error("MetaMask connection failed:", error)
      alert(`MetaMask connection failed: ${error.message}`)
    } finally {
      setIsConnecting(false)
    }
  }

  const handlePrivateKeyConnect = async () => {
    if (!privateKey.trim()) {
      alert("Please enter a private key")
      return
    }

    setIsConnecting(true)
    try {
      // Validate private key format
      let cleanKey = privateKey.trim()
      if (!cleanKey.startsWith("0x")) {
        cleanKey = "0x" + cleanKey
      }

      if (cleanKey.length !== 66) {
        throw new Error("Invalid private key format. Must be 64 hex characters.")
      }

      onConnect({
        type: "private-key",
        address: cleanKey, // This will be replaced by the actual address in the parent component
      })
      setShowPrivateKeyInput(false)
      setPrivateKey("")
    } catch (error: any) {
      console.error("Private key connection failed:", error)
      alert(`Connection failed: ${error.message}`)
    } finally {
      setIsConnecting(false)
    }
  }

  if (isConnected && walletAddress) {
    return (
      <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 dark:from-emerald-950 dark:to-emerald-900 dark:border-emerald-800">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500 rounded-full">
                <CheckCircle className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="font-medium text-emerald-900 dark:text-emerald-100">Wallet Connected</p>
                <p className="text-sm text-emerald-700 dark:text-emerald-300 font-mono">
                  {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                </p>
              </div>
            </div>
            <Badge
              variant="outline"
              className="bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900 dark:text-emerald-200 dark:border-emerald-700"
            >
              {walletType === "metamask" ? "MetaMask" : walletType === "private-key" ? "Private Key" : "Read-Only"}
            </Badge>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Wallet className="h-5 w-5 text-blue-400" />
          Wallet Connection
        </CardTitle>
        <CardDescription className="text-slate-400">Choose your preferred wallet connection method</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* MetaMask Option */}
        <div className="space-y-3">
          <Button
            onClick={handleMetaMaskConnect}
            disabled={isConnecting}
            className="w-full bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white"
          >
            <Wallet className="h-4 w-4 mr-2" />
            {!metaMaskState.isInstalled ? "Install MetaMask" : isConnecting ? "Connecting..." : "Connect MetaMask"}
          </Button>

          <Alert className="bg-orange-900/20 border-orange-700">
            <Shield className="h-4 w-4" />
            <AlertDescription className="text-orange-200">
              <strong>MetaMask Integration:</strong> Secure browser wallet connection with transaction signing
              capabilities. Perfect for manual trading and maximum security.
            </AlertDescription>
          </Alert>

          {!metaMaskState.isInstalled && (
            <Alert className="bg-yellow-900/20 border-yellow-700">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-yellow-200">
                MetaMask not detected. Click the button above to install MetaMask.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Private Key Option */}
        <div className="space-y-3">
          {!showPrivateKeyInput ? (
            <Button
              onClick={() => setShowPrivateKeyInput(true)}
              disabled={isConnecting}
              variant="outline"
              className="w-full border-slate-600 text-slate-300 hover:bg-slate-800"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Use Private Key
            </Button>
          ) : (
            <div className="space-y-3 p-4 bg-slate-900/50 rounded-lg border border-slate-700">
              <Label htmlFor="private-key" className="text-slate-300">
                Private Key
              </Label>
              <Input
                id="private-key"
                type="password"
                value={privateKey}
                onChange={(e) => setPrivateKey(e.target.value)}
                placeholder="Enter your private key (0x...)"
                className="bg-slate-800 border-slate-600 text-white"
              />
              <div className="flex gap-2">
                <Button
                  onClick={handlePrivateKeyConnect}
                  disabled={isConnecting || !privateKey.trim()}
                  className="flex-1"
                >
                  Connect
                </Button>
                <Button
                  onClick={() => {
                    setShowPrivateKeyInput(false)
                    setPrivateKey("")
                  }}
                  variant="outline"
                  className="border-slate-600 text-slate-300"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          <Alert className="bg-yellow-900/20 border-yellow-700">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-yellow-200">
              <strong>Private Key Mode:</strong> Direct wallet access for automated trading. Higher risk but enables
              full bot automation. Never share your private key.
            </AlertDescription>
          </Alert>
        </div>

        <div className="pt-4 border-t border-slate-700">
          <p className="text-xs text-slate-500 text-center">
            Both methods support Base chain trading. MetaMask recommended for beginners.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
