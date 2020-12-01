#!/usr/bin/env bash
function replace_with_env() {
  # replace any {{ENV_NAME}} with its respective env value.
  value="$1"

  # the regular expression matches {{ [SOME NAME] }}
  re='(.*)\{\{[   ]*([a-zA-Z0-9_-]+)[   ]*\}\}(.*)'

  # search for all replacements.
  while [[ "$value" =~ $re ]]; do
    env_name=${BASH_REMATCH[2]}
    env_value=${!env_name}
    value="${BASH_REMATCH[1]}${env_value}${BASH_REMATCH[3]}"
  done

  echo "$value"
}

function to_lowercase() {
  local text="$1"
  echo "${text,,}"
}

function trim() {
  local var="$*"
  # remove leading whitespace characters
  var="${var#"${var%%[![:space:]]*}"}"
  # remove trailing whitespace characters
  var="${var%"${var##*[![:space:]]}"}"
  echo -n "$var"
}

function trim_empty_lines() {
  local value="$1"
  if [[ "$OSTYPE" == "darwin"* ]]; then
    printf "%s" "$1"
  else
    printf "%s" "$1" | sed -r '/^\s*$/d'
  fi
}

function create_random_string() {
  local count="$1"
  : ${count:=5}
  cat /dev/urandom | env LC_CTYPE=C tr -dc a-z0-9 | head -c $count
}

function multi_print() {
  local text="$1"
  local count="$2"

  [ -n "$text" ]
  assert $? "You must send the text" || return $?
  [ -n "$count" ]
  assert $? "You must send the indent count" || return $?

  for i in $(seq 1 $count); do
    printf "%s" "$text"
  done
}

function indent() {
  local text="$1"
  local count="$2"
  local symbol="$3"

  [ -n "$text" ]
  assert $? "You must send the text" || return $?
  [ -n "$count" ]
  assert $? "You must send the indent count" || return $?

  : ${symbol:=" "}
  local replace_with=$(multi_print "$symbol" $count)

  regexp_replace "^" "$replace_with" "$text"
}
