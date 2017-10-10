"use strict";
exports.__esModule = true;
var argv = require("yargs");
exports.options = argv
    .strict()
    .version('version', '1.0.0', 'Version 1.0.0')
    .alias('version', 'vers')
    .option('e', {
    "default": [],
    array: true,
    alias: 'exclude',
    description: 'list of branches to exclude'
})
    .option('i', {
    "default": [],
    array: true,
    alias: 'include',
    description: 'list of branches to include (if empty all branches not excluded will be included)'
})
    .option('l', {
    "default": false,
    alias: 'noLocal',
    description: 'Do not clean up local repo'
})
    .option('r', {
    "default": false,
    alias: 'noRemote',
    description: 'Do not clean up remote repo'
})
    .option('d', {
    "default": false,
    alias: 'dry-run',
    description: 'Only list commands that will be run. Default: false'
})
    .option('v', {
    "default": false,
    alias: 'verbose',
    description: 'More info during run.'
})
    .argv;
