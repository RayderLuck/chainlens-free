// functions/api/rpc.js - ESSA ESCONDE A KEY
const NODE_MAP = {
  '1': 'eth-mainnet','56': 'bsc-mainnet','137': 'polygon-mainnet',
  '8453': 'base-mainnet','42161': 'arbitrum-mainnet','10': 'opt-mainnet',
  '43114': 'avalanche-mainnet','59144': 'linea-mainnet'
};
export async function onRequestPost(c){
  const {request,env}=c;
  const body=await request.json();
  const chain=new URL(request.url).searchParams.get('chain')||'56';
  const key=env.NODEREAL_KEY;
  const url=`https://${NODE_MAP[chain]}.nodereal.io/v1/${key}`;
  const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  const t=await r.text();
  return new Response(t,{headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'}});
}
