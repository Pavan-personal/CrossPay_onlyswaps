// MetaMask Setup Script for CrossPay
// Run this in your browser console to automatically add networks and token

async function addBaseSepolia() {
  try {
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
    });
    console.log('✅ Base Sepolia network added!');
  } catch (error) {
    console.error('❌ Error adding Base Sepolia:', error);
  }
}

async function addAvalancheFuji() {
  try {
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
    });
    console.log('✅ Avalanche Fuji network added!');
  } catch (error) {
    console.error('❌ Error adding Avalanche Fuji:', error);
  }
}

async function addRUSDToken() {
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
    });
    console.log('✅ RUSD token added!');
  } catch (error) {
    console.error('❌ Error adding RUSD token:', error);
  }
}

// Run all setup functions
async function setupMetaMask() {
  console.log('🚀 Setting up MetaMask for CrossPay...');
  
  await addBaseSepolia();
  await addAvalancheFuji();
  await addRUSDToken();
  
  console.log('🎉 MetaMask setup complete!');
  console.log('💡 You can now use the faucet to get test RUSD tokens.');
}

// Export for use
window.setupMetaMask = setupMetaMask;

console.log('📋 MetaMask setup script loaded!');
console.log('🔧 Run setupMetaMask() to configure your wallet automatically.');
