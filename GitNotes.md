# Git Notes

## Deleting Merged Branches - work in progress

```bash
# To delete all local branches that are already merged into the currently checked out branch
git branch --merged | egrep -v "(^\*|master|dev|development)" | xargs git branch -d
# You can see that master and dev are excluded in case they are an ancestor.

# You can delete a merged local branch with:
git branch -d branchname
# If it's not merged, use:
git branch -D branchname  # deletes unmerged stuff

# To delete it from the remote use:
git push --delete origin branchname

# Once you delete the branch from the remote, you can prune to get rid of remote tracking branches with:
git remote prune origin
# or prune individual remote tracking branches, as the other answer suggests, with:
git branch -dr branchname
```

## Pruning

Delete merged branches

```bash
git branch --merged
```

Check not merged branches before deleting
```bash
git branch --no-merged
```

To look at merged branches on the remote:
```bash
for branch in `git branch -r --merged | grep -v HEAD`; do echo -e `git show --format="%ci %cr %an" $branch | head -n 1` \\t$branch; done | sort -r
```

To look at no-merged branches on remote
```bash
for branch in `git branch -r --no-merged | grep -v HEAD`; do echo -e `git show --format="%ci %cr %an" $branch | head -n 1` \\t$branch; done | sort -r
```

### To squish commits:

```bash
# co branch you want to squish
git rebase -i HEAD~5  # go back 5 commits
git reabse -i development # go back to the development branch
```

Old way:

```bash
- git lg
- git tag my-branch-backup # optional
- git reset --soft 22ed781
- git st
- git ci -m 'live manual merge with master'
- git lg
```

### To merge master into a branch
```bash
- git co master
- git pull # to get master up to latest
- git co live # the branch you are merging into
- git merge master
- git merge --abort # to start over
```

### To pull in a remote branch
```bash
1. git fetch origin  # update origin stuff
2. git checkout --track origin/oath-login
4. git branch -a
```

### Delete a branch
```bash
git branch -d test
```

## Setup a remote
```bash
git init --bare # in dir of remote
# to add a remote called nas
git remote add nas /mnt/NAS/git-remotes/chat-sails-angular2/
git push nas --all
```


