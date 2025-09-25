import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { getPaymentLinksByCreator, checkApiHealth } from '../utils/transactionRecorder'

interface PaymentLink {
  paymentId: string
  creatorAddress: string
  recipientAddress: string
  amount: string
  solverFee: string
  sourceChainId: number
  destinationChainId: number
  status: string
  originalStatus: string
  createdAt: string
  expiresAt: string
  paidAt?: string
  transactionHash?: string
  paymentUrl: string
  attemptCount: number
  successfulAttempts: number
  failedAttempts: number
  lastAttempt?: {
    timestamp: string
    address: string
    chainId: number
    success: boolean
    errorMessage?: string
    transactionHash?: string
  }
  completionDetails?: {
    completedAt: string
    transactionHash: string
    attemptAddress: string
    attemptChainId: number
  }
}

export default function PaymentLinks() {
  const { address, isConnected } = useAccount()
  const [paymentLinks, setPaymentLinks] = useState<PaymentLink[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [apiHealth, setApiHealth] = useState<boolean | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid'>('all')

  const loadPaymentLinks = async () => {
    if (!address) return

    setLoading(true)
    setError('')

    try {
      const result = await getPaymentLinksByCreator(address, {
        status: filter === 'all' ? undefined : filter as any,
        limit: 50,
        offset: 0
      })

      if (result.success && result.data) {
        setPaymentLinks(result.data.paymentLinks || [])
      } else {
        setError(result.error || 'Failed to load payment links')
      }
    } catch (err) {
      setError('Failed to load payment links')
      console.error('Error loading payment links:', err)
    } finally {
      setLoading(false)
    }
  }

  const checkHealth = async () => {
    const isHealthy = await checkApiHealth()
    setApiHealth(isHealthy)
  }

  useEffect(() => {
    if (isConnected && address) {
      loadPaymentLinks()
      checkHealth()
    }
  }, [isConnected, address, filter])

  const getChainName = (chainId: number) => {
    switch (chainId) {
      case 84532: return 'Base Sepolia'
      case 43113: return 'Avalanche Fuji'
      default: return `Chain ${chainId}`
    }
  }

  const formatAmount = (amount: string) => {
    return (parseInt(amount) / 1e18).toFixed(4)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'paid':
        return 'success'
      case 'pending':
        return 'warning'
      case 'expired':
      case 'failed':
        return 'error'
      default:
        return 'info'
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      alert('Copied to clipboard!')
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  if (!isConnected) {
    return (
      <div className="payment-links">
        <h2>Payment Links</h2>
        <p>Connect your wallet to view your payment links.</p>
      </div>
    )
  }

  return (
    <div className="payment-links">
      <div className="header">
        <h2>Your Payment Links</h2>
        <div className="controls">
          <div className="filter-group">
            <label>Filter:</label>
            <select value={filter} onChange={(e) => setFilter(e.target.value as any)}>
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
            </select>
          </div>
          <button onClick={loadPaymentLinks} disabled={loading}>
            {loading ? 'Loading...' : 'Refresh'}
          </button>
          <div className="api-status">
            API Status: {apiHealth === null ? 'Checking...' : apiHealth ? '✅ Healthy' : '❌ Unhealthy'}
          </div>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {paymentLinks.length === 0 && !loading ? (
        <p>No payment links found. <a href="/create">Create your first payment link</a>!</p>
      ) : (
        <div className="payment-links-list">
          {paymentLinks.map((link) => (
            <div key={link.paymentId} className={`payment-link-item ${getStatusColor(link.status)}`}>
              <div className="payment-link-header">
                <div className="status-info">
                  <span className={`status-badge ${getStatusColor(link.status)}`}>
                    {link.status.toUpperCase()}
                  </span>
                  <span className="payment-id">ID: {link.paymentId.slice(0, 8)}...</span>
                </div>
                <div className="amount-info">
                  <span className="amount">{formatAmount(link.amount)} RUSD</span>
                  <span className="fee">+ {formatAmount(link.solverFee)} fee</span>
                </div>
              </div>

              <div className="payment-link-details">
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>From (Sender):</label>
                    <span className="address">{link.recipientAddress.slice(0, 10)}...{link.recipientAddress.slice(-8)}</span>
                  </div>
                  <div className="detail-item">
                    <label>To (You):</label>
                    <span className="address">{link.creatorAddress.slice(0, 10)}...{link.creatorAddress.slice(-8)}</span>
                  </div>
                  <div className="detail-item">
                    <label>From Chain:</label>
                    <span>{getChainName(link.sourceChainId)}</span>
                  </div>
                  <div className="detail-item">
                    <label>To Chain:</label>
                    <span>{getChainName(link.destinationChainId)}</span>
                  </div>
                  <div className="detail-item">
                    <label>Created:</label>
                    <span>{new Date(link.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="detail-item">
                    <label>Expires:</label>
                    <span>{new Date(link.expiresAt).toLocaleString()}</span>
                  </div>
                  {link.paidAt && (
                    <div className="detail-item">
                      <label>Paid:</label>
                      <span>{new Date(link.paidAt).toLocaleString()}</span>
                    </div>
                  )}
                  {link.transactionHash && (
                    <div className="detail-item">
                      <label>Transaction:</label>
                      <a 
                        href={`https://${link.destinationChainId === 84532 ? 'sepolia.basescan.org' : 'testnet.snowtrace.io'}/tx/${link.transactionHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="transaction-link"
                      >
                        {link.transactionHash.slice(0, 10)}...
                      </a>
                    </div>
                  )}
                </div>

                <div className="attempts-info">
                  <div className="attempt-stats">
                    <span>Attempts: {link.attemptCount}</span>
                    <span className="success">✅ {link.successfulAttempts}</span>
                    <span className="failed">❌ {link.failedAttempts}</span>
                  </div>
                </div>

                <div className="payment-url-section">
                  <label>Payment URL:</label>
                  <div className="url-container">
                    <input
                      type="text"
                      value={link.paymentUrl}
                      readOnly
                      className="url-input"
                    />
                    <button 
                      onClick={() => copyToClipboard(link.paymentUrl)}
                      className="copy-button"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                {link.lastAttempt && (
                  <div className="last-attempt">
                    <h4>Last Attempt:</h4>
                    <div className="attempt-details">
                      <span>By: {link.lastAttempt.address.slice(0, 10)}...{link.lastAttempt.address.slice(-8)}</span>
                      <span>Chain: {getChainName(link.lastAttempt.chainId)}</span>
                      <span>Status: {link.lastAttempt.success ? '✅ Success' : '❌ Failed'}</span>
                      {link.lastAttempt.errorMessage && (
                        <span className="error">Error: {link.lastAttempt.errorMessage}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
