import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useAccount, useChainId, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther, formatEther } from 'viem'
import { Button } from '@/components/ui/button'
import {
  WalletIcon,
  CubeIcon,
  CurrencyDollarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  ArrowTopRightOnSquareIcon,
  BeakerIcon,
  XCircleIcon,
  CheckBadgeIcon,
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

export default function ProcessPayment() {
  const { paymentId } = useParams<{ paymentId: string }>()
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { writeContract, isPending, data: txHash } = useWriteContract()
  const { data: hash, isSuccess, isError: isTxError } = useWaitForTransactionReceipt({
    hash: txHash,
  })

  const [paymentData, setPaymentData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [solverFee, setSolverFee] = useState('0.01')
  const [currentStep, setCurrentStep] = useState<'idle' | 'approving' | 'swapping'>('idle')
  const [isRecordingTransaction, setIsRecordingTransaction] = useState(false)
  const [transactionRecorded, setTransactionRecorded] = useState(false)

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

  useEffect(() => {
    const fetchPaymentData = async () => {
      if (!paymentId) return

      try {
        setLoading(true)
        const response = await fetch(`${API_BASE_URL}/${paymentId}`)
        
        if (!response.ok) {
          throw new Error('Payment not found')
        }

        const data = await response.json()
        setPaymentData(data)
      } catch (error) {
        console.error('Failed to fetch payment data:', error)
        setError(error instanceof Error ? error.message : 'Failed to load payment')
      } finally {
        setLoading(false)
      }
    }

    fetchPaymentData()
  }, [paymentId])

  // Record transaction to backend
  const recordTransaction = async (success: boolean, transactionHash?: string, errorMessage?: string) => {
    if (!address || transactionRecorded) return

    setIsRecordingTransaction(true)
    
    try {
      const response = await fetch(`${API_BASE_URL}/attempt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentId,
          walletAddress: address,
          success,
          transactionHash,
          errorMessage
        }),
      })

      if (response.ok) {
        console.log('✅ Payment attempt recorded successfully')
        setTransactionRecorded(true)
      } else {
        console.error('❌ Failed to record payment attempt')
      }
    } catch (error) {
      console.error('❌ Error recording payment attempt:', error)
    } finally {
      setIsRecordingTransaction(false)
    }
  }

  // Handle transaction success
  useEffect(() => {
    if (isSuccess && hash) {
      console.log('✅ Transaction successful:', hash)
      setCurrentStep('idle')
      
      if (currentStep === 'swapping') {
        // Payment succeeded - record successful transaction
        console.log('🎉 Payment completed successfully!')
        recordTransaction(true, hash.transactionHash)
      }
    }
  }, [isSuccess, hash, currentStep])

  // Handle transaction error
  useEffect(() => {
    if (isTxError) {
      console.error('❌ Transaction failed')
      setCurrentStep('idle')
      recordTransaction(false, undefined, 'Transaction failed')
    }
  }, [isTxError])

  const executePayment = async () => {
    if (!address || !paymentData || !solverFee) return

    try {
      setCurrentStep('approving')
      
      // First approve the router to spend RUSD
      await writeContract({
        address: CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES]?.RUSD as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [
          CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES]?.ROUTER as `0x${string}`,
          parseEther(paymentData.amount)
        ]
      })

      setCurrentStep('swapping')
      
      // Then execute the cross-chain swap
      writeContract({
        address: CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES]?.ROUTER as `0x${string}`,
        abi: ROUTER_ABI,
        functionName: 'requestCrossChainSwap',
        args: [
          CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES]?.RUSD as `0x${string}`,
          CONTRACT_ADDRESSES[paymentData.destinationChainId as keyof typeof CONTRACT_ADDRESSES]?.RUSD as `0x${string}`,
          parseEther(paymentData.amount),
          parseEther(solverFee),
          BigInt(paymentData.destinationChainId),
          address
        ]
      })
    } catch (error) {
      console.error('❌ Payment execution failed:', error)
      setCurrentStep('idle')
      const errorMessage = error instanceof Error ? error.message : 'Payment execution failed'
      recordTransaction(false, undefined, errorMessage)
    }
  }

  const handleCompletePayment = async () => {
    try {
      await executePayment()
    } catch (error) {
      console.error('❌ Payment failed:', error)
      const errorMessage = error instanceof Error ? error.message : 'Payment failed'
      recordTransaction(false, undefined, errorMessage)
    }
  }

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <div className="spinner mb-4" />
          <p className="loading-text">Loading payment details...</p>
        </div>
      </div>
    )
  }

  if (error || !paymentData) {
    return (
      <div className="page-container">
        <div className="error-container">
          <XCircleIcon className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h2 className="error-title">Payment Not Found</h2>
          <p className="error-message">{error || 'The payment link is invalid or has expired.'}</p>
          <Button
            onClick={() => window.location.href = '/'}
            className="mt-4"
          >
            Go Home
          </Button>
        </div>
      </div>
    )
  }

  if (!isConnected) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Process Payment</h1>
          <p className="page-subtitle">Connect your wallet to complete this payment</p>
        </div>
        
        <div className="card max-w-md mx-auto text-center">
          <WalletIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-xl font-bold mb-2">Wallet Not Connected</h2>
          <p className="text-gray-600 mb-6">Please connect your wallet to complete this payment.</p>
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
        <h1 className="page-title">Process Payment</h1>
        <p className="page-subtitle">Complete your cross-chain RUSD payment</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Payment Details */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title flex items-center">
              <CurrencyDollarIcon className="w-6 h-6 mr-2" />
              Payment Details
            </h2>
            <p className="card-subtitle">Review the payment information</p>
          </div>

          <div className="space-y-6">
            {/* Payment Info */}
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-600">Payment ID</span>
                <span className="font-mono text-sm">{paymentId}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-600">Amount</span>
                <span className="font-semibold font-mono">{formatEther(paymentData.amount)} RUSD</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-600">From</span>
                <span className="font-semibold">{getChainName(paymentData.sourceChainId)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-600">To</span>
                <span className="font-semibold">{getChainName(paymentData.destinationChainId)}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600">Creator</span>
                <span className="font-mono text-sm">
                  {paymentData.creatorAddress?.slice(0, 6)}...{paymentData.creatorAddress?.slice(-4)}
                </span>
              </div>
            </div>

            {/* Solver Fee */}
            <div className="form-group">
              <label className="form-label">Solver Fee (ETH)</label>
              <div className="relative">
                <input
                  type="number"
                  value={solverFee}
                  onChange={(e) => setSolverFee(e.target.value)}
                  placeholder="0.01"
                  className="form-input pr-12"
                  step="0.001"
                  min="0"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <span className="text-sm font-mono text-gray-500">ETH</span>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-1">Fee paid to solver for executing the cross-chain transfer</p>
            </div>

            {/* Process Button */}
            <Button
              onClick={handleCompletePayment}
              disabled={!solverFee || isPending || currentStep !== 'idle'}
              size="lg"
              className="w-full"
            >
              {isPending ? (
                <>
                  <div className="spinner mr-2" />
                  {currentStep === 'approving' ? 'Approving...' : 'Processing...'}
                </>
              ) : (
                <>
                  <ArrowPathIcon className="w-5 h-5 mr-2" />
                  Process Payment
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Status & Results */}
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

          {/* Transaction Status */}
          {(currentStep !== 'idle' || isSuccess || isTxError) && (
            <div className="card">
              <div className="card-header">
                <h3 className="card-title flex items-center">
                  <ClockIcon className="w-5 h-5 mr-2" />
                  Transaction Status
                </h3>
              </div>
              <div className="space-y-4">
                {currentStep === 'approving' && (
                  <div className="flex items-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="spinner mr-3" />
                    <div>
                      <p className="font-semibold text-yellow-800">Approving RUSD</p>
                      <p className="text-sm text-yellow-600">Please confirm the approval transaction in your wallet</p>
                    </div>
                  </div>
                )}

                {currentStep === 'swapping' && (
                  <div className="flex items-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="spinner mr-3" />
                    <div>
                      <p className="font-semibold text-blue-800">Processing Payment</p>
                      <p className="text-sm text-blue-600">Cross-chain payment in progress...</p>
                    </div>
                  </div>
                )}

                {isSuccess && (
                  <div className="flex items-center p-4 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircleIcon className="w-6 h-6 mr-3 text-green-600" />
                    <div className="flex-1">
                      <p className="font-semibold text-green-800">Payment Successful!</p>
                      <p className="text-sm text-green-600">Your payment has been processed successfully</p>
                      {hash && (
                        <a
                          href={`https://${chainId === 84532 ? 'sepolia.basescan.org' : 'testnet.snowtrace.io'}/tx/${hash.transactionHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center mt-2 text-sm text-green-700 hover:text-green-800"
                        >
                          View Transaction
                          <ArrowTopRightOnSquareIcon className="w-4 h-4 ml-1" />
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {isTxError && (
                  <div className="flex items-center p-4 bg-red-50 border border-red-200 rounded-lg">
                    <XCircleIcon className="w-6 h-6 mr-3 text-red-600" />
                    <div>
                      <p className="font-semibold text-red-800">Payment Failed</p>
                      <p className="text-sm text-red-600">Transaction was not successful</p>
                    </div>
                  </div>
                )}

                {/* Recording Status */}
                {isRecordingTransaction && (
                  <div className="flex items-center p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="spinner mr-3" />
                    <div>
                      <p className="font-semibold text-gray-800">Recording Transaction</p>
                      <p className="text-sm text-gray-600">Saving transaction details...</p>
                    </div>
                  </div>
                )}

                {transactionRecorded && (
                  <div className="flex items-center p-4 bg-green-50 border border-green-200 rounded-lg">
                    <CheckBadgeIcon className="w-6 h-6 mr-3 text-green-600" />
                    <div>
                      <p className="font-semibold text-green-800">Transaction Recorded</p>
                      <p className="text-sm text-green-600">Transaction details saved successfully</p>
                    </div>
                  </div>
                )}
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