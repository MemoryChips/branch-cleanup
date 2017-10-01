# Setup
###
TODO:
1. Flesh out README
2. Organzie directory structure
3. Remove unneeded files

### Clone Repo
```bash
# install from github or npm
npm i
npm run build  # ignore strange false error about string.startsWith and string.includes

# IMPORTANT: You must do one of the following:
# 1. After building you must edit first line in cleanup.js to point to node
# Note: this line must be kept at ts-node to debug script during development
# 2. Install ts-node globally so it is available to run the script
```

### Install Command Globally
```bash
npm i -g # installs a link to this repo so commands can run globally
# test with these commands
cleanup-ts --help  # For dev; compiles and runs script from source
cleanup-branches   # For normal use; Rename in package.json if you want.
```