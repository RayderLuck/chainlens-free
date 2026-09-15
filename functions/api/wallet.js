const NODE_MAP = {
  '1':'eth-mainnet','56':'bsc-mainnet','137':'polygon-mainnet',
  '8453':'base-mainnet','42161':'arbitrum-mainnet','10':'opt-mainnet',
  '43114':'avalanche-mainnet','59144':'linea-mainnet'
};

// tokens mais usados pra escanear - se a carteira tiver só isso, já acha
const TOKENS = {
  '56': [
    {addr:'0x55d398326f99059fF775485246999027B319F875', sym:'USDT'},
    {addr:'0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', sym:'USDC'},
    {addr:'0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', sym:'WBNB'},
    {addr:'0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56', sym:'BUSD'},
  ],
  '1': [
    {addr:'0xdAC17F958D2ee523a2206206994597C13D831ec7', sym:'USDT'},
    {addr:'0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', sym:'USDC'},
  ],
  '137': [
    {addr:'0xc2132D05D31c914a87C6611C10748AEb04B58e8F', sym:'USDT'},
    {addr:'0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', sym:'USDC'},
  ]
};

async function rpc(key, chain, method, params){
  const url = `https://${NODE_MAP[chain]}.nodereal.io/v1/${key}`;
  const r = await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params})});
  const j = await r.json();
  if(j.error) throw j.error;
  return j.result;
}

export async function onRequestGet(c){
  const {request, env} = c;
  const wallet = new URL(request.url).searchParams.get('address');
  const key = env.NODEREAL_KEY;
  const CHAINS = ['56','1','137','8453','42161','10','43114','59144'];

  const results = await Promise.all(CHAINS.map(async (chain)=>{
    let nativeHex = '0x0';
    let tokensFound = [];
    try{
      nativeHex = await rpc(key, chain, 'eth_getBalance', [wallet, 'latest']);
      const hasNative = nativeHex && nativeHex!=='0x0' && BigInt(nativeHex) > 0n;

      // verifica tokens dessa chain
      const list = TOKENS[chain] || [];
      for(const t of list){
        try{
          const data = '0x70a08231000000000000000000000000' + wallet.slice(2);
          const balHex = await rpc(key, chain, 'eth_call', [{to:t.addr, data}, 'latest']);
          if(balHex && balHex!=='0x' && BigInt(balHex) > 0n){
            tokensFound.push({symbol:t.sym, contract:t.addr, balanceHex:balHex});
          }
        }catch{}
      }

      const hasAny = hasNative || tokensFound.length>0;
      return {chain, has:hasAny, native:nativeHex, tokens:tokensFound};
    }catch(e){
      return {chain, has:false, native:'0x0', tokens:[], error:e.message};
    }
  }));

  return new Response(JSON.stringify({wallet, chains: results}), {headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'}});
}
