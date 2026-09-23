#!/usr/bin/env bash
# Serves a production build on this machine and shares it through ngrok.
#
#   pnpm share         build and (re)start the server, then print the public link
#                      (a tunnel that is already open is reused, so the link stays)
#   pnpm share:stop    stop both
#
# Optional env: PORT (default 3000), NGROK_DOMAIN (a reserved ngrok domain, so
# the link survives restarts), SEED_ADMIN_PASSWORD / SEED_COACH_PASSWORD (used
# only when the database is empty and gets seeded).
set -euo pipefail
cd "$(dirname "$0")/.."

PORT="${PORT:-3000}"
STATE=.data/share
# The agent gets its own inspector address so it can run beside any other
# ngrok tunnel already open on this machine (those default to :4040).
INSPECT_ADDR=127.0.0.1:4041

stop() {
  for name in "$@"; do
    local pidfile="$STATE/$name.pid"
    if [[ -f $pidfile ]]; then
      local pid
      pid=$(<"$pidfile")
      # each process leads its own group (setsid), so this takes its children too
      kill -- "-$pid" 2>/dev/null || true
      rm -f "$pidfile"
    fi
  done
}

launch() {
  local name=$1
  shift
  nohup setsid "$@" >"$STATE/$name.log" 2>&1 &
  echo $! >"$STATE/$name.pid"
}

if [[ ${1:-} == stop ]]; then
  stop next ngrok
  echo "Stopped."
  exit 0
fi

tunnel_url() {
  curl -fs "http://$INSPECT_ADDR/api/tunnels" 2>/dev/null |
    node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const t=JSON.parse(s).tunnels.find(t=>t.proto==="https");if(t)console.log(t.public_url)})' ||
    true
}

mkdir -p "$STATE"
stop next

url=$(tunnel_url)
if [[ -z $url ]]; then
  stop ngrok
  echo "→ opening tunnel"
  base_config=$(ngrok config check | sed -n 's/^Valid configuration file at //p')
  printf 'version: "3"\nagent:\n  web_addr: %s\n' "$INSPECT_ADDR" >"$STATE/ngrok.yml"
  launch ngrok ngrok http "127.0.0.1:$PORT" \
    --config "$base_config,$STATE/ngrok.yml" \
    ${NGROK_DOMAIN:+--url "$NGROK_DOMAIN"} \
    --log stdout
  for _ in $(seq 30); do
    url=$(tunnel_url)
    [[ -n $url ]] && break
    sleep 1
  done
  if [[ -z $url ]]; then
    echo "ngrok did not come up — see $STATE/ngrok.log" >&2
    stop ngrok
    exit 1
  fi
fi

products=$(node -e 'const {createClient}=require("@libsql/client");const url=process.env.TURSO_DATABASE_URL??process.env.DATABASE_URL??`file:${process.env.DATABASE_FILE??".data/tfm.db"}`;createClient({url,authToken:process.env.TURSO_AUTH_TOKEN}).execute("select count(*) n from products").then(r=>console.log(r.rows[0].n)).catch(()=>console.log(0))' 2>/dev/null)
if [[ $products == 0 ]]; then
  echo "→ empty database — creating schema and seeding"
  pnpm setup
fi

# NEXT_PUBLIC_* is inlined at build time, so the build must know the public link.
echo "→ building for $url"
NEXT_PUBLIC_SITE_URL=$url pnpm build

echo "→ starting server"
launch next env NEXT_PUBLIC_SITE_URL="$url" node_modules/.bin/next start -H 127.0.0.1 -p "$PORT"
up=""
for _ in $(seq 60); do
  curl -fso /dev/null "http://127.0.0.1:$PORT" && up=1 && break
  sleep 1
done
if [[ -z $up ]]; then
  echo "the server did not come up — see $STATE/next.log" >&2
  stop next
  exit 1
fi

echo
echo "  Live:      $url"
echo "  Admin:     $url/admin"
echo "  Inspector: http://$INSPECT_ADDR"
echo "  Logs:      $STATE/"
