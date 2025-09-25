const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function createTables() {
  try {
    console.log('Creating tables...')
    
    // Create payment_links table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "payment_links" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "paymentId" TEXT NOT NULL UNIQUE,
        "creatorAddress" TEXT NOT NULL,
        "recipientAddress" TEXT NOT NULL,
        "amount" TEXT NOT NULL,
        "solverFee" TEXT NOT NULL,
        "sourceChainId" INTEGER NOT NULL,
        "destinationChainId" INTEGER NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'pending',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "expiresAt" TIMESTAMP(3) NOT NULL,
        "paidAt" TIMESTAMP(3),
        "transactionHash" TEXT,
        "metadata" JSONB
      )
    `
    
    // Create payment_attempts table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "payment_attempts" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "paymentId" TEXT NOT NULL,
        "attemptAddress" TEXT NOT NULL,
        "attemptChainId" INTEGER NOT NULL,
        "attemptTimestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "success" BOOLEAN NOT NULL DEFAULT false,
        "errorMessage" TEXT,
        "transactionHash" TEXT,
        FOREIGN KEY ("paymentId") REFERENCES "payment_links"("paymentId") ON DELETE CASCADE
      )
    `
    
    // Create transactions table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "transactions" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "type" TEXT NOT NULL,
        "walletAddress" TEXT NOT NULL,
        "fromChainId" INTEGER NOT NULL,
        "toChainId" INTEGER,
        "amount" TEXT,
        "recipientAddress" TEXT,
        "tokenIn" TEXT,
        "tokenOut" TEXT,
        "success" BOOLEAN NOT NULL DEFAULT false,
        "errorMessage" TEXT,
        "transactionHash" TEXT,
        "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "metadata" JSONB
      )
    `
    
    // Create indexes
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "payment_links_paymentId_idx" ON "payment_links"("paymentId")`
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "payment_links_recipientAddress_idx" ON "payment_links"("recipientAddress")`
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "payment_links_creatorAddress_idx" ON "payment_links"("creatorAddress")`
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "payment_links_status_idx" ON "payment_links"("status")`
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "payment_links_createdAt_idx" ON "payment_links"("createdAt")`
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "payment_attempts_paymentId_idx" ON "payment_attempts"("paymentId")`
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "payment_attempts_attemptAddress_idx" ON "payment_attempts"("attemptAddress")`
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "transactions_walletAddress_idx" ON "transactions"("walletAddress")`
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "transactions_type_idx" ON "transactions"("type")`
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "transactions_timestamp_idx" ON "transactions"("timestamp")`
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "transactions_success_idx" ON "transactions"("success")`
    
    console.log('✅ Tables created successfully!')
    
    // Test the tables
    const count = await prisma.paymentLink.count()
    console.log('✅ PaymentLink table accessible, count:', count)
    
  } catch (error) {
    console.error('❌ Error creating tables:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

createTables()
