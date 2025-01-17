// @ts-nocheck

const { dirname } = require('path');
const ts = require('typescript');
const { findTsconfig } = require('./find-tsconfig');
const { getCompilerOptions } = require('./get-compiler-options');

const log = (...args) => {
	process.stderr.write(JSON.stringify(args, null, 2) + '\n');
};

function getTypeScriptLanguageServiceHost(path, content) {
	const tsconfig = findTsconfig(path);
	log('Found tsconfig:', tsconfig);
	
	const compilerOptions = getCompilerOptions(tsconfig);
	log('Compiler options:', compilerOptions);
	
	const snapshot = ts.ScriptSnapshot.fromString(content);

	// 파일 시스템 캐시
	const fileVersions = new Map();
	const fileContents = new Map([[path, content]]);
	fileVersions.set(path, 0);

	// 프로그램 생성을 위한 파일 목록
	const rootFiles = [
		path,
		ts.getDefaultLibFilePath(compilerOptions),
		require.resolve('@types/react/index.d.ts')
	];

	// 프로그램 생성
	const program = ts.createProgram(rootFiles, compilerOptions);
	const sourceFile = program.getSourceFile(path);

	if (!sourceFile) {
		log('Failed to create source file');
		return null;
	}

	// TypeChecker 생성
	const typeChecker = program.getTypeChecker();

	return {
		directoryExists: ts.sys.directoryExists,
		fileExists: (fileName) => {
			// lib.d.ts 파일들은 항상 존재한다고 처리
			if (fileName.startsWith(ts.getDirectoryPath(ts.getDefaultLibFilePath(compilerOptions)))) {
				return true;
			}
			return ts.sys.fileExists(fileName);
		},
		getDefaultLibFileName: ts.getDefaultLibFileName,
		getDirectories: ts.sys.getDirectories,
		readDirectory: ts.sys.readDirectory,
		readFile: (fileName) => {
			// lib.d.ts 파일들은 TypeScript에서 직접 읽도록 함
			if (fileName.startsWith(ts.getDirectoryPath(ts.getDefaultLibFilePath(compilerOptions)))) {
				return undefined;
			}
			return fileContents.get(fileName) || ts.sys.readFile(fileName);
		},
		getCurrentDirectory: () => (tsconfig ? dirname(tsconfig) : ts.sys.getCurrentDirectory()),
		getCompilationSettings: () => compilerOptions,
		getNewLine: () => ts.sys.newLine,
		getScriptFileNames: () => rootFiles,
		getScriptVersion: (fileName) => fileVersions.get(fileName)?.toString() || '0',
		getScriptSnapshot: (fileName) => {
			if (fileName === path) {
				return snapshot;
			}
			// lib.d.ts 파일들은 TypeScript에서 처리하도록 함
			if (fileName.startsWith(ts.getDirectoryPath(ts.getDefaultLibFilePath(compilerOptions)))) {
				return undefined;
			}
			const content = ts.sys.readFile(fileName);
			return content ? ts.ScriptSnapshot.fromString(content) : undefined;
		},
		getProgram: () => program,
		getTypeChecker: () => typeChecker,
	};
}

module.exports = { getTypeScriptLanguageServiceHost };
