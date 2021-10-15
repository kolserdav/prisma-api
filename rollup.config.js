const path = require('path');
const rollup = require('rollup');

/**
 * @type {rollup.demoWatcherPlugin}
 * @param {*} globs
 * @returns
 */
function demoWatcherPlugin(globs) {
  let doTheAction = false;

  return {
    name: 'prisma-api-watcher',
    watchChange(id) {
      const relPath = path.relative(__dirname, id);
      if (globs.some((item) => minimatch.match([relPath], item).length > 0)) {
        doTheAction = true;
      }
    },

    async buildEnd() {
      if (doTheAction) {
        console.log('action');
      }
    },
  };
}

/**
 * @type {rollup.InputOptions} options
 */
const options = {
  plugins: [demoWatcherPlugin(['dist/bin/index.js'])],
};

export default options;
