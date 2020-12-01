#!/usr/bin/env bash
function read_from_pipe() {
  # checking first line.
  read -t 1 -s first_line || return $?
  echo "$first_line"
  while read line; do echo "$line"; done
}

function get_input() {
  local question="$1"
  local default="$2"
  printf "%s" "${magenta}QUESTION:${end_color} $question [$default]: "
  read -r
  if [ -z "$REPLY" ]; then
    echo "$default"
  else
    echo "${REPLY}"
  fi
}

function get_menu_value() {
  local question="$1"
  shift
  local vals=($@)
  local all_options=$(echo "${vals[@]}")
  while true; do
    printf "%s" "${magenta}QUESTION:${end_color} $question [$all_options]: "
    read -r
    if [[ ! " ${vals[@]} " =~ " ${REPLY} " ]]; then
      log "${yellow}Input invalid:${end_color} you must specify one of ${values[@]}."
    else
      break
    fi
  done

  export REPLY
}

function get_yes_no() {
  while true; do
    printf "%s" "${magenta}QUESTION:${end_color} $1 [y/n]: "
    read -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[YyNn]$ ]]; then
      log "Input invalid: you must specify y or n."
    else
      break
    fi
  done

  export REPLY

  if [ "$REPLY" == "y" ]; then
    return 0
  else
    return 1
  fi
}

function validate_arg() {
  local value=$(trim "${!1}")
  if [ -z "$value" ]; then
    return 2
  fi
}
