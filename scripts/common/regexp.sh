#!/usr/bin/env bash
function regexp_replace() {
  type "node" &>>/dev/null
  local dose_not_have_node=$?
  type "python3" &>>/dev/null
  local dose_not_have_pyhton3=$?

  local regex="$1"
  local replace_with="$2"
  local value="$3"
  local singleline="$4"

  if [ $dose_not_have_node -eq 0 ]; then
    local flags="gm"
    if [ "$singleline" == "true" ]; then flags="gs"; fi
    local script="
        const regex=/$regex/$flags
        const replace=process.argv[1]
        const str=process.argv[2]
        const replaced=str.replace(regex,replace)
        console.log(replaced)
      "
    node -e "$script" "$replace_with" "$value"

  elif [ $dose_not_have_pyhton3 -eq 0 ]; then
    local flags=""
    if [ "$singleline" == "true" ]; then flags=", flags=re.S"; fi
    local script="
import sys
import re
regex=r'$regex'
replace=sys.argv[1].replace('%','\\%').replace('$','\\\\')
value=sys.argv[2]
print(re.sub(regex, replace, value$flags))
"
    python3 -c "$script" "$replace_with" "$value"
  else
    assert 1 "For advanced regex replace, either NodeJS or python3 must be installed." || return $?
  fi
}

function regexp_match() {
  local regex="$1"
  shift
  while [ "$#" -gt 0 ]; do
    echo "$1" | grep -Eo "$regex"
    shift
  done
}
