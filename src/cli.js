import fs from 'fs'
import { homedir } from 'os'
import { resolve } from 'path'
import { promisify } from 'util'
import { safeLoad } from 'js-yaml'

import arg from 'arg'
import inquirer from 'inquirer'
import chalk from 'chalk'

import { ls } from './ls'
import { update } from './update'
import { create } from './create'

const access = promisify(fs.access)
const readdir = promisify(fs.readdir)

const help = `eactl controls EA environments. Find more information at: https://github.com/EAmode/eactl

List Commands:
 ls             List current environment

Create Commands:
 website        Creating a website

Update Commands:
 website        Update website
 nginx          Sync nginx.conf and conf.d/ with remote
 pm2app         Update a PM2 app

Usage:
 eactl [flags] [options]

Options:
 -e,--environment   Select available environments in the EACTL_PATH folder
 -p,--path          Defaults to ~/env/. Can also be set by EACTL_PATH env variable
 -s,--subdomains    Add subdomains
 --help             Print this help

Examples:
 eactl update website -e mode`

function parseArgumentsIntoOptions(rawArgs) {
  const args = arg(
    {
      '--environment': String,
      '--path': String,
      '--subdomains': [String],
      '--help': Boolean,
      '-e': '--environment',
      '-p': '--path',
      '-s': '--subdomains'
    },
    {
      argv: rawArgs.slice(2)
    }
  )
  return {
    path: args['--path'] || process.env.EACTL_PATH,
    environment: args['--environment'],
    subdomains: args['--subdomains'],
    command: args._[0],
    commandType: args._[1],
    commandOption1: args._[2],
    commandOption2: args._[3],
    printHelp: args['--help'] || false
  }
}

async function promptForMissingOptions(options) {
  if (!options.path) {
    let hasHomePath = false
    const homePath = resolve(homedir(), 'env')
    const localPath = resolve('./env')

    try {
      await access(homePath, fs.constants.R_OK)
      options.path = homePath
      hasHomePath = true
    } catch {}

    if (!hasHomePath) {
      try {
        await access(localPath, fs.constants.R_OK)
        options.path = localPath
      } catch (err) {
        console.error(
          '%s Unable to find environment path',
          chalk.red.bold('ERROR')
        )
        console.error(homePath)
        console.error(localPath)
        process.exit(1)
      }
    }
  }

  let environments = []
  try {
    const content = await readdir(options.path, { withFileTypes: true })
    environments = content.filter(x => x.isDirectory()).map(x => x.name)
    if (environments.length === 0) {
      console.error(
        '%s No environment found in %s',
        chalk.red.bold('ERROR'),
        options.path
      )
      process.exit(1)
    }
  } catch (err) {
    console.error(
      '%s while trying to locate environments in %s',
      chalk.red.bold('ERROR'),
      options.path
    )
    console.error('%s', chalk.red.bold(err.message))
    process.exit(1)
  }

  const questions = []
  if (!options.environment) {
    questions.push({
      type: 'list',
      name: 'environment',
      message: 'Select environment:',
      choices: environments,
      default: environments[0]
    })
  }

  if (!options.command) {
    questions.push({
      type: 'list',
      name: 'command',
      message: 'Please choose a command',
      choices: ['ls', 'update', 'create'],
      default: 'ls'
    })
  }

  const answers = await inquirer.prompt(questions)
  const completed_options = {
    ...options,
    command: options.command || answers.command,
    environment: options.environment || answers.environment,
    envPath: resolve(options.path, options.environment || answers.environment)
  }

  try {
    const envData = safeLoad(
      fs.readFileSync(
        resolve(
          completed_options.path,
          completed_options.environment,
          'env.yaml'
        ),
        'utf8'
      )
    )
    completed_options.envData = envData
  } catch (err) {
    console.error(
      '%s opening env.yaml config file in %s',
      chalk.red.bold('ERROR'),
      options.path
    )
    console.error('%s', chalk.red.bold(err.message))
    process.exit(1)
  }

  return completed_options
}

export async function cli(args) {
  let options = parseArgumentsIntoOptions(args)
  if (options.printHelp) {
    console.log(help)
    process.exit(0)
  }

  options = await promptForMissingOptions(options)
  // console.log(options)
  if (options.command === 'ls') {
    await ls(options)
  } else if (options.command === 'create') {
    const questions = []
    if (!options.commandType) {
      questions.push({
        type: 'list',
        name: 'commandType',
        message: 'Please choose what to create',
        choices: ['website'],
        default: 'website'
      })
      const answers = await inquirer.prompt(questions)
      options.commandType = answers.commandType
    }
    create(options)
  } else if (options.command === 'update') {
    const questions = []
    if (!options.commandType) {
      questions.push({
        type: 'list',
        name: 'commandType',
        message: 'Please choose what to update',
        choices: ['website', 'pm2app', 'nginx'],
        default: 'website'
      })
      const answers = await inquirer.prompt(questions)
      options.commandType = answers.commandType
    }
    update(options)
  }
}
