import { useState, useEffect } from 'react'
import { useAccount, useChainId, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther } from 'viem'
import { recordSwapTransaction, type SwapTransactionData } from '../utils/transactionRecorder'

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

export default function Swap() {
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
  const [amount, setAmount] = useState('')
  const [solverFee, setSolverFee] = useState('0.01')
  const [destinationChainId, setDestinationChainId] = useState(43113) // Default to Avalanche Fuji
  const [txStatus, setTxStatus] = useState('')
  
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
      const transactionData: SwapTransactionData = {
        walletAddress: address,
        amount: parseEther(amount).toString(),
        solverFee: parseEther(solverFee).toString(),
        sourceChainId: chainId || 0,
        destinationChainId,
        transactionHash,
        success,
        errorMessage
      }

      console.log('📝 Recording swap transaction:', transactionData)
      const result = await recordSwapTransaction(transactionData)
      
      if (result.success) {
        console.log('✅ Swap transaction recorded successfully:', result.data)
        setTransactionRecorded(true)
      } else {
        console.error('❌ Failed to record swap transaction:', result.error)
      }
    } catch (error) {
      console.error('❌ Error recording swap transaction:', error)
    } finally {
      setIsRecordingTransaction(false)
    }
  }

  const executeSwap = async () => {
    if (!address || !amount) return

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
          address as `0x${string}` // recipient (same user)
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

  const handleCompleteSwap = async () => {
    if (!address || !amount) {
      alert('Please enter amount and ensure wallet is connected')
      return
    }

    const contracts = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES] || CONTRACT_ADDRESSES[84532]
    if (!contracts) {
      alert(`Unsupported chain: ${chainId}`)
      return
    }

    console.log('✅ Starting swap process...')
    setTxStatus('Starting swap process...')
    setIsConfirming(true)
    setCurrentStep('approving')
    
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
      console.error('Complete swap error:', error)
      setTxStatus('Swap failed')
      setIsConfirming(false)
      setCurrentStep('failed')
      
      // Record failed transaction
      const errorMessage = error instanceof Error ? error.message : 'Swap failed'
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
        setTxStatus(`Swap completed successfully! Transaction: ${hash.transactionHash}`)
        
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
        <p>Connect your wallet to perform cross-chain swaps.</p>
      </div>
    )
  }

  return (
    <div className="swap-page">
      <div className="header">
        <h1>Cross-Chain Swap</h1>
        <p>Swap RUSD tokens to another chain (to your own wallet)</p>
      </div>

      <div className="content">
        {/* Faucet Section */}
        <div className="faucet-section">
          <h3>Get Test Tokens</h3>
          <FaucetButton chainId={chainId || 0} />
        </div>

        {/* Swap Form */}
        <div className="swap-form">
          <h3>Swap Details</h3>
          
          <div className="form-group">
            <label>Amount (RUSD)</label>
            <input
              type="number"
              placeholder="Enter amount to swap"
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
              className="complete-swap-button"
              onClick={handleCompleteSwap}
              disabled={isWritePending || isConfirming || !amount}
            >
              {currentStep === 'approving' ? '⏳ Approving...' : 
               currentStep === 'swapping' ? '🔄 Swapping...' : 
               currentStep === 'completed' ? '✅ Swap Completed!' :
               currentStep === 'failed' ? '❌ Swap Failed' :
               isWritePending ? 'Processing...' : '💱 Complete Swap'}
            </button>
            <p className="swap-instructions">
              This will open MetaMask with TWO popups sequentially:<br/>
              1️⃣ First popup: Approve RUSD tokens (required for swap)<br/>
              2️⃣ Second popup: Execute cross-chain swap (opens after approval)<br/>
              <strong>Both must be approved for swap to complete!</strong>
            </p>
          </div>
        </div>

        {/* Transaction Status */}
        {txStatus && (
          <div className="status-section">
            <h3>Status</h3>
            <p className={txStatus.includes('confirmed') ? 'success' : 'info'}>{txStatus}</p>
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