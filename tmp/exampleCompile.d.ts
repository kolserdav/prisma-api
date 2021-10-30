import ts from 'typescript';
export declare class CompilerX {
    private readonly host;
    private _program;
    private _typeChecker;
    private readonly compilerOptions;
    constructor(compilerOptionsIn?: ts.CompilerOptions);
    private static createHostWithCache;
    get program(): ts.Program;
    get typeChecker(): ts.TypeChecker;
    compileProgram(newSourceFiles: ReadonlyArray<[string, ts.SourceFile]> | undefined, filepaths: ReadonlyArray<string>, emit: boolean): void;
    emit(sourceFile: ts.SourceFile): void;
}
