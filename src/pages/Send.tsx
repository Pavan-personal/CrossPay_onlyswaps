import { useState, useEffect } from 'react'
import { useAccount, useChainId, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther } from 'viem'
import QRCode from 'qrcode'
import { recordSendTransaction, type SendTransactionData } from '../utils/transactionRecorder'

const API_BASE_URL = 'http://localhost:3001/api/payment'

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
    <button 
      className="faucet-button"
      onClick={handleFaucet}
      disabled={isPending}
    >
      {isPending ? 'Requesting...' : 'Get 1000 RUSD'}
    </button>
  )
}

export default function Send() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { writeContract, isPending: isWritePending, data: txHash } = useWriteContract()
  
  // Sequential transaction tracking
  const [currentStep, setCurrentStep] = useState<'idle' | 'approving' | 'swapping' | 'completed' | 'failed'>('idle')
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
  const [error, setError] = useState('')
  
  // Transaction recording state
  const [isRecordingTransaction, setIsRecordingTransaction] = useState(false)
  const [transactionRecorded, setTransactionRecorded] = useState(false)

  // Get current chain name
  const getCurrentChainName = (chainId: number) => {
    switch (chainId) {
      case 84532: return 'Base Sepolia'
      case 43113: return 'Avalanche Fuji'
      default: return `Unknown (${chainId})`
    }
  }

  // Record transaction to backend
  const recordTransaction = async (success: boolean, transactionHash?: string, errorMessage?: string) => {
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

  const executeSwap = async () => {
    if (!address || !amount || !recipientAddress) return

    try {
      const contracts = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES] || CONTRACT_ADDRESSES[84532]
      if (!contracts) {
        throw new Error(`Unsupported chain: ${chainId}`)
      }

      setTxStatus('Executing cross-chain swap...')
      const amountWei = parseEther(amount)
      const solverFeeWei = parseEther(solverFee)

      console.log('📝 Submitting swap transaction...')
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
          recipientAddress as `0x${string}` // recipient (the address user specified)
        ],
        chainId,
      })
      
      setTxStatus('Swap transaction submitted - waiting for confirmation...')

    } catch (error) {
      console.error('Swap execution error:', error)
      setTxStatus('Swap failed')
      setCurrentStep('failed')
      setIsConfirming(false)
      
      // Record failed transaction
      const errorMessage = error instanceof Error ? error.message : 'Swap execution failed'
      recordTransaction(false, undefined, errorMessage)
    }
  }

  const handleCompleteSend = async () => {
    if (!address || !amount || !recipientAddress) {
      setError('Please fill in all required fields and ensure wallet is connected')
      return
    }

    const contracts = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES] || CONTRACT_ADDRESSES[84532]
    if (!contracts) {
      setError(`Unsupported chain: ${chainId}`)
      return
    }

    console.log('✅ Starting send process...')
    setTxStatus('Starting send process...')
    setIsConfirming(true)
    setCurrentStep('approving')
    setError('')
    
    try {
      const totalAmount = parseEther(amount)
      const feeAmount = parseEther(solverFee)
      const totalCost = totalAmount + feeAmount

      // Step 1: Approve tokens
      console.log('📝 Step 1: Submitting approval transaction...')
      setTxStatus('Step 1: Approving RUSD tokens...')
      
      writeContract({
        address: contracts.RUSD as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [contracts.ROUTER as `0x${string}`, totalCost],
        chainId,
      })
      
      setTxStatus('Approval transaction submitted - waiting for confirmation...')

    } catch (error) {
      console.error('Complete send error:', error)
      setTxStatus('Send failed')
      setIsConfirming(false)
      setCurrentStep('failed')
      
      // Record failed transaction
      const errorMessage = error instanceof Error ? error.message : 'Send failed'
      recordTransaction(false, undefined, errorMessage)
    }
  }

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
        // Swap succeeded - record successful transaction
        setIsConfirming(false)
        setIsConfirmed(true)
        setCurrentStep('completed')
        setTxStatus(`Send completed successfully! Transaction: ${hash.transactionHash}`)
        
        // Record successful transaction
        recordTransaction(true, hash.transactionHash)
      }
    }
  }, [isTxSuccess, hash, currentStep])

  // Handle transaction error
  useEffect(() => {
    if (isTxError) {
      console.log('❌ Transaction failed')
      setIsConfirming(false)
      setIsConfirmed(false)
      setCurrentStep('failed')
      setTxStatus('Transaction failed')
      
      // Record failed transaction
      recordTransaction(false, undefined, 'Transaction failed')
    }
  }, [isTxError])

  if (!isConnected) {
    return (
      <div className="connect-prompt">
        <h2>Connect Your Wallet</h2>
        <p>Connect your wallet to send payments.</p>
      </div>
    )
  }

  return (
    <div className="send-page">
      <div className="header">
        <h1>Send Payment</h1>
        <p>Send RUSD tokens to any address across chains</p>
      </div>

      <div className="content">
        {/* Faucet Section */}
        <div className="faucet-section">
          <h3>Get Test Tokens</h3>
          <FaucetButton chainId={chainId || 0} address={address} />
        </div>

        {/* Send Form */}
        <div className="send-form">
          <h3>Send Details</h3>
          
          <div className="form-group">
            <label>Recipient Address *</label>
            <input
              type="text"
              placeholder="0x..."
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Amount (RUSD) *</label>
            <input
              type="number"
              placeholder="Enter amount to send"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              step="0.01"
              min="0"
            />
          </div>

          <div className="form-group">
            <label>Solver Fee (RUSD)</label>
            <input
              type="number"
              placeholder="0.01"
              value={solverFee}
              onChange={(e) => setSolverFee(e.target.value)}
              step="0.01"
              min="0"
            />
          </div>

          <div className="form-group">
            <label>From Chain (Current)</label>
            <input
              type="text"
              value={getCurrentChainName(chainId || 0)}
              disabled
              className="disabled-field"
            />
          </div>

          <div className="form-group">
            <label>To Chain (Destination)</label>
            <select
              value={destinationChainId}
              onChange={(e) => setDestinationChainId(Number(e.target.value))}
            >
              <option value={43113}>Avalanche Fuji</option>
              <option value={84532}>Base Sepolia</option>
            </select>
          </div>

          <div className="button-group">
            <button 
              className="complete-send-button"
              onClick={handleCompleteSend}
              disabled={isWritePending || isConfirming || !recipientAddress || !amount}
            >
              {currentStep === 'approving' ? '⏳ Approving...' : 
               currentStep === 'swapping' ? '🔄 Sending...' : 
               currentStep === 'completed' ? '✅ Send Completed!' :
               currentStep === 'failed' ? '❌ Send Failed' :
               isWritePending ? 'Processing...' : '💸 Send Payment'}
            </button>
            <p className="send-instructions">
              This will open MetaMask with TWO popups sequentially:<br/>
              1️⃣ First popup: Approve RUSD tokens (required for swap)<br/>
              2️⃣ Second popup: Execute cross-chain swap to recipient<br/>
              <strong>Both must be approved for send to complete!</strong>
            </p>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
        </div>

        {/* Transaction Status */}
        {txStatus && (
          <div className="status-section">
            <h3>Status</h3>
            <p className={txStatus.includes('success') ? 'success' : 'info'}>{txStatus}</p>
            {hash && (
              <p>
                <a 
                  href={`https://${chainId === 84532 ? 'sepolia.basescan.org' : 'testnet.snowtrace.io'}/tx/${hash.transactionHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View Transaction
                </a>
              </p>
            )}
            {isRecordingTransaction && (
              <p className="info">📝 Recording transaction to database...</p>
            )}
            {transactionRecorded && (
              <p className="success">✅ Transaction recorded successfully</p>
            )}
          </div>
        )}

        {/* Network Info */}
        <div className="network-info">
          <h3>Current Network</h3>
          <p>{getCurrentChainName(chainId || 0)}</p>
          <p>Supported: Base Sepolia ↔ Avalanche Fuji</p>
        </div>
      </div>
    </div>
  )
}
