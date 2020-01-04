import execa from 'execa'

export async function reloadNginx(user, serverUrl, envPath) {
  try {
    await execa(
      `ssh -i ${user}.private ${user}@${serverUrl} sudo systemctl reload nginx`,
      [],
      { cwd: envPath }
    )
  } catch (err) {
    if (err.stderr) throw new Error(err.stderr)
    else throw new Error(err.message)
  }
}

export async function copyConfd(user, serverUrl, envPath) {
  try {
    await execa(
      'scp',
      [
        `-i`,
        `${user}.private`,
        `conf.d/*.conf`,
        `${user}@${serverUrl}:/etc/nginx/conf.d`
      ],
      { cwd: envPath }
    )
  } catch (err) {
    if (err.stderr) throw new Error(err.stderr)
    else throw new Error(err.message)
  }
}
