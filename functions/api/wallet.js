const NODE_MAP = {
  '1': 'eth-mainnet','56': 'bsc-mainnet','137': 'polygon-mainnet',
  '8453': 'base-mainnet','42161': 'arbitrum-mainnet','10': 'opt-mainnet',
  '43114': 'avalanche-mainnet','59144': 'linea-mainnet'
};

export async function onRequestGet(c){
  const {request, env} = c;
  const u = new URL(request.url);
  const wallet = u.searchParams.get('address');
  const chain = u.searchParams.get('chain') || '56';
  const key = env.NODEREAL_KEY;

  try{
    const url = `https://${NODE_MAP[chain]}.nodereal.io/v1/${key}`;
    const r = await fetch(url,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({jsonrpc:'2.0',id:1,method:'eth_getBalance',params:[wallet,'latest']})
    });
    const j = await r.json();
    return new Response(JSON.stringify({chain, wallet, native: j.result || '0x0', tokens: []}), {headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'}});
  }catch(e){
    return new Response(JSON.stringify({error:e.message}), {headers:{'Content-Type':'application/json'}, status:500});
  }
}
