export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const address = url.searchParams.get('address');
  const chain = url.searchParams.get('chain') || '56';
  const action = url.searchParams.get('action') || 'tokeninfo';
  const apiKey = env.ETHERSCAN_V2_KEY || env.VITE_ETHERSCAN_V2_KEY;

  if (!apiKey) {
    return new Response(JSON.stringify({ status: '0', message: 'API KEY NÃO ENCONTRADA' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }

  // tokeninfo é PRO, então a gente usa tokentx que é FREE pra detectar
  const targetAction = (action === 'tokeninfo')? 'tokentx' : action;

  let etherscanUrl;
  if (targetAction === 'tokentx') {
    etherscanUrl = `https://api.etherscan.io/v2/api?chainid=${chain}&module=account&action=tokentx&contractaddress=${address}&page=1&offset=1&sort=desc&apikey=${apiKey}`;
  } else if (targetAction === 'getsourcecode') {
    etherscanUrl = `https://api.etherscan.io/v2/api?chainid=${chain}&module=contract&action=getsourcecode&address=${address}&apikey=${apiKey}`;
  } else {
    etherscanUrl = `https://api.etherscan.io/v2/api?chainid=${chain}&module=account&action=tokentx&contractaddress=${address}&page=1&offset=10&sort=desc&apikey=${apiKey}`;
  }

  try {
    const resp = await fetch(etherscanUrl);
    const data = await resp.json();

    // Adapta o resultado do tokentx pro formato que seu index.html já espera
    if (action === 'tokeninfo') {
      if (data.status === '1' && Array.isArray(data.result) && data.result.length > 0) {
        const first = data.result[0];
        // Monta um objeto no formato tokeninfo usando dados do tokentx
        const adapted = {
          status: '1',
          message: 'OK',
          result: [{
            contractAddress: address,
            tokenName: first.tokenName,
            symbol: first.tokenSymbol,
            tokenSymbol: first.tokenSymbol,
            decimals: first.tokenDecimal,
            divisor: '1' + '0'.repeat(Number(first.tokenDecimal||18)),
            totalSupply: '0',
            holderCount: '?'
          }],
          _raw_tokentx: data.result
        };
        return new Response(JSON.stringify(adapted), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
      } else {
        // Se não tem tx, verifica se é contrato verificado via getsourcecode
        const sourceUrl = `https://api.etherscan.io/v2/api?chainid=${chain}&module=contract&action=getsourcecode&address=${address}&apikey=${apiKey}`;
        const sourceResp = await fetch(sourceUrl);
        const sourceData = await sourceResp.json();
        if (sourceData.status === '1' && sourceData.result[0]?.ABI!== 'Contract source code not verified' && sourceData.result[0]?.ABI!== '') {
          return new Response(JSON.stringify({
            status: '1',
            message: 'OK - verified contract',
            result: [{ contractAddress: address, tokenName: sourceData.result[0].ContractName || 'Contrato Verificado', symbol: '?', decimals: '?' }],
            _source: sourceData.result[0]
          }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
        }
        return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
      }
    }

    return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=60' } });
  } catch (e) {
    return new Response(JSON.stringify({ status: '0', message: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
