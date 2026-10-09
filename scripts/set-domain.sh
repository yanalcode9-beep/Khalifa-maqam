#!/usr/bin/env bash
# Usage: ./scripts/set-domain.sh https://your-real-domain.com
# Replaces the placeholder domain in every SEO file (canonical, hreflang, Open Graph, JSON-LD, sitemap, robots).
set -euo pipefail
cd "$(dirname "$0")/.."
NEW="${1%/}"
[ -z "$NEW" ] && { echo "Give the full domain, e.g. https://maqam.vercel.app"; exit 1; }
for f in site/index.html site/sitemap.xml site/robots.txt; do
  sed -i "s#https://maqam.example.com#${NEW}#g" "$f"
done
sed -i "s#<lastmod>[^<]*</lastmod>#<lastmod>$(date +%F)</lastmod>#" site/sitemap.xml
grep -c "$NEW" site/index.html | xargs echo "index.html references:"
