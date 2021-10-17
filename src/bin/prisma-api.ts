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
import chokidar from 'chokidar';
import ts from 'typescript';
import _tsconfig from '../../tsconfig.json';
import fs from 'fs';
import * as utils from '../core/utils';

const { spawn } = childProcess;

const { WARNING, ERROR } = utils;
const { NODE_ENV, NPM_PACKAGE_VERSION, PWD }: any = process.env;
const prod = NODE_ENV === 'production';
const _tsConfigAny: any = _tsconfig;
const tsconfig: ts.TranspileOptions = _tsConfigAny;
let { compilerOptions } = tsconfig;
compilerOptions = compilerOptions || {};
const { outDir, rootDir } = compilerOptions;
const controller = new AbortController();
const { signal } = controller;
/**
 * Цвета текста в консоли
 */
const Red = '\x1b[31m';
const Reset = '\x1b[0m';
const Bright = '\x1b[1m';
const Yellow = '\x1b[33m';
const Dim = '\x1b[2m';

/**
 *
 * @param props
 * @returns
 */
async function getSpawn(props: { command: string; args: string[]; options?: any }): Promise<any> {
  const { command, args, options } = props;
  return await new Promise((resolve, reject) => {
    const sh = spawn.call('sh', command, args, options || {});
    sh.stdout?.on('data', (data) => {
      const str = data.toString();
      if (!str.match(/\[nodemon\]/)) {
        console.log(`\r\r${str}`);
      }
    });
    sh.stderr?.on('data', (err) => {
      const str = err.toString();
      console.warn(ERROR, Red, str, Reset);
      reject(str);
    });
    sh.on('close', (code) => {
      resolve(code);
    });
  }).catch((e) => {
    console.error('error', e);
  });
}

/**
 * Глобальный просушиватель папок
 * по умолчанию null
 */
let watcher: chokidar.FSWatcher | null = null;

/**
 * Функция навешивающая прослушиватель на файлы
 * @param dirPath
 * @returns
 */
function watchDir(dirPath: string): Promise<void> {
  return new Promise(() => {
    watcher = chokidar
      .watch(dirPath, {
        ignored: [/node_modules/, new RegExp(`${outDir}`), '.git'],
        persistent: true,
      })
      .on('all', (event, path) => {
        if (event !== 'add' && event !== 'addDir') {
          if (event === 'change') {
            if (path.match(/\.ts$/)) {
              const resPath = transpileFile(path);
              if (path.match(/\/src\/bin\/index.ts/)) {
                const i = import('../scripts/index');
                i.then((d) => {
                  const { script } = d;
                  script('env', resPath);
                  controller.abort();
                  process.exit(2);
                });
              }
            }
          } else {
            console.info(event, path);
          }
        }
      });
  });
}

/**
 * Закрыть прослушиватель изменения файлов
 */
function closeWatch() {
  watcher?.close().then(() => {});
}

/**
 * Транспиляция типскриптом изменившегося файла
 * @param file
 */
function transpileFile(file: string) {
  const startDate = new Date().getTime();
  const tsD = fs.readFileSync(path.resolve(__dirname, file)).toString();
  const jsD = ts.transpileModule(tsD, tsconfig).outputText;
  let filePath = file;
  const relativePath = file.replace(PWD, '').replace(/^\/?/, '');
  if (rootDir === '.' || rootDir === './') {
    filePath = path.resolve(PWD, outDir?.replace(/^\.\//, '') || 'dist', relativePath);
  } else if (rootDir !== undefined) {
    filePath = path.resolve(PWD, relativePath);
  } else {
    console.warn(WARNING, 'Missing rootDir compiler option in tsconfig.json');
  }
  filePath = filePath.replace(/\.ts$/, '.js');
  try {
    fs.writeFileSync(filePath, jsD);
  } catch (e) {
    console.error(ERROR, `Error write dist file by path ${filePath}`);
  }
  const finDate = new Date().getTime();
  process.stdout.write('\r\r');
  console.log(`Compile file ${filePath} done in ${finDate - startDate} ms.`);
  return filePath;
}

(async () => {
  /**
   * Переключатель по третьему параметру команды
   */
  const arg0 = process.argv[0];
  const arg2 = process.argv[2];
  const version = `Prisma Api version ${NPM_PACKAGE_VERSION}`;
  const help = `
    ${version}
> prisma-api [options] <command>     
COMMANDS
build - build project 
  `;
  let rootPath: string;
  let command = /^win/.test(process.platform) ? 'npm.cmd' : 'npm';
  let args: string[];
  let generateRes: any;
  let generateResStr: string;
  console.log(2, PWD);
  const cwd = path.resolve(PWD, './node_modules/prisma-api/');
  switch (arg2) {
    case 'build':
      args = ['run', 'generate'];
      generateRes = await getSpawn({
        command,
        args,
        options: {
          cwd,
        },
      }).catch((e) => {
        console.error(ERROR, `Error ${command} ${args.join(' ')}`);
      });
      generateResStr = generateRes?.toString();
      if (generateResStr?.match(/TS5057/)) {
        utils.debugLog(new Error(generateResStr), 'Try run command <prisma-api init>');
      }
      args = ['run', 'build'];
      const buildRes = await getSpawn({
        command,
        args,
        options: {
          cwd,
        },
      }).catch((e) => {
        console.error(ERROR, `Error ${command} ${args.join(' ')}`);
      });
      const spawnResStr = buildRes?.toString();
      break;
    case '-h':
      console.info(help);
      break;
    case '--help':
      console.info(help);
      break;
    case '-v':
      console.info(version);
      break;
    case '--version':
      console.info(version);
      break;
    case 'dev':
      const srcDir = path.resolve(PWD, rootDir || '.');
      if (watcher !== null) {
        closeWatch();
      }
      watchDir(srcDir);
      args = ['run', 'generate'];
      generateRes = await getSpawn({
        command,
        args,
        options: {
          cwd,
        },
      }).catch((e) => {
        console.error(ERROR, `Error ${command} ${args.join(' ')}`);
      });
      generateResStr = generateRes?.toString();
      if (generateResStr?.match(/TS5057/)) {
        utils.debugLog(new Error(generateResStr), 'Try run command <prisma-api init>');
      }
      args = ['run', 'dev'];
      const spawnRes = getSpawn({
        command,
        args,
        options: {
          signal,
          cwd,
          env: { DATABASE_URL: 'mysql://arch:1234@127.0.0.1:3306/boring_weekend' },
        },
      }).catch((e) => {
        console.error(ERROR, `Error ${command} ${args.join(' ')}`);
      });
      spawnRes.then((data) => {
        console.log(32, data);
      });
      break;
    default:
      console.info(`
error Unknown command ${arg2}
Try run "prisma-api --help" 
        ${help}
      `);
  }
})();
