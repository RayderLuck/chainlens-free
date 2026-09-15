const MAP = {
  '1':'eth-mainnet','56':'bsc-mainnet','137':'polygon-mainnet',
  '8453':'base-mainnet','42161':'arbitrum-mainnet','10':'opt-mainnet',
  '43114':'avalanche-mainnet','59144':'linea-mainnet'
};

// Cache em memória (60s) - evita drain attack
const CACHE = new Map();
const TTL = 60 * 1000;

// Rate limit simples em memória (100 req/min por IP)
const RATE = new Map();
const WINDOW = 60 * 1000;
const MAX_REQ = 100;

function isRateLimited(ip) {
  const now = Date.now();
  const entry = RATE.get(ip);
  if (!entry || now - entry.ts > WINDOW) {
    RATE.set(ip, { count: 1, ts: now });
    return false;
  }
  entry.count++;
  if (entry.count > MAX_REQ) return true;
  return false;
}

export async function onRequestGet(c){
  try {
    const url = new URL(c.request.url);
    const addr = url.searchParams.get('address')?.trim();
    const key = c.env.NODEREAL_KEY;
    const ip = c.request.headers.get('CF-Connecting-IP') || 'unknown';

    // 1. Validação forte - evita injeção e stack leak
    if (!addr || !/^0x[a-fA-F0-9]{40}$/.test(addr)) {
      return new Response(JSON.stringify({ error: 'ENDERECO_INVALIDO' }), {
        status: 400,
        headers: { 'Content-Type':'application/json' }
      });
    }
    if (!key) {
      return new Response(JSON.stringify({ error: 'KEY_MISSING' }), { status: 500, headers: { 'Content-Type':'application/json' } });
    }

    // 2. Rate limit
    if (isRateLimited(ip)) {
      return new Response(JSON.stringify({ error: 'RATE_LIMIT' }), {
        status: 429,
        headers: { 'Content-Type':'application/json', 'Retry-After':'60' }
      });
    }

    // 3. Cache - se já escaneou esse endereço há <60s, retorna direto
    const cacheKey = addr.toLowerCase();
    const cached = CACHE.get(cacheKey);
    if (cached && Date.now() - cached.ts < TTL) {
      return new Response(JSON.stringify(cached.data), {
        headers: {
          'Content-Type':'application/json',
          'Access-Control-Allow-Origin':'https://chainlens-free.pages.dev',
          'X-Cache':'HIT'
        }
      });
    }

    const CHAINS = Object.keys(MAP);

    // 4. Timeout de 5s por chain + Promise.allSettled pra não derrubar tudo se uma falhar
    const all = await Promise.all(CHAINS.map(async id=>{
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 5000);
      try{
        const r = await fetch(`https://${MAP[id]}.nodereal.io/v1/${key}`,{
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body: JSON.stringify({jsonrpc:'2.0',id:1,method:'eth_getCode',params:[addr,'latest']}),
          signal: controller.signal
        });
        clearTimeout(t);
        if (!r.ok) throw new Error('rpc_http_' + r.status);
        const j = await r.json();
        const code = j.result || '0x';
        // valida se result é hex mesmo
        if (typeof code !== 'string' || !code.startsWith('0x')) throw new Error('invalid_result');
        return {id, exists: code!=='0x' && code.length>10, len: code.length};
      }catch{
        clearTimeout(t);
        return {id, exists:false, len:0};
      }
    }));

    // 5. Salva no cache
    CACHE.set(cacheKey, { data: all, ts: Date.now() });
    // limpa cache velho (evita memory leak)
    if (CACHE.size > 500) {
      const first = CACHE.keys().next().value;
      CACHE.delete(first);
    }

    return new Response(JSON.stringify(all), {
      headers:{
        'Content-Type':'application/json',
        // 6. CORS restrito pro seu domínio - ninguém mais usa sua key
        'Access-Control-Allow-Origin':'https://chainlens-free.pages.dev',
        'Access-Control-Allow-Methods':'GET',
        'Cache-Control':'public, max-age=30',
        'X-Cache':'MISS'
      }
    });

  } catch (e) {
    // 7. Nunca vaza stack trace nem URL da NodeReal
    return new Response(JSON.stringify({ error: 'INTERNAL' }), {
      status: 500,
      headers: { 'Content-Type':'application/json' }
    });
  }
}
