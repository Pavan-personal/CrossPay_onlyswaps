import { useAccount, useBalance, useChainId, useSwitchChain, useDisconnect } from 'wagmi'
import { Button } from '@/components/ui/button'
import { useRusdBalance } from '@/hooks/useRusdBalance'
import {
  XMarkIcon,
  WalletIcon,
} from '@heroicons/react/24/outline'

interface WalletModalProps {
  isOpen: boolean
  onClose: () => void
}

// Supported chains
const SUPPORTED_CHAINS = [
  { id: 84532, name: 'Base Sepolia', symbol: 'ETH' },
  { id: 43113, name: 'Avalanche Fuji', symbol: 'AVAX' },
]

export default function WalletModal({ isOpen, onClose }: WalletModalProps) {
  const { address } = useAccount()
  const chainId = useChainId()
  const { data: ethBalance } = useBalance({ address })
  const { balance: rusdBalance, isLoading: isLoadingRusd } = useRusdBalance(address, chainId)
  const { switchChain, isPending: isSwitchingChain } = useSwitchChain()
  const { disconnect } = useDisconnect()

  // Get chain name
  const getChainName = (chainId: number) => {
    switch (chainId) {
      case 84532: return 'Base Sepolia'
      case 43113: return 'Avalanche Fuji'
      default: return `Chain ${chainId}`
    }
  }



  // Add RUSD token to MetaMask
  const addRUSDToken = async () => {
    if (!window.ethereum) return

    try {
      await window.ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: '0x908e1D85604E0e9e703d52D18f3f3f604Fe7Bb1b',
            symbol: 'RUSD',
            decimals: 18,
          },
        },
      })
    } catch (error) {
      console.error('Error adding RUSD token:', error)
    }
  }

  // Handle wallet disconnect
  const handleDisconnect = () => {
    disconnect()
    onClose()
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
      <div className="relative bg-white rounded-lg shadow-xl max-w-sm w-full mx-4 border-2 border-black">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-black">Wallet</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <XMarkIcon className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 px-8 space-y-4">
          {/* Wallet Address */}
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
              <WalletIcon className="w-4 h-4 text-gray-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500">Address</p>
              <p className="font-mono text-sm text-black truncate">
                {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Not connected'}
              </p>
            </div>
          </div>

          {/* Current Network */}
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
              <WalletIcon className="w-4 h-4 text-gray-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500">Network</p>
              <p className="text-sm font-medium text-black truncate">{getChainName(chainId)}</p>
            </div>
          </div>

          {/* Network Switching */}
          <div className="space-y-2">
            <p className="text-xs text-gray-500 font-medium">Switch Network</p>
            {SUPPORTED_CHAINS.map((chain) => (
              <div key={chain.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                    <WalletIcon className="w-3 h-3 text-gray-600" />
                  </div>
                  <span className="text-sm text-black truncate">{chain.name}</span>
                </div>
                {chainId === chain.id ? (
                  <span className="text-xs text-gray-500 px-2 py-1">Current</span>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => switchChain({ chainId: chain.id })}
                    disabled={isSwitchingChain}
                    className="text-xs px-2 py-1 h-6"
                  >
                    Switch
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* Balances */}
          <div className="space-y-2">
            <p className="text-xs text-gray-500 font-medium">Balances</p>
            
            {/* ETH Balance */}
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                  <WalletIcon className="w-3 h-3 text-gray-600" />
                </div>
                <span className="text-sm text-gray-600">ETH</span>
              </div>
              <span className="text-sm font-medium text-black">
                {ethBalance ? parseFloat(ethBalance.formatted).toFixed(4) : '0.0000'}
              </span>
            </div>

            {/* RUSD Balance */}
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                  <WalletIcon className="w-3 h-3 text-gray-600" />
                </div>
                <span className="text-sm text-gray-600">RUSD</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-black">
                  {isLoadingRusd ? '...' : rusdBalance}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={addRUSDToken}
                  className="text-xs px-1 py-1 h-5"
                >
                  +
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-200 space-y-2">
          <Button
            onClick={handleDisconnect}
            className="w-full bg-red-600 text-white hover:bg-red-700 text-sm"
          >
            Disconnect Wallet
          </Button>
          <Button
            onClick={onClose}
            variant="outline"
            className="w-full text-sm"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}
