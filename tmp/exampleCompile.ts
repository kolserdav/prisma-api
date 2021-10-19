import ts from 'typescript';
import _ from 'lodash';
import dedent from 'ts-dedent';
import fs from 'fs';
import path from 'path';
import cp from 'child_process';
import os from 'os';
import {} from 'ts-expose-internals';

export class CompilerX {
  private readonly host: ts.CompilerHost;
  private _program: ts.Program | undefined;
  private _typeChecker: ts.TypeChecker | undefined;
  private readonly compilerOptions: ts.CompilerOptions;
  constructor(compilerOptionsIn: ts.CompilerOptions = {}) {
    this.compilerOptions = _.cloneDeep(compilerOptionsIn);
    this.host = ts.createCompilerHost(this.compilerOptions, true);
  }
  private static createHostWithCache(
    hostOrig: ts.CompilerHost,
    newFileCache: Map<string, ts.SourceFile>
  ): ts.CompilerHost {
    const origFileCache = new Map<string, ts.SourceFile>(newFileCache);
    return {
      ...hostOrig,
      getSourceFile: (fileName: string, languageVersion: ts.ScriptTarget) => {
        let sourceFile: undefined | ts.SourceFile;
        fileName = ts.normalizePath(fileName);
        let fromCache = false;
        if (newFileCache.has(fileName)) {
          sourceFile = newFileCache.get(fileName);
          //newFileCache.delete(fileName); // delete it so that hereafter program will use it's own cache
          fromCache = true;
        } else sourceFile = hostOrig.getSourceFile(fileName, languageVersion);
        if (origFileCache.has(fileName))
          console.log(`${fromCache ? 'cache, ' : 'notcache'}getSourceFile(${fileName})`);
        return sourceFile;
      },
      fileExists: (filename: string) => {
        let exists = hostOrig.fileExists(filename);
        if (origFileCache.has(filename)) {
          const existsOrig = exists;
          exists = true;
          console.log(`fileExists(${filename})= ${existsOrig}=>${exists}`);
        }
        return exists;
      },
    };
  }
  get program(): ts.Program {
    if (!this._program) throw new Error('program undefined');
    return this._program;
  }
  get typeChecker(): ts.TypeChecker {
    if (!this._typeChecker) throw new Error('typeChecker undefined');
    return this._typeChecker;
  }
  compileProgram(
    newSourceFiles: ReadonlyArray<[string, ts.SourceFile]> | undefined,
    filepaths: ReadonlyArray<string>,
    emit: boolean
  ): void {
    let host = this.host;
    if (newSourceFiles) {
      filepaths = [...newSourceFiles.map(([fp, _]) => fp), ...filepaths];
      const cache = new Map<string, ts.SourceFile>(newSourceFiles);
      host = CompilerX.createHostWithCache(this.host, cache);
    }
    this._program = ts.createProgram(filepaths, this.compilerOptions, host, this._program);
    this._typeChecker = this._program.getTypeChecker();
    if (this._program!.getGlobalDiagnostics().length) {
      console.error(
        ts.formatDiagnosticsWithColorAndContext(this._program!.getGlobalDiagnostics(), this.host)
      );
      throw new Error('this.program.getGlobalDiagnostics()');
    }
    if (ts.getPreEmitDiagnostics(this._program!).length) {
      console.error(
        ts.formatDiagnosticsWithColorAndContext(ts.getPreEmitDiagnostics(this._program!), this.host)
      );
      throw new Error('ts.getPreEmitDiagnostics(this.program)');
    }
    filepaths.forEach((fp) => {
      const sourceFile = this._program!.getSourceFile(fp);
      if (!sourceFile) {
        throw new Error(`sourceFile for ${fp} not found`);
      }
      if (ts.getPreEmitDiagnostics(this._program!, sourceFile).length) {
        console.error(
          ts.formatDiagnosticsWithColorAndContext(
            ts.getPreEmitDiagnostics(this._program!, sourceFile),
            this.host
          )
        );
        throw new Error('ts.getPreEmitDiagnostics(this.program, sourceFile)');
      }
    });
    if (emit) {
      const emitres = this._program.emit();
      if (emitres.diagnostics.length) {
        console.error(ts.formatDiagnosticsWithColorAndContext(emitres.diagnostics, this.host));
      }
    }
  }
  emit(sourceFile: ts.SourceFile): void {
    if (!this._program) {
      throw new Error('this._program is undefined');
    }
    const emitres = this._program!.emit(sourceFile);
    if (emitres.diagnostics.length) {
      console.error(ts.formatDiagnosticsWithColorAndContext(emitres.diagnostics, this.host));
    }
  }
}

const projdir = fs.mkdtempSync(path.join(os.tmpdir(), 'test'));
console.log(`project dir is ${projdir}`);
//const projdir = path.resolve('./tmp/test');

const scriptTarget = ts.ScriptTarget.ES2020;
const defaultCompilerOptions = {
  lib: ['lib.es2020.d.ts'],
  module: ts.ModuleKind.CommonJS,
  target: scriptTarget,
  noEmit: false, // for transformer with output, it must be false
  strict: true,
  esModuleInterop: true,
  skipLibCheck: true,
  forceConsistentCasingInFileNames: true,
  declaration: false,
  configDirPath: path.join(projdir, 'tsconfig.json'),
  outDir: path.join(projdir, 'dist'), // internally convert to full path
  rootDir: path.join(projdir, ''), // internally convert to full path
};

const files = [
  {
    virtual: false,
    basename: 'src/a1.ts',
    text: dedent`
      import * as b from '../gen/bdir/b'
      import * as c from '../gen/cdir/c'
      b.name;
      c.name;

      `,
  },
  {
    virtual: true,
    basename: 'gen/bdir/b.ts',
    text: dedent`
    import * as c from '../cdir/c'
    export const name = 'my name is b'
    c.name;

    `,
  },
  {
    virtual: true,
    basename: 'gen/cdir/c.ts',
    text: dedent`
      export const name = 'my name is c'
      `,
  },
];
for (let iter = 0; iter < 2; iter++) {
  fs.rmdirSync(projdir, { recursive: true });
  fs.mkdirSync(projdir, { recursive: true });
  if (iter === 0) console.log('iter 0, create real directories for the virtual files - OK');
  else console.log('iter 1, do not create real directories for the virtual files - NG');
  const virtual: [string, ts.SourceFile][] = [];
  const real: string[] = [];
  files.forEach((s) => {
    const fpath = path.join(projdir, s.basename);
    if (s.virtual) {
      if (iter === 0) fs.mkdirSync(path.dirname(fpath), { recursive: true });
      const sourceFile = ts.createSourceFile(fpath, s.text, defaultCompilerOptions.target!);
      virtual.push([fpath, sourceFile]);
    } else {
      fs.mkdirSync(path.dirname(fpath), { recursive: true });
      fs.writeFileSync(fpath, s.text);
      real.push(fpath);
    }
  });

  const cx = new CompilerX(defaultCompilerOptions);
  cx.compileProgram(virtual, real, true);

  console.log(cp.execSync(`tree ${projdir}`).toString());
}
