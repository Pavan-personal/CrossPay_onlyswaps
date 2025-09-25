import { useState } from 'react'
import { useAccount, useChainId, useWriteContract } from 'wagmi'
import { parseEther } from 'viem'
import QRCode from 'qrcode'
import { Button } from '@/components/ui/button'
import {
  QrCodeIcon,
  LinkIcon,
  ClipboardDocumentIcon,
  ArrowDownTrayIcon,
  WalletIcon,
  CubeIcon,
  CurrencyDollarIcon,
  ClockIcon,
  BeakerIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowTopRightOnSquareIcon,
  ShareIcon,
  DocumentDuplicateIcon,
} from '@heroicons/react/24/outline'

const API_BASE_URL = 'http://localhost:3001/api/payment'
const RUSD_TOKEN = '0x908e1D85604E0e9e703d52D18f3f3f604Fe7Bb1b'

function FaucetButton({ chainId }: { chainId: number }) {
  const { address } = useAccount()
  const { writeContract, isPending } = useWriteContract()

  const handleFaucet = async () => {
    if (!chainId || !address) return

    try {
      writeContract({
        address: RUSD_TOKEN,
        abi: [
          {
            "inputs": [{"name": "to", "type": "address"}, {"name": "amount", "type": "uint256"}],
            "name": "mint",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
          }
        ],
        functionName: 'mint',
        args: [address as `0x${string}`, parseEther('1000')],
        chainId,
      })
    } catch (error) {
      console.error('Faucet error:', error)
    }
  }

  return (
    <Button
      onClick={handleFaucet}
      disabled={isPending}
      variant="outline"
      size="sm"
      className="w-full"
    >
      {isPending ? (
        <div className="spinner mr-2" />
      ) : (
        <BeakerIcon className="w-4 h-4 mr-2" />
      )}
      Get 1000 RUSD
    </Button>
  )
}

