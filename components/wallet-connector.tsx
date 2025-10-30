"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Wallet, Copy, Check, AlertTriangle, Key, Eye } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface WalletConnectorProps {
  isConnected: boolean
  walletAddress: string
  walletType: "metamask" | "private-key" | "readonly"
  onConnect: (connection: { type: "metamask" | "private-key"; address: string; signer?: any }) => void
  onDisconnect: () => void
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
  const [copied, setCopied] = useState(false)

  const formatAddress = (address: string): string => {
    if (!address) return ""
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const copyAddress = async (fullAddress: string) => {
    try {
      await navigator.clipboard.writeText(fullAddress)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast({
        title: "Address Copied",
        description: "Full wallet address copied to clipboard",
      })
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy address to clipboard",
        variant: "destructive",
      })
    }
  }

  const connectMetaMask = async () => {
    setIsConnecting(true)
    try {
      if (typeof window.ethereum !== "undefined") {
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

  const connectPrivateKey = () => {
    if (!privateKey.trim()) {
      toast({
        title: "Invalid Private Key",
        description: "Please enter a valid private key",
        variant: "destructive",
      })
      return
    }

    try {
      // Generate a mock address from private key for demo
      const mockAddress = `0x${privateKey.slice(-40).padStart(40, "0")}`

      onConnect({
        type: "private-key",
        address: mockAddress,
        signer: { privateKey },
      })

      setPrivateKey("")
    } catch (error) {
      toast({
        title: "Invalid Private Key",
        description: "Please check your private key format",
        variant: "destructive",
      })
    }
  }

  const connectReadOnly = () => {
    if (!readOnlyAddress.trim() || !readOnlyAddress.startsWith("0x") || readOnlyAddress.length !== 42) {
      toast({
        title: "Invalid Address",
        description: "Please enter a valid Ethereum address",
        variant: "destructive",
      })
      return
    }

    onConnect({
      type: "private-key", // We'll treat read-only as private-key type but without actual key
      address: readOnlyAddress,
    })

    setReadOnlyAddress("")
  }

  if (isConnected) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Wallet className="h-5 w-5 text-green-400" />
            Wallet Connected
          </CardTitle>
          <CardDescription className="text-gray-400">
            Connected via {walletType === "metamask" ? "MetaMask" : "Private Key"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-gray-300">Wallet Address</Label>
            <div className="flex items-center gap-2">
              <div className="flex-1 p-2 bg-slate-700/50 rounded border border-slate-600">
                <p className="text-white font-mono text-sm">{formatAddress(walletAddress)}</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyAddress(walletAddress)}
                className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-gray-300">Full Address</Label>
            <div className="p-2 bg-slate-900/50 rounded border border-slate-600">
              <p className="text-gray-300 font-mono text-xs break-all select-all">{walletAddress}</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => copyAddress(walletAddress)}
              className="w-full border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Full Address
                </>
              )}
            </Button>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-600">
            <div className="flex items-center gap-2">
              <Badge className="bg-green-500/20 text-green-400 border-green-400/30">Connected</Badge>
              {walletType === "readonly" && (
                <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-400/30">Read Only</Badge>
              )}
            </div>
            <Button
              onClick={onDisconnect}
              variant="outline"
              size="sm"
              className="border-red-600 text-red-400 hover:bg-red-600/10 bg-transparent"
            >
              Disconnect
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Wallet className="h-5 w-5 text-blue-400" />
          Connect Wallet
        </CardTitle>
        <CardDescription className="text-gray-400">Connect your wallet to start trading</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="metamask" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 bg-slate-700/50">
            <TabsTrigger value="metamask" className="data-[state=active]:bg-blue-600">
              MetaMask
            </TabsTrigger>
            <TabsTrigger value="private-key" className="data-[state=active]:bg-blue-600">
              Private Key
            </TabsTrigger>
            <TabsTrigger value="read-only" className="data-[state=active]:bg-blue-600">
              Read Only
            </TabsTrigger>
          </TabsList>

          <TabsContent value="metamask" className="space-y-4">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-orange-500/20 rounded-full flex items-center justify-center border border-orange-400/30">
                <Wallet className="h-8 w-8 text-orange-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Connect with MetaMask</h3>
                <p className="text-gray-400 text-sm">Use your MetaMask wallet to connect</p>
              </div>
              <Button
                onClick={connectMetaMask}
                disabled={isConnecting}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white"
              >
                {isConnecting ? "Connecting..." : "Connect MetaMask"}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="private-key" className="space-y-4">
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto bg-red-500/20 rounded-full flex items-center justify-center border border-red-400/30 mb-4">
                  <Key className="h-8 w-8 text-red-400" />
                </div>
                <h3 className="text-white font-semibold">Private Key</h3>
                <p className="text-gray-400 text-sm">Enter your private key to connect</p>
              </div>

              <Alert className="border-red-500/50 bg-red-500/10">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <AlertDescription className="text-red-200">
                  Never share your private key. Only use this on trusted devices.
                </AlertDescription>
              </Alert>

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
              </div>

              <Button
                onClick={connectPrivateKey}
                disabled={!privateKey.trim()}
                className="w-full bg-red-600 hover:bg-red-700 text-white"
              >
                Connect with Private Key
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="read-only" className="space-y-4">
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto bg-blue-500/20 rounded-full flex items-center justify-center border border-blue-400/30 mb-4">
                  <Eye className="h-8 w-8 text-blue-400" />
                </div>
                <h3 className="text-white font-semibold">Read Only Mode</h3>
                <p className="text-gray-400 text-sm">Monitor without trading capabilities</p>
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

              <Button
                onClick={connectReadOnly}
                disabled={!readOnlyAddress.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                Connect Read Only
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
