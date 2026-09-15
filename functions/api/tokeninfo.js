export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const address = url.searchParams.get('address');
  const chain = url.searchParams.get('chain') || '56';
  const action = url.searchParams.get('action') || 'tokeninfo';

  const apiKey = env.ETHERSCAN_V2_KEY || env.VITE_ETHERSCAN_V2_KEY || env.ETHERSCAN_API_KEY;

  if (!apiKey) {
    return new Response(JSON.stringify({ 
      status: '0', 
      message: 'API KEY NÃO ENCONTRADA NA FUNCTION', 
      result: `Vars: ${Object.keys(env).join(', ')}`
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }

  let etherscanUrl;
  if (action === 'tokeninfo') {
    etherscanUrl = `https://api.etherscan.io/v2/api?chainid=${chain}&module=token&action=tokeninfo&contractaddress=${address}&apikey=${apiKey}`;
  } else {
    etherscanUrl = `https://api.etherscan.io/v2/api?chainid=${chain}&module=account&action=tokentx&contractaddress=${address}&page=1&offset=10&sort=desc&apikey=${apiKey}`;
  }

  const resp = await fetch(etherscanUrl);
  const data = await resp.json();

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=60'
    }
  });
}
