import execa from 'execa'
import * as shell from 'shelljs'
import * as rimraf from 'rimraf'
import { mkdirSync, copyFileSync } from 'fs'
import { copySync } from 'cpx'

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
    )} -pr ${localPath}/* ${server.user}@${server.url}:${
      server.webPath
    }/${wwwPath}`
    await execa(cmd)
  } catch (err) {
    if (err.stderr) throw new Error(err.stderr)
    else throw new Error(err.message)
  }
}

export async function deleteWebsite(server, wwwPath, envPath) {
  try {
    const cmd = `ssh ${getCommonOptions(envPath, server.user)} ${server.user}@${
      server.url
    } rm -rf ${server.webPath}/${wwwPath}/*`
    await execa(cmd)
  } catch (err) {
    if (err.stderr) throw new Error(err.stderr)
    else throw new Error(err.message)
  }
}

export async function buildPm2app(path) {
  try {
    const cmd = `npm run build`
    await execa(cmd, { cwd: path })
  } catch (err) {
    if (err.stderr) throw new Error(err.stderr)
    else throw new Error(err.message)
  }
}

export async function bundlePm2app(path, name) {
  try {
    rimraf.sync(path + '/build')
    mkdirSync(path + `/build`)
    mkdirSync(path + `/build/${name}`)
    copySync(`${path}/package*.json`, `${path}/build/${name}`)
    copySync(`${path}/dist/**/*`, `${path}/build/${name}/dist`)
    copyFileSync(`${path}/${name}.env`, `${path}/build/${name}/.env`)

    const cmd2 = `tar czf build/${name}.tar.gz -C build ${name}`
    await execa(cmd2, { cwd: path })
  } catch (err) {
    if (err.stderr) throw new Error(err.stderr)
    else throw new Error(err.message)
  }
}

export async function copyBundle(server, localPath, wwwPath, envPath) {
  try {
    const cmd = `scp ${getCommonOptions(
      envPath,
      server.user
    )} -pr ${localPath}/build/${wwwPath}.tar.gz ${server.user}@${server.url}:${
      server.webPath
    }`
    return execa(cmd)
  } catch (err) {
    if (err.stderr) throw new Error(err.stderr)
    else throw new Error(err.message)
  }
}

export function installBundle(server, localPath, wwwPath, envPath) {
  try {
    const cmd =
      `ssh ${getCommonOptions(envPath, server.user)} ${server.user}@${
        server.url
      } "cd ${
        server.webPath
      };rm -rf ${wwwPath};tar zxf ${wwwPath}.tar.gz; cd ${wwwPath};npm install --production;` +
      `pm2 stop ${wwwPath};pm2 delete ${wwwPath};pm2 start --name ${wwwPath} npm -- run start:prod;pm2 save;"`
    console.log(cmd)
    return shell.exec(cmd, { silent: true, async: true })
  } catch (err) {
    if (err.stderr) throw new Error(err.stderr)
    else throw new Error(err.message)
  }
}
