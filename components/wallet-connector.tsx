"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Wallet, Key, Eye, AlertTriangle, CheckCircle, Copy } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { formatAddress } from "@/lib/utils"

interface WalletConnectorProps {
  isConnected: boolean
  walletAddress: string
  walletType: "metamask" | "private-key" | "readonly"
  onConnect: (connection: { type: "metamask" | "private-key"; address: string; signer?: any }) => void
  onDisconnect?: () => void
}

export function WalletConnector({
  isConnected,
  walletAddress,
  walletType,
  onConnect,
  onDisconnect,
}: WalletConnectorProps) {
  const { toast } = useToast()
  const [privateKey, setPrivateKey] = useState("")
  const [isConnecting, setIsConnecting] = useState(false)

  const handleMetaMaskConnect = async () => {
    setIsConnecting(true)
    try {
      if (typeof window.ethereum === "undefined") {
        toast({
          title: "MetaMask Not Found",
          description: "Please install MetaMask to continue",
          variant: "destructive",
        })
        return
      }

      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      })

      if (accounts.length === 0) {
        throw new Error("No accounts found")
      }

      // Switch to Base network
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0x2105" }], // Base chain ID
        })
      } catch (switchError: any) {
        // If Base network is not added, add it
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: "0x2105",
                chainName: "Base",
                nativeCurrency: {
                  name: "Ethereum",
                  symbol: "ETH",
                  decimals: 18,
                },
                rpcUrls: ["https://mainnet.base.org"],
                blockExplorerUrls: ["https://basescan.org"],
              },
            ],
          })
        }
      }

      onConnect({
        type: "metamask",
        address: accounts[0],
      })
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: `Failed to connect to MetaMask: ${error}`,
        variant: "destructive",
      })
    } finally {
      setIsConnecting(false)
    }
  }

  const handlePrivateKeyConnect = async () => {
    if (!privateKey) {
      toast({
        title: "Private Key Required",
        description: "Please enter your private key",
        variant: "destructive",
      })
      return
    }

    if (!privateKey.startsWith("0x") || privateKey.length !== 66) {
      toast({
        title: "Invalid Private Key",
        description: "Private key must be 64 characters long and start with 0x",
        variant: "destructive",
      })
      return
    }

    setIsConnecting(true)
    try {
      // Create wallet from private key
      const wallet = new (await import("ethers")).Wallet(privateKey)

      onConnect({
        type: "private-key",
        address: wallet.address,
        signer: wallet,
      })

      // Clear the private key input for security
      setPrivateKey("")
    } catch (error) {
      toast({
        title: "Invalid Private Key",
        description: "Please check your private key and try again",
        variant: "destructive",
      })
    } finally {
      setIsConnecting(false)
    }
  }

  const copyAddress = () => {
    navigator.clipboard.writeText(walletAddress)
    toast({
      title: "Address Copied",
      description: "Wallet address copied to clipboard",
    })
  }

  if (isConnected) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg border border-green-400/30">
                <CheckCircle className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <CardTitle className="text-white">Wallet Connected</CardTitle>
                <CardDescription className="text-gray-400">
                  Connected via {walletType === "metamask" ? "MetaMask" : "Private Key"}
                </CardDescription>
              </div>
            </div>
            <Badge className="bg-green-500 text-white">
              <Wallet className="h-3 w-3 mr-1" />
              Connected
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg border border-slate-600">
            <div>
              <p className="text-sm text-gray-400">Wallet Address</p>
              <p className="text-white font-mono">{formatAddress(walletAddress)}</p>
            </div>
            <Button size="sm" variant="ghost" onClick={copyAddress} className="text-blue-400 hover:bg-blue-500/20">
              <Copy className="h-4 w-4" />
            </Button>
          </div>

          {onDisconnect && (
            <Button
              variant="outline"
              onClick={onDisconnect}
              className="w-full border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
            >
              Disconnect Wallet
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/20 rounded-lg border border-blue-400/30">
            <Wallet className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <CardTitle className="text-white">Connect Wallet</CardTitle>
            <CardDescription className="text-gray-400">Connect your wallet to start trading</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="metamask" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 bg-slate-700/50 border border-slate-600">
            <TabsTrigger value="metamask" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Wallet className="h-4 w-4 mr-2" />
              MetaMask
            </TabsTrigger>
            <TabsTrigger value="private-key" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Key className="h-4 w-4 mr-2" />
              Private Key
            </TabsTrigger>
          </TabsList>

          <TabsContent value="metamask" className="space-y-4">
            <div className="text-center space-y-4">
              <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                <Wallet className="h-12 w-12 mx-auto mb-3 text-orange-400" />
                <h3 className="text-lg font-semibold text-white mb-2">Connect with MetaMask</h3>
                <p className="text-sm text-gray-400 mb-4">
                  Connect using your MetaMask wallet. Make sure you're on the Base network.
                </p>
                <Button
                  onClick={handleMetaMaskConnect}
                  disabled={isConnecting}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                >
                  {isConnecting ? "Connecting..." : "Connect MetaMask"}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="private-key" className="space-y-4">
            <Alert className="border-yellow-500/50 bg-yellow-500/10">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <AlertDescription className="text-yellow-200">
                <strong>Security Warning:</strong> Your private key will be stored locally and never transmitted. Only
                use this on trusted devices.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="privateKey" className="text-gray-300">
                  Private Key
                </Label>
                <Input
                  id="privateKey"
                  type="password"
                  placeholder="0x..."
                  value={privateKey}
                  onChange={(e) => setPrivateKey(e.target.value)}
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-gray-500"
                />
                <p className="text-xs text-gray-500">
                  Enter your private key to connect. It will be used to sign transactions.
                </p>
              </div>

              <Button
                onClick={handlePrivateKeyConnect}
                disabled={isConnecting || !privateKey}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isConnecting ? "Connecting..." : "Connect with Private Key"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-4 p-3 bg-slate-700/30 rounded-lg border border-slate-600">
          <div className="flex items-center gap-2 mb-2">
            <Eye className="h-4 w-4 text-blue-400" />
            <span className="text-sm font-medium text-blue-400">Read-Only Mode</span>
          </div>
          <p className="text-xs text-gray-400">
            You can use the bot in monitoring mode without connecting a wallet. Trading features will be disabled.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
