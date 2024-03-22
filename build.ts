import * as fs from "fs";
import * as path from "path";
import esbuild from "esbuild";
import { SourceInfo } from "./sources/types";
import archiver from "archiver";

/**
 * @param {String} sourceDir: /some/folder/to/compress
 * @param {String} outPath: /path/to/created.zip
 * @returns {Promise}
 */

function zipDirectory(sourceDir: string, outPath: string): Promise<void> {
  // @ts-ignore
  const archive = archiver("zip", { zlib: { level: 9 } });
  const stream = fs.createWriteStream(outPath);

  return new Promise((resolve, reject) => {
    archive
      .directory(sourceDir, false)
      .on("error", (err: archiver.ArchiverError) => reject(err))
      .pipe(stream);

    stream.on("close", () => resolve());
    archive.finalize();
  });
}

var rmdir = function (dir: string) {
  var list = fs.readdirSync(dir);
  for (var i = 0; i < list.length; i++) {
    var filename = path.join(dir, list[i]);
    var stat = fs.statSync(filename);

    if (filename == "." || filename == "..") {
      // pass these files
    } else if (stat.isDirectory()) {
      // rmdir recursively
      rmdir(filename);
    } else {
      // rm fiilename
      fs.unlinkSync(filename);
    }
  }
  fs.rmdirSync(dir);
};

class Build {
  static buildPath = path.join(process.cwd(), "bundles");
  /*
    gives the build path source info e.g
    {
      "name": "GoodReads",
      "description": "GoodReads scraper",
      "websiteURL": "https://www.goodreads.com/"
    }
   */
  static async generateSourceInfo(filePaths: string[]) {
    const sourcesInfoPath = path.join(this.buildPath, "sources.json");

    let sources: SourceInfo[] = [];
    filePaths.forEach((filePath) => {
      const sourceInfo = JSON.parse(fs.readFileSync(filePath, "utf8"));

      sources.push(sourceInfo);
    });

    fs.writeFileSync(sourcesInfoPath, JSON.stringify(sources));
  }

  static createBuildDir() {
    if (fs.existsSync(this.buildPath)) {
      rmdir(this.buildPath);
    }

    fs.mkdirSync(this.buildPath);
  }

  /*
    sourceDirectory of files must be /src/{extension_name}/{extension_name}.ts
  */
  static async build(sourceDirectory: string) {
    this.createBuildDir();

    const files = fs.readdirSync(sourceDirectory).filter((file) => {
      return fs.existsSync(path.join(sourceDirectory, file, `${file}.ts`));
    });

    const buildFiles = files.flatMap((file) => [
      {
        in: path.join(sourceDirectory, file, `${file}.ts`),
        out: path.join(file, "index"),
      },
    ]);

    var sourceFiles: string[] = [];
    files.forEach((file) => {
      const jsonFile = path.join(sourceDirectory, file, "source.json");

      //
      const dest = path.join(this.buildPath, file);
      const sourceJSONFile = path.join(dest, "source.json");

      if (fs.existsSync(dest) === false) {
        fs.mkdirSync(dest);
      }

      fs.copyFileSync(jsonFile, sourceJSONFile);
      //
      if (fs.existsSync(jsonFile)) {
        sourceFiles.push(jsonFile);
      }
    });

    this.generateSourceInfo(sourceFiles);

    await esbuild.build({
      bundle: true,
      entryPoints: buildFiles,
      format: "iife",
      globalName: "source",
      metafile: true,
      outdir: this.buildPath,
    });

    // zip files in bundles dir

    const dirs = fs
      .readdirSync(this.buildPath)
      .filter((file) => {
        return fs.lstatSync(path.join(this.buildPath, file)).isDirectory();
      })
      .flatMap((file) => path.join(this.buildPath, file));

    dirs.forEach(async (dir) => {
      await zipDirectory(
        dir,
        path.join(this.buildPath, path.parse(dir).base) + ".zip",
      );
    });
  }
}

Build.build("/Users/mirnaolvera/MALLEL/read/sources");
