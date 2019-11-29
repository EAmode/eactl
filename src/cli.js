import arg from 'arg'
import inquirer from 'inquirer'
import fs from 'fs'
import { ls } from './ls'
import { homedir } from 'os'
import { resolve } from 'path'
import { promisify } from 'util'
import chalk from 'chalk'

const access = promisify(fs.access)
const readdir = promisify(fs.readdir)

function parseArgumentsIntoOptions(rawArgs) {
  const args = arg(
    {
      '--environment': String,
      '--path': String,
      '--install': Boolean,
      '-e': '--environment',
      '-p': '--path',
      '-i': '--install'
    },
    {
      argv: rawArgs.slice(2)
    }
  )
  return {
    path: args['--path'] || process.env.EACTL_PATH,
    environment: args['--environment'],
    command: args._[0],
    commandType: args._[1],
    runInstall: args['--install'] || false
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
      } catch {
        console.error(
          '%s Unable to find environment path',
          chalk.red.bold('ERROR')
        )
        console.log(homePath)
        console.log(localPath)
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
  } catch (error) {
    console.error(
      '%s while trying to locate environments in %s',
      chalk.red.bold('ERROR'),
      options.path
    )
    console.error('%s', chalk.red.bold('error.message'))
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
      choices: ['ls', 'create'],
      default: 'ls'
    })
  }

  const answers = await inquirer.prompt(questions)
  return {
    ...options,
    environment: options.environment || answers.environment,
    git: options.git || answers.git
  }
}

export async function cli(args) {
  let options = parseArgumentsIntoOptions(args)
  options = await promptForMissingOptions(options)
  console.log(options)

  if (options.command === 'ls') {
    await ls(options)
  } else if (options.command === 'create') {
      
  }
}
