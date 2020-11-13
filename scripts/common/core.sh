# auto assert last line.

function log_core() {
  local prefex="$1"
  shift
  echo "$prefex: " "$@"
}

function assert() {
  local err="$1"
  : ${err:=0}
  if [ "$err" -ne 0 ]; then
    log_core "${red}ERROR${end_color}" "$2" >>/dev/stderr
    return $err
  fi
}

function log() {
  log_core "${green}INFO${end_color}" "$@"
}

function log:sep() {
  echo "${green}----------------------------${end_color}"
  if [ "$#" -gt 0 ]; then
    echo "${dark_magenta}>${end_color}" "$@"
  fi
}

function is_interactive_shell() {
  "$(dirname "${BASH_SOURCE[0]}")/../commands/detect_interactive_shell"
}

# correction for mac.
if [ -z "$(type -t realpath)" ]; then
  function realpath() {
    [[ $1 == /* ]] && echo "$1" || echo "$PWD/${1#./}"
  }
fi
