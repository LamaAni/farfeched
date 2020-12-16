#!/usr/bin/env bash
: "${LOG_DISPLAY_DATE_TIME="%F %T"}"
function log_core() {
  local prefix="$1"
  shift
  if [ -n "$prefix" ]; then
    prefix="[$prefix]"
  fi
  if [ -n "$LOG_DISPLAY_DATE_TIME" ]; then
    prefix="[$(date +"$LOG_DISPLAY_DATE_TIME")]$prefix"
  fi
  echo "${prefix}" "$@"
}

# ------------------

function assert() {
  local err="$1"
  shift
  : ${err:=0}
  if [ "$err" -ne 0 ]; then
    log_core "${red}ERROR${end_color}" "$@" 1>&2
    return $err
  fi
}

function assert_warning() {
  local err="$1"
  shift
  : ${err:=0}
  if [ "$err" -ne 0 ]; then
    log_core "${yellow}WARNING${end_color}" "$@" 1>&2
    return $err
  fi
}

function warn() {
  assert_warning "$@"
  return $?
}

# ------------------

export LINE_SEPARATOR='------------------------------------'

function log:info() {
  log_core "${green}INFO${end_color}" "$@"
}

function log:warn() {
  log_core "${yellow}WARNING${end_color}" "$@"
}

function log:error() {
  log_core "${red}ERROR${end_color}" "$@"
}

function log:trace() {
  log_core "${magenta}TRACE${end_color}" "$@"
}

function log() {
  log:info "$@"
}

function log:warning() {
  log:warn "$@"
}

: "${LINE_SEPARATOR:="----------------------------"}"

function log:sep() {
  echo "$green$LINE_SEPARATOR$end_color"
  if [ "$#" -gt 0 ]; then
    echo "${magenta}->${end_color}" "$@"
  fi
}

function is_interactive_shell() {
  "$(dirname "${BASH_SOURCE[0]}")/../commands/detect_interactive_shell"
}

function is_command() {
  type "$1" &>/dev/null
  if [ $? -eq 0 ]; then
    echo "true"
    return 0
  fi
  echo "false"
  return 1
}

function check_access() {
  [ -r "$1" ] && [ -w "$1" ] && return 0 || return 1
}

# correction for mac.
if [ "$(is_command "realpath")" != "true" ]; then
  REALPATH_PYTHON_CALLABLE=""
  if [ "$(is_command "python3")" == "true" ]; then
    REALPATH_PYTHON_CALLABLE="python3"
  elif [ "$(is_command "python")" == "true" ]; then
    REALPATH_PYTHON_CALLABLE="python"
  else
    assert 4 "Python must be defined if realpath is not a function." || exit $?
  fi

  function realpath() {
    $REALPATH_PYTHON_CALLABLE -c "import os; print(os.path.abspath('$1'));"
  }

  export REALPATH_PYTHON_CALLABLE
fi
