#!/usr/bin/env bash
set -euo pipefail

if [[ "${RUN_ONCE:-false}" == "true" ]]; then
  exec python /app/main.py --once
fi

: "${BATCH_CRON:=0 3 * * *}"

echo "BATCH_CRON=${BATCH_CRON}"

cat > /app/crontab <<EOF
${BATCH_CRON} python /app/main.py --once
EOF

exec /usr/local/bin/supercronic /app/crontab

