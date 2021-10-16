import { watch } from 'gulp';

const path = require('path');
const rollup = require('rollup');
const merge = require('deepmerge');
const { createBasicConfig } = require('@open-wc/building-rollup');
const spawn = require('child_process').spawn;

const SUCCESS = 'success';
const RESULT = 'result';
const WARNING = 'warning';
const ERROR = 'error';

/**
 * плагин для отслеживания изменения в файлах
 * @type {rollup.demoWatcherPlugin}
 * @param {string[]} globs
 * @returns
 */
function watcher(globs) {
  return {
    buildStart() {
      globs.map((glob) => {
        watch(glob, async () => {
          switch (glob) {
            case 'src':
              console.info(new Date(), 'Starting build typescript sub process');
              /**
               * @type {Buffer} spawnRes
               */
              const spawnRes = await new Promise((resolve, reject) => {
                const tsc = spawn.call('sh', 'tsc', ['-p', '.']);
                tsc.stdout?.on('data', (data) => {
                  resolve(data);
                });
                tsc.stderr?.on('data', (err) => {
                  console.warn(WARNING, `Spawn tsc -p . return error: ${err.message}`);
                  reject(err);
                });
                tsc.on('close', (code) => {
                  resolve(SUCCESS, `Build Typescript sub proccess exited with code ${code}`);
                });
              }).catch((e) => {
                console.error('error', e);
              });
              console.log(spawnRes);
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
  input: './dist/core/index.js',
  output: {
    dir: 'dist',
  },
  plugins: [watcher(['dist/bin/index.js', 'src'])],
  onwarn: function (warning) {
    if (warning.code === 'THIS_IS_UNDEFINED') {
      return;
    }
    console.warn(warning.message);
  },
};

export default merge(baseConfig, options);
