#!/bin/zsh
# Rende la demo raggiungibile da internet (telefoni della giuria, QR) con un tunnel Cloudflare gratuito.
# Uso: npm run share  (con npm start già acceso). L'indirizzo cambia a ogni avvio: lo trovi qui sotto e in server/data/public-url.txt
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
command -v cloudflared >/dev/null || { echo "Manca cloudflared: brew install cloudflared"; exit 1; }
DIR="${0:A:h}"; PORT="${PORT:-8790}"; LOG="$DIR/data/tunnel.log"
mkdir -p "$DIR/data"; : > "$LOG"
cloudflared tunnel --no-autoupdate --url "http://127.0.0.1:$PORT" 2>"$LOG" &
CF=$!; trap 'kill $CF 2>/dev/null' EXIT INT TERM
for i in {1..60}; do URL=$(grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' "$LOG" | head -1); [[ -n $URL ]] && break; sleep 1; done
[[ -z $URL ]] && { echo "Il tunnel non ha dato un indirizzo: guarda $LOG"; exit 1; }
echo "$URL/demo/" > "$DIR/data/public-url.txt"
echo "\nDemo online:  $URL/demo/\nSito:         $URL/\n(chiudi con ctrl+C)"
wait $CF
