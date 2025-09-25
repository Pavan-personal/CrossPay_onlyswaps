import { useAccount, useBalance, useChainId } from 'wagmi'
import { Button } from '@/components/ui/button'
import { useRusdBalance } from '@/hooks/useRusdBalance'
import {
  XMarkIcon,
  WalletIcon,
  CurrencyDollarIcon,
  CubeIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline'

interface WalletModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function WalletModal({ isOpen, onClose }: WalletModalProps) {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { data: ethBalance } = useBalance({ address })
  const { balance: rusdBalance, isLoading: isLoadingRusd } = useRusdBalance(address, chainId)

  // Get chain name
  const getChainName = (chainId: number) => {
    switch (chainId) {
      case 84532: return 'Base Sepolia'
      case 43113: return 'Avalanche Fuji'
      default: return `Chain ${chainId}`
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 border-2 border-black">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-black">Wallet Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Wallet Address */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
              <WalletIcon className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Wallet Address</p>
              <p className="font-mono text-sm text-black">
                {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Not connected'}
              </p>
            </div>
          </div>

          {/* Network */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
              <CubeIcon className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Network</p>
              <p className="font-semibold text-black">{getChainName(chainId)}</p>
            </div>
          </div>

          {/* ETH Balance */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
              <CurrencyDollarIcon className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">ETH Balance</p>
              <p className="font-semibold text-black">
                {ethBalance ? `${parseFloat(ethBalance.formatted).toFixed(4)} ETH` : '0.0000 ETH'}
              </p>
            </div>
          </div>

          {/* RUSD Balance */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
              <CurrencyDollarIcon className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">RUSD Balance</p>
              <p className="font-semibold text-black">
                {isLoadingRusd ? 'Loading...' : `${rusdBalance} RUSD`}
              </p>
            </div>
          </div>

          {/* Connection Status */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
              <CheckCircleIcon className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <p className="font-semibold text-black">
                {isConnected ? 'Connected' : 'Disconnected'}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200">
          <Button
            onClick={onClose}
            className="w-full bg-black text-white hover:bg-gray-800"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}
