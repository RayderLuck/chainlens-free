// Usa a KEY que você colocou na Cloudflare
const KEY = import.meta.env.VITE_NODEREAL_KEY;
const RPC = `https://bsc-mainnet.nodereal.io/v1/${KEY}`;

async function rpc(method, params) {
  const res = await fetch(RPC, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params })
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.result;
}

export async function getWhaleTransactions(address, limit = 10) {
  if (!KEY) throw new Error('VITE_NODEREAL_KEY não configurada na Cloudflare');
  
  // Pega saldo BNB
  const balanceHex = await rpc('eth_getBalance', [address, 'latest']);
  const balanceBNB = parseInt(balanceHex, 16) / 1e18;
  
  // Baleia = +100 BNB (você pode mudar depois)
  const isWhale = balanceBNB >= 100;

  return {
    address,
    balanceBNB,
    isWhale,
    limit
  };
}
