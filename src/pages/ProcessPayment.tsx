import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useAccount, useChainId, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther, formatEther } from 'viem'

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
    <button 
      className="faucet-button"
      onClick={handleFaucet}
      disabled={isPending}
    >
      {isPending ? 'Requesting...' : 'Get 1000 RUSD'}
    </button>
  )
}

export default function ProcessPayment() {
  const { paymentId } = useParams<{ paymentId: string }>()
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { writeContract, isPending: isWritePending, data: txHash } = useWriteContract()
  
  // Custom confirmation state to avoid the useWaitForTransactionReceipt issue
  const [isConfirming, setIsConfirming] = useState(false)
  const [isConfirmed, setIsConfirmed] = useState(false)
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
  const { data: hash, isPending: isTxPending, isSuccess: isTxSuccess, isError: isTxError } = useWaitForTransactionReceipt({
    hash: txHash,
  })

  // Handle transaction success
  useEffect(() => {
    if (isTxSuccess && hash) {
      console.log('✅ Transaction confirmed:', hash)
      console.log('🔍 Transaction details:', { hash: hash.transactionHash, status: hash.status })
      
      if (currentStep === 'approving') {
        // Approval succeeded, now execute swap
        setCurrentStep('swapping')
        setTxStatus('Approval successful! Now executing swap...')
        executeSwap()
      } else if (currentStep === 'swapping') {
        // Swap succeeded
        setIsConfirming(false)
        setIsConfirmed(true)
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
      setIsConfirmed(false)
      setCurrentStep('failed')
      setTxStatus('Transaction failed')
      
      // Record failed payment attempt
      if (currentPaymentId && address) {
        recordPaymentAttempt(currentPaymentId, address, chainId || 0, false, undefined, 'Transaction failed')
      }
    }
  }, [isTxError, currentPaymentId, address, chainId])

  // Debug logging
  console.log('🔍 Transaction Debug:', {
    txHash,
    hash,
    isTxPending,
    isTxSuccess,
    isTxError,
    isWritePending,
    isConfirming,
    currentStep
  })

  // Debug logging for button state (moved after all variable declarations)
  console.log('🔍 ProcessPayment Debug:', {
    isWritePending,
    isConfirming,
    isConfirmed,
    currentStep,
    txHash,
    hash,
    paymentData: !!paymentData,
    address,
    currentPaymentId,
    buttonDisabled: isWritePending || isConfirming
  })

  const validatePaymentLink = async () => {
    console.log('🔄 validatePaymentLink called:', { currentPaymentId, address, hasValidated })
    
    if (!currentPaymentId || !address || hasValidated) {
      console.log('❌ validatePaymentLink early return:', { currentPaymentId: !!currentPaymentId, address: !!address, hasValidated })
      return
    }

    console.log('✅ Starting validation...')
    setHasValidated(true)
    setIsValidating(true)
    setValidationError('')

    try {
      const result = await validatePayment(currentPaymentId, address)
      console.log('✅ Validation successful:', result)
      setPaymentData(result.data)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.log('❌ Validation failed:', errorMessage)
      setValidationError(errorMessage)
    } finally {
      setIsValidating(false)
      console.log('🏁 Validation completed')
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

      console.log('📝 Submitting swap transaction...')
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
    console.log('🚀 handleCompletePayment called:', { address, paymentData: !!paymentData, isWritePending, isConfirming })
    
    if (!address || !paymentData) {
      console.log('❌ Missing requirements:', { address: !!address, paymentData: !!paymentData })
      alert('Please connect wallet and ensure payment is validated')
      return
    }

    console.log('✅ Starting payment process...')
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
      
      console.log('💰 Payment amounts:', {
        amount: paymentData.amount,
        solverFee: paymentData.solverFee,
        amountWei: amountWei.toString(),
        feeWei: feeWei.toString(),
        totalCost: totalCost.toString(),
        contracts,
        amountFormatted: formatEther(amountWei),
        feeFormatted: formatEther(feeWei),
        totalFormatted: formatEther(totalCost)
      })

      // Step 1: Approve tokens
      console.log('📝 Step 1: Submitting approval transaction...')
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

  // Handle transaction status updates
  useEffect(() => {
    if (isConfirmed && hash) {
      setTxStatus(`Transaction confirmed! Hash: ${hash}`)
        recordPaymentAttempt(currentPaymentId, address || '', chainId || 0, true, hash.transactionHash)
    } else if (isConfirming) {
      setTxStatus('Transaction pending...')
    }
  }, [isConfirmed, isConfirming, hash, currentPaymentId, address, chainId])

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
      <div className="connect-prompt">
        <h2>Connect Your Wallet</h2>
        <p>Connect your wallet to process this payment link.</p>
      </div>
    )
  }

  if (!currentPaymentId) {
    return (
      <div className="connect-prompt">
        <h2>Process Payment</h2>
        <p>Enter a payment ID to process a payment, or use a payment link.</p>
        <div className="form-group">
          <label>Payment ID</label>
          <input
            type="text"
            placeholder="Enter payment ID"
            value={manualPaymentId}
            onChange={(e) => setManualPaymentId(e.target.value)}
          />
          <button 
            className="form-button"
            onClick={validatePaymentLink}
            disabled={!manualPaymentId || !address}
          >
            Validate Payment
          </button>
        </div>
      </div>
    )
  }

  if (isValidating) {
    return (
      <div className="payment-validation">
        <h2>Validating Payment Link...</h2>
        <p>Please wait while we validate your payment link.</p>
      </div>
    )
  }

  if (validationError) {
    const isRecipientError = validationError.includes('not the authorized recipient')
    
    return (
      <div className="payment-error">
        <h2>❌ Payment Access Denied</h2>
        {isRecipientError ? (
          <>
            <p>🔒 <strong>Security Error:</strong> You are not the authorized recipient for this payment.</p>
            <p>Only the intended recipient wallet can process this payment link.</p>
            <div className="security-info">
              <p><strong>Your wallet:</strong> {address}</p>
              <p><strong>Required wallet:</strong> Check with the payment creator</p>
            </div>
          </>
        ) : (
          <>
            <p>{validationError}</p>
            <p>Please check that the payment link is valid and not expired.</p>
          </>
        )}
        <button onClick={() => window.location.href = '/'} className="back-button">
          Go Back to Home
        </button>
      </div>
    )
  }

  if (!paymentData) {
    return (
      <div className="payment-not-found">
        <h2>Payment Link Not Found</h2>
        <p>No payment data available. Please check the payment link.</p>
        <button onClick={() => window.location.href = '/'} className="back-button">
          Go Back to Home
        </button>
      </div>
    )
  }

  return (
    <div className="process-payment-page">
      <div className="header">
        <h1>Pay Request</h1>
        <p>Complete this cross-chain RUSD payment request</p>
      </div>

      <div className="content">
        {/* Faucet Section */}
        <div className="faucet-section">
          <h3>Get Test Tokens</h3>
          <FaucetButton chainId={chainId || 0} address={address} />
        </div>

        {/* Payment Details */}
        <div className="payment-details">
          <h3>Payment Request Details</h3>
          <div className="details-grid">
            <div className="detail-item">
              <label>Amount to Pay:</label>
              <span>{formatEther(paymentData.amount)} RUSD</span>
            </div>
            <div className="detail-item">
              <label>Solver Fee:</label>
              <span>{formatEther(paymentData.solverFee)} RUSD</span>
            </div>
            <div className="detail-item">
              <label>Pay To (Creator):</label>
              <span>{paymentData.creatorAddress}</span>
            </div>
            <div className="detail-item">
              <label>Your Address (Sender):</label>
              <span>{address}</span>
            </div>
            <div className="detail-item">
              <label>From Chain (Your Current):</label>
              <span>{paymentData.sourceChainId === 84532 ? 'Base Sepolia' : 'Avalanche Fuji'}</span>
            </div>
            <div className="detail-item">
              <label>To Chain (Recipient's):</label>
              <span>{paymentData.destinationChainId === 84532 ? 'Base Sepolia' : 'Avalanche Fuji'}</span>
            </div>
            <div className="detail-item">
              <label>Expires:</label>
              <span>{new Date(paymentData.expiresAt).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="action-section">
          <h3>Complete Payment</h3>
          <div className="button-group">
            <button 
              className="complete-payment-button"
              onClick={() => {
                console.log('🖱️ Complete Payment clicked!', { isWritePending, isConfirming, currentStep, disabled: isWritePending || isConfirming })
                handleCompletePayment()
              }}
              disabled={isWritePending || isConfirming}
            >
              {currentStep === 'approving' ? '⏳ Approving...' : 
               currentStep === 'swapping' ? '🔄 Swapping...' : 
               currentStep === 'completed' ? '✅ Payment Completed!' :
               currentStep === 'failed' ? '❌ Payment Failed' :
               isWritePending ? 'Processing...' : '💳 Complete Payment'}
            </button>
            <p className="payment-instructions">
              This will open MetaMask with TWO popups sequentially:<br/>
              1️⃣ First popup: Approve RUSD tokens (required for swap)<br/>
              2️⃣ Second popup: Execute cross-chain swap (opens after approval)<br/>
              <strong>Both must be approved for payment to complete!</strong>
            </p>
          </div>
        </div>

        {/* Transaction Status */}
        {txStatus && (
          <div className="status-section">
            <h3>Status</h3>
            <p className={txStatus.includes('success') ? 'success' : 'info'}>{txStatus}</p>
            {hash && (
              <p>
                <a 
                  href={`https://${chainId === 84532 ? 'sepolia.basescan.org' : 'testnet.snowtrace.io'}/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {txHash}
                  View Transaction
                </a>
              </p>
            )}
          </div>
        )}

        {/* Network Info */}
        <div className="network-info">
          <h3>Current Network</h3>
          <p>
            {chainId === 84532 ? 'Base Sepolia' : 
             chainId === 43113 ? 'Avalanche Fuji' : 
             `Unknown (${chainId})`}
          </p>
          <p>Supported: Base Sepolia ↔ Avalanche Fuji</p>
        </div>
      </div>
    </div>
  )
}
