import { useState } from 'react'
import { useAccount, useChainId, useWriteContract } from 'wagmi'
import { parseEther } from 'viem'
import QRCode from 'qrcode'

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
    <button 
      className="faucet-button"
      onClick={handleFaucet}
      disabled={isPending}
    >
      {isPending ? 'Requesting...' : 'Get 1000 RUSD'}
    </button>
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
        setPaymentLink(result.data.paymentLink)
        
        // Generate QR code
        const qrCode = await QRCode.toDataURL(result.data.paymentLink, {
          width: 256,
          margin: 2,
          color: { dark: '#000000', light: '#FFFFFF' }
        })
        setQrCodeUrl(qrCode)
      } else {
        setError(result.error || 'Failed to create payment link')
      }
    } catch (err) {
      setError('Failed to create payment link')
      console.error('Error creating payment:', err)
    } finally {
      setIsCreating(false)
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(paymentLink)
      alert('Payment link copied to clipboard!')
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  if (!isConnected) {
    return (
      <div className="connect-prompt">
        <h2>Connect Your Wallet</h2>
        <p>Connect your wallet to create payment links.</p>
      </div>
    )
  }

  return (
    <div className="create-payment-page">
      <div className="header">
        <h1>Create Payment Request</h1>
        <p>Generate a payment link to request money from someone</p>
      </div>

      <div className="content">
        {/* Faucet Section */}
        <div className="faucet-section">
          <h3>Get Test Tokens</h3>
          <FaucetButton chainId={chainId || 0} />
        </div>

        {/* Payment Form */}
        <div className="payment-form">
          <h3>Payment Request Details</h3>
          
          <div className="form-group">
            <label>Sender Address (Who will pay) *</label>
            <input
              type="text"
              placeholder="0x..."
              value={senderAddress}
              onChange={(e) => setSenderAddress(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Amount (RUSD) *</label>
            <input
              type="number"
              placeholder="Enter amount"
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
            <label>Your Address (Recipient)</label>
            <input
              type="text"
              value={address || 'Connect wallet first'}
              disabled
              className="disabled-field"
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

          <div className="form-group">
            <label>Expires In (Hours)</label>
            <input
              type="number"
              placeholder="24"
              value={expiresInHours}
              onChange={(e) => setExpiresInHours(Number(e.target.value))}
              min="1"
              max="168"
            />
          </div>

          <button 
            className="generate-button"
            onClick={createPayment}
            disabled={isCreating || !senderAddress || !amount}
          >
            {isCreating ? 'Creating...' : 'Generate Payment Request'}
          </button>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
        </div>

        {/* Payment Link Result */}
        {paymentLink && (
          <div className="payment-link-result">
            <h3>Payment Request Created!</h3>
            <div className="payment-details">
              <p><strong>Amount:</strong> {amount} RUSD</p>
              <p><strong>From (Sender):</strong> {senderAddress}</p>
              <p><strong>To (You):</strong> {address}</p>
              <p><strong>From Chain:</strong> {getCurrentChainName(chainId || 0)}</p>
              <p><strong>To Chain:</strong> {destinationChainId === 84532 ? 'Base Sepolia' : 'Avalanche Fuji'}</p>
              <p><strong>Expires:</strong> {expiresInHours} hours</p>
            </div>
            
            <div className="link-section">
              <label>Payment Request Link:</label>
              <div className="link-container">
                <input
                  type="text"
                  value={paymentLink}
                  readOnly
                  className="link-input"
                />
                <button onClick={copyToClipboard} className="copy-button">
                  Copy Link
                </button>
              </div>
              <p className="link-instructions">
                📤 Send this link to <strong>{senderAddress}</strong> - they can click it to pay you!
              </p>
            </div>

            {qrCodeUrl && (
              <div className="qr-section">
                <label>QR Code:</label>
                <div className="qr-code">
                  <img src={qrCodeUrl} alt="Payment QR Code" />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}