export default function CreatePayment() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()

  const [amount, setAmount] = useState('')
  const [destinationChainId, setDestinationChainId] = useState(43113)
  const [paymentMode, setPaymentMode] = useState<'qr' | 'link'>('qr')
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('')
  const [paymentLink, setPaymentLink] = useState('')
  const [paymentId, setPaymentId] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const getChainName = (chainId: number) => {
    switch (chainId) {
      case 84532: return 'Base Sepolia'
      case 43113: return 'Avalanche Fuji'
      default: return `Chain ${chainId}`
    }
  }

  const getChainColor = (chainId: number) => {
    switch (chainId) {
      case 84532: return 'bg-blue-500'
      case 43113: return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const generateQRCode = async (data: string) => {
    try {
      const qrDataUrl = await QRCode.toDataURL(data, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })
      setQrCodeDataUrl(qrDataUrl)
    } catch (error) {
      console.error('QR Code generation failed:', error)
    }
  }

  const createPaymentLink = async () => {
    if (!amount || !address) return

    setIsGenerating(true)
    setError('')
    setSuccess(false)

    try {
      const paymentData = {
        amount: parseEther(amount).toString(),
        sourceChainId: chainId,
        destinationChainId,
        creatorAddress: address,
        mode: paymentMode
      }

      const response = await fetch(`${API_BASE_URL}/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      })

      if (!response.ok) {
        throw new Error('Failed to create payment link')
      }

      const result = await response.json()
      setPaymentId(result.paymentId)
      setPaymentLink(`${window.location.origin}/payment/${result.paymentId}`)
      setSuccess(true)

      if (paymentMode === 'qr') {
        await generateQRCode(`${window.location.origin}/payment/${result.paymentId}`)
      }
    } catch (error) {
      console.error('Payment creation failed:', error)
      setError(error instanceof Error ? error.message : 'Failed to create payment')
    } finally {
      setIsGenerating(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
    }
  }

  const downloadQRCode = () => {
    if (!qrCodeDataUrl) return

    const link = document.createElement('a')
    link.download = `payment-qr-${paymentId}.png`
    link.href = qrCodeDataUrl
    link.click()
  }

  if (!isConnected) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Create Payment</h1>
          <p className="page-subtitle">Connect your wallet to create payment links and QR codes</p>
        </div>
        
        <div className="card max-w-md mx-auto text-center">
          <WalletIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-xl font-bold mb-2">Wallet Not Connected</h2>
          <p className="text-gray-600 mb-6">Please connect your wallet to access the payment creation functionality.</p>
          <Button size="lg" className="w-full">
            <WalletIcon className="w-5 h-5 mr-2" />
            Connect Wallet
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Create Payment</h1>
        <p className="page-subtitle">Generate QR codes and payment links for cross-chain RUSD payments</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Payment Configuration */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title flex items-center">
              <CurrencyDollarIcon className="w-6 h-6 mr-2" />
              Payment Configuration
            </h2>
            <p className="card-subtitle">Configure your payment parameters</p>
          </div>

          <div className="space-y-6">
            {/* Amount Input */}
            <div className="form-group">
              <label className="form-label">Amount (RUSD)</label>
              <div className="relative">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.0"
                  className="form-input pr-12"
                  step="0.01"
                  min="0"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <span className="text-sm font-mono text-gray-500">RUSD</span>
                </div>
              </div>
            </div>

            {/* Destination Chain */}
            <div className="form-group">
              <label className="form-label">Destination Chain</label>
              <select
                value={destinationChainId}
                onChange={(e) => setDestinationChainId(Number(e.target.value))}
                className="form-select"
              >
                <option value={43113}>Avalanche Fuji</option>
                <option value={84532}>Base Sepolia</option>
              </select>
            </div>

            {/* Payment Mode */}
            <div className="form-group">
              <label className="form-label">Payment Mode</label>
              <div className="flex space-x-4">
                <button
                  onClick={() => setPaymentMode('qr')}
                  className={`flex-1 p-3 border-2 rounded-lg text-center transition-all ${
                    paymentMode === 'qr'
                      ? 'border-black bg-black text-white'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                  }`}
                >
                  <QrCodeIcon className="w-6 h-6 mx-auto mb-2" />
                  <span className="font-semibold">QR Code</span>
                </button>
                <button
                  onClick={() => setPaymentMode('link')}
                  className={`flex-1 p-3 border-2 rounded-lg text-center transition-all ${
                    paymentMode === 'link'
                      ? 'border-black bg-black text-white'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                  }`}
                >
                  <LinkIcon className="w-6 h-6 mx-auto mb-2" />
                  <span className="font-semibold">Payment Link</span>
                </button>
              </div>
            </div>

            {/* Generate Button */}
            <Button
              onClick={createPaymentLink}
              disabled={!amount || isGenerating}
              size="lg"
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <div className="spinner mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <ShareIcon className="w-5 h-5 mr-2" />
                  Generate Payment
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Payment Details & Results */}
        <div className="space-y-6">
          {/* Current Chain Info */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title flex items-center">
                <CubeIcon className="w-5 h-5 mr-2" />
                Current Network
              </h3>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-3 ${getChainColor(chainId)}`}></div>
                <span className="font-semibold">{getChainName(chainId)}</span>
              </div>
              <span className="text-sm font-mono text-gray-600">Chain ID: {chainId}</span>
            </div>
          </div>

          {/* Payment Summary */}
          {amount && (
            <div className="card">
              <div className="card-header">
                <h3 className="card-title flex items-center">
                  <ClockIcon className="w-5 h-5 mr-2" />
                  Payment Summary
                </h3>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-gray-600">From</span>
                  <span className="font-semibold">{getChainName(chainId)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-gray-600">To</span>
                  <span className="font-semibold">{getChainName(destinationChainId)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-gray-600">Amount</span>
                  <span className="font-semibold font-mono">{amount} RUSD</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">Mode</span>
                  <span className="font-semibold capitalize">{paymentMode}</span>
                </div>
              </div>
            </div>
          )}

          {/* Success State */}
          {success && (
            <div className="card">
              <div className="card-header">
                <h3 className="card-title flex items-center text-green-800">
                  <CheckCircleIcon className="w-6 h-6 mr-2" />
                  Payment Created Successfully
                </h3>
              </div>
              <div className="space-y-4">
                {paymentMode === 'qr' && qrCodeDataUrl && (
                  <div className="text-center">
                    <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-lg">
                      <img src={qrCodeDataUrl} alt="Payment QR Code" className="w-64 h-64" />
                    </div>
                    <div className="mt-4 space-x-2">
                      <Button
                        onClick={downloadQRCode}
                        variant="outline"
                        size="sm"
                      >
                        <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                        Download QR
                      </Button>
                    </div>
                  </div>
                )}

                {paymentLink && (
                  <div className="space-y-3">
                    <div>
                      <label className="form-label">Payment Link</label>
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={paymentLink}
                          readOnly
                          className="form-input flex-1"
                        />
                        <Button
                          onClick={() => copyToClipboard(paymentLink)}
                          variant="outline"
                          size="sm"
                        >
                          <DocumentDuplicateIcon className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-semibold mb-2">Payment Details</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Payment ID:</span>
                          <span className="font-mono">{paymentId}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Amount:</span>
                          <span className="font-mono">{amount} RUSD</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Destination:</span>
                          <span className="font-mono">{getChainName(destinationChainId)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <Button
                        onClick={() => window.open(paymentLink, '_blank')}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        <ArrowTopRightOnSquareIcon className="w-4 h-4 mr-2" />
                        Open Payment
                      </Button>
                      <Button
                        onClick={() => copyToClipboard(paymentLink)}
                        size="sm"
                        className="flex-1"
                      >
                        <ClipboardDocumentIcon className="w-4 h-4 mr-2" />
                        Copy Link
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="card border-red-200 bg-red-50">
              <div className="flex items-center p-4">
                <ExclamationTriangleIcon className="w-6 h-6 mr-3 text-red-600" />
                <div>
                  <h3 className="font-semibold text-red-800">Error</h3>
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Faucet Section */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title flex items-center">
                <BeakerIcon className="w-5 h-5 mr-2" />
                Testnet Faucet
              </h3>
              <p className="card-subtitle">Get test RUSD tokens for testing</p>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start">
                  <ExclamationTriangleIcon className="w-5 h-5 mr-2 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-yellow-800 font-semibold">Testnet Only</p>
                    <p className="text-sm text-yellow-700">This faucet provides test RUSD tokens with no real value</p>
                  </div>
                </div>
              </div>
              <FaucetButton chainId={chainId} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}