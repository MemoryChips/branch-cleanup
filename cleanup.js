#!/usr/bin/env ts-node
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
// Start up
console.log(chalk.cyanBright.bold(figlet.textSync('Branch Cleanup', { horizontalLayout: 'full' })));
if (options_1.options.noLocal && options_1.options.noRemote) {
    console.log(chalk.yellow.bold('*** Warning *** Running with both noLocal and noRemote will do nothing.'));
    console.log(chalk.green.bold('Switching to dry-run with both local and remotes enabled'));
    options_1.options.noLocal = false;
    options_1.options.noRemote = false;
    options_1.options['dry-run'] = true;
}
if (options_1.options['dry-run']) {
    console.log(chalk.green.bold('This is a DRY-RUN. No changes will be made.'));
}
/*
 *
 * Hard Coded Branches that will never be deleted
 * even if merged. Add or subtract as needed
 *
 */
var alwaysExclude = ['master', 'development', 'dev'];
// const alwaysExclude = ["master"]
var allExcludes = alwaysExclude.concat(options_1.options.exclude);
// start up finished
// Main
git()
    .status()
    .then(function (statusSummary) {
    var currentBranch = statusSummary.current;
    console.log(chalk.yellow('You are on branch ') + chalk.green.bold(currentBranch));
    if (currentBranch !== 'master') {
        console.log(chalk.yellow('You are not on the master branch.'));
        console.log(chalk.yellow('The ') +
            chalk.green.bold(currentBranch) +
            chalk.yellow(' branch will be removed from the list of branches to be slaughtered.'));
        allExcludes.push(currentBranch);
    }
    if (isStatusSummaryClean(statusSummary)) {
        console.log(chalk.green('The current branch is clean. '));
    }
    else {
        if (options_1.options.verbose) {
            console.log(statusSummary);
        }
        console.log(chalk.red.bold('The current branch is dirty.'));
        console.log(chalk.green('You should commit the changes before continuing.'));
    }
    getRepos();
})["catch"](function (err) {
    console.log('An error has occurred.');
    console.log(err);
});
function isBranchExcluded(branch) {
    return !allExcludes.every(function (excludedBranch) { return branch !== excludedBranch; });
}
function isBranchIncluded(branch) {
    if (isBranchExcluded(branch)) {
        return false;
    }
    // otherwise always return true if include option is unspecified
    return options_1.options.include.length === 0 || options_1.options.include.includes(branch);
}
var LOCAL_REPO = '__LOCAL_REPO__'; // Hopefully nobody names a remote repo with this name
function getReposForSlaughter(branchSummary) {
    var repos = {};
    var re = /[\ \*]+/g;
    var branches = branchSummary.split('\n').map(function (b) {
        return b.replace(re, '');
    });
    branches.forEach(function (b) {
        if (b.startsWith('remotes/')) {
            if (!options_1.options.noRemote && !b.includes('HEAD->origin')) {
                var branchRemote = b.substr(8);
                var pos = branchRemote.indexOf('/');
                var remote = branchRemote.substr(0, pos);
                var branch = branchRemote.substr(pos + 1);
                if (isBranchIncluded(branch)) {
                    if (!repos[remote]) {
                        repos[remote] = [branch];
                    }
                    else {
                        repos[remote].push(branch);
                    }
                    console.log(chalk.red(' *' + b));
                }
                else {
                    console.log(chalk.green('  ' + b));
                }
            }
            else {
                console.log(chalk.green('  ' + b));
            }
        }
        else {
            if (!options_1.options.noLocal && b.length !== 0 && isBranchIncluded(b)) {
                if (!repos[LOCAL_REPO]) {
                    repos[LOCAL_REPO] = [b];
                }
                else {
                    repos[LOCAL_REPO].push(b);
                }
                console.log(chalk.red(' *' + b));
            }
            else {
                console.log(chalk.green('  ' + b));
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
    message: options_1.options['dry-run'] ? 'Continue with dry-run' : 'Continue with delete',
    "default": false
};
function removeBranches(command) {
    gitraw().raw(command, function (err, result) {
        // console.log(command)
        console.log('Running git ' + command.join(' '));
        if (err) {
            throw new Error(err);
        }
        if (result) {
            console.log(result);
        }
        else {
            console.log('Remote branch deleted.');
        }
    });
}
function getRepos() {
    gitraw().raw(['branch', '-a', '--merged'], function (err, branchSummary) {
        console.log(chalk.blue('Branches marked with * will be deleted'));
        if (err) {
            throw new Error(err);
        }
        var reposForSlaughter = getReposForSlaughter(branchSummary);
        var repos = Object.keys(reposForSlaughter);
        if (repos.every(function (r) { return reposForSlaughter[r].length === 0; })) {
            console.log(chalk.green('There are no branches to slaughter.'));
        }
        else {
            inquirer.prompt([continueQuestion])
                .then(function (answers) {
                if (answers["continue"]) {
                    // continue with the slaughter
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
                                removeBranches(command);
                            }
                        });
                    });
                }
            })["catch"](function (upErr) {
                console.log(upErr);
            });
        }
    });
}
