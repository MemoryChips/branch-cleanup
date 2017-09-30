# Setup

### Clone Repo
```bash
# install from github or npm
npm i
npm run build
# IMPORTANT: You must do one of the following:
# 1. After building you must edit first line in cleanup.js to point to node
# Note: this line must be kept at ts-node to debug script during development
# 2. Install ts-node globally so it is available to run the script
```

### Install Command Globally
```bash
npm i -g # installs a link to this repo so commands can run globally
# test with these commands
cleanup-ts --help  # For dev; runs script in repo
cleanup-branches   # For normal use; Rename in package.json if you want.
```