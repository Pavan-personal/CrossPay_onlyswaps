const API_BASE_URL = 'http://localhost:3001'

export interface SendTransactionData {
  walletAddress: string
  recipientAddress: string
  amount: string // in wei
  solverFee: string // in wei
  sourceChainId: number
  destinationChainId: number
  transactionHash?: string
  success: boolean
  errorMessage?: string
}

export interface SwapTransactionData {
  walletAddress: string
  amount: string // in wei
  solverFee: string // in wei
  sourceChainId: number
  destinationChainId: number
  transactionHash?: string
  success: boolean
  errorMessage?: string
}

export interface TransactionResponse {
  success: boolean
  data?: {
    transactionId: string
    transactionHash?: string
    status: string
  }
  error?: string
}

export interface TransactionsResponse {
  success: boolean
  data?: {
    transactions: any[]
  }
  error?: string
}

export interface PaymentLinksResponse {
  success: boolean
  data?: {
    paymentLinks: any[]
  }
  error?: string
}

// Record Send Transaction
export async function recordSendTransaction(transactionData: SendTransactionData): Promise<TransactionResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/transaction`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'send',
        walletAddress: transactionData.walletAddress,
        fromChainId: transactionData.sourceChainId,
        amount: transactionData.amount,
        recipientAddress: transactionData.recipientAddress,
        success: transactionData.success,
        transactionHash: transactionData.transactionHash,
        errorMessage: transactionData.errorMessage
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Failed to record send transaction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

// Record Swap Transaction
export async function recordSwapTransaction(transactionData: SwapTransactionData): Promise<TransactionResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/transaction`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'swap',
        walletAddress: transactionData.walletAddress,
        fromChainId: transactionData.sourceChainId,
        toChainId: transactionData.destinationChainId,
        amount: transactionData.amount,
        recipientAddress: transactionData.walletAddress, // For swap, recipient is the same as wallet
        tokenIn: '0x0000000000000000000000000000000000000000', // RUSD token address
        tokenOut: '0x0000000000000000000000000000000000000000', // RUSD token address
        success: transactionData.success,
        transactionHash: transactionData.transactionHash,
        errorMessage: transactionData.errorMessage
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Failed to record swap transaction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

// Get Transactions by Wallet
export async function getTransactionsByWallet(
  walletAddress: string,
  options: {
    type?: 'send' | 'swap' | 'payment' | 'received'
    success?: boolean
    limit?: number
    offset?: number
  } = {}
): Promise<TransactionsResponse> {
  try {
    const params = new URLSearchParams({
      ...(options.type && { type: options.type }),
      ...(options.success !== undefined && { success: options.success.toString() }),
      ...(options.limit && { limit: options.limit.toString() }),
      ...(options.offset && { offset: options.offset.toString() })
    })

    const response = await fetch(`${API_BASE_URL}/api/transaction/wallet/${walletAddress}?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Failed to get transactions by wallet:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

// Get Payment Links by Creator
export async function getPaymentLinksByCreator(
  creatorAddress: string,
  options: {
    status?: 'pending' | 'paid' | 'completed' | 'expired' | 'failed'
    limit?: number
    offset?: number
  } = {}
): Promise<PaymentLinksResponse> {
  try {
    const params = new URLSearchParams({
      ...(options.status && { status: options.status }),
      ...(options.limit && { limit: options.limit.toString() }),
      ...(options.offset && { offset: options.offset.toString() })
    })

    const response = await fetch(`${API_BASE_URL}/api/payment/creator/${creatorAddress}?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Failed to get payment links by creator:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

// Create Payment Link
export async function createPaymentLink(paymentData: {
  creatorAddress: string
  recipientAddress: string
  amount: string
  solverFee: string
  sourceChainId: number
  destinationChainId: number
  expiresInHours: number
}): Promise<TransactionResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/payment/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Failed to create payment link:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

// Get Payment Details
export async function getPaymentDetails(paymentId: string): Promise<TransactionResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/payment/${paymentId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Failed to get payment details:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

// Record Payment Attempt
export async function recordPaymentAttempt(attemptData: {
  paymentId: string
  attemptAddress: string
  attemptChainId: number
  success: boolean
  transactionHash?: string
  errorMessage?: string
}): Promise<TransactionResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/payment/attempt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(attemptData),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Failed to record payment attempt:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

// Health Check
export async function checkApiHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
    })
    return response.ok
  } catch (error) {
    console.error('API health check failed:', error)
    return false
  }
}
