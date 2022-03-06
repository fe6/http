/*
Produces production builds and stitches together d.ts files.

```
# name supports fuzzy match. will build all packages with name containing "dom":
yarn build dom

# specify the format to output
yarn build core --formats cjs
```
*/

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const execa = require('execa');
const { Extractor, ExtractorConfig } = require('@microsoft/api-extractor');
const { gzipSync } = require('zlib');
const { compress } = require('brotli');

const args = require('minimist')(process.argv.slice(2));
const formats = args.formats || args.f;
const isRelease = args.release;
const buildTypes = args.t || args.types || isRelease;

build();

async function build() {
  const pkgDir = path.resolve(`.`);
  const pkg = require(`${pkgDir}/package.json`);

  // if building a specific format, do not remove dist.
  if (!formats) {
    await fs.remove(`${pkgDir}/dist`);
  }

  const env = 'production';

  await execa(
    'rollup',
    [
      '-c',
      '--environment',
      [`NODE_ENV:${env}`, buildTypes ? `TYPES:true` : ``]
        .filter(Boolean)
        .join(','),
    ],
    { stdio: 'inherit' },
  );

  if (buildTypes && pkg.types) {
    const apiExtractorJsonPath = path.resolve(pkgDir, 'api-extractor.json');
    // https://api-extractor.com/pages/setup/configure_api_report/
    const extractorConfig =
      ExtractorConfig.loadFileAndPrepare(apiExtractorJsonPath);

    const extractorResult = Extractor.invoke(extractorConfig, {
      localBuild: true,
      showVerboseMessages: true,
    });

    if (extractorResult.succeeded) {
      const typesDir = path.resolve(pkgDir, 'dist/src');
      if (await fs.exists(typesDir)) {
        await fs.remove(typesDir);
      }
      console.log(`API Extractor completed successfully`);
      console.log();
      checkFileSize(
        path.resolve(
          pkgDir,
          'dist/' + path.basename(pkgDir) + '.global.prod.js',
        ),
      );
      console.log();
      process.exitCode = 0;
    } else {
      console.error(
        `API Extractor completed with ${extractorResult.errorCount} errors` +
          ` and ${extractorResult.warningCount} warnings`,
      );
      process.exitCode = 1;
    }
  }
}

function checkFileSize(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }
  const file = fs.readFileSync(filePath);
  const minSize = (file.length / 1024).toFixed(2) + 'kb';
  const gzipped = gzipSync(file);
  const gzippedSize = (gzipped.length / 1024).toFixed(2) + 'kb';
  const compressed = compress(file);
  const compressedSize = (compressed.length / 1024).toFixed(2) + 'kb';
  console.log(`Shared size`);
  console.log(
    `${chalk.blue(
      chalk.bold(path.basename(filePath)),
    )} min:${minSize} / gzip:${gzippedSize} / brotli:${compressedSize}`,
  );
}
