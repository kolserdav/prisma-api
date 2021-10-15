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

import fs from 'fs';
import path from 'path';
import childProcess from 'child_process';

const { spawn } = childProcess;

(async () => {
  /**
   * Переключатель по третьему параметру команды
   */
  let rootPath: string;
  switch (process.argv[2]) {
    case 'build':
      rootPath = path.resolve(__dirname, './index.js');
      const spawnRes = await new Promise((resolve, reject) => {
        console.log(rootPath);
        const yarn = spawn.call('tsc', '-p', [rootPath], {
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
      console.log(spawnRes);
      break;
    default:
      console.info('Allowed only: "copy" parameters');
  }
})();
