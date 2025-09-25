const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');
const Joi = require('joi');

const app = express();
const PORT = 3000;

// Database connection - Simple approach like MindMesh
const prisma = new PrismaClient();

// Test database connection on startup
async function testConnection() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  }
}

testConnection();

// Middleware
app.use(cors(
  { origin: '*' }
));
app.use(express.json());

// Validation schemas
const createPaymentSchema = Joi.object({
  creatorAddress: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).required(),
  recipientAddress: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).required(),
  amount: Joi.string().pattern(/^\d+$/).required(),
  solverFee: Joi.string().pattern(/^\d+$/).required(),
  sourceChainId: Joi.number().valid(84532, 43113).required(),
  destinationChainId: Joi.number().valid(84532, 43113).required(),
  expiresInHours: Joi.number().min(1).max(168).default(24)
});

const validatePaymentSchema = Joi.object({
  paymentId: Joi.string().uuid().required(),
  recipientAddress: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).required()
});

// Routes

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Payment Backend API is running'
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Payment Backend API is running',
    timestamp: new Date().toISOString()
  });
});

// Create payment link
app.post('/api/payment/create', async (req, res) => {
  try {
    const { error, value } = createPaymentSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.details[0].message
      });
    }

    const paymentId = uuidv4();
    const expiresAt = new Date(Date.now() + (value.expiresInHours * 60 * 60 * 1000));

    const payment = await prisma.paymentLink.create({
      data: {
        paymentId,
        creatorAddress: value.creatorAddress,
        recipientAddress: value.recipientAddress,
        amount: value.amount,
        solverFee: value.solverFee,
        sourceChainId: value.sourceChainId,
        destinationChainId: value.destinationChainId,
        expiresAt,
        metadata: {}
      }
    });

    res.json({
      success: true,
      data: {
        paymentId: payment.paymentId,
        paymentLink: `${process.env.FRONTEND_URL}/payment/${payment.paymentId}`,
        expiresAt: payment.expiresAt,
        status: payment.status
      }
    });
  } catch (err) {
    console.error('Error creating payment link:', err);
    console.error('Error details:', err.message);
    res.status(500).json({
      success: false,
      error: 'Failed to create payment link',
      details: err.message
    });
  }
});

// Validate payment
app.post('/api/payment/validate', async (req, res) => {
  try {
    const { error, value } = validatePaymentSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.details[0].message
      });
    }

    const payment = await prisma.paymentLink.findUnique({
      where: { paymentId: value.paymentId }
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment link not found'
      });
    }

    if (payment.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: 'Payment link is no longer active'
      });
    }

    if (new Date() > new Date(payment.expiresAt)) {
      return res.status(400).json({
        success: false,
        error: 'Payment link has expired'
      });
    }

    // SECURITY: Validate that the requesting address matches the intended recipient
    console.log(`Payment validation: stored recipient ${payment.recipientAddress}, requesting address ${value.recipientAddress}`);

    if (payment.recipientAddress.toLowerCase() !== value.recipientAddress.toLowerCase()) {
      return res.status(403).json({
        success: false,
        error: 'You are not the authorized recipient for this payment',
        details: `Expected: ${payment.recipientAddress}, Got: ${value.recipientAddress}`,
        message: 'Only the intended recipient can process this payment'
      });
    }

    res.json({
      success: true,
      data: {
        paymentId: payment.paymentId,
        amount: payment.amount,
        solverFee: payment.solverFee,
        sourceChainId: payment.sourceChainId,
        destinationChainId: payment.destinationChainId,
        creatorAddress: payment.creatorAddress,
        expiresAt: payment.expiresAt,
        metadata: payment.metadata
      }
    });
  } catch (err) {
    console.error('Error validating payment:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to validate payment'
    });
  }
});

// Record payment attempt
app.post('/api/payment/attempt', async (req, res) => {
  try {
    const { paymentId, attemptAddress, attemptChainId, success, errorMessage, transactionHash } = req.body;

    const attempt = await prisma.paymentAttempt.create({
      data: {
        paymentId,
        attemptAddress,
        attemptChainId,
        success,
        errorMessage,
        transactionHash
      }
    });

    // If payment was successful, mark the payment as paid
    if (success && transactionHash) {
      await prisma.paymentLink.update({
        where: { paymentId },
        data: {
          status: 'paid',
          paidAt: new Date(),
          transactionHash
        }
      });
    }

    res.json({
      success: true,
      data: attempt
    });
  } catch (err) {
    console.error('Error recording payment attempt:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to record payment attempt'
    });
  }
});

