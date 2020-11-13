#!/usr/bin/env bash
: "${SCRIPTS_PATH:="$(realpath "$(dirname "${BASH_SOURCE[0]}")")"}"
source "$SCRIPTS_PATH/common/core.sh" || exit $?

# -----------------------
# envs
source "$SCRIPTS_PATH/image/envs"

# -----------------------
# Loading

for file in $SCRIPTS_PATH/common/*; do
  source "$file"
  assert $? "Error while loading lib file: $file" || exit $?
done

# -----------------------
# Augmenttions
DEFAULT_FORWARD_ADDRESS="localhost"
if [ "$(is_chromeos)" == "true" ]; then
  log "chromeos detected, forwarding to 0.0.0.0"
  DEFAULT_FORWARD_ADDRESS="0.0.0.0"
fi

: ${FORWARD_ADDRESS:="$DEFAULT_FORWARD_ADDRESS"}
