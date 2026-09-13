// Conexão com NodeReal - funciona na Cloudflare Pages também
const NODEREAL_KEY = import.meta.env.VITE_NODEREAL_KEY;

export const RPC_URL = `https://bsc-mainnet.nodereal.io/v1/${NODEREAL_KEY}`;

export async function callRPC(method, params = []) {
  const res = await fetch(RPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params })
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.result;
}
