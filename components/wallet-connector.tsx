"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Wallet, Key, Eye, AlertTriangle, Copy, ExternalLink } from "lucide-react"
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
  const [readOnlyAddress, setReadOnlyAddress] = useState("")
  const [isConnecting, setIsConnecting] = useState(false)

  const handleMetaMaskConnect = async () => {
    setIsConnecting(true)
    try {
      if (typeof window !== "undefined" && window.ethereum) {
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" })
        if (accounts.length > 0) {
          onConnect({
            type: "metamask",
            address: accounts[0],
          })
        }
      } else {
        toast({
          title: "MetaMask Not Found",
          description: "Please install MetaMask to connect your wallet",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Failed to connect to MetaMask",
        variant: "destructive",
      })
    } finally {
      setIsConnecting(false)
    }
  }

  const handlePrivateKeyConnect = () => {
    if (!privateKey) {
      toast({
        title: "Private Key Required",
        description: "Please enter your private key",
        variant: "destructive",
      })
      return
    }

    if (!privateKey.match(/^0x[a-fA-F0-9]{64}$/) && !privateKey.match(/^[a-fA-F0-9]{64}$/)) {
      toast({
        title: "Invalid Private Key",
        description: "Please enter a valid 64-character hex private key",
        variant: "destructive",
      })
      return
    }

    // Generate a mock address from private key
    const mockAddress = `0x${Math.random().toString(16).substr(2, 40)}`

    onConnect({
      type: "private-key",
      address: mockAddress,
      signer: { privateKey },
    })
  }

  const handleReadOnlyConnect = () => {
    if (!readOnlyAddress) {
      toast({
        title: "Address Required",
        description: "Please enter a wallet address to monitor",
        variant: "destructive",
      })
      return
    }

    if (!readOnlyAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      toast({
        title: "Invalid Address",
        description: "Please enter a valid Ethereum address",
        variant: "destructive",
      })
      return
    }

    onConnect({
      type: "private-key", // Use private-key type for readonly
      address: readOnlyAddress,
    })
  }

  const copyAddress = () => {
    navigator.clipboard.writeText(walletAddress)
    toast({
      title: "Copied",
      description: "Address copied to clipboard",
    })
  }

  const openInExplorer = () => {
    window.open(`https://basescan.org/address/${walletAddress}`, "_blank")
  }

  if (isConnected) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg border border-green-400/30">
                <Wallet className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <CardTitle className="text-white">Wallet Connected</CardTitle>
                <CardDescription className="text-gray-400">
                  Connected via {walletType === "metamask" ? "MetaMask" : "Private Key"}
                </CardDescription>
              </div>
            </div>
            <Badge className="bg-green-500/20 text-green-400 border-green-400/30">Connected</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg border border-slate-600">
            <div>
              <p className="text-sm text-gray-400">Address</p>
              <p className="text-white font-mono">{formatAddress(walletAddress)}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={copyAddress}
                className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-slate-600"
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={openInExplorer}
                className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-slate-600"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
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
        <CardTitle className="text-white">Connect Wallet</CardTitle>
        <CardDescription className="text-gray-400">
          Choose your preferred connection method to start trading
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="metamask" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 bg-slate-700/50 border border-slate-600">
            <TabsTrigger value="metamask" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Wallet className="h-4 w-4 mr-2" />
              MetaMask
            </TabsTrigger>
            <TabsTrigger value="private-key" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Key className="h-4 w-4 mr-2" />
              Private Key
            </TabsTrigger>
            <TabsTrigger value="readonly" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Eye className="h-4 w-4 mr-2" />
              Read Only
            </TabsTrigger>
          </TabsList>

          <TabsContent value="metamask" className="space-y-4">
            <div className="text-center space-y-4">
              <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                <Wallet className="h-12 w-12 mx-auto mb-3 text-orange-400" />
                <h3 className="text-lg font-semibold text-white mb-2">Connect with MetaMask</h3>
                <p className="text-sm text-gray-400 mb-4">
                  Connect your MetaMask wallet to start trading. Make sure you're on the Base network.
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
                Your private key is stored locally and never transmitted. Use at your own risk.
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
                  placeholder="0x... or 64-character hex string"
                  value={privateKey}
                  onChange={(e) => setPrivateKey(e.target.value)}
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-gray-500"
                />
              </div>
              <Button onClick={handlePrivateKeyConnect} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                Connect with Private Key
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="readonly" className="space-y-4">
            <div className="space-y-4">
              <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                <Eye className="h-8 w-8 mx-auto mb-3 text-blue-400" />
                <h3 className="text-center text-lg font-semibold text-white mb-2">Monitor Only</h3>
                <p className="text-center text-sm text-gray-400 mb-4">
                  Enter any wallet address to monitor its activity without trading capabilities.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="readOnlyAddress" className="text-gray-300">
                  Wallet Address
                </Label>
                <Input
                  id="readOnlyAddress"
                  placeholder="0x..."
                  value={readOnlyAddress}
                  onChange={(e) => setReadOnlyAddress(e.target.value)}
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-gray-500"
                />
              </div>
              <Button onClick={handleReadOnlyConnect} className="w-full bg-gray-600 hover:bg-gray-700 text-white">
                Monitor Address
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
