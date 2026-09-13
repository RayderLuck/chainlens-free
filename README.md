# 🔭 chainlens-free
Real-time BNB Chain tracker 100% powered by NodeReal free tier

> DeBank open-source que você hospeda de graça na Cloudflare. Sem cartão, sem telefone.

**LIVE:** https://chainlens-free.pages.dev/

### O que faz (v1)
- [x] Rastrear carteira: de onde veio / pra onde foi o dinheiro + saldo em USD
- [x] Detectar baleias > $10k - classificação PEIXE / BALEIA / TOP / LENDÁRIA
- [x] Histórico útil: últimas 8 movimentações ENTRADA / SAÍDA com data BR
- [x] Watchlist pessoal: salva suas baleias no navegador (⭐)
- [ ] Alerta de movimentação (v2)
- [ ] NFT sales tracker (v2)

### Stack grátis
- NodeReal RPC - bsc-mainnet.nodereal.io
- Cloudflare Pages - hospedagem sem telefone
- GitHub Codespaces - codar sem PC
- CoinGecko API - preço do BNB

### Como usar
1. Acesse https://chainlens-free.pages.dev/
2. Cole qualquer carteira 0x... da BNB Chain
3. Clique em Rastrear
4. Salve com ⭐

### Deploy
1. Fork esse repo
2. Cloudflare Pages > Create > Connect Git
3. Build: `npm run build` | Output: `dist`
4. Env var: `VITE_NODEREAL_KEY` = sua key da NodeReal

---
Feito com 1 index.html. Sem cartão, sem telefone.
