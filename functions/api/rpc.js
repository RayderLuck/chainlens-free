const NODE_MAP = {
  '1': 'eth-mainnet',
  '56': 'bsc-mainnet',
  '137': 'polygon-mainnet',
  '8453': 'base-mainnet',
  '42161': 'arbitrum-mainnet',
  '10': 'opt-mainnet',
  '43114': 'avalanche-mainnet',
  '59144': 'linea-mainnet'
};

export async function onRequestPost(context) {
  const { request, env } = context;
  const body = await request.json();
  const url = new URL(request.url);
  const chain = url.searchParams.get('chain') || '56';
  const key = env.NODEREAL_KEY || env.VITE_NODEREAL_KEY;
  const network = NODE_MAP[chain] || 'bsc-mainnet';

  const noderealUrl = `https://${network}.nodereal.io/v1/${key}`;

  const resp = await fetch(noderealUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await resp.text();
  return new Response(data, { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
}
