#!/usr/bin/env bash
# Copies the single source of truth (shared/) into the website.
set -euo pipefail
cd "$(dirname "$0")/.."
rm -rf site/shared
cp -r shared site/shared
echo "synced shared/ -> site/shared"
