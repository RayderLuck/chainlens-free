const NODE_MAP = {
  '1': 'eth-mainnet', '56': 'bsc-mainnet', '137': 'polygon-mainnet',
  '8453': 'base-mainnet', '42161': 'arbitrum-mainnet', '10': 'opt-mainnet',
  '43114': 'avalanche-mainnet', '59144': 'linea-mainnet'
};
const PUBLIC_RPC = {
  '1': 'https://eth.llamarpc.com', '56': 'https://bsc.llamarpc.com',
  '137': 'https://polygon.llamarpc.com', '8453': 'https://base.llamarpc.com',
  '42161': 'https://arbitrum.llamarpc.com', '10': 'https://optimism.llamarpc.com',
  '43114': 'https://avalanche.llamarpc.com', '59144': 'https://linea.llamarpc.com'
};

async function tryNodeReal(key, chain, method, params) {
  const network = NODE_MAP[chain];
  if (!network) throw new Error('chain invalid');
  const url = `https://${network}.nodereal.io/v1/${key}`;
  const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }) });
  const j = await r.json();
  if (j.error) throw new Error(j.error.message);
  return j.result;
}
async function tryPublic(chain, method, params) {
  const url = PUBLIC_RPC[chain];
  const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }) });
  const j = await r.json();
  return j.result;
}

function decodeString(hex) {
  try {
    if (!hex || hex === '0x') return '';
    const h = hex.slice(2);
    if (h.length < 128) return '';
    const len = parseInt(h.slice(64, 128), 16);
    if (len === 0 || len > 200) return '';
    const data = h.slice(128, 128 + len * 2);
    let s = '';
    for (let i = 0; i < data.length; i += 2) {
      const c = parseInt(data.substr(i, 2), 16);
      if (c >= 32 && c <= 126) s += String.fromCharCode(c);
    }
    return s.trim();
  } catch { return ''; }
}
function decodeUint(hex) { try { return parseInt(hex, 16) || 18; } catch { return 18; } }

export async function onRequestGet(context) {
  const { request, env } = context;
  const u = new URL(request.url);
  const address = u.searchParams.get('address');
  const chain = u.searchParams.get('chain') || '56';
  const key = env.NODEREAL_KEY; // SÓ Secret, nunca VITE_

  if (!address) return new Response(JSON.stringify({ status: '0', message: 'address required' }), { headers: { 'Content-Type': 'application/json' } });

  try {
    let code;
    try { code = await tryNodeReal(key, chain, 'eth_getCode', [address, 'latest']); }
    catch { code = await tryPublic(chain, 'eth_getCode', [address, 'latest']); }

    if (!code || code === '0x' || code.length <= 4) {
      return new Response(JSON.stringify({ status: '0', message: 'NOTOK', result: 'not a contract on this chain', hasKey:!!key, chain }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
    }

    let name = '', symbol = '', decimals = 18;
    try { name = decodeString(await tryNodeReal(key, chain, 'eth_call', [{ to: address, data: '0x06fdde03' }, 'latest'])); } catch { try { name = decodeString(await tryPublic(chain, 'eth_call', [{ to: address, data: '0x06fdde03' }, 'latest'])); } catch {} }
    try { symbol = decodeString(await tryNodeReal(key, chain, 'eth_call', [{ to: address, data: '0x95d89b41' }, 'latest'])); } catch { try { symbol = decodeString(await tryPublic(chain, 'eth_call', [{ to: address, data: '0x95d89b41' }, 'latest'])); } catch {} }
    try { decimals = decodeUint(await tryNodeReal(key, chain, 'eth_call', [{ to: address, data: '0x313ce567' }, 'latest'])); } catch { try { decimals = decodeUint(await tryPublic(chain, 'eth_call', [{ to: address, data: '0x313ce567' }, 'latest'])); } catch {} }

    return new Response(JSON.stringify({
      status: '1', message: 'OK via NodeReal',
      result: [{ contractAddress: address, tokenName: name || 'Token', symbol: symbol || 'TOKEN', tokenSymbol: symbol || 'TOKEN', decimals }]
    }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });

  } catch (e) {
    return new Response(JSON.stringify({ status: '0', message: 'NOTOK', result: e.message }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
  }
}
