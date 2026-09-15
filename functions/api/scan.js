const MAP = {
  '1':'eth-mainnet','56':'bsc-mainnet','137':'polygon-mainnet',
  '8453':'base-mainnet','42161':'arbitrum-mainnet','10':'opt-mainnet',
  '43114':'avalanche-mainnet','59144':'linea-mainnet'
};

export async function onRequestGet(c){
  const addr = new URL(c.request.url).searchParams.get('address');
  const key = c.env.NODEREAL_KEY;
  const CHAINS = Object.keys(MAP);

  const all = await Promise.all(CHAINS.map(async id=>{
    try{
      const r = await fetch(`https://${MAP[id]}.nodereal.io/v1/${key}`,{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({jsonrpc:'2.0',id:1,method:'eth_getCode',params:[addr,'latest']})
      });
      const j = await r.json();
      const code = j.result || '0x';
      return {id, exists: code!=='0x' && code.length>10, len: code.length};
    }catch{ return {id, exists:false, len:0}; }
  }));

  return new Response(JSON.stringify(all), {headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'}});
}
