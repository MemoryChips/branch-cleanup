#!/usr/bin/env ts-node

"use strict"

import chalk = require('chalk')
import figlet = require('figlet')
import git = require('simple-git/promise')
import gitraw = require('simple-git')  // raw command is unavailable in the promise version
import { options } from './options'
import inquirer = require('inquirer')

// var files = require('./lib/files')
// clear()
console.log(
  chalk.yellow(
    figlet.textSync('Branch Cleanup', { horizontalLayout: 'full' })
  )
)

// if (!files.directoryExists('.git')) {
//   console.log(chalk.red('Git repository not found!'))
//   process.exit()
// }

// console.log(options)

function isBranchExcluded(branch: string): boolean {
  return !options.excludes.every(excludedBranch => branch !== excludedBranch)
}
const localRepo = '__LOCAL_REPO__'

function getReposForSlaughter(branchSummary): {} {
  let repos = { [localRepo]: [] }
  repos[localRepo] = []
  const re = /[\ \*]+/g
  let branches = branchSummary.split('\n').map((b) => {
    return b.replace(re, '')
  })
  branches.forEach(b => {
    if (b.startsWith('remotes/')) {
      if (!b.includes('HEAD->origin')) {
        let branchRemote = b.substr(8)
        let pos = branchRemote.indexOf('/')
        let remote = branchRemote.substr(0, pos)
        let branch = branchRemote.substr(pos + 1)
        if (!isBranchExcluded(branch)) {
          if (!repos[remote]) { repos[remote] = [] }
          repos[remote].push(branch)
        }
      }
    }
    else {
      if (b.length !== 0 && !isBranchExcluded(b)) { repos[localRepo].push(b) }
    }
  })
  // console.log(branches)
  // console.log(repos)
  return repos
}

function isStatusSummaryClean(statusSummary: object): boolean {
  const items = ['not_added', 'conflicted', 'created', 'deleted', 'modified', 'renamed']
  return items.every((i) => statusSummary[i].length === 0)
}

let continueQuestion = {
  type: 'confirm',
  name: 'continue',
  message: 'Continue?',
}

git()
  .status()
  .then((statusSummary) => {
    let currentBranch = statusSummary.current
    console.log(chalk.yellow('You are on branch ' + currentBranch))
    if (currentBranch !== 'master') {
      console.log(chalk.yellow('You are not on the master branch.'))
      console.log(chalk.yellow('This branch will be removed from the list of branches to be slaughtered.'))
      options.excludes.push(currentBranch)
    }
    if (isStatusSummaryClean(statusSummary)) {
      console.log(chalk.green('The current branch is clean. '))
    }
    else {
      console.log(statusSummary)
      console.log(chalk.red('The current branch is dirty\nYou should commit the changes before continuing.'))
    }
    inquirer.prompt([continueQuestion])
      .then((answers) => {
        // console.log(answers)
        if (answers.continue) {
          gitraw()
          .raw(['branch', '-a'], (err, branchSummary) => {
            if (err) { throw new Error(err) }
            let reposForSlaughter = getReposForSlaughter(branchSummary);
            console.log(reposForSlaughter)
          })
        }
        else {
          console.log(chalk.yellow('exiting...'))
        }
      })
      .catch((err) => {
        console.log(err)
      })
  })
  .catch((err) => {
    console.log('An error has occurred.')
    console.log(err)
  })




  // git.branchLocal( (err, summary) => {
//   if (err) {return console.log(err)}
//   console.log(summary)
//   console.log(summary.branches)
//   console.log(summary.all)
// })

// This does not work as expected
// git.branch([], (err, summary) => {
//   if (err) {return console.log(err)}
//   console.log(summary)
//   console.log(summary.branches)
//   console.log(summary.all)
// })



// #!/usr/bin / env node
// var program = require('commander')
// var co = require('co')
// var prompt = require('co-prompt')

// program
//   .arguments('<file>')
//   .option('-u, --username <username>', 'The user to authenticate as')
//   .option('-p, --password <password>', 'The user\'s password')
//   .action(function (file) {
//     co(function* () {
//       let username = yield prompt('username: ')
//       let password = yield prompt.password('password: ')
//       console.log('user: %s pass: %s file: %s', username, password, file)
//       // program.username, program.password, file)
//     })
//   })
//   .parse(process.argv)

// import argparse = require('argparse')
// let parser = new argparse.ArgumentParser({
//   version: '1.0.1',
//   addHelp: true,
//   description: 'Argparse example'
// })


// // #!/usr/bin / env node

// // import * as program from 'commander'
// import program = require('commander');
// declare var process
// declare var console

// let git = '';

// program
//   .version('0.1.0')
//   .option('-i, --includes [type]', 'Add branches to include', '.*')
//   .option('-e, --excludes [type]', 'Add branches to exclude from cleanup', '__NOTHING__')
//   .option('--nolocal', 'No local branches should be cleaned up')
//   .option('--noremote', 'No remote branches should be cleaned up')
//   .option('-c, --cheese [type]', 'Add the specified type of cheese [marble]', 'marble')
//   .parse(process.argv)

// program.excludes_default = "(master|development|dev)$"

// console.log('Cleanup with:')
// console.log(program.cheese)
// console.log(program.includes)
// console.log(program.nolocal)
// // const exec = require('child_process').exec;
// // exec('git branch', (error, stdout, stderr) => {
// //   console.log(stdout);
// // });
// // console.log('Cleanup Started.')