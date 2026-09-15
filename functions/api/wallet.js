const NODE_MAP = {
  '1':'eth-mainnet','56':'bsc-mainnet','137':'polygon-mainnet',
  '8453':'base-mainnet','42161':'arbitrum-mainnet','10':'opt-mainnet',
  '43114':'avalanche-mainnet','59144':'linea-mainnet'
};

export async function onRequestGet(c){
  const {request, env} = c;
  const u = new URL(request.url);
  const wallet = u.searchParams.get('address');
  const key = env.NODEREAL_KEY;
  
  const CHAINS = ['1','56','137','8453','42161','10','43114','59144'];
  
  const results = await Promise.all(CHAINS.map(async (chain)=>{
    try{
      const url = `https://${NODE_MAP[chain]}.nodereal.io/v1/${key}`;
      const r = await fetch(url,{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({jsonrpc:'2.0',id:1,method:'eth_getBalance',params:[wallet,'latest']})
      });
      const j = await r.json();
      const bal = j.result ? BigInt(j.result) : 0n;
      return {chain, balance: bal.toString(), has: bal > 0n, hex: j.result};
    }catch{ return {chain, balance:'0', has:false}; }
  }));
  
  return new Response(JSON.stringify({wallet, chains: results}), {headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'}});
}
