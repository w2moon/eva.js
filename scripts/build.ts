import { build as esbuild } from "esbuild";
import { swcPlugin } from "esbuild-plugin-swc";
import { evaAlias } from "./plugins/eva-alias";
import { esbuildDecorators } from "esbuild-plugin-typescript-decorators";
import { NodeResolvePlugin } from "@esbuild-plugins/node-resolve";
import external from "@chialab/esbuild-plugin-external";
import EsmExternals from '@esbuild-plugins/esm-externals'
import { transform } from "@swc/core";

import { minify } from "terser";

import { resolve } from "path";
import { readFileSync, writeFileSync } from "fs";


const pkg = 'renderer-adapter';

const entry = `./packages/${pkg}/lib/index.ts`;
const output = `./packages/${pkg}/dist/${pkg}.esbuild.js`
const minoutput = `./packages/${pkg}/dist/${pkg}.esbuild.min.js`;


(async () => {
  console.time('build');
  await build();
  console.timeEnd('build');
})();

async function build() {
  const result = await esbuild({
    entryPoints: [entry],
    sourcemap: false,
    outfile: output,
    target: 'es2015',
    minify: false,
    define: {
      __TEST__: 'false',
      __DEV__: `${process.env.NODE_ENV === 'development'}`,
      __VERSION__: `'0.0.0'`,
    },
    bundle: true,
    tsconfig: './tsconfig.json',
    treeShaking: true,
    format: 'iife',
    globalName: 'EVA',
    write: false,
    plugins: [

      EsmExternals({

        externals: [
          // "@eva/inspector-decorator",
          // "eventemitter3",
          // "lodash-es",
          // "mini-signals",
          // "parse-uri",
          // "resource-loader",
          // "sprite-timeline",
          "pixi.js"
        ]
      }),
      // NodeResolvePlugin({
      //   extensions: ['.ts', '.js'],
      // })
      // evaAlias(),/

      // swcPlugin({
      //   configFile: './.swcrc',
      //   minify: true
      // }),
    ]
  });

  const temp = result.outputFiles[0].text
  // const temp = await minify(result.outputFiles[0].text, {
  //   ecma: 2020,
  //   output: {
  //     wrap_iife: false,
  //     ecma: 2020,
  //   }
  // }).code;

  const result2 = await transform(temp, {
    configFile: './.swcrc',
    swcrc: true,
    minify: true
  });

  writeFileSync(output, result2.code)

  const result3 = await minify(result2.code, {
    ecma: 5,
    output: {
      wrap_iife: false,
      ecma: 5
    }
  });
  writeFileSync(minoutput, result3.code);

  console.log(`${result3.code.length / 1024}`.slice(0, 6), 'KB');

}