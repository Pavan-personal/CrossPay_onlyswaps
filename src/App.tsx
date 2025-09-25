import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import Swap from './pages/Swap.tsx'
import CreatePayment from './pages/CreatePayment'
import Send from './pages/Send'
import ProcessPayment from './pages/ProcessPayment'
import TransactionHistory from './components/TransactionHistory'
import PaymentLinks from './pages/PaymentLinks'
import './App.css'

function App() {
  return (
    <Router>
      <div className="App">
        <header className="app-header">
          <div className="header-content">
            <h1>CrossPay</h1>
            <nav className="main-nav">
              <Link to="/swap" className="nav-link">Swap</Link>
              <Link to="/create" className="nav-link">Create Payment</Link>
              <Link to="/send" className="nav-link">Send</Link>
              <Link to="/payments" className="nav-link">Payments</Link>
              <Link to="/history" className="nav-link">History</Link>
            </nav>
            <ConnectButton />
          </div>
        </header>

        <main className="app-main">
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

        <footer className="app-footer">
          <p>&copy; 2024 CrossPay - Cross-chain RUSD payments</p>
        </footer>
      </div>
    </Router>
  )
}

export default App