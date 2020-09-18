import fs from 'fs'

import { promisify } from 'util'
import chalk from 'chalk'
import execa from 'execa'
import Listr from 'listr'
import inquirer from 'inquirer'

import {
  deleteWebsite,
  buildPm2app,
  bundlePm2app,
  copyBundle,
  installBundle,
} from './tasks'

const access = promisify(fs.access)

import { copyConfd, reloadNginx, copyWebsite } from './tasks'

export async function update(options) {
  if (options.commandType === 'website' || options.commandType === 'pm2app') {
    if (!options.commandOption1) {
      const answers = await inquirer.prompt({
        type: 'input',
        name: 'commandOption1',
        message: 'Please provide the hostname',
        validate: (input) => {
          const isValid = /^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9\-]*[A-Za-z0-9])$/.test(
            input
          )
          if (isValid) {
            return true
          }
          return 'Please enter a valid hostname'
        },
      })
      options.commandOption1 = answers.commandOption1
    }
    if (!options.commandOption2) {
      const answers = await inquirer.prompt({
        type: 'input',
        name: 'commandOption2',
        message: 'Please provide the path to deployment files',
        validate: async (input) => {
          try {
            await access(input, fs.constants.R_OK)
            return true
          } catch (err) {
            if (err.code === 'ENOENT') return 'Directory not found'
          }
          return 'Path is invalid'
        },
      })
      options.commandOption2 = answers.commandOption2
    }
    if (options.commandType === 'website') {
      updateWebsite(options)
    } else {
      updatePm2app(options)
    }
  } else if (options.commandType === 'nginx') {
    updateNginx(options)
  }
}

async function updatePm2app(options) {
  const { envData, envPath, commandOption1, commandOption2 } = options
  const { server } = envData

  const tasks = new Listr([
    {
      title: `Build PM2 App at ${commandOption2}`,
      task: async () => await buildPm2app(commandOption2),
    },
    {
      title: `Bundle PM2 App at ${commandOption2}`,
      task: async () => await bundlePm2app(commandOption2, commandOption1),
    },
    {
      title: `Copy bundle to ${server.webPath}/${commandOption1}`,
      task: async () => await copyBundle(server, commandOption2, commandOption1, envPath),
    },
    {
      title: `Extract and install ${commandOption1}`,
      task: () => installBundle(server, commandOption2, commandOption1, envPath),
    },
  ])

  try {
    await tasks.run()
    return true
  } catch (err) {
    console.error(chalk.red.bold('Error: ') + err.message)
    return false
  }
}

export async function updateNginx(options) {
  const { envData, envPath } = options
  const { server } = envData

  const tasks = new Listr([
    {
      title: 'Copy nginx.conf to ' + envData.server.url,
      task: async () => {
        try {
          await execa(
            'scp',
            [
              `-i`,
              `${envData.server.user}.private`,
              `nginx.conf`,
              `${envData.server.user}@${envData.server.url}:/etc/nginx/`,
            ],
            { cwd: envPath }
          )
        } catch (err) {
          throw new Error(err.stderr)
        }
      },
    },
    {
      title: 'Copy conf.d to ' + server.url,
      task: () => copyConfd(server.user, server.url, envPath),
    },
    {
      title: 'Reloading NGINX',
      task: () => reloadNginx(server.user, server.url, envPath),
    },
  ])

  try {
    await tasks.run()
    return true
  } catch (err) {
    console.error(chalk.red.bold('Error: ') + err.message)
    return false
  }
}

async function updateWebsite(options) {
  const { envData, envPath, commandOption1, commandOption2 } = options
  const { server } = envData

  const tasks = new Listr([
    {
      title: `Deleting ${server.webPath}/${commandOption1}`,
      task: async () => await deleteWebsite(server, commandOption1, envPath),
    },
    {
      title: `Copy website to ${server.webPath}/${commandOption1}`,
      task: async () => await copyWebsite(server, commandOption2, commandOption1, envPath),
    },
  ])

  try {
    await tasks.run()
    return true
  } catch (err) {
    console.error(chalk.red.bold('Error: ') + err.message)
    return false
  }
}
