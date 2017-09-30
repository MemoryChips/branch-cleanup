#!/usr/bin/env node
'use strict';
exports.__esModule = true;
// import chalk = require('chalk')
var chalk = require('chalk');
// import figlet = require('figlet')
var figlet = require('figlet');
var git = require("simple-git/promise");
// import gitraw = require('simple-git')  // raw command is unavailable in the promise version
var gitraw = require('simple-git'); // raw command is unavailable in the promise version
var options_1 = require("./options");
var inquirer = require("inquirer");
// declare var chalk: any
console.log(chalk.cyanBright.bold(figlet.textSync('Branch Cleanup', { horizontalLayout: 'full' })));
var alwaysExclude = ['master', 'development', 'dev'];
// const alwaysExclude = ["dev"]
var allExcludes = alwaysExclude.concat(options_1.options.excludes);
function isBranchExcluded(branch) {
    return !allExcludes.every(function (excludedBranch) { return branch !== excludedBranch; });
}
var LOCAL_REPO = '__LOCAL_REPO__';
function getReposForSlaughter(branchSummary) {
    var repos = {};
    repos[LOCAL_REPO] = [];
    var re = /[\ \*]+/g;
    var branches = branchSummary.split('\n').map(function (b) {
        return b.replace(re, '');
    });
    branches.forEach(function (b) {
        if (b.startsWith('remotes/')) {
            if (!b.includes('HEAD->origin')) {
                var branchRemote = b.substr(8);
                var pos = branchRemote.indexOf('/');
                var remote = branchRemote.substr(0, pos);
                var branch = branchRemote.substr(pos + 1);
                if (!isBranchExcluded(branch)) {
                    if (!repos[remote]) {
                        repos[remote] = [];
                    }
                    repos[remote].push(branch);
                }
            }
        }
        else {
            if (b.length !== 0 && !isBranchExcluded(b)) {
                repos[LOCAL_REPO].push(b);
            }
        }
    });
    return repos;
}
function isStatusSummaryClean(statusSummary) {
    return statusSummary.not_added.length === 0 &&
        statusSummary.conflicted.length === 0 &&
        statusSummary.created.length === 0 &&
        statusSummary.deleted.length === 0 &&
        statusSummary.modified.length === 0 &&
        statusSummary.renamed.length === 0;
    // return items.every((i) => (<string[]>statusSummary[i]).length === 0)
}
var continueQuestion = {
    type: 'confirm',
    name: 'continue',
    message: 'Continue?',
    "default": false
};
function removeBranches(command) {
    gitraw().raw(command, function (err, result) {
        console.log(command);
        console.log('Running git ' + command.join(' '));
        if (err) {
            throw new Error(err);
        }
        console.log(result);
    });
}
git()
    .status()
    .then(function (statusSummary) {
    var currentBranch = statusSummary.current;
    console.log(chalk.yellow('You are on branch ' + currentBranch));
    if (currentBranch !== 'master') {
        console.log(chalk.yellow('You are not on the master branch.'));
        console.log(chalk.yellow('The ') +
            chalk.green.bold(currentBranch) +
            chalk.yellow(' will be removed from the list of branches to be slaughtered.'));
        options_1.options.excludes.push(currentBranch);
    }
    if (isStatusSummaryClean(statusSummary)) {
        console.log(chalk.green('The current branch is clean. '));
    }
    else {
        console.log(statusSummary);
        console.log(chalk.red.bold('The current branch is dirty.'));
        console.log(chalk.green('You should commit the changes before continuing.'));
    }
    inquirer.prompt([continueQuestion])
        .then(function (answers) {
        if (answers["continue"]) {
            gitraw().raw(['branch', '-a'], function (err, branchSummary) {
                // console.log(branchSummary)
                if (err) {
                    throw new Error(err);
                }
                var reposForSlaughter = getReposForSlaughter(branchSummary);
                var repos = Object.keys(reposForSlaughter);
                if (repos.every(function (r) { return reposForSlaughter[r].length === 0; })) {
                    console.log(chalk.green('There are no branches to slaughter.'));
                }
                else {
                    // continue with the slaughter
                    // gitraw().raw(['remote', 'update', '--prune'], (upErr: string, remoteUpdateResp) => {
                    gitraw().raw(['remote', 'update', '--prune'], function (upErr) {
                        if (upErr) {
                            throw new Error(upErr);
                        }
                        // now commit murder on innocent branches
                        // console.log(reposForSlaughter)
                        repos.forEach(function (r) {
                            // create branch delete commands
                            var command = (r === LOCAL_REPO) ? ['branch', '-d'] : ['push', r, '--delete'];
                            command = command.concat(reposForSlaughter[r]);
                            if (options_1.options['dry-run']) {
                                console.log('Dry run only.');
                                console.log(command.join(' '));
                            }
                            else {
                                // Remove merged branches
                                if (options_1.options.local && r === LOCAL_REPO) {
                                    // local
                                    removeBranches(command);
                                }
                                else {
                                    // remotes
                                    if (options_1.options.remote && r !== LOCAL_REPO) {
                                        removeBranches(command);
                                    }
                                }
                            }
                        });
                    });
                }
            });
        }
        else {
            console.log(chalk.yellow('exiting...'));
        }
    })["catch"](function (err) {
        console.log(err);
    });
})["catch"](function (err) {
    console.log('An error has occurred.');
    console.log(err);
});
