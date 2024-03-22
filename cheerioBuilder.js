const esbuild = require("esbuild");
const path = require("path");

async function startCH() {
  const cwd = process.cwd();
  const sourceDirectory = path.join(cwd, "cheerio", "src");
  const destinationDirectory = path.join(cwd, "bundles");

  const result = await esbuild.build({
    bundle: true,
    entryPoints: [path.join(sourceDirectory, "index.ts")],
    format: "iife",
    globalName: "cheerio",
    metafile: true,
    minify: false,
    outfile: path.join(destinationDirectory, "bundle.js"),
  });

  result.metafile;
}

// async function startCH() {
//   const cwd = process.cwd();
//   const sourceDirectory = path.join(cwd, "cheerio", "src");
//   const destinationDirectory = path.join(cwd, "bundles");

//   const result = await esbuild.build({
//     bundle: true,
//     entryPoints: [path.join(sourceDirectory, "index.ts")],
//     format: "iife",
//     globalName: "cheerio",
//     metafile: true,
//     minify: false,
//     platform: "browser",
//     outfile: path.join(destinationDirectory, "bundle.js"),
//   });
// }

startCH();
