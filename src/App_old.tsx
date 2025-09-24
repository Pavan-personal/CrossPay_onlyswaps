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
  onGenerate 
}: { 
  amount: string
  solverFee: string
  recipient: string
  onGenerate: (link: string, qrCode: string) => void
}) {
  const [generatedLink, setGeneratedLink] = useState('')
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('')

  const generatePaymentLink = async () => {
    if (!amount || !solverFee || !recipient) {
      alert('Please fill in amount, solver fee, and recipient address')
      return
    }

    // Create payment link with parameters
    const baseUrl = window.location.origin + window.location.pathname
    const params = new URLSearchParams({
      amount,
      solverFee,
      recipient,
      mode: 'payment'
    })
    
    const paymentLink = `${baseUrl}?${params.toString()}`
    
    // Generate QR code
    try {
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
      onGenerate(paymentLink, qrCodeUrl)
    } catch (error) {
      console.error('Error generating QR code:', error)
      alert('Error generating QR code')
    }
  }

  const copyLink = () => {
    navigator.clipboard.writeText(generatedLink)
    alert('Payment link copied to clipboard!')
  }

  const downloadQR = () => {
    if (qrCodeDataUrl) {
      const link = document.createElement('a')
      link.download = 'crosspay-qr.png'
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
      >
        Generate CrossPay Link & QR Code
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
  const [mode, setMode] = useState<'swap' | 'payment'>('swap')

  // Parse URL parameters for payment links
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const urlAmount = urlParams.get('amount')
    const urlSolverFee = urlParams.get('solverFee')
    const urlRecipient = urlParams.get('recipient')
    const urlMode = urlParams.get('mode')

    if (urlMode === 'payment' && urlAmount && urlSolverFee && urlRecipient) {
      setAmount(urlAmount)
      setSolverFee(urlSolverFee)
      setRecipient(urlRecipient)
      setMode('payment')
      setStatus('💰 Payment link detected! Fill in your wallet details and complete the payment.')
    }
  }, [])

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

            {/* Balance Display */}
            <div className="card">
              <h3>Your Balances</h3>
              <BalanceDisplay address={address!} />
              
              {/* Faucet Buttons */}
              <div className="faucet-section">
                <h4>Get RUSD Tokens</h4>
                <div className="faucet-buttons">
                  <div>
                    <p>Base Sepolia:</p>
                    <FaucetButton chainId={84532} />
                  </div>
                  <div>
                    <p>Avalanche Fuji:</p>
                    <FaucetButton chainId={43113} />
                  </div>
                </div>
                <p className="faucet-info">Get 1000 RUSD tokens (24h cooldown)</p>
              </div>
            </div>

            {isBaseSepolia || isAvalancheFuji ? (
              <div className="card">
                <div className="mode-toggle">
                  <button 
                    className={`mode-button ${mode === 'swap' ? 'active' : ''}`}
                    onClick={() => setMode('swap')}
                  >
                    Direct Swap
                  </button>
                  <button 
                    className={`mode-button ${mode === 'payment' ? 'active' : ''}`}
                    onClick={() => setMode('payment')}
                  >
                    Generate Payment Link
                  </button>
                </div>

                <h3>{mode === 'swap' ? 'Request Cross-Chain Swap' : 'CrossPay Payment Link'}</h3>
                
                <label className="label">Amount to Swap:</label>
                <input
                  type="text"
                  className="input"
                  placeholder="0.1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />

                <label className="label">Solver Fee:</label>
                <input
                  type="text"
                  className="input"
                  placeholder="0.01"
                  value={solverFee}
                  onChange={(e) => setSolverFee(e.target.value)}
                />

                <label className="label">Recipient Address (leave empty for yourself):</label>
                <input
                  type="text"
                  className="input"
                  placeholder={address}
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                />

                {mode === 'payment' && (
                  <PaymentLinkGenerator
                    amount={amount}
                    solverFee={solverFee}
                    recipient={recipient || address || ''}
                    onGenerate={() => {}}
                  />
                )}

                {mode === 'swap' && (
                  <>
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
                  </>
                )}

                {mode === 'payment' && (
                  <div className="payment-mode-info">
                    <p>💡 <strong>CrossPay Mode:</strong> Generate a shareable payment link and QR code. Recipients can click the link to complete the cross-chain payment.</p>
                    <p>📱 <strong>Perfect for:</strong> Invoicing, donations, cross-device payments, and sharing payment requests.</p>
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
