#!/usr/bin/env sh
set -eu
SKILL_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
REPO_DIR=$(CDPATH= cd -- "$SKILL_DIR/../.." && pwd)
cd "$REPO_DIR"
npm run audit -- "$@"
