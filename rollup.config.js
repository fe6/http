import path from 'path';
import ts from 'rollup-plugin-typescript2';
import json from '@rollup/plugin-json';
import resolveRollup from 'rollup-plugin-node-resolve';
import chalk from 'chalk';

const packagesDir = path.resolve(__dirname, '.');
const packageDir = path.resolve(packagesDir, '.');
const name = path.basename(packageDir);
const resolve = (p) => path.resolve(packageDir, p);
const pkg = require(resolve(`package.json`));

// ensure TS checks only once for each build
let hasTSChecked = false;

const outputConfigs = {
  'esm-bundler': {
    file: resolve(`dist/${name}.esm-bundler.js`),
    format: `es`,
  },
  'esm-browser': {
    file: resolve(`dist/${name}.esm-browser.js`),
    format: `es`,
  },
  cjs: {
    file: resolve(`dist/${name}.cjs.js`),
    format: `cjs`,
  },
  global: {
    file: resolve(`dist/${name}.global.js`),
    format: `iife`,
  },
};

const defaultFormats = ['esm-bundler', 'esm-browser', 'cjs', 'global'];
const inlineFormats = process.env.FORMATS && process.env.FORMATS.split(',');
const packageFormats = inlineFormats || defaultFormats;
const packageConfigs = packageFormats.map((format) =>
  createConfig(format, outputConfigs[format]),
);

if (process.env.NODE_ENV === 'production') {
  packageFormats.forEach((format) => {
    if (format === 'cjs') {
      packageConfigs.push(createProductionConfig(format));
    }
    if (/^(global|esm-browser)(-runtime)?/.test(format)) {
      packageConfigs.push(createMinifiedConfig(format));
    }
  });
}

export default packageConfigs;

function createConfig(format, output, plugins = []) {
  if (!output) {
    console.log(chalk.yellow(`invalid format: "${format}"`));
    process.exit(1);
  }

  output.sourcemap = !!process.env.SOURCE_MAP;
  output.externalLiveBindings = false;

  const isBrowserESMBuild = /esm-browser/.test(format);
  const isGlobalBuild = /global/.test(format);

  if (isGlobalBuild) {
    output.name = name;
  }
  if (!isBrowserESMBuild) {
    output.exports = 'named';
  }

  const shouldEmitDeclarations = process.env.TYPES != null && !hasTSChecked;

  const tsPlugin = ts({
    check: process.env.NODE_ENV === 'production' && !hasTSChecked,
    tsconfig: path.resolve(__dirname, 'tsconfig.json'),
    cacheRoot: path.resolve(__dirname, 'node_modules/.rts2_cache'),
    tsconfigOverride: {
      compilerOptions: {
        sourceMap: output.sourcemap,
        declaration: shouldEmitDeclarations,
        declarationMap: false,
      },
    },
  });

  hasTSChecked = true;

  const entryFile = `src/index.ts`;

  const external = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.peerDependencies || {}),
  ];

  if (isGlobalBuild) {
    output.globals = {
      axios: 'axios',
      lodash: '_',
      '@fe6/shared': 'waterShared',
    };
  }

  return {
    input: resolve(entryFile),
    external,
    plugins: [
      json({
        namedExports: false,
      }),
      tsPlugin,
      ...plugins,
      resolveRollup({
        // 将自定义选项传递给解析插件
        customResolveOptions: {
          moduleDirectory: 'node_modules',
        },
      }),
    ],
    output,
    onwarn: (msg, warn) => {
      if (!/Circular/.test(msg)) {
        warn(msg);
      }
    },
    treeshake: {
      moduleSideEffects: false,
    },
  };
}

function createProductionConfig(format) {
  return createConfig(format, {
    file: resolve(`dist/${name}.${format}.prod.js`),
    format: outputConfigs[format].format,
  });
}

function createMinifiedConfig(format) {
  const { terser } = require('rollup-plugin-terser');
  return createConfig(
    format,
    {
      file: outputConfigs[format].file.replace(/\.js$/, '.prod.js'),
      format: outputConfigs[format].format,
    },
    [
      terser({
        module: /^esm/.test(format),
        compress: {
          ecma: 2015,
          pure_getters: true,
        },
        safari10: true,
      }),
    ],
  );
}
