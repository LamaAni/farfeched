#!/usr/bin/env bash

function get_cur_branch() {
    git rev-parse --abbrev-ref HEAD
}

function get_cur_repo_name() {
    local label="$1"
    : "${label:="origin"}"

    local name="$(git remote get-url $label)"
    name="$(basename "$name")"
    name="${name%.*}"
    echo "$name"
}
