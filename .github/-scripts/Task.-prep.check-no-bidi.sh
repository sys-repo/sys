#!/usr/bin/env sh
set -eu

# Bidi + isolate marks + BOM (Trojan Source class)
PATTERN='[\u200E\u200F\u202A-\u202E\u2066-\u2069\uFEFF]'

# Scan tracked text files (skip binaries via git grep)
if git grep -nP "$PATTERN" -- . >/dev/null 2>&1; then
  echo "ERROR: Found bidi/hidden Unicode control characters:"
  git grep -nP "$PATTERN" -- .
  exit 1
fi
