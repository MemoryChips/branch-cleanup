#!/bin/bash

# see https://gist.github.com/rocketraman/edb0a2aac74004d8d6b482690d7c62e3

# exclude branches regex, configure as "(branch1|branch2|etc)$"
excludes_default="(master|development|dev)$"
excludes="__NOTHING__"
includes=
merged="--merged"
local=1
remote=1

while [ $# -gt 0 ]; do
  case "$1" in
  -i) shift; includes="$includes $1" ;;
  -e) shift; excludes="$1" ;;
  --no-local) local=0 ;;
  --no-remote) remote=0 ;;
  --all) merged= ;;
  *) echo "Unknown argument $1"; exit 1 ;;
  esac
  shift   # next option
done

if [ "$includes" == "" ]; then
  includes=".*"
else
  includes="($(echo $includes | sed -e 's/ /|/g'))"
fi

files_not_committed=$(git status | grep -iE "modified" | perl -p -e 's/modified: +//g;')
if [ ! -z "$files_not_committed" ]; then
  echo
  echo Some Files not commited:
  for file in $files_not_committed
    do
      echo $file
    done
  echo "WARNING: Some files are not committed."
  read -p "Continue? (y/n): " -n 1 choice
  echo
  if [ "$choice" != "y" ] && [ "$choice" != "Y" ]; then
    exit 0
  fi
fi

current_branch=$(git branch --no-color 2> /dev/null | sed -e '/^[^*]/d' -e 's/* \(.*\)/\1/')
if [ "$current_branch" != "master" ]; then
  echo "WARNING: You are on branch $current_branch, NOT master."
  read -p "Continue? (y/n): " -n 1 choice
  echo
  if [ "$choice" != "y" ] && [ "$choice" != "Y" ]; then
    exit 0
  fi
fi

echo -e "Fetching branches...\n"

git remote update --prune
remote_branches=$(git branch -r $merged | grep -v "/$current_branch$" | grep -v -E "$excludes" | grep -v -E "$excludes_default" | grep -E "$includes")
local_branches=$(git branch $merged | grep -v "$current_branch$" | grep -v -E "$excludes" | grep -v -E "$excludes_default" | grep -E "$includes")
if [ -z "$remote_branches" ] && [ -z "$local_branches" ]; then
  echo "No existing branches have been merged into $current_branch."
else
  echo "This will remove the following branches:"
  if [ "$remote" == 1 -a -n "$remote_branches" ]; then
    echo "$remote_branches"
  fi
  if [ "$local" == 1 -a -n "$local_branches" ]; then
    echo "$local_branches"
  fi
  read -p "Continue? (y/n): " -n 1 choice
  echo
  if [ "$choice" == "y" ] || [ "$choice" == "Y" ]; then
    if [ "$remote" == 1 ]; then
      remotes=$(git remote)
      # Remove remote branches
      for remote in $remotes
      do
        branches=$(echo "$remote_branches" | grep "$remote/" | sed "s/$remote\/\(.*\)/:\1 /g" | tr -d '\n')
        git push $remote $branches
      done
    fi

    if [ "$local" == 1 ]; then
      # Remove local branches
      locals=$(echo "$local_branches" | sed 's/origin\///g' | tr -d '\n')
      if [ -z "$locals" ]; then
        echo "No branches removed."
      else
        git branch -d $(echo "$locals" | tr -d '\n')
      fi
    fi
  fi
fi