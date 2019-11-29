import chalk from 'chalk'
import { readFileSync } from 'fs'
import { resolve } from 'path'

import { safeLoad } from 'js-yaml'

export async function ls(options) {
  try {
    const environment = safeLoad(
      readFileSync(
        resolve(options.path, options.environment, 'env.yaml'),
        'utf8'
      )
    )
    console.log('%s Environment:', chalk.green.bold('DONE'))
    console.log(environment)
    return true
  } catch (e) {
    console.log(e)
    return false
  }
}
