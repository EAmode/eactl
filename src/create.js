import fs from 'fs'

import { promisify } from 'util'
import chalk from 'chalk'
import execa from 'execa'
import Listr from 'listr'
import inquirer from 'inquirer'
import { parse } from 'psl'

import { copyConfd, reloadNginx, copyWebsite } from './tasks'

const access = promisify(fs.access)

export async function create(options) {
  if (options.commandType === 'website') {
    if (!options.commandOption1) {
      const answers = await inquirer.prompt({
        type: 'input',
        name: 'commandOption1',
        message: 'Please provide the hostname',
        validate: input => {
          const isValid = /^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9\-]*[A-Za-z0-9])$/.test(
            input
          )
          if (isValid) {
            return true
          }
          return 'Please enter a valid hostname'
        }
      })
      options.commandOption1 = answers.commandOption1
    }
    if (!options.commandOption2) {
      const answers = await inquirer.prompt({
        type: 'input',
        name: 'commandOption2',
        message: 'Please provide the path to website files',
        validate: async input => {
          try {
            await access(input, fs.constants.R_OK)
            return true
          } catch (err) {
            if (err.code === 'ENOENT') return 'Directory not found'
          }
          return 'Path is invalid'
        }
      })
      options.commandOption2 = answers.commandOption2
    }
    createWebsite(options)
  }
}

async function createWebsite(options) {
  const { envData, envPath, commandOption1, commandOption2 } = options
  const { server } = envData

  const parsed_domain = parse(commandOption1)
  const domain = parsed_domain.domain

  let certName = commandOption1
  for (const c of options.envData.certs) {
    if (c.wildcard && c.domain === domain) {
      certName = c.name
    }
  }

  const conf = `server {
    listen 80;
    server_name ${commandOption1} www.${commandOption1};
    return 301 https://$server_name$request_uri;
  }
  
  server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
  
    server_name ${commandOption1};
  
    ssl_certificate /etc/letsencrypt/live/${certName}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${certName}/privkey.pem;
  
    root ${server.webPath}/${commandOption1};
    index index.html;
  
    location / {
      add_header Cache-Control no-cache;
      try_files $uri$args $uri$args/ $uri $uri/ /index.html =404;
    }
  }`
  const tasks = new Listr([
    {
      title: `Create conf.d/${commandOption1}.conf`,
      task: async () => {
        try {
          fs.writeFileSync(`${envPath}/conf.d/${commandOption1}.conf`, conf)
        } catch (err) {
          throw new Error(err.message)
        }
      }
    },
    {
      title: 'Copy conf.d to ' + server.url,
      task: () => copyConfd(server.user, server.url, envPath)
    },
    {
      title: `Copy website to ${server.webPath}/${commandOption1}`,
      task: async () => {
        try {
          await execa(`ssh`, [
            '-i',
            envPath + '/' + server.user + '.private',
            server.user + '@' + server.url,
            `mkdir -p ${server.webPath}/${commandOption1}`
          ])
          await copyWebsite(server, commandOption2, commandOption1, envPath)
        } catch (err) {
          if (err.stderr) throw new Error(err.stderr)
          else throw new Error(err.message)
        }
      }
    },
    {
      title: 'Reloading NGINX',
      task: () => reloadNginx(server.user, server.url, envPath)
    }
  ])

  try {
    await tasks.run()
    return true
  } catch (err) {
    console.log(err)
    console.error(chalk.red.bold('Error: ') + err.message)
    return false
  }
}
