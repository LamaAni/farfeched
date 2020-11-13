#!/usr/bin/env bash
function get_github_latest_release() {
  local repo="$1"
  local repo_latest="$repo/releases/latest"
  local latest_page_url="$(curl -sL -w %{url_effective} -o /dev/null "$repo_latest")"
  assert $? "Failed to resolve version @ $repo_latest"$'\n'"$version" || return $?

  if [ -z "$latest_page_url" ]; then
    assert 1 "Failed to retrive the latest release redirect uri for $repo_latest" || return $?
  fi

  echo "$latest_page_url"
}

function get_github_latest_release_downloads_url() {
  local release_url="$(get_github_latest_release "$@")"
  local downloads_url="$(regexp_replace "\/tag\/" "/download/" "$release_url")"
  echo "$downloads_url"
}

function get_github_latest_release_version() {
  local release_url="$(get_github_latest_release "$@")"
  local version="$(regexp_match "\/(.*)$" "$release_url" | grep -Eo '[^\/]+$')"
  echo "$version"
}
