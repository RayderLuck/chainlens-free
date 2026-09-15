export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const address = url.searchParams.get('address');
  const chain = url.searchParams.get('chain') || '56';
  const action = url.searchParams.get('action') || 'tokeninfo';
  const apiKey = env.ETHERSCAN_V2_KEY || env.VITE_ETHERSCAN_V2_KEY || env.ETHERSCAN_API_KEY;

  if (!apiKey) {
    return new Response(JSON.stringify({ status: '0', message: 'API KEY NÃO ENCONTRADA' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }

  // MAPA QUE BYPASSA O V2 PRO - usa o domínio antigo de cada chain que ainda é FREE
  const EXPLORER_MAP = {
    '1': 'https://api.etherscan.io/api',
    '56': 'https://api.bscscan.com/api',
    '137': 'https://api.polygonscan.com/api',
    '8453': 'https://api.basescan.org/api',
    '42161': 'https://api.arbiscan.io/api',
    '10': 'https://api-optimistic.etherscan.io/api',
    '43114': 'https://api.snowtrace.io/api',
    '59144': 'https://api.lineascan.build/api'
  };

  const baseUrl = EXPLORER_MAP[chain] || `https://api.etherscan.io/v2/api?chainid=${chain}&`;

  let finalUrl;
  if (baseUrl.includes('/v2/')) {
    finalUrl = `${baseUrl}module=account&action=tokentx&contractaddress=${address}&page=1&offset=1&sort=desc&apikey=${apiKey}`;
  } else {
    // API V1 - ainda é free e aceita tokentx
    if (action === 'tokeninfo' || action === 'tokentx') {
      finalUrl = `${baseUrl}?module=account&action=tokentx&contractaddress=${address}&page=1&offset=1&sort=desc&apikey=${apiKey}`;
    } else {
      finalUrl = `${baseUrl}?module=account&action=tokentx&contractaddress=${address}&page=1&offset=10&sort=desc&apikey=${apiKey}`;
    }
  }

  try {
    const resp = await fetch(finalUrl);
    const data = await resp.json();

    // Adapta tokentx pra formato que seu index espera
    if (action === 'tokeninfo') {
      if (data.status === '1' && Array.isArray(data.result) && data.result.length > 0) {
        const first = data.result[0];
        const adapted = {
          status: '1',
          message: 'OK',
          result: [{
            contractAddress: address,
            tokenName: first.tokenName,
            symbol: first.tokenSymbol,
            tokenSymbol: first.tokenSymbol,
            decimals: first.tokenDecimal,
            holderCount: '?'
          }]
        };
        return new Response(JSON.stringify(adapted), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
      }
      // Se não achou tx, tenta ver se é contrato verificado
      const sourceUrl = `${baseUrl}?module=contract&action=getsourcecode&address=${address}&apikey=${apiKey}`;
      const sourceResp = await fetch(sourceUrl);
      const sourceData = await sourceResp.json();
      if (sourceData.status === '1' && sourceData.result[0]?.ABI && sourceData.result[0].ABI!== 'Contract source code not verified') {
        return new Response(JSON.stringify({
          status: '1',
          message: 'OK verified',
          result: [{ contractAddress: address, tokenName: sourceData.result[0].ContractName, symbol: '?', decimals: '?' }]
        }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
      }
    }

    return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=60' } });
  } catch (e) {
    return new Response(JSON.stringify({ status: '0', message: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
