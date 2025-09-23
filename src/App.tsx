import React, { useState } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useChainId, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther } from 'ethers'

// ERC20 Token ABI (for approval)
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
] as const

// OnlySwaps Router Contract ABI (simplified)
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
  },
  {
    "inputs": [{"name": "requestId", "type": "bytes32"}],
    "name": "getSwapRequestParameters",
    "outputs": [
      {
        "components": [
          {"name": "sender", "type": "address"},
          {"name": "recipient", "type": "address"},
          {"name": "tokenIn", "type": "address"},
          {"name": "tokenOut", "type": "address"},
          {"name": "amountOut", "type": "uint256"},
          {"name": "srcChainId", "type": "uint256"},
          {"name": "dstChainId", "type": "uint256"},
          {"name": "verificationFee", "type": "uint256"},
          {"name": "solverFee", "type": "uint256"},
          {"name": "nonce", "type": "uint256"},
          {"name": "executed", "type": "bool"},
          {"name": "requestedAt", "type": "uint256"}
        ],
        "name": "swapRequestParams",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const

// Contract addresses
const CONTRACTS = {
  // Base Sepolia
  84532: {
    router: '0x3dD1a497846d060Dce130B67b22E1F9DeE18c051',
    // RUSD token address on Base Sepolia
    testToken: '0x908e1D85604E0e9e703d52D18f3f3f604Fe7Bb1b'
  },
  // Avalanche Fuji
  43113: {
    router: '0x3dD1a497846d060Dce130B67b22E1F9DeE18c051',
    // RUSD token address on Avalanche Fuji
    testToken: '0x908e1D85604E0e9e703d52D18f3f3f604Fe7Bb1b'
  }
}

function App() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  })
  
  const [amount, setAmount] = useState('')
  const [solverFee, setSolverFee] = useState('')
  const [recipient, setRecipient] = useState('')
  const [status, setStatus] = useState('')
  const [step, setStep] = useState<'idle' | 'approving' | 'swapping' | 'done'>('idle')

  // Get current chain info
  const currentChain = chainId ? CONTRACTS[chainId as keyof typeof CONTRACTS] : null
  const isBaseSepolia = chainId === 84532
  const isAvalancheFuji = chainId === 43113

  const handleApproval = async () => {
    if (!currentChain || !address) return

    // Validate inputs
    if (!amount || parseFloat(amount) <= 0) {
      setStatus('❌ Please enter a valid amount')
      return
    }
    
    if (!solverFee || parseFloat(solverFee) <= 0) {
      setStatus('❌ Solver fee must be greater than 0')
      return
    }

    try {
      setStep('approving')
      setStatus('Step 1: Approving tokens...')
      
      const totalAmount = parseEther(amount) + parseEther(solverFee)
      
      writeContract({
        address: currentChain.testToken as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [
          currentChain.router as `0x${string}`,
          totalAmount
        ]
      })
    } catch (error) {
      setStatus(`❌ Approval Error: ${error}`)
      setStep('idle')
    }
  }

  const handleSwap = React.useCallback(async () => {
    if (!currentChain || !address) return

    // Validate inputs
    if (!amount || parseFloat(amount) <= 0) {
      setStatus('❌ Please enter a valid amount')
      setStep('idle')
      return
    }
    
    if (!solverFee || parseFloat(solverFee) <= 0) {
      setStatus('❌ Solver fee must be greater than 0')
      setStep('idle')
      return
    }

    try {
      setStep('swapping')
      setStatus('Step 2: Requesting cross-chain swap...')
      
      const dstChainId = isBaseSepolia ? 43113 : 84532
      const dstContract = CONTRACTS[dstChainId as keyof typeof CONTRACTS]
      
      writeContract({
        address: currentChain.router as `0x${string}`,
        abi: ROUTER_ABI,
        functionName: 'requestCrossChainSwap',
        args: [
          currentChain.testToken as `0x${string}`,
          dstContract.testToken as `0x${string}`,
          parseEther(amount),
          parseEther(solverFee),
          BigInt(dstChainId),
          (recipient || address) as `0x${string}`
        ]
      })
    } catch (error) {
      setStatus(`❌ Swap Error: ${error}`)
      setStep('idle')
    }
  }, [currentChain, address, amount, solverFee, recipient, isBaseSepolia, writeContract])

  // Handle transaction confirmation
  React.useEffect(() => {
    if (isConfirmed && step === 'approving') {
      setStatus('✅ Approval confirmed! Automatically requesting swap...')
      setStep('swapping')
      // Automatically trigger the swap after approval
      setTimeout(() => {
        handleSwap()
      }, 1000)
    } else if (isConfirmed && step === 'swapping') {
      setStatus('✅ Swap requested successfully!')
      setStep('done')
    }
  }, [isConfirmed, step, handleSwap])

  return (
    <div className="container">
      <div className="card">
        <h1>OnlySwaps Test Frontend</h1>
        <p>Test cross-chain swaps between Base Sepolia and Avalanche Fuji</p>
        
        <div style={{ marginBottom: '20px' }}>
          <ConnectButton />
        </div>

        {isConnected && (
          <div>
            <div className="status info">
              <strong>Connected:</strong> {address}<br/>
              <strong>Chain:</strong> {chainId === 84532 ? 'Base Sepolia' : chainId === 43113 ? 'Avalanche Fuji' : 'Unknown'}
            </div>

            {isBaseSepolia || isAvalancheFuji ? (
              <div className="card">
                <h3>Request Cross-Chain Swap</h3>
                
                <label className="label">Amount to Swap (RUSD):</label>
                <input
                  type="text"
                  className="input"
                  placeholder="0.03"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                <small className="help-text">Enter amount in RUSD (e.g., 0.03)</small>

                <label className="label">Solver Fee (RUSD):</label>
                <input
                  type="text"
                  className="input"
                  placeholder="0.01"
                  value={solverFee}
                  onChange={(e) => setSolverFee(e.target.value)}
                />
                <small className="help-text">Enter fee in RUSD (e.g., 0.01)</small>
                
                {amount && solverFee && (
                  <div className="total-info">
                    <strong>Total Cost: {parseFloat(amount || '0') + parseFloat(solverFee || '0')} RUSD</strong>
                  </div>
                )}

                <label className="label">Recipient Address (leave empty for yourself):</label>
                <input
                  type="text"
                  className="input"
                  placeholder={address}
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                />

                {step === 'idle' && (
                  <button 
                    className="button"
                    onClick={handleApproval}
                    disabled={!amount || !solverFee || isPending}
                  >
                    Step 1: Approve RUSD Tokens
                  </button>
                )}

                {step === 'approving' && (
                  <button 
                    className="button"
                    onClick={handleSwap}
                    disabled={isPending}
                  >
                    Step 2: Request Swap to {isBaseSepolia ? 'Avalanche Fuji' : 'Base Sepolia'}
                  </button>
                )}

                {step === 'swapping' && (
                  <div className="status info">
                    Processing swap request...
                  </div>
                )}

                {status && (
                  <div className={`status ${status.includes('Error') ? 'error' : 'success'}`}>
                    {status}
                  </div>
                )}
              </div>
            ) : (
              <div className="status error">
                Please switch to Base Sepolia or Avalanche Fuji network
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default App
