const { dirname } = require('path');
const ts = require('typescript');
const { memoize } = require('./memoize');

/**
 * Get the compiler options from the path to a tsconfig.
 *
 * @param {string | undefined} tsconfig path to tsconfig
 */
function getCompilerOptions(tsconfig) {
	const compilerOptions = tsconfig
		? ts.parseJsonConfigFileContent(ts.readConfigFile(tsconfig, ts.sys.readFile).config, ts.sys, dirname(tsconfig))
				.options
		: ts.getDefaultCompilerOptions();

	compilerOptions.allowJs = true; // for automatic JS support
	compilerOptions.allowNonTsExtensions = true // for Vue support

	compilerOptions.noUnusedLocals = true;      // 사용되지 않는 로컬 변수 감지
	compilerOptions.noUnusedParameters = true;   // 사용되지 않는 파라미터 감지
	compilerOptions.checkJs = true;             // JavaScript 파일도 체크
	compilerOptions.moduleResolution = ts.ModuleResolutionKind.Node10;  // 모듈 해석 방식 설정
	compilerOptions.module = ts.ModuleKind.ESNext;      // 추가
	compilerOptions.target = ts.ScriptTarget.ESNext;     // 추가
	compilerOptions.isolatedModules = true;             // 추가
	compilerOptions.skipLibCheck = true;                // 추가

	compilerOptions.strict = false;  // strict 모드 비활성화
	compilerOptions.jsx = ts.JsxEmit.React;  // JSX 지원
	compilerOptions.esModuleInterop = true;  // import * as React 대신 import React 허용
	compilerOptions.allowSyntheticDefaultImports = true;  // default import 허용

	compilerOptions.types = ['react'];  // React 타입 포함
	compilerOptions.typeRoots = [
		'./node_modules/@types',
		'./node_modules'
	];
	compilerOptions.lib = [
		'lib.es2015.d.ts',
		'lib.dom.d.ts'
	];

	return compilerOptions;
}

module.exports.getCompilerOptions = memoize(getCompilerOptions);
