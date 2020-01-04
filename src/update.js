import chalk from 'chalk'
import execa from 'execa'
import Listr from 'listr'

import { copyConfd, reloadNginx } from './tasks'

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
              `${envData.server.user}@${envData.server.url}:/etc/nginx/`
            ],
            { cwd: envPath }
          )
        } catch (err) {
          throw new Error(err.stderr)
        }
      }
    },
    {
      title: 'Copy conf.d to ' + server.url,
      task: () => copyConfd(server.user, server.url, envPath)
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
    console.error(chalk.red.bold('Error: ') + err.message)
    return false
  }
}
