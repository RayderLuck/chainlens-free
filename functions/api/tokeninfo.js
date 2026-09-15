const RPC_MAP = {
  '1': 'https://eth.llamarpc.com',
  '56': 'https://bsc.llamarpc.com',
  '137': 'https://polygon.llamarpc.com',
  '8453': 'https://base.llamarpc.com',
  '42161': 'https://arbitrum.llamarpc.com',
  '10': 'https://optimism.llamarpc.com',
  '43114': 'https://avalanche.llamarpc.com',
  '59144': 'https://linea.llamarpc.com'
};

async function rpc(chain, method, params) {
  const url = RPC_MAP[chain];
  if (!url) throw new Error(`Chain ${chain} sem RPC`);
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params })
  });
  const j = await r.json();
  if (j.error) throw new Error(j.error.message);
  return j.result;
}

function decodeString(hex) {
  try {
    if (!hex || hex === '0x') return '?';
    const h = hex.slice(2);
    if (h.length < 128) return '?';
    const len = parseInt(h.slice(64, 128), 16);
    const data = h.slice(128, 128 + len * 2);
    let str = '';
    for (let i = 0; i < data.length; i += 2) str += String.fromCharCode(parseInt(data.substr(i, 2), 16));
    return str.replace(/\0/g, '');
  } catch { return '?'; }
}
function decodeUint(hex) {
  try { return parseInt(hex, 16).toString(); } catch { return '?'; }
}

export async function onRequestGet(context) {
  const { request } = context;
  const url = new URL(request.url);
  const address = url.searchParams.get('address');
  const chain = url.searchParams.get('chain') || '56';

  try {
    // 1. Verifica se tem código (se é contrato)
    const code = await rpc(chain, 'eth_getCode', [address, 'latest']);
    if (!code || code === '0x' || code === '0x0') {
      return new Response(JSON.stringify({ status: '0', message: 'NOTOK', result: 'Not a contract or not found on this chain' }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
    }

    // 2. Tenta pegar name, symbol, decimals via eth_call
    let name = '?', symbol = '?', decimals = '?';
    try {
      const nameHex = await rpc(chain, 'eth_call', [{ to: address, data: '0x06fdde03' }, 'latest']);
      name = decodeString(nameHex);
    } catch {}
    try {
      const symHex = await rpc(chain, 'eth_call', [{ to: address, data: '0x95d89b41' }, 'latest']);
      symbol = decodeString(symHex);
    } catch {}
    try {
      const decHex = await rpc(chain, 'eth_call', [{ to: address, data: '0x313ce567' }, 'latest']);
      decimals = decodeUint(decHex);
    } catch {}

    // Se não conseguiu nem name nem symbol, ainda assim é ENCONTRADO (contrato existe)
    if (name === '?' && symbol === '?') {
      name = 'Contrato';
      symbol = 'TOKEN';
    }

    const adapted = {
      status: '1',
      message: 'OK via RPC',
      result: [{
        contractAddress: address,
        tokenName: name,
        symbol: symbol,
        tokenSymbol: symbol,
        decimals: decimals,
        holderCount: '?',
        totalSupply: '0'
      }]
    };

    return new Response(JSON.stringify(adapted), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=60' }
    });

  } catch (e) {
    return new Response(JSON.stringify({ status: '0', message: 'NOTOK', result: e.message }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
  }
}
