import { createPublicClient, http } from 'viem'

const berachainTestnet = {
  id: 80084, // Berachain Testnet ChainID
  name: 'Berachain Testnet',
  network: 'berachain-testnet',
  nativeCurrency: {
    name: 'BERA',
    symbol: 'BERA',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://bartio.rpc.berachain.com/']
    }
  },
  blockExplorers: {
    default: {
      name: 'Berachain Explorer',
      url: 'https://bartio.beratrail.io/'
    }
  },
  testnet: true
};

const client = createPublicClient({
  chain: berachainTestnet,
  transport: http(berachainTestnet.rpcUrls.default.http[0]),
})

async function getBlockNumber() {
  
  const blockNumber = await client.getBlockNumber()

  console.log(blockNumber)
}

async function getAddressBalance(address: `0x${string}`) {
  try {
    const balance = await client.getBalance({ address });
    console.log(`Balance of ${address}: ${balance} wei`);
  } catch (error) {
    console.error(`Failed to fetch balance for address ${address}:`, error);
  }
}


getBlockNumber().catch(console.error);

const address = "youraddress"; 
getAddressBalance(address as `0x${string}`).catch(console.error);