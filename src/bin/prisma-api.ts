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
import fs from 'fs';
import * as utils from '../core/utils';

const { spawn } = childProcess;

const { WARNING, ERROR } = utils;
const { NODE_ENV, NPM_PACKAGE_VERSION, PWD }: any = process.env;
const prod = NODE_ENV === 'production';
const controller = new AbortController();
const { signal } = controller;
let tsconfig: ts.TranspileOptions;
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

async function getTSOptions(): Promise<{ tsconfig: ts.TranspileOptions; tsPath: string }> {
  const reg = prod ? /\/node_modules\// : /\/prisma-api-subject\/?/;
  const tsPath = PWD.match(reg)
    ? `${PWD}/tsconfig.json`
    : path.resolve(__dirname, '../../tsconfig.json');
  const _tsConfigAny: any = await import(tsPath);
  tsconfig = _tsConfigAny;
  return { tsconfig, tsPath };
}

async function compileFile(file: string): Promise<{
  compilerOptions: ts.CompilerOptions;
  tsconfig: ts.TranspileOptions;
}> {
  const { tsconfig, tsPath } = await getTSOptions();
  let { compilerOptions } = tsconfig;
  if (!compilerOptions) {
    throw new Error('Error get compilseOptions');
  }
  const realHost = ts.createCompilerHost(compilerOptions, true);
  const filePath = path.resolve(__dirname, file);
  const tsD = fs.readFileSync(filePath).toString();
  const dummyFilePath = '/in-memory-file.ts';
  const dummySourceFile = ts.createSourceFile(filePath, tsD, ts.ScriptTarget.Latest);
  let outputCode: string | undefined = undefined;
  console.log(realHost.directoryExists && realHost.directoryExists.bind(realHost));
  const origFileCache = new Map<string, ts.SourceFile>(newFileCache);
  const formatHost: ts.CompilerHost = {
    fileExists: (filePath) => filePath === dummyFilePath || realHost.fileExists(filePath),
    directoryExists: (dirpath: string) => {
      let exists = realHost.directoryExists!(dirpath);
      if (!exists) {
        exists = ![...origFileCache.keys()].every((fp) => {
          return !path.dirname(fp).startsWith(dirpath);
        });
        if (exists) console.log(`directoryExists(${dirpath})= false=>${exists}`);
      }
      return exists;
    },
    getCurrentDirectory: realHost.getCurrentDirectory.bind(realHost),
    getDirectories: realHost?.getDirectories?.bind(realHost),
    getCanonicalFileName: (fileName) => realHost.getCanonicalFileName(fileName),
    getNewLine: realHost.getNewLine.bind(realHost),
    getDefaultLibFileName: realHost.getDefaultLibFileName.bind(realHost),
    getSourceFile: (fileName, languageVersion, onError, shouldCreateNewSourceFile) =>
      fileName === dummyFilePath
        ? dummySourceFile
        : realHost.getSourceFile(fileName, languageVersion, onError, shouldCreateNewSourceFile),
    readFile: (filePath) => (filePath === dummyFilePath ? tsD : realHost.readFile(filePath)),
    useCaseSensitiveFileNames: () => realHost.useCaseSensitiveFileNames(),
    writeFile: (fileName, data) => (outputCode = data),
  };
  const configPath = ts.findConfigFile(path.resolve(tsPath), ts.sys.fileExists, 'tsconfig.json');
  if (!configPath) {
    throw new Error('Cant read tsconfig.json file');
  }
  const readConfigFileResult = ts.readConfigFile(configPath, ts.sys.readFile);
  if (readConfigFileResult.error) {
    throw new Error(ts.formatDiagnostic(readConfigFileResult.error, formatHost));
  }
  const jsonConfig = readConfigFileResult.config;
  const { rootPath } = jsonConfig;
  const convertResult = ts.convertCompilerOptionsFromJson(jsonConfig, './');
  if (convertResult.errors && convertResult.errors.length > 0) {
    throw new Error(ts.formatDiagnostics(convertResult.errors, formatHost));
  }
  const libs = [
    'es5',
    'es6',
    'es2015',
    'es2016',
    'es2017',
    'es2018',
    'es2019',
    'es2020',
    'es2021',
    'esnext',
  ];
  const rootNames = libs.map((lib) => require.resolve(`typescript/lib/lib.${lib}.d.ts`));
  const program = ts.createProgram(rootNames.concat([filePath]), jsonConfig, formatHost);
  console.log(
    ts.formatDiagnosticsWithColorAndContext(ts.getPreEmitDiagnostics(program), formatHost)
  );
  const emitResult = program.emit();
  //console.log(diagnostics);
  compilerOptions = convertResult.options;
  return { compilerOptions, tsconfig };
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
async function watchDir(dirPath: string): Promise<void> {
  tsconfig = tsconfig || (await (await getTSOptions()).tsconfig);
  let { compilerOptions } = tsconfig;
  compilerOptions = compilerOptions || {};
  const { outDir } = compilerOptions;
  return await new Promise(() => {
    watcher = chokidar
      .watch(dirPath, {
        ignored: [/node_modules/, new RegExp(`${outDir}`), '.git'],
        persistent: true,
      })
      .on('all', (event, path) => {
        if (event !== 'add' && event !== 'addDir') {
          if (event === 'change') {
            if (path.match(/\.ts$/)) {
              const resPath = compileFile(path);
              if (path.match(/\/src\/bin\/prisma-api.ts/)) {
                const i = import('../scripts/index');
                i.then((d) => {
                  const { script } = d;
                  resPath.then((rPath) => {
                    script('env', typeof rPath === 'string' ? rPath : '');
                    controller.abort();
                    process.exit(2);
                  });
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

(async () => {
  //@ts-ignore
  if (typeof tsconfig === 'undefined') {
    tsconfig = await (await getTSOptions()).tsconfig;
  }
  let { compilerOptions } = tsconfig;
  compilerOptions = compilerOptions || {};
  const { rootDir } = compilerOptions;
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
  let command = /^win/.test(process.platform) ? 'npm.cmd' : 'npm';
  let args: string[];
  const cwd = PWD;
  switch (arg2) {
    case 'build':
      args = ['run', 'build'];
      const buildRes = await getSpawn({
        command,
        args,
        options: { cwd },
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
      const packageJson: any = await import(path.resolve(PWD, 'package.json'));
      const { prisma } = packageJson;
      if (!prisma) {
        console.error(ERROR, Red, 'prisma.schema directive is not found in package.json', Reset);
        process.exit(1);
      }
      const prismaSchema = fs.readFileSync(path.resolve(PWD, prisma.schema))?.toString();
      args = ['run', 'dev'];
      const spawnRes = await getSpawn({
        command,
        args,
        options: {
          signal,
          cwd,
        },
      }).catch((e) => {
        console.error(ERROR, `Error ${command} ${args.join(' ')}`);
      });
      console.info(`Dev server existed with code ${spawnRes}`);
      break;
    default:
      console.info(`
error Unknown command ${arg2}
Try run "prisma-api --help" 
        ${help}
      `);
  }
})();
