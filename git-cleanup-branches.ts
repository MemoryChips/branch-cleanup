#!/usr/bin/env ts-node

'use strict'

// import chalk = require('chalk')
const chalk = require('chalk')
// import figlet = require('figlet')
const figlet = require('figlet')
import git = require('simple-git/promise')
// import gitraw = require('simple-git')  // raw command is unavailable in the promise version
const gitraw = require('simple-git')  // raw command is unavailable in the promise version
import { options } from './options'
import inquirer = require('inquirer')

// Start up
console.log(
  chalk.cyanBright.bold(
    figlet.textSync('Branch Cleanup', { horizontalLayout: 'full' })
  )
)

if (options.noLocal && options.noRemote) {
  console.log(chalk.yellow.bold('*** Warning *** Running with both noLocal and noRemote will do nothing.'))
  console.log(chalk.green.bold('Switching to dry-run with both local and remotes enabled'))
  options.noLocal = false
  options.noRemote = false
  options['dry-run'] = true
}

if (options['dry-run']) {
  console.log(chalk.green.bold('This is a DRY-RUN. No changes will be made.'))
}
/*
 *
 * Hard Coded Branches that will never be deleted
 * even if merged. Add or subtract as needed
 *
 */
const alwaysExclude = ['master', 'development', 'dev']
// const alwaysExclude = ["master"]
const allExcludes = alwaysExclude.concat(options.exclude)

// start up finished

// Main
git()
  .status()
  .then((statusSummary: git.StatusResult) => {
    const currentBranch = statusSummary.current
    console.log(chalk.yellow('You are on branch ' + currentBranch))
    if (currentBranch !== 'master') {
      console.log(chalk.yellow('You are not on the master branch.'))
      console.log(
        chalk.yellow('The ') +
        chalk.green.bold(currentBranch) +
        chalk.yellow(' branch will be removed from the list of branches to be slaughtered.'))
      allExcludes.push(currentBranch)
    }
    if (isStatusSummaryClean(statusSummary)) {
      console.log(chalk.green('The current branch is clean. '))
    } else {
      if (options.verbose) { console.log(statusSummary) }
      console.log(chalk.red.bold('The current branch is dirty.'))
      console.log(chalk.green('You should commit the changes before continuing.'))
    }
    getRepos()
  })
  .catch((err) => {
    console.log('An error has occurred.')
    console.log(err)
  })

function isBranchExcluded(branch: string): boolean {
  return !allExcludes.every(excludedBranch => branch !== excludedBranch)
}

function isBranchIncluded(branch: string): boolean {
  if (isBranchExcluded(branch)) { return false }
  // otherwise always return true if include option is unspecified
  return options.include.length === 0 || options.include.includes(branch)
}

const LOCAL_REPO = '__LOCAL_REPO__'  // Hopefully nobody names a remote repo with this name

interface IReposSummary {
  [index: string]: string[]
}
function getReposForSlaughter(branchSummary: string): IReposSummary {
  const repos: IReposSummary = {}
  const re = /[\ \*]+/g
  const branches = branchSummary.split('\n').map((b) => {
    return b.replace(re, '')
  })
  branches.forEach((b: string) => {
    if (b.startsWith('remotes/')) {
      if (!options.noRemote && !b.includes('HEAD->origin')) {
        const branchRemote = b.substr(8)
        const pos = branchRemote.indexOf('/')
        const remote = branchRemote.substr(0, pos)
        const branch = branchRemote.substr(pos + 1)
        if (isBranchIncluded(branch)) {
          if (!repos[remote]) { repos[remote] = [branch] } else { repos[remote].push(branch) }
          console.log(chalk.red(' *' + b))
        } else {
          console.log(chalk.green('  ' + b))
        }
      } else {
        console.log(chalk.green('  ' + b))
      }
    } else {
      if (!options.noLocal && b.length !== 0 && isBranchIncluded(b)) {
        if (!repos[LOCAL_REPO]) {
          repos[LOCAL_REPO] = [b]
        } else { repos[LOCAL_REPO].push(b) }
        console.log(chalk.red(' *' + b))
      } else {
        console.log(chalk.green('  ' + b))
      }
    }
  })
  return repos
}

function isStatusSummaryClean(statusSummary: git.StatusResult): boolean {
  return statusSummary.not_added.length === 0 &&
    statusSummary.conflicted.length === 0 &&
    statusSummary.created.length === 0 &&
    statusSummary.deleted.length === 0 &&
    statusSummary.modified.length === 0 &&
    statusSummary.renamed.length === 0
  // return items.every((i) => (<string[]>statusSummary[i]).length === 0)
}

const continueQuestion = {
  type: 'confirm',
  name: 'continue',
  message: options['dry-run'] ? 'Continue with dry-run' : 'Continue with delete',
  default: false
}

function removeBranches(command: string[]) {
  gitraw().raw(command, (err: string, result: string) => {
    // console.log(command)
    console.log('Running git ' + command.join(' '))
    if (err) { throw new Error(err) }
    if (result) {console.log(result)} else {console.log('Remote branch deleted.')}
  })
}

function getRepos() {
  gitraw().raw(['branch', '-a'], (err: string, branchSummary: any) => {
    console.log(chalk.blue('Branches marked with * will be deleted'))
    if (err) { throw new Error(err) }
    const reposForSlaughter = getReposForSlaughter(branchSummary)
    const repos = Object.keys(reposForSlaughter)
    if (repos.every((r) => reposForSlaughter[r].length === 0)) {
      console.log(chalk.green('There are no branches to slaughter.'))
    } else {
      inquirer.prompt([continueQuestion])
        .then((answers) => {
          if (answers.continue) {
            // continue with the slaughter
            gitraw().raw(['remote', 'update', '--prune'], (upErr: string) => {
              if (upErr) { throw new Error(upErr) }
              // now commit murder on innocent branches
              // console.log(reposForSlaughter)
              repos.forEach((r) => {
                // create branch delete commands
                let command = (r === LOCAL_REPO) ? ['branch', '-d'] : ['push', r, '--delete']
                command = command.concat(reposForSlaughter[r])
                if ( options['dry-run'] ) {
                  console.log('Dry run only.')
                  console.log(command.join(' '))
                } else {
                  removeBranches(command)
                }
              })
            })
          }
        })
        .catch((upErr) => {
          console.log(upErr)
        })
    }
  })
}
