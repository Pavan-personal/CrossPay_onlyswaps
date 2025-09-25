import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { getPaymentLinksByCreator, checkApiHealth } from '../utils/transactionRecorder'
import { Button } from '@/components/ui/button'
import {
  LinkIcon,
  ClipboardDocumentIcon,
  WalletIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  CurrencyDollarIcon,
  CubeIcon,
  UserIcon,
  CalendarIcon,
  ArrowPathIcon,
  EyeIcon,
  ShareIcon,
} from '@heroicons/react/24/outline'

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
        status: filter === 'all' ? undefined : filter,
        limit: 20,
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
    try {
      const result = await checkApiHealth()
      setApiHealth(result)
    } catch (error) {
      setApiHealth(false)
    }
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


  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <span className="status-badge status-success">
            <CheckCircleIcon className="w-4 h-4 mr-1" />
            Paid
          </span>
        )
      case 'pending':
        return (
          <span className="status-badge status-pending">
            <ClockIcon className="w-4 h-4 mr-1" />
            Pending
          </span>
        )
      case 'expired':
        return (
          <span className="status-badge status-error">
            <XCircleIcon className="w-4 h-4 mr-1" />
            Expired
          </span>
        )
      default:
        return (
          <span className="status-badge status-info">
            <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
            {status}
          </span>
        )
    }
  }

  const formatAmount = (amount: string) => {
    try {
      return (parseFloat(amount) / 1e18).toFixed(4)
    } catch {
      return '0.0000'
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return 'Invalid Date'
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
    }
  }

  const openPaymentLink = (url: string) => {
    window.open(url, '_blank')
  }

  if (!isConnected) {
    return (
      <div className="page-container">
        <div className="page-header">
        <h1 className="text-4xl font-bold text-black mb-4">Payment Links</h1>
          <p className="page-subtitle">Connect your wallet to view your payment links</p>
        </div>
        
        <div className="card max-w-md mx-auto text-center">
          <WalletIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-xl font-bold mb-2">Wallet Not Connected</h2>
          <p className="text-gray-600 mb-6">Please connect your wallet to view your payment links.</p>
          <Button size="lg" className="w-full">
            <WalletIcon className="w-5 h-5 mr-2" />
            Connect Wallet
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-black mb-4">Payment Links</h1>
          <p className="text-gray-600 text-lg">Manage your created payment links and track their status</p>
        </div>

      {/* API Health Status */}
      {apiHealth !== null && (
        <div className={`card mb-6 ${apiHealth ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
          <div className="flex items-center">
            {apiHealth ? (
              <CheckCircleIcon className="w-5 h-5 mr-2 text-green-600" />
            ) : (
              <XCircleIcon className="w-5 h-5 mr-2 text-red-600" />
            )}
            <span className={`font-semibold ${apiHealth ? 'text-green-800' : 'text-red-800'}`}>
              API Status: {apiHealth ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="filter-group">
            <button
              onClick={() => setFilter('all')}
              className={`filter-button ${filter === 'all' ? 'active' : ''}`}
            >
              All Links
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`filter-button ${filter === 'pending' ? 'active' : ''}`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilter('paid')}
              className={`filter-button ${filter === 'paid' ? 'active' : ''}`}
            >
              Received
            </button>
          </div>
          
          <Button
            onClick={loadPaymentLinks}
            disabled={loading}
            variant="outline"
            size="sm"
          >
            {loading ? (
              <div className="spinner mr-2" />
            ) : (
              <ArrowPathIcon className="w-4 h-4 mr-2" />
            )}
            Refresh
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="loading-container">
          <div className="spinner mb-4" />
          <p className="loading-text">Loading payment links...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="error-container">
          <XCircleIcon className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h2 className="error-title">Error Loading Payment Links</h2>
          <p className="error-message">{error}</p>
          <Button onClick={loadPaymentLinks} className="mt-4">
            Try Again
          </Button>
        </div>
      )}

      {/* Payment Links List */}
      {!loading && !error && (
        <div className="payment-links">
          {paymentLinks.length === 0 ? (
            <div className="card text-center py-12">
              <LinkIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-bold mb-2">No Payment Links Found</h3>
              <p className="text-gray-600 mb-6">You haven't created any payment links yet.</p>
              <Button onClick={() => window.location.href = '/create'}>
                <ShareIcon className="w-5 h-5 mr-2" />
                Create Payment Link
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {paymentLinks.map((link) => (
                <div key={link.paymentId} className="payment-link-item">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h3 className="text-lg font-bold mr-3">Payment Link</h3>
                        {getStatusBadge(link.status)}
                      </div>
                      <div className="amount-info">
                        {formatAmount(link.amount)} RUSD
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => openPaymentLink(link.paymentUrl)}
                        variant="outline"
                        size="sm"
                      >
                        <EyeIcon className="w-4 h-4 mr-2" />
                        View
                      </Button>
                      <Button
                        onClick={() => copyToClipboard(link.paymentUrl)}
                        variant="outline"
                        size="sm"
                      >
                        <ClipboardDocumentIcon className="w-4 h-4 mr-2" />
                        Copy
                      </Button>
                    </div>
                  </div>

                  <div className="payment-link-details">
                    <div className="detail-grid">
                      <div className="flex items-center">
                        <CurrencyDollarIcon className="w-4 h-4 mr-2 text-gray-500" />
                        <span className="text-sm text-gray-600">Amount:</span>
                        <span className="ml-2 font-semibold">{formatAmount(link.amount)} RUSD</span>
                      </div>
                      
                      <div className="flex items-center">
                        <CubeIcon className="w-4 h-4 mr-2 text-gray-500" />
                        <span className="text-sm text-gray-600">From:</span>
                        <span className="ml-2 font-semibold">{getChainName(link.sourceChainId)}</span>
                      </div>
                      
                      <div className="flex items-center">
                        <CubeIcon className="w-4 h-4 mr-2 text-gray-500" />
                        <span className="text-sm text-gray-600">To:</span>
                        <span className="ml-2 font-semibold">{getChainName(link.destinationChainId)}</span>
                      </div>
                      
                      <div className="flex items-center">
                        <UserIcon className="w-4 h-4 mr-2 text-gray-500" />
                        <span className="text-sm text-gray-600">Recipient:</span>
                        <span className="ml-2 font-mono text-sm">
                          {link.recipientAddress?.slice(0, 6)}...{link.recipientAddress?.slice(-4)}
                        </span>
                      </div>
                      
                      <div className="flex items-center">
                        <CalendarIcon className="w-4 h-4 mr-2 text-gray-500" />
                        <span className="text-sm text-gray-600">Created:</span>
                        <span className="ml-2 text-sm">{formatDate(link.createdAt)}</span>
                      </div>
                      
                      <div className="flex items-center">
                        <ClockIcon className="w-4 h-4 mr-2 text-gray-500" />
                        <span className="text-sm text-gray-600">Expires:</span>
                        <span className="ml-2 text-sm">{formatDate(link.expiresAt)}</span>
                      </div>
                    </div>

                    {/* Payment URL Section */}
                    <div className="payment-url-section">
                      <h4 className="font-semibold mb-2 flex items-center">
                        <LinkIcon className="w-4 h-4 mr-2" />
                        Payment URL
                      </h4>
                      <div className="url-container">
                        <input
                          type="text"
                          value={link.paymentUrl}
                          readOnly
                          className="form-input flex-1 text-sm"
                        />
                        <Button
                          onClick={() => copyToClipboard(link.paymentUrl)}
                          size="sm"
                        >
                          <ClipboardDocumentIcon className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Attempt Statistics */}
                    {link.attemptCount > 0 && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-semibold mb-2">Attempt Statistics</h4>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div className="text-center">
                            <div className="font-bold text-lg">{link.attemptCount}</div>
                            <div className="text-gray-600">Total Attempts</div>
                          </div>
                          <div className="text-center">
                            <div className="font-bold text-lg text-green-600">{link.successfulAttempts}</div>
                            <div className="text-gray-600">Successful</div>
                          </div>
                          <div className="text-center">
                            <div className="font-bold text-lg text-red-600">{link.failedAttempts}</div>
                            <div className="text-gray-600">Failed</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Last Attempt */}
                    {link.lastAttempt && (
                      <div className="last-attempt">
                        <h4 className="font-semibold mb-2">Last Attempt</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Time:</span>
                            <span>{formatDate(link.lastAttempt.timestamp)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Address:</span>
                            <span className="font-mono">
                              {link.lastAttempt.address.slice(0, 6)}...{link.lastAttempt.address.slice(-4)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Chain:</span>
                            <span>{getChainName(link.lastAttempt.chainId)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Status:</span>
                            <span className={link.lastAttempt.success ? 'text-green-600' : 'text-red-600'}>
                              {link.lastAttempt.success ? 'Success' : 'Failed'}
                            </span>
                          </div>
                          {link.lastAttempt.errorMessage && (
                            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-700">
                              <strong>Error:</strong> {link.lastAttempt.errorMessage}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Completion Details */}
                    {link.completionDetails && (
                      <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <h4 className="font-semibold mb-2 text-green-800">Payment Completed</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Completed At:</span>
                            <span>{formatDate(link.completionDetails.completedAt)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Transaction Hash:</span>
                            <a
                              href={`https://${link.completionDetails.attemptChainId === 84532 ? 'sepolia.basescan.org' : 'testnet.snowtrace.io'}/tx/${link.completionDetails.transactionHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 font-mono text-xs"
                            >
                              {link.completionDetails.transactionHash.slice(0, 10)}...
                            </a>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  )
}