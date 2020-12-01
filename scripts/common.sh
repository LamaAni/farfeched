#!/usr/bin/env bash
: "${SCRIPTS_PATH:="$(dirname "${BASH_SOURCE[0]}")"}"
source "$SCRIPTS_PATH/common/core.sh" || exit $?

SCRIPTS_PATH="$(realpath "$SCRIPTS_PATH")"
export SCRIPTS_PATH

# -----------------------
# envs
source "$SCRIPTS_PATH/image/envs"

# -----------------------
# Loading

for file in $SCRIPTS_PATH/common/*; do
  source "$file"
  assert $? "Error while loading lib file: $file" || exit $?
done

export REPO_PATH="$(realpath "$(dirname "${BASH_SOURCE[0]}")/../")"
export SCRIPTS_PATH
