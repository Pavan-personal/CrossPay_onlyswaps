import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'
import { useState, useRef, useEffect } from 'react'
import LandingPage from './components/LandingPage'
import Swap from './pages/Swap.tsx'
import CreatePayment from './pages/CreatePayment'
import Send from './pages/Send'
import ProcessPayment from './pages/ProcessPayment'
import TransactionHistory from './components/TransactionHistory'
import PaymentLinks from './pages/PaymentLinks'
import WalletModal from './components/WalletModal'
import MobileNav from './components/MobileNav'
import {
  Bars3Icon,
  ArrowPathIcon,
  PlusIcon,
  PaperAirplaneIcon,
  LinkIcon,
  ClockIcon,
  CubeIcon,
} from '@heroicons/react/24/outline'
import './App.css'

function App() {
  const { isConnected } = useAccount()
  const [showLanding, setShowLanding] = useState(!isConnected)
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false)
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)
  const connectButtonRef = useRef<HTMLDivElement>(null)

  const handleConnectWallet = () => {
    if (connectButtonRef.current) {
      const button = connectButtonRef.current.querySelector('button')
      if (button) {
        button.click()
      }
    }
  }

  const handleStartSwapping = () => {
    if (isConnected) {
      setShowLanding(false)
    } else {
      handleConnectWallet()
    }
  }

  useEffect(() => {
    if (isConnected) {
      setShowLanding(false)
    }
  }, [isConnected])

  // Show landing page if wallet is not connected
  if (showLanding && !isConnected) {
    return (
      <div className="App">
        <LandingPage
          onConnectWallet={handleConnectWallet}
          isWalletConnected={isConnected}
          onStartSwapping={handleStartSwapping}
        />
        <div ref={connectButtonRef} className="hidden">
          <ConnectButton />
        </div>
      </div>
    )
  }

  return (
    <Router>
      <div className="App">
        {/* Header */}
        <header className="bg-white border-b-2 border-black sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <div className="flex items-center">
                <Link to="/" className="text-2xl font-bold text-black">
                  CrossPay
                </Link>
              </div>

              {/* Desktop Navigation */}
              <nav className="hidden lg:flex items-center space-x-8">
                <Link to="/swap" className="flex items-center space-x-2 text-gray-700 hover:text-black transition-colors">
                  <ArrowPathIcon className="w-4 h-4" />
                  <span>Swap</span>
                </Link>
                <Link to="/create" className="flex items-center space-x-2 text-gray-700 hover:text-black transition-colors">
                  <PlusIcon className="w-4 h-4" />
                  <span>Create</span>
                </Link>
                <Link to="/send" className="flex items-center space-x-2 text-gray-700 hover:text-black transition-colors">
                  <PaperAirplaneIcon className="w-4 h-4" />
                  <span>Send</span>
                </Link>
                <Link to="/payments" className="flex items-center space-x-2 text-gray-700 hover:text-black transition-colors">
                  <LinkIcon className="w-4 h-4" />
                  <span>Payments</span>
                </Link>
                <Link to="/history" className="flex items-center space-x-2 text-gray-700 hover:text-black transition-colors">
                  <ClockIcon className="w-4 h-4" />
                  <span>History</span>
                </Link>
              </nav>

              {/* Right Side */}
              <div className="flex items-center space-x-2">
                {/* Chain Icon - All devices */}
                <button
                  onClick={() => setIsWalletModalOpen(true)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg border-2 border-black hover:bg-gray-100 transition-colors"
                >
                  <CubeIcon className="w-5 h-5 text-black" />
                  <span className="hidden sm:inline text-sm font-medium">Wallet</span>
                </button>

                {/* Mobile Menu Button */}
                <button
                  onClick={() => setIsMobileNavOpen(true)}
                  className="lg:hidden p-2 rounded-lg border-2 border-black hover:bg-gray-100 transition-colors"
                >
                  <Bars3Icon className="w-5 h-5 text-black" />
                </button>

                {/* Connect Button - Hidden but functional */}
                <div ref={connectButtonRef} className="hidden">
                  <ConnectButton />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="min-h-screen bg-white">
          <Routes>
            <Route path="/" element={<Navigate to="/swap" replace />} />
            <Route path="/swap" element={<Swap />} />
            <Route path="/create" element={<CreatePayment />} />
            <Route path="/send" element={<Send />} />
            <Route path="/payments" element={<PaymentLinks />} />
            <Route path="/history" element={<TransactionHistory />} />
            <Route path="/payment/:paymentId" element={<ProcessPayment />} />
            <Route path="*" element={<Navigate to="/swap" replace />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="bg-black text-white py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <p className="text-sm">&copy; 2025 CrossPay - Cross-chain RUSD payments</p>
            </div>
          </div>
        </footer>

        {/* Modals */}
        <WalletModal 
          isOpen={isWalletModalOpen} 
          onClose={() => setIsWalletModalOpen(false)} 
        />
        <MobileNav 
          isOpen={isMobileNavOpen} 
          onClose={() => setIsMobileNavOpen(false)} 
        />
      </div>
    </Router>
  )
}

export default App