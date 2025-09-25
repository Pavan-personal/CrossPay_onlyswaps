import { useAccount, useBalance, useChainId, useSwitchChain } from 'wagmi'
import { Button } from '@/components/ui/button'
import { useRusdBalance } from '@/hooks/useRusdBalance'
import {
  XMarkIcon,
  WalletIcon,
  CurrencyDollarIcon,
  CubeIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  PlusIcon,
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
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { data: ethBalance } = useBalance({ address })
  const { balance: rusdBalance, isLoading: isLoadingRusd } = useRusdBalance(address, chainId)
  const { switchChain, isPending: isSwitchingChain } = useSwitchChain()

  // Get chain name
  const getChainName = (chainId: number) => {
    switch (chainId) {
      case 84532: return 'Base Sepolia'
      case 43113: return 'Avalanche Fuji'
      default: return `Chain ${chainId}`
    }
  }

  // Add network to MetaMask
  const addNetwork = async (chainId: number) => {
    if (!window.ethereum) return

    const chain = SUPPORTED_CHAINS.find(c => c.id === chainId)
    if (!chain) return

    try {
      if (chainId === 84532) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: '0x14A34', // 84532 in hex
            chainName: 'Base Sepolia',
            nativeCurrency: {
              name: 'Ethereum',
              symbol: 'ETH',
              decimals: 18,
            },
            rpcUrls: ['https://sepolia.base.org'],
            blockExplorerUrls: ['https://sepolia.basescan.org'],
          }],
        })
      } else if (chainId === 43113) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: '0xA869', // 43113 in hex
            chainName: 'Avalanche Fuji C-Chain',
            nativeCurrency: {
              name: 'Avalanche',
              symbol: 'AVAX',
              decimals: 18,
            },
            rpcUrls: ['https://api.avax-test.network/ext/bc/C/rpc'],
            blockExplorerUrls: ['https://testnet.snowtrace.io'],
          }],
        })
      }
    } catch (error) {
      console.error('Error adding network:', error)
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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 border-2 border-black max-h-[90vh] overflow-y-auto">
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

          {/* Network Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                <CubeIcon className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Current Network</p>
                <p className="font-semibold text-black">{getChainName(chainId)}</p>
              </div>
            </div>

            {/* Network Switching */}
            <div className="ml-13 space-y-2">
              <p className="text-sm text-gray-600 mb-2">Switch Network</p>
              <div className="space-y-2">
                {SUPPORTED_CHAINS.map((chain) => (
                  <div key={chain.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-gray-600">{chain.symbol}</span>
                      </div>
                      <span className="text-sm font-medium text-black truncate">{chain.name}</span>
                    </div>
                    <div className="flex space-x-1 flex-shrink-0">
                      {chainId === chain.id ? (
                        <span className="text-xs text-gray-500 px-2 py-1">Current</span>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => switchChain({ chainId: chain.id })}
                            disabled={isSwitchingChain}
                            className="text-xs px-2 py-1 h-6 min-w-0"
                          >
                            <ArrowPathIcon className="w-3 h-3 mr-1" />
                            <span className="hidden sm:inline">Switch</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => addNetwork(chain.id)}
                            className="text-xs px-2 py-1 h-6 min-w-0"
                          >
                            <PlusIcon className="w-3 h-3 mr-1" />
                            <span className="hidden sm:inline">Add</span>
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Balances Section */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-600">Balances</h4>
            
            {/* ETH Balance */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                <CurrencyDollarIcon className="w-5 h-5 text-gray-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-600">ETH Balance</p>
                <p className="font-semibold text-black">
                  {ethBalance ? `${parseFloat(ethBalance.formatted).toFixed(4)} ETH` : '0.0000 ETH'}
                </p>
              </div>
            </div>

            {/* RUSD Balance */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                <CurrencyDollarIcon className="w-5 h-5 text-gray-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-600">RUSD Balance</p>
                <p className="font-semibold text-black truncate">
                  {isLoadingRusd ? 'Loading...' : `${rusdBalance} RUSD`}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={addRUSDToken}
                className="text-xs px-2 py-1 h-6 flex-shrink-0"
              >
                <PlusIcon className="w-3 h-3 mr-1" />
                <span className="hidden sm:inline">Add Token</span>
              </Button>
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
