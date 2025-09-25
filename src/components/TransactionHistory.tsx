import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { getTransactionsByWallet, checkApiHealth } from '../utils/transactionRecorder'
import { Button } from '@/components/ui/button'
import {
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  WalletIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ArrowTopRightOnSquareIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  ArrowsUpDownIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline'

interface Transaction {
  id: string
  type: 'send' | 'swap' | 'payment' | 'received'
  walletAddress: string
  fromChainId: number
  toChainId: number | null
  amount: string
  recipientAddress: string
  tokenIn: string | null
  tokenOut: string | null
  transactionHash?: string
  success: boolean
  errorMessage?: string
  timestamp: string
  metadata: any
}

export default function TransactionHistory() {
  const { address, isConnected } = useAccount()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [apiHealth, setApiHealth] = useState<boolean | null>(null)

  const [typeFilter, setTypeFilter] = useState<'all' | 'send' | 'swap' | 'received'>('all')
  const [successFilter, setSuccessFilter] = useState<'all' | 'true' | 'false'>('all')

  const loadTransactions = async () => {
    if (!address) return

    setLoading(true)
    setError('')

    try {
      const result = await getTransactionsByWallet(address, {
        type: typeFilter === 'all' ? undefined : typeFilter,
        success: successFilter === 'all' ? undefined : successFilter === 'true',
        limit: 20,
        offset: 0
      })

      if (result.success && result.data) {
        setTransactions(result.data.transactions || [])
      } else {
        setError(result.error || 'Failed to load transactions')
      }
    } catch (err) {
      setError('Failed to load transactions')
      console.error('Error loading transactions:', err)
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
      loadTransactions()
      checkHealth()
    }
  }, [isConnected, address, typeFilter, successFilter])

  const getChainName = (chainId: number) => {
    switch (chainId) {
      case 84532: return 'Base Sepolia'
      case 43113: return 'Avalanche Fuji'
      default: return `Chain ${chainId}`
    }
  }

  const getChainColor = (chainId: number) => {
    switch (chainId) {
      case 84532: return 'bg-blue-500'
      case 43113: return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'send':
        return <ArrowRightIcon className="w-5 h-5" />
      case 'swap':
        return <ArrowsUpDownIcon className="w-5 h-5" />
      case 'received':
        return <ArrowLeftIcon className="w-5 h-5" />
      case 'payment':
        return <CurrencyDollarIcon className="w-5 h-5" />
      default:
        return <ArrowPathIcon className="w-5 h-5" />
    }
  }

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'send':
        return 'text-blue-600 bg-blue-100'
      case 'swap':
        return 'text-purple-600 bg-purple-100'
      case 'received':
        return 'text-green-600 bg-green-100'
      case 'payment':
        return 'text-green-600 bg-green-100'
      default:
        return 'text-gray-600 bg-gray-100'
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

  const getExplorerUrl = (chainId: number, txHash: string) => {
    const baseUrl = chainId === 84532 ? 'https://sepolia.basescan.org' : 'https://testnet.snowtrace.io'
    return `${baseUrl}/tx/${txHash}`
  }

  if (!isConnected) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Transaction History</h1>
          <p className="page-subtitle">Connect your wallet to view your transaction history</p>
        </div>
        
        <div className="card max-w-md mx-auto text-center">
          <WalletIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-xl font-bold mb-2">Wallet Not Connected</h2>
          <p className="text-gray-600 mb-6">Please connect your wallet to view your transaction history.</p>
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
          <h1 className="text-4xl font-bold text-black mb-4">Transaction History</h1>
          <p className="text-gray-600 text-lg">View all your cross-chain transactions and their status</p>
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
              onClick={() => setTypeFilter('all')}
              className={`filter-button ${typeFilter === 'all' ? 'active' : ''}`}
            >
              All Types
            </button>
            <button
              onClick={() => setTypeFilter('send')}
              className={`filter-button ${typeFilter === 'send' ? 'active' : ''}`}
            >
              Send
            </button>
            <button
              onClick={() => setTypeFilter('swap')}
              className={`filter-button ${typeFilter === 'swap' ? 'active' : ''}`}
            >
              Swap
            </button>
            <button
              onClick={() => setTypeFilter('received')}
              className={`filter-button ${typeFilter === 'received' ? 'active' : ''}`}
            >
              Received
            </button>
          </div>
          
          <div className="filter-group">
            <button
              onClick={() => setSuccessFilter('all')}
              className={`filter-button ${successFilter === 'all' ? 'active' : ''}`}
            >
              All Status
            </button>
            <button
              onClick={() => setSuccessFilter('true')}
              className={`filter-button ${successFilter === 'true' ? 'active' : ''}`}
            >
              Success
            </button>
            <button
              onClick={() => setSuccessFilter('false')}
              className={`filter-button ${successFilter === 'false' ? 'active' : ''}`}
            >
              Failed
            </button>
          </div>
          
          <Button
            onClick={loadTransactions}
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
          <p className="loading-text">Loading transactions...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="error-container">
          <XCircleIcon className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h2 className="error-title">Error Loading Transactions</h2>
          <p className="error-message">{error}</p>
          <Button onClick={loadTransactions} className="mt-4">
            Try Again
          </Button>
        </div>
      )}

      {/* Transactions List */}
      {!loading && !error && (
        <div className="transaction-history">
          {transactions.length === 0 ? (
            <div className="card text-center py-12">
              <ArrowPathIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-bold mb-2">No Transactions Found</h3>
              <p className="text-gray-600 mb-6">You haven't made any transactions yet.</p>
              <div className="flex space-x-4 justify-center">
                <Button onClick={() => window.location.href = '/swap'}>
                  <ArrowsUpDownIcon className="w-5 h-5 mr-2" />
                  Start Swapping
                </Button>
                <Button onClick={() => window.location.href = '/send'} variant="outline">
                  <ArrowRightIcon className="w-5 h-5 mr-2" />
                  Send Payment
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {transactions
                .filter((transaction) => {
                  if (typeFilter === 'all') return true
                  if (typeFilter === 'send') return transaction.type === 'send'
                  if (typeFilter === 'swap') return transaction.type === 'swap'
                  if (typeFilter === 'received') return transaction.type === 'received'
                  return true
                })
                .filter((transaction) => {
                  if (successFilter === 'all') return true
                  if (successFilter === 'true') return transaction.success === true
                  if (successFilter === 'false') return transaction.success === false
                  return true
                })
                .map((transaction) => (
                <div key={transaction.id} className="transaction-item">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 ${getTransactionTypeColor(transaction.type)}`}>
                        {getTransactionIcon(transaction.type)}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold capitalize">{transaction.type} Transaction</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span className="flex items-center">
                            <CalendarIcon className="w-4 h-4 mr-1" />
                            {formatDate(transaction.timestamp)}
                          </span>
                          <span className="flex items-center">
                            <ClockIcon className="w-4 h-4 mr-1" />
                            {transaction.success ? 'Completed' : 'Failed'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <div className={`status ${transaction.success ? 'status-success' : 'status-error'}`}>
                        {transaction.success ? (
                          <CheckCircleIcon className="w-4 h-4 mr-1" />
                        ) : (
                          <XCircleIcon className="w-4 h-4 mr-1" />
                        )}
                        {transaction.success ? 'Success' : 'Failed'}
                      </div>
                      
                      {transaction.transactionHash && (
                        <Button
                          onClick={() => window.open(getExplorerUrl(transaction.fromChainId, transaction.transactionHash!), '_blank')}
                          variant="outline"
                          size="sm"
                        >
                          <ArrowTopRightOnSquareIcon className="w-4 h-4 mr-2" />
                          View
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Transaction Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="detail-row">
                          <span className="text-gray-600">Amount:</span>
                          <span className="font-semibold font-mono">{formatAmount(transaction.amount)} RUSD</span>
                        </div>
                        
                        <div className="detail-row">
                          <span className="text-gray-600">From Chain:</span>
                          <div className="flex items-center">
                            <div className={`w-2 h-2 rounded-full mr-2 ${getChainColor(transaction.fromChainId)}`}></div>
                            <span className="font-semibold">{getChainName(transaction.fromChainId)}</span>
                          </div>
                        </div>
                        
                        {transaction.toChainId && (
                          <div className="detail-row">
                            <span className="text-gray-600">To Chain:</span>
                            <div className="flex items-center">
                              <div className={`w-2 h-2 rounded-full mr-2 ${getChainColor(transaction.toChainId)}`}></div>
                              <span className="font-semibold">{getChainName(transaction.toChainId)}</span>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        {transaction.recipientAddress && (
                          <div className="detail-row">
                            <span className="text-gray-600">Recipient:</span>
                            <span className="font-mono text-sm">
                              {transaction.recipientAddress.slice(0, 6)}...{transaction.recipientAddress.slice(-4)}
                            </span>
                          </div>
                        )}
                        
                        {transaction.transactionHash && (
                          <div className="detail-row">
                            <span className="text-gray-600">Transaction Hash:</span>
                            <a
                              href={getExplorerUrl(transaction.fromChainId, transaction.transactionHash)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="transaction-link"
                            >
                              {transaction.transactionHash.slice(0, 10)}...
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Error Message */}
                    {!transaction.success && transaction.errorMessage && (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-start">
                          <ExclamationTriangleIcon className="w-5 h-5 mr-2 text-red-600 mt-0.5" />
                          <div>
                            <h4 className="font-semibold text-red-800 mb-1">Error Details</h4>
                            <p className="text-sm text-red-700">{transaction.errorMessage}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Success Message */}
                    {transaction.success && (
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-start">
                          <CheckCircleIcon className="w-5 h-5 mr-2 text-green-600 mt-0.5" />
                          <div>
                            <h4 className="font-semibold text-green-800 mb-1">Transaction Successful</h4>
                            <p className="text-sm text-green-700">
                              Your {transaction.type} transaction has been completed successfully.
                            </p>
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