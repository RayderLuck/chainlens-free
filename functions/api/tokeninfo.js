export async function onRequestPost(context) {
  const { request, env } = context;
  const body = await request.text();
  const key = env.VITE_NODEREAL_KEY || env.NODEREAL_KEY;
  const target = `https://bsc-mainnet.nodereal.io/v1/${key}`;
  const res = await fetch(target, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
  const data = await res.text();
  return new Response(data, { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
}
export async function onRequestGet(context) { return onRequestPost(context); }
