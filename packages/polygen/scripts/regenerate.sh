#!/bin/sh
if which npx >/dev/null; then
 echo "[Polygen] Regenerating codegen artifacts"
 npx polygen generate
else
 echo "[Polygen] `npx` command not found. Skipping auto-generating"
fi
