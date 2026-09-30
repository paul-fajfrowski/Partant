#!/bin/bash
set -euo pipefail

# Always open the workspace beside this launcher, never a stale recent project.
PARTANT_ROOT="$(cd -- "$(dirname -- "$0")" && pwd -P)"
PARTANT_WORKSPACE="$PARTANT_ROOT/apps/mobile/ios/Partant.xcworkspace"

if [[ ! -f "$PARTANT_WORKSPACE/contents.xcworkspacedata" ]]; then
  echo "Workspace Partant introuvable : $PARTANT_WORKSPACE" >&2
  exit 1
fi
if [[ ! -f "$PARTANT_ROOT/apps/mobile/ios/Pods/Manifest.lock" ]]; then
  echo "Installez les dépendances iOS selon apps/mobile/README.md avant de compiler." >&2
  exit 1
fi

printf 'Ouverture de Partant : %s\n' "$PARTANT_WORKSPACE"
exec /usr/bin/open -a Xcode "$PARTANT_WORKSPACE"
