import argv = require('yargs')
export let options = argv
  .version('version', '1.0.0', 'Version 1.0.0')
  .alias('version', 'v')
  .option('e', {
    default: [],
    array: true,
    alias: 'excludes',
    description: 'list of branches to exclude'
  })
  .option('i', {
    default: [],
    array: true,
    alias: 'includes',
    description: 'list of branches to include (if empty all branches not excluded will be included)'
  })
  .option('l', {
    default: true,
    alias: 'local',
    description: 'Clean up local repo'
  })
  .option('r', {
    default: true,
    alias: 'remote',
    description: 'Clean up remote repo'
  })
  .option('d', {
    default: false,
    alias: 'dry-run',
    description: 'Run the delete command. Defaults to false(dry-run)'
  })
  .argv
