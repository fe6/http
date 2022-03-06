/*
Run Rollup in watch mode for development.

To specific the package to watch, simply pass its name and the desired build
formats to watch (defaults to "global"):

```
# name supports fuzzy match. will watch all packages with name containing "dom"
yarn dev dom

# specify the format to output
yarn dev core --formats cjs

# Can also drop all __DEV__ blocks with:
__DEV__=false yarn dev
```
*/

const path = require('path');
const execa = require('execa');
const fs = require('fs-extra');
const args = require('minimist')(process.argv.slice(2));
const formats = args.formats || args.f;
const sourceMap = args.sourcemap || args.s;

const pkgDir = path.resolve(`.`);
const typesDir = path.resolve(pkgDir, 'dist');

run();

async function run() {
  if (fs.existsSync(typesDir)) {
    await fs.remove(typesDir);
  }

  execa(
    'rollup',
    [
      '-wc',
      '--environment',
      [`FORMATS:${formats || 'global'}`, sourceMap ? `SOURCE_MAP:true` : ``]
        .filter(Boolean)
        .join(','),
    ],
    {
      stdio: 'inherit',
    },
  );
}
