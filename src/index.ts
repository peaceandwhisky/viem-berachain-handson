import { createWalletClient, createPublicClient, parseEther, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import * as dotenv from 'dotenv';


// 秘密鍵を環境変数からimportする
dotenv.config();
const privateKey = process.env.PRIVATE_KEY;

if (!privateKey) {
  throw new Error('Please set your PRIVATE_KEY in the .env file');
}
const account = privateKeyToAccount(privateKey as `0x${string}`) 

// Berachain上で利用するコントラクトやトークンの情報
const beraCrocMultiSwapAddress = "0x21e2C0AFd058A89FCf7caf3aEA3cB84Ae977B73D";
const crocQueryAddress = '0x8685CE9Db06D40CBa73e3d09e6868FE476B5dC89';
const HONEY = "0x0E4aaF1351de4c0264C5c7056Ef3777b41BD8e03";
const WBTC = "0x286f1c3f0323db9c91d1e8f45c8df2d065ab5fae";
const WBERA = "0x7507c1dc16935B82698e4C63f2746A2fCf994dF8";
const WETH = "0x6E1E9896e93F7A71ECB33d4386b49DeeD67a231A";

// Berachain自体の情報
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

// Berachainから情報を参照するためのclient
const client = createPublicClient({
  chain: berachainTestnet,
  transport: http(berachainTestnet.rpcUrls.default.http[0]),
})

// Berachainの現在のブロック高を参照
async function getBlockNumber() {
  
  const blockNumber = await client.getBlockNumber()

  console.log(blockNumber)
}

getBlockNumber().catch(console.error);

// 各アカウントのBERA残高を参照
async function getAddressBalance(address: `0x${string}`) {
  try {
    const balance = await client.getBalance({ address });
    console.log(`Balance of ${address}: ${balance} wei`);
  } catch (error) {
    console.error(`Failed to fetch balance for address ${address}:`, error);
  }
}

// あなたのアカウントの持っているBERAを確認してみましょう。
getAddressBalance("0x-youraccountaddress").catch(console.error);

// 自分のアカウントで資産を動かすためのクライアントを作成
const walletClient = createWalletClient({
  chain: berachainTestnet,
  transport: http(berachainTestnet.rpcUrls.default.http[0]),
  account
})

// 所有しているBERAを送金する
async function sendBERA(to: `0x${string}`, amount: string) {
  try {
    const txHash = await walletClient.sendTransaction({
      account,
      to,
      value: parseEther(amount),
    });
    console.log(`Transaction sent! TX hash: ${txHash}`);
  } catch (error) {
    console.error('Failed to send transaction:', error);
  }
}

// 困ったら以下をtoAddressに代入して送金してみてください。
// 0x0A772258e2f36999C6aA57B2Ba09B78caF7EbAd3
const toAddress = "送りたい相手のアドレス";
// sendBERA(toAddress as `0x${string}`, "0.01")


// Berachainで利用するコントラクトを実行するためのインターファイス
const erc20Abi = [
  {
    "constant": true,
    "inputs": [],
    "name": "totalSupply",
    "outputs": [
      {
        "name": "",
        "type": "uint256"
      }
    ],
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [
      {
        "name": "_owner",
        "type": "address"
      }
    ],
    "name": "balanceOf",
    "outputs": [
      {
        "name": "balance",
        "type": "uint256"
      }
    ],
    "type": "function"
  }
];

// コントラクトからHONEYトークンの情報を参照して、総発行量を参照する
async function getERC20TotalSupply() {
  
  const data = await client.readContract({
    address: HONEY,
    abi: erc20Abi,
    functionName: 'totalSupply',
  })

  console.log(`ERC20 total supply: ${data}`);
}

getERC20TotalSupply().catch(console.error);


// それぞれのアカウントが持っているERC20トークンの残高を参照する
async function getERC20Balance(tokenAddress: `0x${string}`, walletAddress: `0x${string}`) {
  try {
    const balance = await client.readContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [walletAddress],
    });

    console.log(`Balance of ${walletAddress} for token ${tokenAddress}: ${balance}`);
  } catch (error) {
    console.error('Failed to fetch ERC20 token balance:', error);
  }
}

// HONEYコントラクトのアドレスと、あなたのアカウントのアドレスを渡して残高を参照します。
getERC20Balance(HONEY, "0x-youraccountaddress").catch(console.error);


