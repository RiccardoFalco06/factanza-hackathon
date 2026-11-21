#!/bin/zsh
# Pubblica una copia statica su https://factanza-demo.vercel.app: pagine da Vercel, /api girato al tunnel sul Mac.
# Uso: zsh server/vercel.sh https://xxx.trycloudflare.com  (senza argomento usa l'ultimo tunnel di npm run share)
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
DIR="${0:A:h}"; ROOT="${DIR:h}"; WEB="$HOME/Projects/factanza-demo-web"
URL="${1:-$(sed 's#/demo/##' "$DIR/data/public-url.txt" 2>/dev/null)}"
[[ -z $URL ]] && { echo "Manca l'indirizzo del tunnel: avvia npm run share"; exit 1; }
mkdir -p "$WEB"
# fuori dal repo, e senza assets/riferimenti (materiale Factanza da non pubblicare)
rsync -a --delete --exclude .vercel --exclude .vercelignore --exclude vercel.json \
  --include '/demo/***' --include '/vendor/***' --include '/assets/' --exclude '/assets/*/' --include '/assets/*' \
  --include '/index.html' --include '/site.css' --include '/site.js' --include '/i18n.js' --include '/logo3d.js' \
  --include '/tokens.css' --include '/design-system.html' --exclude '*' "$ROOT/" "$WEB/"
printf '.env*\n.gitignore\n' > "$WEB/.vercelignore"
echo "{\"rewrites\":[{\"source\":\"/api/:path*\",\"destination\":\"$URL/api/:path*\"}]}" > "$WEB/vercel.json"
(cd "$WEB" && npx -y vercel@latest deploy --prod --yes >/dev/null && rm -f .env.local && echo "Vercel:       https://factanza-demo.vercel.app/demo/") || echo "deploy su Vercel fallito"
