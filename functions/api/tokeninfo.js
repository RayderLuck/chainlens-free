export async function onRequest(context) {
  try {
    const { request, env } = context;
    
    // Pega a key - tenta todos os nomes possíveis
    const key = env.VITE_NODEREAL_KEY || env.NODEREAL_KEY || env.NODEREAL || env.KEY;
    
    if (!key) {
      return new Response(JSON.stringify({ 
        error: true,
        message: 'KEY não encontrada',
        env_keys: Object.keys(env),
        help: 'Vá em Cloudflare Pages > Settings > Variables > Production e adicione VITE_NODEREAL_KEY'
      }), { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
    }

    // Se for GET sem body, testa com eth_blockNumber
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
    
    // Se NodeReal retornar erro, passa pra frente como JSON
    return new Response(text, {
      status: res.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: true, message: e.message, stack: e.stack }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}
