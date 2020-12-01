#!/usr/bin/env bash
function join_by() {
  local sep="$1"
  shift
  local joined=""
  while [ $# -gt 1 ]; do
    joined="$joined$1$sep"
    shift
  done
  joined="$joined$1$sep"
  printf "%s" "$joined"
}

function unique_array_values() {
  sorted=($(sort_array_values "$@"))
  local unique=($(join_by $'\n' "${sorted[@]}" | uniq))
  echo "${unique[@]}"
}

function sort_array_values() {
  local sorted=($(join_by $'\n' "$@" | sort))
  echo "${sorted[@]}"
}
