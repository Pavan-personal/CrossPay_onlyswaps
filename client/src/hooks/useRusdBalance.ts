import { useReadContract } from 'wagmi'
import { formatEther } from 'viem'

// RUSD contract addresses
const RUSD_CONTRACTS = {
  84532: '0x908e1D85604E0e9e703d52D18f3f3f604Fe7Bb1b', // Base Sepolia
  43113: '0x908e1D85604E0e9e703d52D18f3f3f604Fe7Bb1b', // Avalanche Fuji
}

// ERC20 ABI for balance checking
const ERC20_ABI = [
  {
    "inputs": [{"name": "account", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
]

export function useRusdBalance(address: `0x${string}` | undefined, chainId: number) {
  const rusdContract = RUSD_CONTRACTS[chainId as keyof typeof RUSD_CONTRACTS] as `0x${string}`

  const { data: balance, isLoading, error } = useReadContract({
    address: rusdContract,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId,
  })

  return {
    balance: balance ? formatEther(balance as bigint) : '0',
    isLoading,
    error,
  }
}
