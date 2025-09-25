# CrossPay - Cross-Chain Payment Platform

A modern cross-chain payment platform built with React, TypeScript, and Node.js that enables seamless RUSD token transfers between Base Sepolia and Avalanche Fuji networks.

## 🏗️ Project Structure

```
onlyswaps-frontend/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── utils/         # Utility functions
│   │   └── lib/           # Library configurations
│   ├── public/            # Static assets
│   └── package.json       # Frontend dependencies
├── server/                # Backend Node.js API
│   ├── prisma/           # Database schema and migrations
│   ├── config.js         # Server configuration
│   ├── server.js         # Main server file
│   └── package.json      # Backend dependencies
└── README.md             # This file
```

## 🚀 Features

- **Cross-Chain Swaps**: Swap RUSD tokens between Base Sepolia and Avalanche Fuji
- **Payment Links**: Create shareable payment requests with QR codes
- **Transaction History**: Track all your cross-chain transactions
- **Wallet Integration**: Connect with MetaMask and other Web3 wallets
- **Real-time Status**: Monitor transaction status and completion
- **Mobile Responsive**: Optimized for all device sizes

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Wagmi** for Ethereum wallet integration
- **RainbowKit** for wallet connection UI
- **Heroicons** for icons
- **GSAP** for animations

### Backend
- **Node.js** with Express
- **Prisma** ORM with SQLite database
- **CORS** for cross-origin requests
- **Joi** for request validation
- **UUID** for unique identifiers

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd onlyswaps-frontend
   ```

2. **Install dependencies**
   ```bash
   # Install frontend dependencies
   cd client
   npm install
   
   # Install backend dependencies
   cd ../server
   npm install
   ```

3. **Environment Setup**
   ```bash
   # Create environment file for server
   cd server
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Database Setup**
   ```bash
   cd server
   npx prisma generate
   npx prisma db push
   ```

## 🚀 Running the Application

### Development Mode

1. **Start the backend server**
   ```bash
   cd server
   npm run dev
   ```
   Server will run on `http://localhost:3001`

2. **Start the frontend development server**
   ```bash
   cd client
   npm run dev
   ```
   Frontend will run on `http://localhost:3000`

### Production Build

1. **Build the frontend**
   ```bash
   cd client
   npm run build
   ```

2. **Start the production server**
   ```bash
   cd server
   npm start
   ```

## 🔧 Configuration

### Frontend Configuration
- Update `client/vite.config.ts` for build settings
- Modify `client/tailwind.config.js` for styling
- Configure wallet providers in `client/src/main.tsx`

### Backend Configuration
- Update `server/config.js` for server settings
- Modify `server/prisma/schema.prisma` for database schema
- Configure CORS and other middleware in `server/server.js`

## 📱 Usage

1. **Connect Wallet**: Click the wallet button to connect your MetaMask
2. **Manage Wallet**: View balances, switch networks, and disconnect from the wallet modal
3. **Swap Tokens**: Navigate to Swap page to exchange RUSD between chains
4. **Send Payment**: Use Send page to transfer RUSD to another address
5. **Create Payment Link**: Generate shareable payment requests (either QR or Links)
6. **View History**: Check Transaction History for all your activities

## 🔒 Security

- Environment variables are properly excluded from version control
- Database files are not committed to the repository
- API endpoints include proper validation and error handling
- CORS is configured for secure cross-origin requests

## 📝 API Documentation

The complete API documentation is available in `server/COMPLETE_API_DOCUMENTATION.md`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

If you encounter any issues or have questions, please open an issue on GitHub or contact the development team.

---

**Note**: This is a development version. Make sure to configure proper environment variables and security settings before deploying to production.
