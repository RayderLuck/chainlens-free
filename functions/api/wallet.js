const NODE_MAP = {
  '1': 'eth-mainnet', '56': 'bsc-mainnet', '137': 'polygon-mainnet',
  '8453': 'base-mainnet', '42161': 'arbitrum-mainnet', '10': 'opt-mainnet',
  '43114': 'avalanche-mainnet', '59144': 'linea-mainnet'
};

// tokens mais usados em cada chain pra escanear
const TOKENS = {
  '56': [ // BSC
    {addr:'0x55d398326f99059fF775485246999027B319F875', sym:'USDT'},
    {addr:'0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', sym:'WBNB'},
    {addr:'0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', sym:'USDC'},
    {addr:'0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c', sym:'BTCB'},
  ],
  '1': [
    {addr:'0xdAC17F958D2ee523a2206206994597C13D831ec7', sym:'USDT'},
    {addr:'0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', sym:'USDC'},
  ],
  // adiciona mais depois
};

async function rpcCall(key, chain, method, params){
  const url = `https://${NODE_MAP[chain]}.nodereal.io/v1/${key}`;
  const r = await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params})});
  const j = await r.json();
  return j.result;
}

export async function onRequestGet(c){
  const {request, env} = c;
  const u = new URL(request.url);
  const wallet = u.searchParams.get('address');
  const chain = u.searchParams.get('chain') || '56';
  const key = env.NODEREAL_KEY;

  // balanceOf = 0x70a08231 + 32 bytes do endereço
  const data = '0x70a08231000000000000000000000000' + wallet.slice(2);

  const list = TOKENS[chain] || [];
  const balances = [];

  for(const t of list){
    try{
      const hex = await rpcCall(key, chain, 'eth_call', [{to:t.addr, data}, 'latest']);
      const bal = BigInt(hex);
      if(bal > 0n) balances.push({token:t.sym, contract:t.addr, balance: bal.toString()});
    }catch{}
  }
  // também pega saldo nativo (BNB, ETH)
  let native = '0';
  try{
    const b = await rpcCall(key, chain, 'eth_getBalance', [wallet, 'latest']);
    native = b;
  }catch{}

  return new Response(JSON.stringify({chain, wallet, native, tokens: balances}), {headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'}});
}
