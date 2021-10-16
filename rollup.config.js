//@ts-check
import typescript from '@rollup/plugin-typescript';
import * as ts from 'typescript';
import path from 'path';
import fs from 'fs';
import tsconfig from './tsconfig.json';
const { watch } = require('gulp');
const { spawn } = require('child_process');
//const { WARNING, ERROR, SUCCESS } = require('./lib/index');
const rollup = require('rollup');
const merge = require('deepmerge');
const { createBasicConfig } = require('@open-wc/building-rollup');

/**
 * @type {any}
 */
const _tsconfig = tsconfig;
const SUCCESS = 'success';
const WARNING = 'warning';
const ERROR = 'error';
const INFO = 'info';
/**
 *
 * @param {{
 *  command: string;
 *  args: string[]
 *  options?: any;
 * }} props
 * @returns
 */
async function getSpawn(props) {
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

/**
 * плагин для отслеживания изменения в файлах
 * @function function(globs)
 * @param {string[]} globs
 * @returns
 */
function watcher(globs) {
  return {
    name: 'watch-files',
    async buildStart() {
      const command = 'prisma-api dev';
      console.info(new Date(), `Starting ${command}`);
      globs.map((glob) => {
        watch(glob).on('change', async (file) => {
          switch (glob) {
            case 'src':
              const startDate = new Date().getTime();
              const tsD = fs.readFileSync(path.resolve(__dirname, file)).toString();
              const jsD = ts.transpileModule(tsD, _tsconfig).outputText;
              fs.writeFileSync(
                path.resolve(__dirname, file.replace('src/', 'dist/src/').replace(/\.ts$/, '.js')),
                jsD
              );
              const finDate = new Date().getTime();
              process.stdout.write('\r\r');
              process.stdout.write(
                `Compile file ${file.replace(/\s\S*/, '')} done in ${
                  finDate - startDate
                } ms. Timestamp: ${finDate}`
              );
              break;
            case 'rollup.config.js':
              // console.log(32);
              break;
            default:
          }
        });
      });
    },
  };
}

const baseConfig = createBasicConfig();
/**
 * @type {rollup.InputOptions} options
 */
const options = {
  input: './src/index.ts',
  plugins: [watcher(['src', 'rollup.config.js']), typescript(_tsconfig.compilerOptions)],
  external: [
    'bcrypt',
    'jsonwebtoken',
    'nodemailer',
    'html-to-text',
    '@prisma/client',
    'express',
    'cors',
  ],
  onwarn: function (warning) {
    if (warning.code === 'THIS_IS_UNDEFINED') {
      return;
    }
    console.warn(warning.message);
  },
};

export default merge(baseConfig, options);
