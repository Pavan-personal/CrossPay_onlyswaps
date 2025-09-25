import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { getTransactionsByWallet, checkApiHealth } from '../utils/transactionRecorder'

interface Transaction {
  id: string
  type: 'send' | 'swap' | 'payment'
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

  const [typeFilter, setTypeFilter] = useState<'all' | 'send' | 'swap'>('all')
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
    const isHealthy = await checkApiHealth()
    setApiHealth(isHealthy)
  }

  useEffect(() => {
    if (isConnected && address) {
      loadTransactions()
      checkHealth()
    }
  }, [isConnected, address, typeFilter, successFilter])

  const getChainName = (chainId: number | null) => {
    if (chainId === null) return 'N/A'
    switch (chainId) {
      case 84532: return 'Base Sepolia'
      case 43113: return 'Avalanche Fuji'
      default: return `Chain ${chainId}`
    }
  }

  const formatAmount = (amount: string) => {
    return (parseInt(amount) / 1e18).toFixed(4)
  }

  if (!isConnected) {
    return (
      <div className="transaction-history">
        <h3>Transaction History</h3>
        <p>Connect your wallet to view transaction history.</p>
      </div>
    )
  }

  return (
    <div className="transaction-history">
      <div className="header">
        <h3>Transaction History</h3>
        <div className="controls">
          <div className="filter-group">
            <label>Type:</label>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as any)}>
              <option value="all">All</option>
              <option value="send">Send</option>
              <option value="swap">Swap</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Success:</label>
            <select value={successFilter} onChange={(e) => setSuccessFilter(e.target.value as any)}>
              <option value="all">All</option>
              <option value="true">Success</option>
              <option value="false">Failed</option>
            </select>
          </div>
          <button onClick={loadTransactions} disabled={loading}>
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

      {transactions.length === 0 && !loading ? (
        <p>No transactions found. Try making a send or swap transaction!</p>
      ) : (
        <div className="transactions-list">
          {transactions.map((tx) => (
            <div key={tx.id} className={`transaction-item ${tx.success ? 'success' : 'failed'}`}>
              <div className="transaction-header">
                <span className="transaction-type">{tx.type.toUpperCase()}</span>
                <span className={`transaction-status ${tx.success ? 'success' : 'failed'}`}>
                  {tx.success ? '✅ Success' : '❌ Failed'}
                </span>
              </div>
              
              <div className="transaction-details">
                <div className="detail-row">
                  <span>Amount:</span>
                  <span>{formatAmount(tx.amount)} RUSD</span>
                </div>
                <div className="detail-row">
                  <span>Recipient:</span>
                  <span className="address">{tx.recipientAddress.slice(0, 10)}...{tx.recipientAddress.slice(-8)}</span>
                </div>
                <div className="detail-row">
                  <span>From:</span>
                  <span>{getChainName(tx.fromChainId)}</span>
                </div>
                <div className="detail-row">
                  <span>To:</span>
                  <span>{getChainName(tx.toChainId)}</span>
                </div>
                {tx.transactionHash && (
                  <div className="detail-row">
                    <span>Hash:</span>
                    <a 
                      href={`https://${tx.fromChainId === 84532 ? 'sepolia.basescan.org' : 'testnet.snowtrace.io'}/tx/${tx.transactionHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="transaction-link"
                    >
                      {tx.transactionHash.slice(0, 10)}...
                    </a>
                  </div>
                )}
                {tx.errorMessage && (
                  <div className="detail-row error">
                    <span>Error:</span>
                    <span>{tx.errorMessage}</span>
                  </div>
                )}
                <div className="detail-row">
                  <span>Date:</span>
                  <span>{new Date(tx.timestamp).toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