// BEXのプールから価格を参照するためインターフェイス
const crocPriceQueryABI = [
  {
    "constant": true,
    "inputs": [
      {
        "name": "base",
        "type": "address"
      },
      {
        "name": "quote",
        "type": "address"
      },
      {
        "name": "poolIdx",
        "type": "uint256"
      }
    ],
    "name": "queryPrice",
    "outputs": [
      {
        "name": "",
        "type": "uint128"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  }
];

// HONEY-WBTCプールから平方根価格を参照してみる
// Uniswap V3で定義されているQ64.64という形式で表現された、本来の価格に対する平方根の値が表示される
// https://docs.uniswap.org/contracts/v3/reference/core/libraries/SqrtPriceMath
async function queryPrice(base: string, quote: string, poolIdx: number) {
  try {
    const priceRoot = await client.readContract({
      address: crocQueryAddress,
      abi: crocPriceQueryABI,
      functionName: 'queryPrice',
      args: [base, quote, poolIdx],
    });
    console.log('Current Price Root:', priceRoot);
  } catch (error) {
    console.error('Failed to fetch price:', error);
  }
}

const baseToken = HONEY;
const quoteToken = WBTC;
const poolIndex = 36001; // プールのインデックス(重要)

queryPrice(baseToken, quoteToken, poolIndex);


// BEXのプールから価格を参照するためのインターフェイス
const crocPoolQueryABI = [
  {
    "constant": true,
    "inputs": [
      {
        "name": "base",
        "type": "address"
      },
      {
        "name": "quote",
        "type": "address"
      },
      {
        "name": "poolIdx",
        "type": "uint256"
      }
    ],
    "name": "queryPoolParams",
    "outputs": [
      {
        "components": [
          {
            "name": "schema_",
            "type": "uint8"
          },
          {
            "name": "feeRate_",
            "type": "uint16"
          },
          {
            "name": "protocolTake_",
            "type": "uint8"
          },
          {
            "name": "tickSize_",
            "type": "uint16"
          },
          {
            "name": "jitThresh_",
            "type": "uint8"
          },
          {
            "name": "knockoutBits_",
            "type": "uint8"
          },
          {
            "name": "oracleFlags_",
            "type": "uint8"
          }
        ],
        "name": "pool",
        "type": "tuple"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  }
];

//　HONEY-WBTCプールの情報を参照します。
async function queryPoolParams(base: string, quote: string, poolIdx: number) {
  try {
    const poolParams = await client.readContract({
      address: crocQueryAddress,
      abi: crocPoolQueryABI,
      functionName: 'queryPoolParams',
      args: [base, quote, poolIdx],
    });
    console.log('Pool Parameters:', poolParams);
  } catch (error) {
    console.error('Failed to fetch pool parameters:', error);
  }
}

queryPoolParams(baseToken, quoteToken, poolIndex);

// BEXのプールに対してSwapを実行するためのインターフェイス
const multiSwapABI = [
  {
    "inputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "poolIdx",
            "type": "uint256"
          },
          {
            "internalType": "address",
            "name": "base",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "quote",
            "type": "address"
          },
          {
            "internalType": "bool",
            "name": "isBuy",
            "type": "bool"
          }
        ],
        "internalType": "struct MultiSwap.SwapStep[]",
        "name": "_steps",
        "type": "tuple[]"
      },
      {
        "internalType": "uint128",
        "name": "_amount",
        "type": "uint128"
      },
      {
        "internalType": "uint128",
        "name": "_minOut",
        "type": "uint128"
      }
    ],
    "name": "multiSwap",
    "outputs": [
      {
        "internalType": "uint128",
        "name": "out",
        "type": "uint128"
      }
    ],
    "stateMutability": "payable",
    "type": "function"
  }
];

// swapするトークンのペアとその売買の方向を指定する。複数Swapの指定も可能。
// HONEYを売って、WBTCを買う情報を指定している。
const swapSteps = [
  {
    poolIdx: 36001,
    base: HONEY,
    quote: WBTC,
    isBuy: true,
  }
];

// HONEYを1だけ売る
const amount = parseEther("1");
const minOut = BigInt(0); 

// CrocMultiSwapというコントラクトを介してBEXに対してトークンのSwapを実行
async function executeMultiSwap() {
  try {
    const txHash = await walletClient.writeContract({
      address: beraCrocMultiSwapAddress,
      abi: multiSwapABI,
      functionName: 'multiSwap',
      args: [swapSteps, amount, minOut],
      value: BigInt(0)
    });
    console.log(`Transaction sent! TX hash: ${txHash}`);
  } catch (error) {
    console.error('Failed to execute multiSwap:', error);
  }
}

// executeMultiSwap();