// Record standalone transaction (send/swap)
app.post('/api/transaction', async (req, res) => {
  try {
    let {
      type,
      walletAddress,
      fromChainId,
      toChainId,
      amount,
      recipientAddress,
      tokenIn,
      tokenOut,
      success,
      errorMessage,
      transactionHash,
      metadata
    } = req.body;

    // Validate required fields based on transaction type
    if (!type || !walletAddress || !fromChainId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: type, walletAddress, fromChainId'
      });
    }

    // Validate type
    if (!['send', 'swap'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid transaction type. Must be: send or swap'
      });
    }

    // Validate type-specific fields
    if (type === 'send' && !recipientAddress) {
      return res.status(400).json({
        success: false,
        error: 'recipientAddress is required for send transactions'
      });
    }

    if (type === 'swap' && (!tokenIn || !tokenOut)) {
      return res.status(400).json({
        success: false,
        error: 'tokenIn and tokenOut are required for swap transactions'
      });
    }

    // For swap transactions, recipient is the same as wallet address
    if (type === 'swap') {
      recipientAddress = walletAddress;
    }

    const transaction = await prisma.transaction.create({
      data: {
        type,
        walletAddress,
        fromChainId,
        toChainId,
        amount,
        recipientAddress,
        tokenIn,
        tokenOut,
        success: success || false,
        errorMessage,
        transactionHash,
        metadata: metadata || {}
      }
    });

    res.json({
      success: true,
      data: transaction
    });
  } catch (err) {
    console.error('Error recording transaction:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to record transaction'
    });
  }
});

// Get transactions for a wallet address
app.get('/api/transaction/wallet/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const { limit = 50, offset = 0, type, success, direction } = req.query;

    let whereClause = {};

    // Handle direction filter
    if (direction === 'sent') {
      whereClause = { walletAddress: address };
    } else if (direction === 'received') {
      whereClause = {
        recipientAddress: address,
        type: 'send' // Only send transactions can be received
      };
    } else {
      // Default: show both sent and received
      whereClause = {
        OR: [
          { walletAddress: address },
          {
            recipientAddress: address,
            type: 'send'
          }
        ]
      };
    }

    // Apply type filter
    if (type && ['send', 'swap', 'received'].includes(type)) {
      if (type === 'received') {
        // For received, only 'send' type is valid in DB
        whereClause = {
          recipientAddress: address,
          type: 'send'
        };
      } else if (type === 'send' || type === 'swap') {
        // For send/swap, only show sent transactions
        whereClause = {
          walletAddress: address,
          type: type
        };
      }
    }

    if (success !== undefined) {
      whereClause.success = success === 'true';
    }

    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      orderBy: { timestamp: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    const totalCount = await prisma.transaction.count({
      where: whereClause
    });

    res.json({
      success: true,
      data: {
        transactions: transactions.map(tx => {
          // Determine if this is sent or received
          const isReceived = tx.recipientAddress === address && tx.type === 'send';

          return {
            id: tx.id,
            type: isReceived ? 'received' : tx.type, // Change 'send' to 'received' for received transactions
            walletAddress: tx.walletAddress,
            fromChainId: tx.fromChainId,
            toChainId: tx.toChainId,
            amount: tx.amount,
            recipientAddress: tx.recipientAddress,
            tokenIn: tx.tokenIn,
            tokenOut: tx.tokenOut,
            success: tx.success,
            errorMessage: tx.errorMessage,
            transactionHash: tx.transactionHash,
            timestamp: tx.timestamp,
            metadata: tx.metadata
          };
        }),
        pagination: {
          total: totalCount,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: (parseInt(offset) + parseInt(limit)) < totalCount
        }
      }
    });
  } catch (err) {
    console.error('Error fetching transactions:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch transactions'
    });
  }
});

// Get payment details (public - anyone can view payment info)
app.get('/api/payment/:paymentId', async (req, res) => {
  try {
    const payment = await prisma.paymentLink.findUnique({
      where: { paymentId: req.params.paymentId }
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment link not found'
      });
    }

    // Return public payment info (no sensitive data)
    res.json({
      success: true,
      data: {
        paymentId: payment.paymentId,
        amount: payment.amount,
        solverFee: payment.solverFee,
        sourceChainId: payment.sourceChainId,
        destinationChainId: payment.destinationChainId,
        status: payment.status,
        expiresAt: payment.expiresAt,
        createdAt: payment.createdAt,
        // Note: recipientAddress and creatorAddress are not exposed for privacy
      }
    });
  } catch (err) {
    console.error('Error fetching payment:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payment details'
    });
  }
});

