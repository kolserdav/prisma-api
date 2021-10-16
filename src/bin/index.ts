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
import * as utils from '../core/utils';

const { spawn } = childProcess;

const { NODE_ENV } = process.env;
const prod = NODE_ENV === 'production';

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
      const spawnRes: Buffer = await new Promise((resolve, reject) => {
        const yarn = spawn.call('sh', 'npm', ['run', 'dev:build'], {
          cwd: rootPath,
        });
        yarn.stdout?.on('data', (data) => {
          resolve(data);
        });
        yarn.stderr?.on('data', (err) => {
          reject(err);
        });
        yarn.on('close', (code) => {
          console.log(`child process exited with code ${code}`);
        });
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
