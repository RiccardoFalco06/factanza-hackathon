#!/bin/zsh
# Apre il tunnel Cloudflare verso il backend e, se l'indirizzo è cambiato,
# ripubblica il sito su Vercel con il nuovo indirizzo (vercel.json → rewrite /api).
export PATH="$HOME/.local/bin:/opt/homebrew/bin:/usr/bin:/bin"
DIR="$HOME/Projects/factanza-voti"
LOG="$DIR/server/tunnel.log"
: > "$LOG"
cloudflared tunnel --no-autoupdate --url http://127.0.0.1:8787 2>"$LOG" &
CF=$!
trap 'kill $CF 2>/dev/null' EXIT

for i in {1..60}; do
  URL=$(grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' "$LOG" | head -1)
  [[ -n $URL ]] && break
  sleep 1
done
[[ -z $URL ]] && { echo "tunnel senza indirizzo"; exit 1; }
echo "tunnel: $URL"

NEW="{\"rewrites\":[{\"source\":\"/api/:path*\",\"destination\":\"$URL/api/:path*\"}]}"
if [[ "$(cat "$DIR/vercel.json" 2>/dev/null)" != "$NEW" ]]; then
  echo "$NEW" > "$DIR/vercel.json"
  (cd "$DIR" && npx -y vercel@latest deploy --prod --yes) || echo "deploy fallito"
fi
wait $CF
