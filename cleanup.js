#!/usr/bin/env ts-node
"use strict";
exports.__esModule = true;
var chalk = require("chalk");
var figlet = require("figlet");
var git = require("simple-git/promise");
var gitraw = require("simple-git"); // raw command is unavailable in the promise version
var options_1 = require("./options");
var inquirer = require("inquirer");
// var files = require('./lib/files')
// clear()
console.log(chalk.cyanBright.bold(figlet.textSync('Branch Cleanup', { horizontalLayout: 'full' })));
// if (!files.directoryExists('.git')) {
//   console.log(chalk.red('Git repository not found!'))
//   process.exit()
// }
// console.log(options)
function isBranchExcluded(branch) {
    return !options_1.options.excludes.every(function (excludedBranch) { return branch !== excludedBranch; });
}
var localRepo = '__LOCAL_REPO__';
function getReposForSlaughter(branchSummary) {
    var repos = (_a = {}, _a[localRepo] = [], _a);
    repos[localRepo] = [];
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
                repos[localRepo].push(b);
            }
        }
    });
    // console.log(branches)
    // console.log(repos)
    return repos;
    var _a;
}
function isStatusSummaryClean(statusSummary) {
    var items = ['not_added', 'conflicted', 'created', 'deleted', 'modified', 'renamed'];
    return items.every(function (i) { return statusSummary[i].length === 0; });
}
var continueQuestion = {
    type: 'confirm',
    name: 'continue',
    message: 'Continue?'
};
git()
    .status()
    .then(function (statusSummary) {
    var currentBranch = statusSummary.current;
    console.log(chalk.yellow('You are on branch ' + currentBranch));
    if (currentBranch !== 'master') {
        console.log(chalk.yellow('You are not on the master branch.'));
        // console.log(chalk.yellow.bold('The ' + currentBranch + 'will be removed from the list of branches to be slaughtered.'))
        console.log(chalk.yellow('The ') + chalk.green.bold(currentBranch) + chalk.yellow(' will be removed from the list of branches to be slaughtered.'));
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
        // console.log(answers)
        if (answers["continue"]) {
            gitraw().raw(['branch', '-a'], function (err, branchSummary) {
                if (err) {
                    throw new Error(err);
                }
                var reposForSlaughter = getReposForSlaughter(branchSummary);
                console.log(reposForSlaughter);
                var repos = Object.keys(reposForSlaughter);
                if (repos.every(function (r) { return reposForSlaughter[r].length === 0; })) {
                    console.log(chalk.green('There are no branches to slaughter.'));
                }
                else {
                    // continue with the slaughter
                    gitraw().raw(['remote', 'update', '--prune'], function (upErr, remoteUpdateResp) {
                        if (upErr) {
                            throw new Error(upErr);
                        }
                        console.log(remoteUpdateResp);
                        // now commite murder on innocent branches
                        var repos = Object.keys(reposForSlaughter);
                        repos.forEach(function (r) {
                            console.log('git push -d ' + reposForSlaughter[r].join(' '));
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
