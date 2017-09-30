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

// declare var chalk: any

console.log(
  chalk.cyanBright.bold(
    figlet.textSync('Branch Cleanup', { horizontalLayout: 'full' })
  )
)

const alwaysExclude = ['master', 'development', 'dev']
// const alwaysExclude = ["dev"]
const allExcludes = alwaysExclude.concat(options.excludes)

function isBranchExcluded(branch: string): boolean {
  return !allExcludes.every(excludedBranch => branch !== excludedBranch)
}
const LOCAL_REPO = '__LOCAL_REPO__'

interface IReposSummary {
  [index: string]: string[]
}
function getReposForSlaughter(branchSummary: string): IReposSummary {
  const repos: IReposSummary = {}
  repos[LOCAL_REPO] = []
  const re = /[\ \*]+/g
  const branches = branchSummary.split('\n').map((b) => {
    return b.replace(re, '')
  })
  branches.forEach(b => {
    if (b.startsWith('remotes/')) {
      if (!b.includes('HEAD->origin')) {
        const branchRemote = b.substr(8)
        const pos = branchRemote.indexOf('/')
        const remote = branchRemote.substr(0, pos)
        const branch = branchRemote.substr(pos + 1)
        if (!isBranchExcluded(branch)) {
          if (!repos[remote]) { repos[remote] = [] }
          repos[remote].push(branch)
        }
      }
    } else {
      if (b.length !== 0 && !isBranchExcluded(b)) { repos[LOCAL_REPO].push(b) }
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
  message: 'Continue?',
  default: false
}

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
        chalk.yellow(' will be removed from the list of branches to be slaughtered.'))
      options.excludes.push(currentBranch)
    }
    if (isStatusSummaryClean(statusSummary)) {
      console.log(chalk.green('The current branch is clean. '))
    } else {
      console.log(statusSummary)
      console.log(chalk.red.bold('The current branch is dirty.'))
      console.log(chalk.green('You should commit the changes before continuing.'))
    }
    inquirer.prompt([continueQuestion])
      .then((answers) => {
        if (answers.continue) {
          gitraw().raw(['branch', '-a'], (err: string, branchSummary: any) => {
            // console.log(branchSummary)
            if (err) { throw new Error(err) }
            const reposForSlaughter = getReposForSlaughter(branchSummary)
            const repos = Object.keys(reposForSlaughter)
            if (repos.every((r) => reposForSlaughter[r].length === 0)) {
              console.log(chalk.green('There are no branches to slaughter.'))
            } else {
              // continue with the slaughter
              // gitraw().raw(['remote', 'update', '--prune'], (upErr: string, remoteUpdateResp) => {
              gitraw().raw(['remote', 'update', '--prune'], (upErr: string) => {
                if (upErr) { throw new Error(upErr) }
                // now commit murder on innocent branches
                // console.log(reposForSlaughter)
                repos.forEach((r) => {
                  // create branch delete commands
                  let command = (r === LOCAL_REPO) ? 'git branch -d ' : 'git push ' + r + ' --delete '
                  command += reposForSlaughter[r].join(' ')
                  if (options['dry-run']) {
                    console.log('Dry run only. Add --exec to perform deletes')
                    console.log(command)
                  } else {
                    if (options.local && r === LOCAL_REPO) {
                      console.log(command)
                    } else {
                      if (options.remote && r !== LOCAL_REPO) {
                        console.log(command)
                      }
                    }
                  }
                })
              })
            }
          })
        } else {
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
