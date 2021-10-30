"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompilerX = void 0;
const typescript_1 = __importDefault(require("typescript"));
const lodash_1 = __importDefault(require("lodash"));
const ts_dedent_1 = __importDefault(require("ts-dedent"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const child_process_1 = __importDefault(require("child_process"));
const os_1 = __importDefault(require("os"));
class CompilerX {
    constructor(compilerOptionsIn = {}) {
        this.compilerOptions = lodash_1.default.cloneDeep(compilerOptionsIn);
        this.host = typescript_1.default.createCompilerHost(this.compilerOptions, true);
    }
    static createHostWithCache(hostOrig, newFileCache) {
        const origFileCache = new Map(newFileCache);
        return {
            ...hostOrig,
            getSourceFile: (fileName, languageVersion) => {
                let sourceFile;
                fileName = typescript_1.default.normalizePath(fileName);
                let fromCache = false;
                if (newFileCache.has(fileName)) {
                    sourceFile = newFileCache.get(fileName);
                    fromCache = true;
                }
                else
                    sourceFile = hostOrig.getSourceFile(fileName, languageVersion);
                if (origFileCache.has(fileName))
                    console.log(`${fromCache ? 'cache, ' : 'notcache'}getSourceFile(${fileName})`);
                return sourceFile;
            },
            fileExists: (filename) => {
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
    get program() {
        if (!this._program)
            throw new Error('program undefined');
        return this._program;
    }
    get typeChecker() {
        if (!this._typeChecker)
            throw new Error('typeChecker undefined');
        return this._typeChecker;
    }
    compileProgram(newSourceFiles, filepaths, emit) {
        let host = this.host;
        if (newSourceFiles) {
            filepaths = [...newSourceFiles.map(([fp, _]) => fp), ...filepaths];
            const cache = new Map(newSourceFiles);
            host = CompilerX.createHostWithCache(this.host, cache);
        }
        this._program = typescript_1.default.createProgram(filepaths, this.compilerOptions, host, this._program);
        this._typeChecker = this._program.getTypeChecker();
        if (this._program.getGlobalDiagnostics().length) {
            console.error(typescript_1.default.formatDiagnosticsWithColorAndContext(this._program.getGlobalDiagnostics(), this.host));
            throw new Error('this.program.getGlobalDiagnostics()');
        }
        if (typescript_1.default.getPreEmitDiagnostics(this._program).length) {
            console.error(typescript_1.default.formatDiagnosticsWithColorAndContext(typescript_1.default.getPreEmitDiagnostics(this._program), this.host));
            throw new Error('ts.getPreEmitDiagnostics(this.program)');
        }
        filepaths.forEach((fp) => {
            const sourceFile = this._program.getSourceFile(fp);
            if (!sourceFile) {
                throw new Error(`sourceFile for ${fp} not found`);
            }
            if (typescript_1.default.getPreEmitDiagnostics(this._program, sourceFile).length) {
                console.error(typescript_1.default.formatDiagnosticsWithColorAndContext(typescript_1.default.getPreEmitDiagnostics(this._program, sourceFile), this.host));
                throw new Error('ts.getPreEmitDiagnostics(this.program, sourceFile)');
            }
        });
        if (emit) {
            const emitres = this._program.emit();
            if (emitres.diagnostics.length) {
                console.error(typescript_1.default.formatDiagnosticsWithColorAndContext(emitres.diagnostics, this.host));
            }
        }
    }
    emit(sourceFile) {
        if (!this._program) {
            throw new Error('this._program is undefined');
        }
        const emitres = this._program.emit(sourceFile);
        if (emitres.diagnostics.length) {
            console.error(typescript_1.default.formatDiagnosticsWithColorAndContext(emitres.diagnostics, this.host));
        }
    }
}
exports.CompilerX = CompilerX;
const projdir = fs_1.default.mkdtempSync(path_1.default.join(os_1.default.tmpdir(), 'test'));
console.log(`project dir is ${projdir}`);
const scriptTarget = typescript_1.default.ScriptTarget.ES2020;
const defaultCompilerOptions = {
    lib: ['lib.es2020.d.ts'],
    module: typescript_1.default.ModuleKind.CommonJS,
    target: scriptTarget,
    noEmit: false,
    strict: true,
    esModuleInterop: true,
    skipLibCheck: true,
    forceConsistentCasingInFileNames: true,
    declaration: false,
    configDirPath: path_1.default.join(projdir, 'tsconfig.json'),
    outDir: path_1.default.join(projdir, 'dist'),
    rootDir: path_1.default.join(projdir, ''),
};
const files = [
    {
        virtual: false,
        basename: 'src/a1.ts',
        text: (0, ts_dedent_1.default) `
      import * as b from '../gen/bdir/b'
      import * as c from '../gen/cdir/c'
      b.name;
      c.name;

      `,
    },
    {
        virtual: true,
        basename: 'gen/bdir/b.ts',
        text: (0, ts_dedent_1.default) `
    import * as c from '../cdir/c'
    export const name = 'my name is b'
    c.name;

    `,
    },
    {
        virtual: true,
        basename: 'gen/cdir/c.ts',
        text: (0, ts_dedent_1.default) `
      export const name = 'my name is c'
      `,
    },
];
for (let iter = 0; iter < 2; iter++) {
    fs_1.default.rmdirSync(projdir, { recursive: true });
    fs_1.default.mkdirSync(projdir, { recursive: true });
    if (iter === 0)
        console.log('iter 0, create real directories for the virtual files - OK');
    else
        console.log('iter 1, do not create real directories for the virtual files - NG');
    const virtual = [];
    const real = [];
    files.forEach((s) => {
        const fpath = path_1.default.join(projdir, s.basename);
        if (s.virtual) {
            if (iter === 0)
                fs_1.default.mkdirSync(path_1.default.dirname(fpath), { recursive: true });
            const sourceFile = typescript_1.default.createSourceFile(fpath, s.text, defaultCompilerOptions.target);
            virtual.push([fpath, sourceFile]);
        }
        else {
            fs_1.default.mkdirSync(path_1.default.dirname(fpath), { recursive: true });
            fs_1.default.writeFileSync(fpath, s.text);
            real.push(fpath);
        }
    });
    const cx = new CompilerX(defaultCompilerOptions);
    cx.compileProgram(virtual, real, true);
    console.log(child_process_1.default.execSync(`tree ${projdir}`).toString());
}
