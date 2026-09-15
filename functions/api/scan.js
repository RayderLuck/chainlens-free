const NODE_MAP = {
  '1':'eth-mainnet','56':'bsc-mainnet','137':'polygon-mainnet',
  '8453':'base-mainnet','42161':'arbitrum-mainnet','10':'opt-mainnet',
  '43114':'avalanche-mainnet','59144':'linea-mainnet'
};

async function getCode(key, chain, address){
  const url = `https://${NODE_MAP[chain]}.nodereal.io/v1/${key}`;
  const r = await fetch(url,{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify({jsonrpc:'2.0',id:1,method:'eth_getCode',params:[address,'latest']})
  });
  const j = await r.json();
  return j.result;
}

export async function onRequestGet(c){
  const {request, env} = c;
  const address = new URL(request.url).searchParams.get('address');
  const key = env.NODEREAL_KEY;
  const CHAINS = ['1','56','137','8453','42161','10','43114','59144'];

  const results = await Promise.all(CHAINS.map(async chain=>{
    try{
      const code = await getCode(key, chain, address);
      const isContract = code && code!=='0x' && code.length>10;
      return {chain, isContract, codeLength: code?.length || 0};
    }catch{
      return {chain, isContract:false, codeLength:0};
    }
  }));

  return new Response(JSON.stringify({address, found: results.filter(r=>r.isContract), all: results}), {
    headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'}
  });
}
