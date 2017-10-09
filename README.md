# Setup

### Clone and Build Repo
- install from github or npm
- install dependencies
```bash
npm i
npm run build  # ignore strange false error about string.startsWith and string.includes
```

### Install Command Globally

- edit the git-cleanup-branches.sh file
- install the cleanup-branches command globally

```bash
npm uninstall -g # removes previous install if required
npm i -g # installs a link to this repo so commands can run globally
# test with this command
cleanup-branches   # For normal use; Rename in package.json if you want.
```
