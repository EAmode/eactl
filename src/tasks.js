import execa from 'execa'

function getCommonOptions(envPath, user) {
  return `-oStrictHostKeyChecking=no -i ${envPath}/${user}.private`
}

export async function reloadNginx(user, serverUrl, envPath) {
  try {
    await execa(
      `ssh ${getCommonOptions(
        envPath,
        user
      )} ${user}@${serverUrl} sudo systemctl reload nginx`,
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
    const cmd = `scp ${getCommonOptions(
      envPath,
      user
    )} conf.d/*.conf ${user}@${serverUrl}:/etc/nginx/conf.d`
    await execa(cmd, { cwd: envPath })
  } catch (err) {
    if (err.stderr) throw new Error(err.stderr)
    else throw new Error(err.message)
  }
}

export async function copyWebsite(server, localPath, wwwPath, envPath) {
  try {
    const cmd = `scp ${getCommonOptions(
      envPath,
      server.user
    )} -pr ${localPath}/* ${server.user}@${server.url}:${server.webPath}/${wwwPath}`
    await execa(cmd)
  } catch (err) {
    if (err.stderr) throw new Error(err.stderr)
    else throw new Error(err.message)
  }
}

export async function deleteWebsite(server, wwwPath, envPath) {
  try {
    await execa(
      'ssh',
      [
        getCommonOptions(envPath, user),
        server.user + '@' + server.url,
        'rm -r -f ' + server.webPath + '/' + wwwPath + '/*',
      ],
      { cwd: envPath }
    )
  } catch (err) {
    if (err.stderr) throw new Error(err.stderr)
    else throw new Error(err.message)
  }
}
