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

getBlockNumber().catch(console.error);