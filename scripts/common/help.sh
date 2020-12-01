#!/usr/bin/env bash
function log:help() {
  echo
  local help_text=""
  help_text="$@"

  # set tab length
  if [[ ! "$OSTYPE" == "darwin"* ]]; then tabs 2; fi

  help_text=$(trim "$help_text")
  help_text=$(colorize "$help_text" "[^a-zA-Z0-9_]-[a-zA-Z0-9_-]+" "${yellow}")
  help_text=$(colorize "$help_text" "^[a-zA-Z0-9_-]+:" "${green}")
  # help_text=$(colorize "$help_text" '(?<=\[).*?(?=\])' "${cyan}")

  echo -e "$help_text"
  if [[ ! "$OSTYPE" == "darwin"* ]]; then tabs -8; fi
  echo
}
