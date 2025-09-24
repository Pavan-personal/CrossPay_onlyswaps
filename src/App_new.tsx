import React, { useState, useEffect, useCallback } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useChainId, useWriteContract, useWaitForTransactionReceipt, useBalance, useReadContract } from 'wagmi'
import { parseEther, formatEther } from 'ethers'
import QRCode from 'qrcode'

// ERC20 Token ABI (for approval and balance checking)
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
  },
  {
    "inputs": [{"name": "account", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const

// Faucet ABI
const FAUCET_ABI = [
  {
    "inputs": [],
    "name": "mint",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "account", "type": "address"}],
    "name": "lastMint",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
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

// API Configuration
const API_BASE_URL = 'http://localhost:3001/api/payment'

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

// API Functions
const createPaymentLink = async (paymentData: {
  creatorAddress: string
  recipientAddress: string
  amount: string
  solverFee: string
  sourceChainId: number
  destinationChainId: number
  expiresInHours?: number
}) => {
  const response = await fetch(`${API_BASE_URL}/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(paymentData),
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create payment link')
  }
  
  return response.json()
}

const validatePayment = async (paymentId: string, recipientAddress: string) => {
  const response = await fetch(`${API_BASE_URL}/validate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ paymentId, recipientAddress }),
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to validate payment')
  }
  
  return response.json()
}

const recordPaymentAttempt = async (attemptData: {
  paymentId: string
  attemptAddress: string
  chainId: number
  success: boolean
  errorMessage?: string
  transactionHash?: string
}) => {
  const response = await fetch(`${API_BASE_URL}/attempt`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(attemptData),
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to record payment attempt')
  }
  
  return response.json()
}

// Balance Display Component
function BalanceDisplay({ address }: { address: string }) {
  // Native token balances
  const { data: baseEthBalance } = useBalance({
    address: address as `0x${string}`,
    chainId: 84532, // Base Sepolia
  })

  const { data: avaxBalance } = useBalance({
    address: address as `0x${string}`,
    chainId: 43113, // Avalanche Fuji
  })

  // RUSD token balances
  const { data: baseRusdBalance } = useReadContract({
    address: '0x908e1D85604E0e9e703d52D18f3f3f604Fe7Bb1b',
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [address as `0x${string}`],
    chainId: 84532, // Base Sepolia
  })

  const { data: avaxRusdBalance } = useReadContract({
    address: '0x908e1D85604E0e9e703d52D18f3f3f604Fe7Bb1b',
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [address as `0x${string}`],
    chainId: 43113, // Avalanche Fuji
  })

  return (
    <div className="balance-grid">
      <div className="balance-card base">
        <h3>Base Sepolia</h3>
        <div className="balance-item">
          <span className="token">ETH:</span>
          <span className="amount">{baseEthBalance ? formatEther(baseEthBalance.value) : '0'}</span>
        </div>
        <div className="balance-item">
          <span className="token">RUSD:</span>
          <span className="amount">{baseRusdBalance ? formatEther(baseRusdBalance) : '0'}</span>
        </div>
      </div>
      
      <div className="balance-card avax">
        <h3>Avalanche Fuji</h3>
        <div className="balance-item">
          <span className="token">AVAX:</span>
          <span className="amount">{avaxBalance ? formatEther(avaxBalance.value) : '0'}</span>
        </div>
        <div className="balance-item">
          <span className="token">RUSD:</span>
          <span className="amount">{avaxRusdBalance ? formatEther(avaxRusdBalance) : '0'}</span>
        </div>
      </div>
    </div>
  )
}

// Faucet Component
function FaucetButton({ chainId }: { chainId: number }) {
  const { writeContract, isPending } = useWriteContract()

  const handleFaucet = () => {
    writeContract({
      address: '0x908e1D85604E0e9e703d52D18f3f3f604Fe7Bb1b',
      abi: FAUCET_ABI,
      functionName: 'mint',
      chainId,
    })
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

// Payment Link Generator Component
function PaymentLinkGenerator({ 
  amount, 
  solverFee, 
  recipient, 
  creatorAddress,
  sourceChainId,
  destinationChainId,
  onGenerate 
}: { 
  amount: string
  solverFee: string
  recipient: string
  creatorAddress: string
  sourceChainId: number
  destinationChainId: number
  onGenerate: (link: string, qrCode: string, paymentId: string) => void
}) {
  const [generatedLink, setGeneratedLink] = useState('')
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('')
  const [paymentId, setPaymentId] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  const generatePaymentLink = async () => {
    if (!amount || !solverFee || !recipient || !creatorAddress) {
      alert('Please fill in all required fields and connect your wallet')
      return
    }

    setIsGenerating(true)
    
    try {
      // Convert amounts to wei (assuming 18 decimals)
      const amountWei = parseEther(amount).toString()
      const solverFeeWei = parseEther(solverFee).toString()

      // Create payment link via API
      const result = await createPaymentLink({
        creatorAddress,
        recipientAddress: recipient,
        amount: amountWei,
        solverFee: solverFeeWei,
        sourceChainId,
        destinationChainId,
        expiresInHours: 24
      })

      const paymentLink = result.data.paymentLink
      setPaymentId(result.data.paymentId)
      
      // Generate QR code
      const qrCodeUrl = await QRCode.toDataURL(paymentLink, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })
      
      setGeneratedLink(paymentLink)
      setQrCodeDataUrl(qrCodeUrl)
      onGenerate(paymentLink, qrCodeUrl, result.data.paymentId)
    } catch (error) {
      console.error('Error generating payment link:', error)
      alert(`Error: ${error.message}`)
    } finally {
      setIsGenerating(false)
    }
  }

  const copyLink = () => {
    navigator.clipboard.writeText(generatedLink)
    alert('Payment link copied to clipboard!')
  }

  const downloadQR = () => {
    if (qrCodeDataUrl) {
      const link = document.createElement('a')
      link.download = `crosspay-${paymentId}.png`
      link.href = qrCodeDataUrl
      link.click()
    }
  }

  return (
    <div className="payment-link-generator">
      <h4>Generate Payment Link</h4>
      <button 
        className="generate-button"
        onClick={generatePaymentLink}
        disabled={isGenerating}
      >
        {isGenerating ? 'Generating...' : 'Generate CrossPay Link & QR Code'}
      </button>
      
      {generatedLink && (
        <div className="payment-link-result">
          <div className="link-section">
            <h5>Payment Link:</h5>
            <div className="link-container">
              <input 
                type="text" 
                value={generatedLink} 
                readOnly 
                className="link-input"
              />
              <button onClick={copyLink} className="copy-button">
                Copy Link
              </button>
            </div>
            <p className="payment-id">Payment ID: {paymentId}</p>
          </div>
          
          {qrCodeDataUrl && (
            <div className="qr-section">
              <h5>QR Code:</h5>
              <div className="qr-container">
                <img src={qrCodeDataUrl} alt="Payment QR Code" className="qr-image" />
                <button onClick={downloadQR} className="download-button">
                  Download QR
                </button>
              </div>
            </div>
          )}
          
          <div className="payment-info">
            <p><strong>Amount:</strong> {amount} RUSD</p>
            <p><strong>Solver Fee:</strong> {solverFee} RUSD</p>
            <p><strong>Recipient:</strong> {recipient}</p>
            <p><strong>Total Cost:</strong> {(parseFloat(amount) + parseFloat(solverFee)).toFixed(4)} RUSD</p>
          </div>
        </div>
      )}
    </div>
  )
}

// Payment Link Handler Component (for recipients)
function PaymentLinkHandler({ 
  paymentId, 
  recipientAddress, 
  onPaymentComplete 
}: { 
  paymentId: string
  recipientAddress: string
  onPaymentComplete: (success: boolean, message: string) => void
}) {
  const [paymentData, setPaymentData] = useState<any>(null)
  const [isValidating, setIsValidating] = useState(false)
  const [validationError, setValidationError] = useState('')

  const validatePaymentLink = async () => {
    if (!paymentId || !recipientAddress) return

    setIsValidating(true)
    setValidationError('')

    try {
      const result = await validatePayment(paymentId, recipientAddress)
      setPaymentData(result.data)
    } catch (error) {
      setValidationError(error.message)
      onPaymentComplete(false, error.message)
    } finally {
      setIsValidating(false)
    }
  }

  useEffect(() => {
    if (paymentId && recipientAddress) {
      validatePaymentLink()
    }
  }, [paymentId, recipientAddress])

  if (isValidating) {
    return (
      <div className="payment-validation">
        <p>Validating payment link...</p>
      </div>
    )
  }

  if (validationError) {
    return (
      <div className="payment-error">
        <h3>❌ Payment Link Error</h3>
        <p>{validationError}</p>
        <p>Please check that you are the correct recipient and the link is still valid.</p>
      </div>
    )
  }

  if (!paymentData) {
    return null
  }

  return (
    <div className="payment-link-handler">
      <h3>✅ Valid Payment Link</h3>
      <div className="payment-details">
        <p><strong>Amount:</strong> {formatEther(paymentData.amount)} RUSD</p>
        <p><strong>Solver Fee:</strong> {formatEther(paymentData.solverFee)} RUSD</p>
        <p><strong>From:</strong> {paymentData.creatorAddress}</p>
        <p><strong>To:</strong> {paymentData.recipientAddress}</p>
        <p><strong>Source Chain:</strong> {paymentData.sourceChainId === 84532 ? 'Base Sepolia' : 'Avalanche Fuji'}</p>
        <p><strong>Destination Chain:</strong> {paymentData.destinationChainId === 84532 ? 'Base Sepolia' : 'Avalanche Fuji'}</p>
        <p><strong>Expires:</strong> {new Date(paymentData.expiresAt).toLocaleString()}</p>
      </div>
    </div>
  )
}

function App() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { writeContract, isPending: isWritePending } = useWriteContract()
  const { data: hash, isPending: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: undefined,
  })

  // Form state
  const [amount, setAmount] = useState('')
  const [solverFee, setSolverFee] = useState('0.01')
  const [recipient, setRecipient] = useState('')
  const [mode, setMode] = useState<'swap' | 'payment'>('swap')
  const [paymentLink, setPaymentLink] = useState('')
  const [qrCode, setQrCode] = useState('')
  const [paymentId, setPaymentId] = useState('')
  const [showLinkGenerator, setShowLinkGenerator] = useState(false)

  // Transaction state
  const [txStatus, setTxStatus] = useState('')
  const [approvalHash, setApprovalHash] = useState<string | undefined>()

  // Parse URL parameters for payment links
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const paymentIdParam = urlParams.get('paymentId')
    const modeParam = urlParams.get('mode')
    
    if (modeParam === 'payment' && paymentIdParam) {
      setMode('payment')
      setPaymentId(paymentIdParam)
    } else if (urlParams.get('amount')) {
      setAmount(urlParams.get('amount') || '')
      setSolverFee(urlParams.get('solverFee') || '0.01')
      setRecipient(urlParams.get('recipient') || '')
      setMode('payment')
    }
  }, [])

  const handleApproval = useCallback(async () => {
    if (!address || !amount || !solverFee) {
      alert('Please connect wallet and fill in amount and solver fee')
      return
    }

    const totalAmount = parseEther(amount).toString()
    const feeAmount = parseEther(solverFee).toString()
    const totalCost = (BigInt(totalAmount) + BigInt(feeAmount)).toString()

    setTxStatus('Approving RUSD tokens...')
    
    try {
      writeContract({
        address: '0x908e1D85604E0e9e703d52D18f3f3f604Fe7Bb1b',
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [
          '0x3dD1a497846d060Dce130B67b22E1F9DeE18c051', // Router address
          totalCost
        ],
        chainId,
      })
    } catch (error) {
      console.error('Approval error:', error)
      setTxStatus('Approval failed')
    }
  }, [address, amount, solverFee, chainId, writeContract])

  const handleSwap = useCallback(async () => {
    if (!address || !amount || !solverFee || !recipient) {
      alert('Please fill in all fields')
      return
    }

    const amountWei = parseEther(amount).toString()
    const solverFeeWei = parseEther(solverFee).toString()
    const totalCost = (BigInt(amountWei) + BigInt(solverFeeWei)).toString()

    setTxStatus('Requesting cross-chain swap...')
    
    try {
      const destinationChainId = chainId === 84532 ? 43113 : 84532
      
      writeContract({
        address: '0x3dD1a497846d060Dce130B67b22E1F9DeE18c051',
        abi: ROUTER_ABI,
        functionName: 'requestCrossChainSwap',
        args: [
          '0x908e1D85604E0e9e703d52D18f3f3f604Fe7Bb1b', // tokenIn (RUSD)
          '0x908e1D85604E0e9e703d52D18f3f3f604Fe7Bb1b', // tokenOut (RUSD)
          amountWei,
          solverFeeWei,
          destinationChainId,
          recipient
        ],
        chainId,
      })
    } catch (error) {
      console.error('Swap error:', error)
      setTxStatus('Swap request failed')
    }
  }, [address, amount, solverFee, recipient, chainId, writeContract])

  // Handle payment link generation
  const handleGeneratePaymentLink = (link: string, qrCodeDataUrl: string, newPaymentId: string) => {
    setPaymentLink(link)
    setQrCode(qrCodeDataUrl)
    setPaymentId(newPaymentId)
    setShowLinkGenerator(false)
  }

  // Handle payment completion
  const handlePaymentComplete = async (success: boolean, message: string) => {
    if (success && paymentId && address) {
      try {
        await recordPaymentAttempt({
          paymentId,
          attemptAddress: address,
          chainId: chainId || 0,
          success: true,
          transactionHash: hash
        })
      } catch (error) {
        console.error('Failed to record payment attempt:', error)
      }
    }
    
    setTxStatus(success ? 'Payment completed successfully!' : `Payment failed: ${message}`)
  }

  // Auto-trigger swap after approval
  useEffect(() => {
    if (isConfirmed && approvalHash && txStatus === 'Approval successful! Proceeding with swap...') {
      setTimeout(() => {
        handleSwap()
      }, 1000)
    }
  }, [isConfirmed, approvalHash, txStatus, handleSwap])

  // Handle transaction status updates
  useEffect(() => {
    if (isWritePending) {
      setTxStatus('Transaction pending...')
    } else if (isConfirming) {
      setTxStatus('Transaction confirming...')
    } else if (isConfirmed) {
      if (txStatus.includes('Approval')) {
        setTxStatus('Approval successful! Proceeding with swap...')
        setApprovalHash(hash)
      } else {
        setTxStatus('Swap request submitted successfully!')
      }
    }
  }, [isWritePending, isConfirming, isConfirmed, txStatus, hash])

  return (
    <div className="App">
      <header className="App-header">
        <h1>CrossPay - OnlySwaps Cross-Chain Payments</h1>
        <ConnectButton />
      </header>

      {isConnected && address && (
        <div className="main-content">
          {/* Balance Display */}
          <div className="balance-section">
            <h2>Your Balances</h2>
            <BalanceDisplay address={address} />
          </div>

          {/* Faucet Section */}
          <div className="faucet-section">
            <h2>Get Test Tokens</h2>
            <div className="faucet-buttons">
              <div className="faucet-item">
                <h3>Base Sepolia</h3>
                <FaucetButton chainId={84532} />
              </div>
              <div className="faucet-item">
                <h3>Avalanche Fuji</h3>
                <FaucetButton chainId={43113} />
              </div>
            </div>
          </div>

          {/* Mode Toggle */}
          <div className="mode-toggle">
            <button 
              className={mode === 'swap' ? 'active' : ''} 
              onClick={() => setMode('swap')}
            >
              Direct Swap
            </button>
            <button 
              className={mode === 'payment' ? 'active' : ''} 
              onClick={() => setMode('payment')}
            >
              Generate Payment Link
            </button>
          </div>

          {/* Payment Link Handler (for recipients) */}
          {mode === 'payment' && paymentId && (
            <div className="payment-link-section">
              <h2>Payment Link</h2>
              <PaymentLinkHandler 
                paymentId={paymentId}
                recipientAddress={address}
                onPaymentComplete={handlePaymentComplete}
              />
            </div>
          )}

          {/* Payment Link Generator (for creators) */}
          {mode === 'payment' && !paymentId && (
            <div className="payment-link-section">
              <h2>Create Payment Link</h2>
              <div className="form-group">
                <label>Amount (RUSD):</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="5.0"
                  step="0.01"
                  min="0"
                />
              </div>
              
              <div className="form-group">
                <label>Solver Fee (RUSD):</label>
                <input
                  type="number"
                  value={solverFee}
                  onChange={(e) => setSolverFee(e.target.value)}
                  placeholder="0.01"
                  step="0.001"
                  min="0"
                />
              </div>
              
              <div className="form-group">
                <label>Recipient Address:</label>
                <input
                  type="text"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="0x..."
                />
              </div>

              <PaymentLinkGenerator
                amount={amount}
                solverFee={solverFee}
                recipient={recipient}
                creatorAddress={address}
                sourceChainId={chainId || 84532}
                destinationChainId={chainId === 84532 ? 43113 : 84532}
                onGenerate={handleGeneratePaymentLink}
              />
            </div>
          )}

          {/* Direct Swap Mode */}
          {mode === 'swap' && (
            <div className="swap-section">
              <h2>Cross-Chain Swap</h2>
              <div className="form-group">
                <label>Amount (RUSD):</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="5.0"
                  step="0.01"
                  min="0"
                />
              </div>
              
              <div className="form-group">
                <label>Solver Fee (RUSD):</label>
                <input
                  type="number"
                  value={solverFee}
                  onChange={(e) => setSolverFee(e.target.value)}
                  placeholder="0.01"
                  step="0.001"
                  min="0"
                />
              </div>
              
              <div className="form-group">
                <label>Recipient Address:</label>
                <input
                  type="text"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="0x..."
                />
              </div>

              <div className="button-group">
                <button 
                  className="approve-button"
                  onClick={handleApproval}
                  disabled={isWritePending || isConfirming}
                >
                  {isWritePending ? 'Approving...' : '1. Approve RUSD'}
                </button>
                
                <button 
                  className="swap-button"
                  onClick={handleSwap}
                  disabled={isWritePending || isConfirming}
                >
                  {isWritePending ? 'Processing...' : '2. Request Swap'}
                </button>
              </div>
            </div>
          )}

          {/* Transaction Status */}
          {txStatus && (
            <div className="status-section">
              <h3>Status</h3>
              <p className={txStatus.includes('success') ? 'success' : 'info'}>{txStatus}</p>
              {hash && (
                <p>
                  <a 
                    href={`https://${chainId === 84532 ? 'sepolia.basescan.org' : 'testnet.snowtrace.io'}/tx/${hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
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
      )}

      {!isConnected && (
        <div className="connect-prompt">
          <h2>Connect Your Wallet</h2>
          <p>Connect your wallet to start using CrossPay for cross-chain RUSD transfers.</p>
        </div>
      )}
    </div>
  )
}

export default App

