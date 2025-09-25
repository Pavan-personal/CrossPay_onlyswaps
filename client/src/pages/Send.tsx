import { useState, useEffect } from 'react'
import { useAccount, useChainId, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther } from 'viem'
import { recordSendTransaction, type SendTransactionData } from '../utils/transactionRecorder'
import { Button } from '@/components/ui/button'
import {
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline'

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

function FaucetButton({ chainId, address }: { chainId: number, address: string | undefined }) {
  const { writeContract, isPending } = useWriteContract()

  const handleFaucet = async () => {
    if (!chainId || !address) return

    const contracts = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES] || CONTRACT_ADDRESSES[84532]
    if (!contracts) {
      alert(`Unsupported chain: ${chainId}`)
      return
    }

    try {
      writeContract({
        address: contracts.RUSD as `0x${string}`,
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

export default function Send() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { writeContract, data: txHash } = useWriteContract()

  // Sequential transaction tracking
  const [currentStep, setCurrentStep] = useState<'idle' | 'approving' | 'sending' | 'completed' | 'failed'>('idle')
  const [isConfirming, setIsConfirming] = useState(false)
  const [, setIsConfirmed] = useState(false)

  const { data: hash, isSuccess: isTxSuccess, isError: isTxError } = useWaitForTransactionReceipt({
    hash: txHash,
  })

  // State
  const [recipientAddress, setRecipientAddress] = useState('')
  const [amount, setAmount] = useState('')
  const [solverFee, setSolverFee] = useState('0.01')
  const [destinationChainId, setDestinationChainId] = useState(43113) // Default to Avalanche Fuji
  const [txStatus, setTxStatus] = useState('')

  // Transaction recording state
  const [isRecordingTransaction, setIsRecordingTransaction] = useState(false)
  const [transactionRecorded, setTransactionRecorded] = useState(false)

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

  // Record transaction to backend
  const recordTransaction = async (success: boolean, transactionHash?: `0x${string}`, errorMessage?: string) => {
    if (!address || transactionRecorded) return

    setIsRecordingTransaction(true)

    try {
      const transactionData: SendTransactionData = {
        walletAddress: address,
        recipientAddress,
        amount: parseEther(amount).toString(),
        solverFee: parseEther(solverFee).toString(),
        sourceChainId: chainId || 0,
        destinationChainId,
        transactionHash,
        success,
        errorMessage
      }

      console.log('📝 Recording send transaction:', transactionData)
      const result = await recordSendTransaction(transactionData)

      if (result.success) {
        console.log('✅ Send transaction recorded successfully:', result.data)
        setTransactionRecorded(true)
      } else {
        console.error('❌ Failed to record send transaction:', result.error)
      }
    } catch (error) {
      console.error('❌ Error recording send transaction:', error)
    } finally {
      setIsRecordingTransaction(false)
    }
  }

  const executeSend = async () => {
    if (!address || !recipientAddress || !amount) return

    try {
      const contracts = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES] || CONTRACT_ADDRESSES[84532]
      if (!contracts) {
        throw new Error(`Unsupported chain: ${chainId}`)
      }

      setTxStatus('Executing cross-chain send...')
      const amountWei = parseEther(amount)
      const solverFeeWei = parseEther(solverFee)

      console.log('📝 Submitting send transaction...')
      writeContract({
        address: contracts.ROUTER as `0x${string}`,
        abi: ROUTER_ABI,
        functionName: 'requestCrossChainSwap',
        args: [
          contracts.RUSD as `0x${string}`, // tokenIn
          contracts.RUSD as `0x${string}`, // tokenOut
          amountWei,  // amount
          solverFeeWei, // solverFee
          destinationChainId, // destinationChainId
          recipientAddress as `0x${string}` // recipient
        ],
        chainId,
      })

      setTxStatus('Send transaction submitted - waiting for confirmation...')

    } catch (error) {
      console.error('Send execution error:', error)
      setTxStatus('Send failed')
      setCurrentStep('failed')
      setIsConfirming(false)

      // Record failed transaction
      const errorMessage = error instanceof Error ? error.message : 'Send execution failed'
      recordTransaction(false, undefined, errorMessage)
    }
  }

  // Monitor transaction receipt
  useEffect(() => {
    if (isTxSuccess) {
      console.log('✅ Transaction confirmed:', hash)
      setTxStatus('Send completed successfully!')
      setCurrentStep('completed')
      setIsConfirming(false)
      setIsConfirmed(true)

      // Record successful transaction
      recordTransaction(true, hash.transactionHash)
    } else if (isTxError) {
      console.error('❌ Transaction failed')
      setTxStatus('Transaction failed')
      setCurrentStep('failed')
      setIsConfirming(false)

      // Record failed transaction
      recordTransaction(false, hash?.transactionHash, 'Transaction failed')
    }
  }, [isTxSuccess, isTxError, hash])

  // Reset states when starting new transaction
  const resetStates = () => {
    setAmount('')
    setRecipientAddress('')
    setDestinationChainId(43113)
    setTxStatus('')
    setCurrentStep('idle')
    setIsConfirming(false)
    setIsConfirmed(false)
    setTransactionRecorded(false)
  }

  const handleSend = async () => {
    if (!isConnected) {
      showToast('Please connect your wallet first', 'error')
      return
    }

    if (!recipientAddress || !amount || !solverFee) {
      showToast('Please fill in all required fields', 'error')
      return
    }

    if (parseFloat(amount) <= 0) {
      showToast('Please enter a valid amount', 'error')
      return
    }

    if (parseFloat(solverFee) <= 0) {
      showToast('Please enter a valid solver fee', 'error')
      return
    }

    resetStates()
    setCurrentStep('sending')
    setIsConfirming(true)
    
    executeSend()
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircleIcon className="w-8 h-8 text-gray-400" />
          </div>
          <h1 className="text-3xl font-bold text-black mb-4">Connect Your Wallet</h1>
          <p className="text-gray-600 text-lg">Please connect your wallet to send RUSD.</p>
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
          <h1 className="text-4xl font-bold text-black mb-4">Send Payment</h1>
          <p className="text-gray-600 text-lg">
            Send RUSD tokens to another address across different networks
          </p>
        </div>

        {/* Network Info */}
        <div className="bg-gray-100 rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-black">Current Network</h3>
              <p className="text-gray-600">{currentChainName} (Chain ID: {chainId})</p>
            </div>
            <FaucetButton chainId={chainId || 84532} address={address} />
          </div>
        </div>

        {/* Send Form */}
        <div className="bg-white border-2 border-black rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-black mb-6">Send Details</h2>
          
          <div className="space-y-6">
            <div>
              <label htmlFor="recipientAddress" className="block text-sm font-medium text-gray-700 mb-2">Recipient Address</label>
              <input
                type="text"
                id="recipientAddress"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none"
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
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
              <label htmlFor="destinationChain" className="block text-sm font-medium text-gray-700 mb-2">Destination Chain</label>
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

            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Sending from:</span>
                <span className="font-semibold text-black">{currentChainName}</span>
              </div>
              <div className="flex justify-between items-center text-sm mt-1">
                <span className="text-gray-600">Sending to:</span>
                <span className="font-semibold text-black">{destinationChainName}</span>
              </div>
            </div>

            <Button
              onClick={handleSend}
              disabled={!amount || !recipientAddress || isConfirming || isRecordingTransaction}
              className={`w-full py-4 text-lg font-bold ${
                currentStep === 'completed' 
                  ? 'bg-black text-white hover:bg-gray-800' 
                  : 'bg-black text-white hover:bg-gray-800'
              }`}
            >
              {isConfirming ? 'Processing...' : isRecordingTransaction ? 'Recording...' : 'Send RUSD'}
            </Button>
          </div>
        </div>

        {/* Transaction Status */}
        {txStatus && (
          <div className="bg-gray-100 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-black mb-4">Transaction Status</h3>
            <div className="flex items-center space-x-3">
              {currentStep === 'completed' ? (
                <CheckCircleIcon className="w-6 h-6 text-black" />
              ) : currentStep === 'failed' ? (
                <ExclamationTriangleIcon className="w-6 h-6 text-black" />
              ) : (
                <ArrowPathIcon className="w-6 h-6 text-black animate-spin" />
              )}
              <p className={`text-lg ${
                currentStep === 'failed' ? 'text-black' : 
                currentStep === 'completed' ? 'text-black' : 'text-black'
              }`}>
                {txStatus}
              </p>
            </div>
            
            {hash && (
              <div className="mt-4 p-4 bg-white rounded-lg border">
                <p className="text-sm text-gray-600 mb-2">Transaction Hash:</p>
                <p className="font-mono text-sm break-all">{hash.transactionHash}</p>
                <a
                  href={`https://sepolia.basescan.org/tx/${hash.transactionHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm mt-2 inline-block"
                >
                  View on Block Explorer →
                </a>
              </div>
            )}

            {(currentStep === 'completed' || currentStep === 'failed') && (
              <Button
                onClick={resetStates}
                className="w-full mt-4 bg-gray-300 text-gray-800 hover:bg-gray-400"
              >
                Start New Send
              </Button>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-black mb-4">How to Send RUSD</h3>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>Enter the recipient's wallet address</li>
            <li>Enter the amount of RUSD you want to send</li>
            <li>Set the solver fee (paid in RUSD) for cross-chain execution</li>
            <li>Select the destination chain for the recipient</li>
            <li>Click "Send RUSD" and confirm the transaction in your wallet</li>
          </ol>
        </div>
      </div>
    </div>
  )
}