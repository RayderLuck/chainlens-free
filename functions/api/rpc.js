export async function onRequest(context) {
  try {
    const { request, env } = context;
    const key = env.VITE_NODEREAL_KEY || env.NODEREAL_KEY || env.NODEREAL || env.KEY;
    
    if (!key) {
      return new Response(JSON.stringify({ 
        error: true,
        message: 'KEY não encontrada',
        env_keys: Object.keys(env),
        help: 'Cloudflare Pages > Settings > Variables > Production > adicione VITE_NODEREAL_KEY'
      }), { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
    }

    let bodyText = await request.text();
    if (!bodyText) {
      bodyText = JSON.stringify({ jsonrpc:'2.0', id:1, method:'eth_blockNumber', params:[] });
    }

    const target = `https://bsc-mainnet.nodereal.io/v1/${key.trim()}`;
    const res = await fetch(target, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: bodyText
    });
    const text = await res.text();
    
    return new Response(text, {
      status: res.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: true, message: e.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}
