#!/bin/bash
set -euo pipefail

if [ "${1:-}" = "" ]; then
  echo "Usage:"
  echo "  ./push_repo.sh <git-remote-url>"
  echo "Example:"
  echo "  ./push_repo.sh https://github.com/USERNAME/PresidencySoftwares.git"
  exit 1
fi

REMOTE_URL="$1"

if git remote get-url origin >/dev/null 2>&1; then
  git remote set-url origin "$REMOTE_URL"
else
  git remote add origin "$REMOTE_URL"
fi

git push -u origin main

