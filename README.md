# Setup

### Clone Repo
```bash
# install from github or npm
npm i
npm run build
# edit first line in cleanup.js to point to node
# this line must be kept at ts-node to debug script
```

### Install Command Globally
```bash
npm i -g # installs a link to this repo so commands can run globally
# test with these commands
cleanup-ts --help  # For dev; runs script in repo
cleanup-branches   # check built script cleanup.js
```