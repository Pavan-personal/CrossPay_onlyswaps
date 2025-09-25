import { useState } from 'react'
import { useAccount, useChainId, useWriteContract } from 'wagmi'
import { parseEther } from 'viem'
import QRCode from 'qrcode'
import { Button } from '@/components/ui/button'
import {
  XCircleIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
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
      className="bg-gray-800 text-white hover:bg-gray-700"
    >
      {isPending ? 'Requesting...' : 'Get 1000 RUSD'}
    </Button>
  )
}

export default function CreatePayment() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()

  // State
  const [senderAddress, setSenderAddress] = useState('')
  const [amount, setAmount] = useState('')
  const [solverFee, setSolverFee] = useState('0.01')
  const [destinationChainId, setDestinationChainId] = useState(43113) // Default to Avalanche Fuji
  const [expiresInHours, setExpiresInHours] = useState(24)
  const [isCreating, setIsCreating] = useState(false)
  const [paymentLink, setPaymentLink] = useState('')
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [error, setError] = useState('')
  
  // Toast state
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null)

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type })
  }

  const closeToast = () => {
    setToast(null)
  }

  // Get current chain name
  const getCurrentChainName = (chainId: number) => {
    switch (chainId) {
      case 84532: return 'Base Sepolia'
      case 43113: return 'Avalanche Fuji'
      default: return `Unknown (${chainId})`
    }
  }

  const createPayment = async () => {
    if (!isConnected || !address) {
      setError('Please connect your wallet first')
      return
    }

    if (!senderAddress || !amount) {
      setError('Please fill in all required fields')
      return
    }

    setIsCreating(true)
    setError('')

    try {
      const response = await fetch(`${API_BASE_URL}/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorAddress: address, // Creator (who creates the payment request and will receive money)
          recipientAddress: senderAddress, // Recipient (who will pay the money)
          amount: parseEther(amount).toString(),
          solverFee: parseEther(solverFee).toString(),
          sourceChainId: chainId, // Use current chain as source
          destinationChainId, // Where creator wants to receive money
          expiresInHours
        })
      })

      const result = await response.json()

      if (result.success) {
        const fullPaymentLink = `${window.location.origin}/payment/${result.data.paymentId}`
        setPaymentLink(fullPaymentLink)
        const qr = await QRCode.toDataURL(fullPaymentLink)
        setQrCodeUrl(qr)
        showToast('Payment link created successfully!', 'success')
        console.log('✅ Payment link created:', fullPaymentLink)
      } else {
        setError(result.error || 'Failed to create payment link')
        showToast(result.error || 'Failed to create payment link', 'error')
        console.error('❌ Failed to create payment link:', result.error)
      }
    } catch (err) {
      setError('An unexpected error occurred.')
      showToast('An unexpected error occurred.', 'error')
      console.error('❌ Error creating payment link:', err)
    } finally {
      setIsCreating(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    showToast('Copied to clipboard!', 'success')
  }

  const downloadQRCode = () => {
    if (qrCodeUrl) {
      const link = document.createElement('a')
      link.download = 'payment-qr-code.png'
      link.href = qrCodeUrl
      link.click()
    }
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircleIcon className="w-8 h-8 text-gray-400" />
          </div>
          <h1 className="text-3xl font-bold text-black mb-4">Connect Your Wallet</h1>
          <p className="text-gray-600 text-lg">Please connect your wallet to create payment links.</p>
        </div>
      </div>
    )
  }

  const currentChainName = getCurrentChainName(chainId)
  const destinationChainName = getCurrentChainName(destinationChainId)

  return (
    <div className="min-h-screen bg-white">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm ${
          toast.type === 'success' ? 'bg-green-500 text-white' :
          toast.type === 'error' ? 'bg-red-500 text-white' :
          'bg-blue-500 text-white'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{toast.message}</span>
            <button onClick={closeToast} className="ml-4 text-white hover:text-gray-200">
              <XCircleIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-black mb-4">Create Payment</h1>
          <p className="text-gray-600 text-lg">
            Create a payment request with QR code and shareable link
          </p>
        </div>

        {/* Network Info */}
        <div className="bg-gray-100 rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-black">Current Network</h3>
              <p className="text-gray-600">{currentChainName} (Chain ID: {chainId})</p>
            </div>
            <FaucetButton chainId={chainId || 84532} />
          </div>
        </div>

        {/* Create Payment Form */}
        <div className="bg-white border-2 border-black rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-black mb-6">Payment Request Details</h2>
          
          <div className="space-y-6">
            <div>
              <label htmlFor="senderAddress" className="block text-sm font-medium text-gray-700 mb-2">Sender Address (who will pay you)</label>
              <input
                type="text"
                id="senderAddress"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none"
                value={senderAddress}
                onChange={(e) => setSenderAddress(e.target.value)}
                placeholder="0x..."
              />
            </div>

            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">Amount (RUSD)</label>
              <input
                type="number"
                id="amount"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <label htmlFor="solverFee" className="block text-sm font-medium text-gray-700 mb-2">Solver Fee (RUSD)</label>
              <input
                type="number"
                id="solverFee"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none"
                value={solverFee}
                onChange={(e) => setSolverFee(e.target.value)}
                placeholder="0.01"
                min="0"
                step="0.001"
              />
            </div>

            <div>
              <label htmlFor="destinationChain" className="block text-sm font-medium text-gray-700 mb-2">Destination Chain (where you receive RUSD)</label>
              <select
                id="destinationChain"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none"
                value={destinationChainId}
                onChange={(e) => setDestinationChainId(Number(e.target.value))}
              >
                <option value={84532}>Base Sepolia</option>
                <option value={43113}>Avalanche Fuji</option>
              </select>
            </div>

            <div>
              <label htmlFor="expiresInHours" className="block text-sm font-medium text-gray-700 mb-2">Expires In (Hours)</label>
              <input
                type="number"
                id="expiresInHours"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none"
                value={expiresInHours}
                onChange={(e) => setExpiresInHours(Number(e.target.value))}
                min="1"
                step="1"
              />
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Your current chain:</span>
                <span className="font-semibold text-black">{currentChainName}</span>
              </div>
              <div className="flex justify-between items-center text-sm mt-1">
                <span className="text-gray-600">You will receive RUSD on:</span>
                <span className="font-semibold text-black">{destinationChainName}</span>
              </div>
            </div>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <Button
              onClick={createPayment}
              disabled={isCreating || !senderAddress || !amount}
              className="w-full py-4 text-lg font-bold bg-black text-white hover:bg-gray-800"
            >
              {isCreating ? 'Creating...' : 'Create Payment Link'}
            </Button>
          </div>
        </div>

        {/* Payment Link Created */}
        {paymentLink && (
          <div className="bg-white border-2 border-black rounded-lg p-8 mb-8">
            <div className="flex items-center space-x-3 mb-6">
              <CheckCircleIcon className="w-8 h-8 text-green-600" />
              <h3 className="text-2xl font-bold text-black">Payment Link Created!</h3>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Link</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    readOnly
                    value={paymentLink}
                    className="flex-grow px-4 py-3 border-2 border-gray-300 rounded-lg bg-gray-50"
                  />
                  <Button
                    onClick={() => copyToClipboard(paymentLink)}
                    className="bg-gray-800 text-white hover:bg-gray-700"
                  >
                    Copy
                  </Button>
                </div>
              </div>

              {qrCodeUrl && (
                <div className="text-center">
                  <div className="inline-block p-4 bg-white border-2 border-gray-300 rounded-lg">
                    <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48" />
                  </div>
                  <p className="text-sm text-gray-500 mt-2">Scan to pay</p>
                  <Button
                    onClick={downloadQRCode}
                    className="mt-4 bg-gray-800 text-white hover:bg-gray-700"
                  >
                    <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                    Download QR Code
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-black mb-4">How it works</h3>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>Enter the sender's wallet address (who will pay you)</li>
            <li>Enter the amount of RUSD you want to receive</li>
            <li>Set the solver fee (paid in RUSD) for cross-chain execution</li>
            <li>Select the destination chain where you want to receive the tokens</li>
            <li>Set expiration time for the payment request</li>
            <li>Click "Create Payment" to generate a payment link and QR code</li>
            <li>Share the link or QR code with the sender to receive payment</li>
          </ol>
        </div>
      </div>
    </div>
  )
}