/******************************************************************************************
 * Repository: https://github.com/prisma-api/prisma-api
 * Author: Prisma Api Community
 * Email: <prisma.api.community@gmail.com>
 * License: MIT
 * License Text: THE SOFTWARE IS PROVIDED 'AS IS'
 * Copyright: prisma-api (c), All rights reserved
 * Create date: Thu Oct 14 2021 17:46:52 GMT+0700 (Krasnoyarsk Standard Time)
 ******************************************************************************************/
/* eslint-disable no-case-declarations */
/**
 * Файл скриптов для помощи в разработке
 */

import path from 'path';
import childProcess from 'child_process';
import fs from 'fs';
import * as utils from '../core/utils';

const { spawn } = childProcess;

const { WARNING, ERROR } = utils;
const { NODE_ENV } = process.env;
const prod = NODE_ENV === 'production';

/**
 *
 * @param props
 * @returns
 */
async function getSpawn(props: { command: string; args: string[]; options?: any }): Promise<any> {
  const { command, args, options } = props;
  return await new Promise((resolve, reject) => {
    const sh = spawn.call(
      'sh',
      command,
      args.filter((item, index) => index !== 0),
      options || {}
    );
    sh.stdout?.on('data', (data) => {
      const str = data.toString();
      console.log(str);
    });
    sh.stderr?.on('data', (err) => {
      console.warn(WARNING, err.message);
      reject(err.toString());
    });
    sh.on('close', (code) => {
      resolve(code);
    });
  }).catch((e) => {
    console.error('error', e);
  });
}

(async () => {
  /**
   * Переключатель по третьему параметру команды
   */
  const arg0 = process.argv[0];
  const arg2 = process.argv[2];
  const version = `Prisma Api version ${process.env.npm_package_version}`;
  const help = `
    ${version}
> prisma-api [options] <command>    
COMMANDS
build - build project 
  `;
  let rootPath: string;
  switch (arg2) {
    case 'build':
      rootPath = path.relative('prisma-api', arg0);
      console.log(rootPath);
      const spawnRes = getSpawn({
        command: 'npm',
        args: ['run', 'build'],
      });
      spawnRes.catch((e) => {
        console.error(ERROR, e);
      });
      const spawnResStr = spawnRes.toString();
      if (spawnResStr.match(/TS5057/)) {
        utils.debugLog(new Error(spawnResStr), 'Try run command <prisma-api init>');
      }
      break;
    case '-h' || '--help':
      console.info(help);
      break;
    case '-v' || '--version':
      console.info(version);
    default:
      console.info(`
error Unknown command ${arg2}
Try run "prisma-api --help" 
        ${help}
      `);
  }
})();