// Get payment links created by a specific address
app.get('/api/payment/creator/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const { limit = 50, offset = 0, status } = req.query;

    const whereClause = { creatorAddress: address };
    if (status && ['pending', 'paid'].includes(status)) {
      whereClause.status = status;
    }

    const paymentLinks = await prisma.paymentLink.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset),
      include: {
        paymentAttempts: {
          orderBy: { attemptTimestamp: 'desc' }
        }
      }
    });

    const totalCount = await prisma.paymentLink.count({
      where: whereClause
    });

    res.json({
      success: true,
      data: {
        paymentLinks: paymentLinks.map(payment => {
          // Find successful payment attempt
          const successfulAttempt = payment.paymentAttempts.find(attempt => attempt.success);
          const lastAttempt = payment.paymentAttempts[0] || null;
          const failedAttempts = payment.paymentAttempts.filter(attempt => !attempt.success);

          // Determine actual status based on attempts and payment link status
          let actualStatus = payment.status;
          let completionDetails = null;

          if (successfulAttempt) {
            actualStatus = 'completed';
            completionDetails = {
              completedAt: successfulAttempt.attemptTimestamp,
              transactionHash: successfulAttempt.transactionHash || payment.transactionHash,
              attemptAddress: successfulAttempt.attemptAddress,
              attemptChainId: successfulAttempt.attemptChainId
            };
          } else if (payment.status === 'paid' && payment.transactionHash) {
            actualStatus = 'completed';
            completionDetails = {
              completedAt: payment.paidAt,
              transactionHash: payment.transactionHash,
              attemptAddress: lastAttempt?.attemptAddress || 'unknown',
              attemptChainId: lastAttempt?.attemptChainId || 'unknown'
            };
          } else if (new Date() > new Date(payment.expiresAt)) {
            actualStatus = 'expired';
          } else if (failedAttempts.length > 0) {
            actualStatus = 'failed';
          }

          return {
            paymentId: payment.paymentId,
            creatorAddress: payment.creatorAddress,
            recipientAddress: payment.recipientAddress,
            amount: payment.amount,
            solverFee: payment.solverFee,
            sourceChainId: payment.sourceChainId,
            destinationChainId: payment.destinationChainId,
            status: actualStatus,
            originalStatus: payment.status,
            createdAt: payment.createdAt,
            expiresAt: payment.expiresAt,
            paidAt: payment.paidAt,
            transactionHash: payment.transactionHash,
            metadata: payment.metadata,
            paymentUrl: `${process.env.FRONTEND_URL}/payment/${payment.paymentId}`,

            // Attempt details
            attemptCount: payment.paymentAttempts.length,
            successfulAttempts: payment.paymentAttempts.filter(a => a.success).length,
            failedAttempts: failedAttempts.length,
            lastAttempt: lastAttempt ? {
              timestamp: lastAttempt.attemptTimestamp,
              address: lastAttempt.attemptAddress,
              chainId: lastAttempt.attemptChainId,
              success: lastAttempt.success,
              errorMessage: lastAttempt.errorMessage,
              transactionHash: lastAttempt.transactionHash
            } : null,

            // Completion details
            completionDetails,

            // All attempts for detailed history
            allAttempts: payment.paymentAttempts.map(attempt => ({
              id: attempt.id,
              timestamp: attempt.attemptTimestamp,
              address: attempt.attemptAddress,
              chainId: attempt.attemptChainId,
              success: attempt.success,
              errorMessage: attempt.errorMessage,
              transactionHash: attempt.transactionHash
            }))
          };
        }),
        pagination: {
          total: totalCount,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: (parseInt(offset) + parseInt(limit)) < totalCount
        }
      }
    });
  } catch (err) {
    console.error('Error fetching payment links by creator:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payment links'
    });
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Start server (only if not in Vercel environment)
if (process.env.NODE_ENV !== 'production' || process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`🚀 Payment Backend API running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`💳 Payment API: http://localhost:${PORT}/api/payment`);
  });
}

// Graceful shutdown (only for local development)
if (process.env.NODE_ENV !== 'production' || process.env.VERCEL !== '1') {
  process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down gracefully...');
    await prisma.$disconnect();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\n🛑 Shutting down gracefully...');
    await prisma.$disconnect();
    process.exit(0);
  });
}

module.exports = app;
