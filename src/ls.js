import chalk from 'chalk'

export async function ls(options) {
  console.log('Environment %s:', chalk.green.bold(options.environment))
  console.log('Websites:')
  for (const w of options.envData.website) {
    console.log(' ' + w)
  }
  return true
}
