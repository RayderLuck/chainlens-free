const NODE_MAP = {
  '1': 'eth-mainnet', '56': 'bsc-mainnet', '137': 'polygon-mainnet',
  '8453': 'base-mainnet', '42161': 'arbitrum-mainnet', '10': 'opt-mainnet',
  '43114': 'avalanche-mainnet', '59144': 'linea-mainnet'
};

async function rpcCall(key, chain, method, params) {
  const network = NODE_MAP[chain];
  const url = `https://${network}.nodereal.io/v1/${key}`;
  const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }) });
  const j = await r.json();
  return j.result;
}
function decodeString(hex) {
  try {
    if (!hex || hex === '0x') return '';
    const h = hex.slice(2); if (h.length < 128) return '';
    const len = parseInt(h.slice(64, 128), 16);
    const data = h.slice(128, 128 + len * 2);
    let s = ''; for (let i = 0; i < data.length; i += 2) s += String.fromCharCode(parseInt(data.substr(i, 2), 16));
    return s.replace(/\0/g, '').trim();
  } catch { return ''; }
}
function decodeUint(hex) { try { return parseInt(hex, 16); } catch { return 0; } }

export async function onRequestGet(context) {
  const { request, env } = context;
  const u = new URL(request.url);
  const address = u.searchParams.get('address');
  const chain = u.searchParams.get('chain') || '56';
  const key = env.NODEREAL_KEY || env.VITE_NODEREAL_KEY;

  try {
    const code = await rpcCall(key, chain, 'eth_getCode', [address, 'latest']);
    if (!code || code === '0x') {
      return new Response(JSON.stringify({ status: '0', message: 'NOTOK', result: 'not a contract on this chain' }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
    }
    let name = '', symbol = '', decimals = 18;
    try { name = decodeString(await rpcCall(key, chain, 'eth_call', [{ to: address, data: '0x06fdde03' }, 'latest'])); } catch {}
    try { symbol = decodeString(await rpcCall(key, chain, 'eth_call', [{ to: address, data: '0x95d89b41' }, 'latest'])); } catch {}
    try { decimals = decodeUint(await rpcCall(key, chain, 'eth_call', [{ to: address, data: '0x313ce567' }, 'latest'])); } catch {}

    return new Response(JSON.stringify({
      status: '1', message: 'OK via NodeReal',
      result: [{ contractAddress: address, tokenName: name || 'Token', symbol: symbol || 'TOKEN', tokenSymbol: symbol || 'TOKEN', decimals: decimals }]
    }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
  } catch (e) {
    return new Response(JSON.stringify({ status: '0', message: 'NOTOK', result: e.message }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
  }
}
