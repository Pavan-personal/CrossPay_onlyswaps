import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useAccount, useChainId, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther, formatEther } from 'viem'
import { Button } from '@/components/ui/button'
import {
  XCircleIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline'

const API_BASE_URL = 'http://localhost:3001/api/payment'

// Updated contract addresses - these should match the deployed contracts
const RUSD_TOKEN = '0x908e1D85604E0e9e703d52D18f3f3f604Fe7Bb1b' // Base Sepolia RUSD

// Contract addresses for different chains
const CONTRACT_ADDRESSES = {
  84532: { // Base Sepolia
    RUSD: '0x908e1D85604E0e9e703d52D18f3f3f604Fe7Bb1b',
    ROUTER: '0x3dD1a497846d060Dce130B67b22E1F9DeE18c051'
  },
  43113: { // Avalanche Fuji
    RUSD: '0x908e1D85604E0e9e703d52D18f3f3f604Fe7Bb1b', // Same address on both chains
    ROUTER: '0x3dD1a497846d060Dce130B67b22E1F9DeE18c051' // Same address on both chains
  }
}

const ERC20_ABI = [
  {
    "inputs": [
      {"name": "spender", "type": "address"},
      {"name": "amount", "type": "uint256"}
    ],
    "name": "approve",
    "outputs": [{"name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  }
]

const ROUTER_ABI = [
  {
    "inputs": [
      {"name": "tokenIn", "type": "address"},
      {"name": "tokenOut", "type": "address"},
      {"name": "amount", "type": "uint256"},
      {"name": "solverFee", "type": "uint256"},
      {"name": "dstChainId", "type": "uint256"},
      {"name": "recipient", "type": "address"}
    ],
    "name": "requestCrossChainSwap",
    "outputs": [{"name": "requestId", "type": "bytes32"}],
    "stateMutability": "nonpayable",
    "type": "function"
  }
]

// API Functions
const validatePayment = async (paymentId: string, recipientAddress: string) => {
  const response = await fetch(`${API_BASE_URL}/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ paymentId, recipientAddress }),
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to validate payment')
  }
  
  return response.json()
}

const recordPaymentAttempt = async (paymentId: string, attemptAddress: string, attemptChainId: number, success: boolean, transactionHash?: string, errorMessage?: string) => {
  const response = await fetch(`${API_BASE_URL}/attempt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      paymentId,
      attemptAddress,
      attemptChainId,
      success,
      transactionHash,
      errorMessage
    }),
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to record payment attempt')
  }
  
  return response.json()
}

function FaucetButton({ chainId, address }: { chainId: number, address: string | undefined }) {
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

export default function ProcessPayment() {
  const { paymentId } = useParams<{ paymentId: string }>()
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { writeContract, isPending: isWritePending, data: txHash } = useWriteContract()
  
  // Custom confirmation state to avoid the useWaitForTransactionReceipt issue
  const [isConfirming, setIsConfirming] = useState(false)
  const [currentStep, setCurrentStep] = useState<'idle' | 'approving' | 'swapping' | 'completed' | 'failed'>('idle')
  
  // State
  const [manualPaymentId, setManualPaymentId] = useState('')
  const [paymentData, setPaymentData] = useState<any>(null)
  const [isValidating, setIsValidating] = useState(false)
  const [validationError, setValidationError] = useState('')
  const [txStatus, setTxStatus] = useState('')
  const [hasValidated, setHasValidated] = useState(false)

  // Use paymentId from URL params, or manual input
  const currentPaymentId = paymentId || manualPaymentId
  
  // Only call useWaitForTransactionReceipt when we have a transaction hash
  const { data: hash, isSuccess: isTxSuccess, isError: isTxError } = useWaitForTransactionReceipt({
    hash: txHash,
  })

  // Handle transaction success
  useEffect(() => {
    if (isTxSuccess && hash) {
      console.log('✅ Transaction confirmed:', hash)
      
      if (currentStep === 'approving') {
        // Approval succeeded, now execute swap
        setCurrentStep('swapping')
        setTxStatus('Approval successful! Now executing swap...')
        executeSwap()
      } else if (currentStep === 'swapping') {
        // Swap succeeded
        setIsConfirming(false)
        setCurrentStep('completed')
        setTxStatus(`Payment completed successfully! Transaction: ${hash.transactionHash}`)
        
        // Record successful payment attempt
        if (currentPaymentId && address) {
          recordPaymentAttempt(currentPaymentId, address, chainId || 0, true, hash.transactionHash)
        }
      }
    }
  }, [isTxSuccess, hash, currentStep, currentPaymentId, address, chainId])

  // Handle transaction error
  useEffect(() => {
    if (isTxError) {
      console.log('❌ Transaction failed')
      setIsConfirming(false)
      setCurrentStep('failed')
      setTxStatus('Transaction failed')
      
      // Record failed payment attempt
      if (currentPaymentId && address) {
        recordPaymentAttempt(currentPaymentId, address, chainId || 0, false, undefined, 'Transaction failed')
      }
    }
  }, [isTxError, currentPaymentId, address, chainId])

  const validatePaymentLink = async () => {
    if (!currentPaymentId || !address || hasValidated) {
      return
    }

    setHasValidated(true)
    setIsValidating(true)
    setValidationError('')

    try {
      const result = await validatePayment(currentPaymentId, address)
      setPaymentData(result.data)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setValidationError(errorMessage)
    } finally {
      setIsValidating(false)
    }
  }

  const executeSwap = async () => {
    if (!address || !paymentData) return

    try {
      const contracts = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES] || CONTRACT_ADDRESSES[84532]
      if (!contracts) {
        throw new Error(`Unsupported chain: ${chainId}`)
      }

      setTxStatus('Executing cross-chain swap...')
      const amountWei = BigInt(paymentData.amount.toString())
      const solverFeeWei = BigInt(paymentData.solverFee.toString())

      writeContract({
        address: contracts.ROUTER as `0x${string}`,
        abi: ROUTER_ABI,
        functionName: 'requestCrossChainSwap',
        args: [
          contracts.RUSD, // tokenIn
          contracts.RUSD, // tokenOut
          amountWei,  // amount
          solverFeeWei, // solverFee
          paymentData.destinationChainId, // destinationChainId
          paymentData.creatorAddress as `0x${string}` // creator (who will receive the money!)
        ],
        chainId,
      })
      
      setTxStatus('Swap transaction submitted - waiting for confirmation...')

    } catch (error) {
      console.error('Swap execution error:', error)
      setTxStatus('Swap failed')
      setCurrentStep('failed')
      setIsConfirming(false)
    }
  }

  const handleCompletePayment = async () => {
    if (!address || !paymentData) {
      return
    }

    setTxStatus('Starting payment process...')
    setIsConfirming(true)
    setCurrentStep('approving')
    
    try {
      // Get contract addresses for current chain
      const contracts = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES] || CONTRACT_ADDRESSES[84532]
      if (!contracts) {
        throw new Error(`Unsupported chain: ${chainId}`)
      }

      // Convert string amounts to BigInt properly
      const amountWei = BigInt(paymentData.amount.toString())
      const feeWei = BigInt(paymentData.solverFee.toString())
      const totalCost = amountWei + feeWei
      
      // Step 1: Approve tokens
      setTxStatus('Step 1: Approving RUSD tokens...')
      
      writeContract({
        address: contracts.RUSD as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [contracts.ROUTER, totalCost],
        chainId,
      })
      
      setTxStatus('Approval transaction submitted - waiting for confirmation...')

    } catch (error) {
      console.error('Complete payment error:', error)
      setTxStatus('Payment failed')
      setIsConfirming(false)
      setCurrentStep('failed')
      await recordPaymentAttempt(currentPaymentId, address, chainId || 0, false, undefined, 'Payment failed')
    }
  }

  // Reset validation when paymentId changes
  useEffect(() => {
    setHasValidated(false)
    setPaymentData(null)
    setValidationError('')
  }, [currentPaymentId])

  // Auto-validate when paymentId and address are available (only once)
  useEffect(() => {
    if (currentPaymentId && address && !hasValidated) {
      validatePaymentLink()
    }
  }, [currentPaymentId, address, hasValidated])

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircleIcon className="w-8 h-8 text-gray-400" />
          </div>
          <h1 className="text-3xl font-bold text-black mb-4">Connect Your Wallet</h1>
          <p className="text-gray-600 text-lg">Connect your wallet to process this payment link.</p>
        </div>
      </div>
    )
  }

  if (!currentPaymentId) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <h1 className="text-3xl font-bold text-black mb-4">Process Payment</h1>
          <p className="text-gray-600 text-lg mb-8">Enter a payment ID to process a payment, or use a payment link.</p>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Enter payment ID"
              value={manualPaymentId}
              onChange={(e) => setManualPaymentId(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none"
            />
            <Button 
              onClick={validatePaymentLink}
              disabled={!manualPaymentId || !address}
              className="w-full bg-black text-white hover:bg-gray-800"
            >
              Validate Payment
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (isValidating) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <ArrowPathIcon className="w-8 h-8 text-gray-400 animate-spin" />
          </div>
          <h1 className="text-3xl font-bold text-black mb-4">Validating Payment Link...</h1>
          <p className="text-gray-600 text-lg">Please wait while we validate your payment link.</p>
        </div>
      </div>
    )
  }

  if (validationError) {
    const isRecipientError = validationError.includes('not the authorized recipient')
    
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <ExclamationTriangleIcon className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-3xl font-bold text-black mb-4">❌ Payment Access Denied</h1>
          {isRecipientError ? (
            <>
              <p className="text-gray-600 text-lg mb-4">🔒 <strong>Security Error:</strong> You are not the authorized recipient for this payment.</p>
              <p className="text-gray-600 mb-6">Only the intended recipient wallet can process this payment link.</p>
              <div className="bg-gray-100 p-4 rounded-lg mb-6">
                <p className="text-sm text-gray-700"><strong>Your wallet:</strong> {address}</p>
              </div>
            </>
          ) : (
            <>
              <p className="text-gray-600 text-lg mb-4">{validationError}</p>
              <p className="text-gray-600 mb-6">Please check that the payment link is valid and not expired.</p>
            </>
          )}
          <Button 
            onClick={() => window.location.href = '/'} 
            className="bg-black text-white hover:bg-gray-800"
          >
            Go Back to Home
          </Button>
        </div>
      </div>
    )
  }

  if (!paymentData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircleIcon className="w-8 h-8 text-gray-400" />
          </div>
          <h1 className="text-3xl font-bold text-black mb-4">Payment Link Not Found</h1>
          <p className="text-gray-600 text-lg mb-6">No payment data available. Please check the payment link.</p>
          <Button 
            onClick={() => window.location.href = '/'} 
            className="bg-black text-white hover:bg-gray-800"
          >
            Go Back to Home
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-black mb-4">Pay Request</h1>
          <p className="text-gray-600 text-lg">Complete this cross-chain RUSD payment request</p>
        </div>

        {/* Faucet Section */}
        <div className="bg-gray-100 rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-black">Get Test Tokens</h3>
              <p className="text-gray-600 text-sm">Need RUSD to complete this payment?</p>
            </div>
            <FaucetButton chainId={chainId || 0} address={address} />
          </div>
        </div>

        {/* Payment Details */}
        <div className="bg-white border-2 border-black rounded-lg p-8 mb-8">
          <h3 className="text-2xl font-bold text-black mb-6">Payment Request Details</h3>
          <div className="space-y-6">
            {/* Amount and Fee Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">Amount to Pay</span>
                  <span className="text-2xl font-bold text-black">{formatEther(BigInt(paymentData.amount))} RUSD</span>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">Solver Fee</span>
                  <span className="text-2xl font-bold text-black">{formatEther(BigInt(paymentData.solverFee))} RUSD</span>
                </div>
              </div>
            </div>

            {/* Chain Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">From Chain</span>
                  <span className="font-semibold text-black">{paymentData.sourceChainId === 84532 ? 'Base Sepolia' : 'Avalanche Fuji'}</span>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">To Chain</span>
                  <span className="font-semibold text-black">{paymentData.destinationChainId === 84532 ? 'Base Sepolia' : 'Avalanche Fuji'}</span>
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-start">
                  <span className="text-gray-600 font-medium">Pay To (Creator)</span>
                  <span className="font-mono text-sm text-black text-right">{paymentData.creatorAddress}</span>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-start">
                  <span className="text-gray-600 font-medium">Your Address (Sender)</span>
                  <span className="font-mono text-sm text-black text-right">{address}</span>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">Expires</span>
                  <span className="text-black">{new Date(paymentData.expiresAt).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-white border-2 border-black rounded-lg p-8 mb-8">
          <h3 className="text-2xl font-bold text-black mb-6">Complete Payment</h3>
          <div className="space-y-6">
            <Button 
              className={`w-full py-4 text-lg font-bold ${
                currentStep === 'completed' 
                  ? 'bg-black text-white hover:bg-gray-800' 
                  : 'bg-black text-white hover:bg-gray-800'
              }`}
              onClick={handleCompletePayment}
              disabled={isWritePending || isConfirming}
            >
              {currentStep === 'approving' ? 'Approving...' : 
               currentStep === 'swapping' ? 'Swapping...' : 
               currentStep === 'completed' ? 'Payment Completed!' :
               currentStep === 'failed' ? 'Payment Failed' :
               isWritePending ? 'Processing...' : 'Complete Payment'}
            </Button>
            <div className="bg-gray-100 p-4 rounded-lg">
              <p className="text-sm text-gray-700">
                This will open MetaMask with TWO popups sequentially:<br/>
                1. First popup: Approve RUSD tokens (required for swap)<br/>
                2. Second popup: Execute cross-chain swap (opens after approval)<br/>
                <strong>Both must be approved for payment to complete!</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Transaction Status */}
        {txStatus && (
          <div className="bg-gray-100 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-black mb-4">Status</h3>
            <div className="flex items-center space-x-3">
              {currentStep === 'completed' ? (
                <CheckCircleIcon className="w-6 h-6 text-black" />
              ) : currentStep === 'failed' ? (
                <ExclamationTriangleIcon className="w-6 h-6 text-black" />
              ) : (
                <ArrowPathIcon className="w-6 h-6 text-black animate-spin" />
              )}
              <p className={`text-lg ${
                txStatus.includes('success') || currentStep === 'completed' ? 'text-black' : 
                currentStep === 'failed' ? 'text-black' : 'text-black'
              }`}>
                {txStatus}
              </p>
            </div>
            {hash && (
              <div className="mt-4 p-4 bg-white rounded-lg border">
                <p className="text-sm text-gray-600 mb-2">Transaction Hash:</p>
                <p className="font-mono text-sm break-all">{hash.transactionHash}</p>
                <a
                  href={`https://${chainId === 84532 ? 'sepolia.basescan.org' : 'testnet.snowtrace.io'}/tx/${hash.transactionHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm mt-2 inline-block"
                >
                  View Transaction →
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}