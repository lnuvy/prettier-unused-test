// @ts-nocheck

const ts = require('typescript');

/**
 * @param {string} code
 * @param {import('prettier').ParserOptions & { parentParser?: string }} options
 */
module.exports.organize = (code, { filepath = 'file.ts', parentParser, parser }) => {
	if (parentParser === 'vue') {
		return code;
	}

	// 소스 파일 파싱
	const sourceFile = ts.createSourceFile(
		filepath,
		code,
		ts.ScriptTarget.Latest,
		true
	);

	// 사용된 식별자들 수집
	const usedIdentifiers = new Set();
	function visit(node) {
		if (ts.isIdentifier(node) && 
			!ts.isImportSpecifier(node.parent) && 
			!ts.isImportClause(node.parent) &&
			!ts.isImportDeclaration(node.parent)) {
			usedIdentifiers.add(node.text);
		}
		ts.forEachChild(node, visit);
	}
	visit(sourceFile);

	// import 문 분석 및 수정
	let result = code;
	const importNodes = [];
	ts.forEachChild(sourceFile, node => {
		if (ts.isImportDeclaration(node)) {
			importNodes.push(node);
		}
	});

	// 역순으로 처리 (텍스트 위치가 변경되지 않도록)
	for (const node of importNodes.reverse()) {
		const importClause = node.importClause;
		if (!importClause) continue;

		const namedBindings = importClause.namedBindings;
		if (!namedBindings || !ts.isNamedImports(namedBindings)) continue;

		const unusedImports = namedBindings.elements.filter(
			element => !usedIdentifiers.has(element.name.text)
		);

		if (unusedImports.length === namedBindings.elements.length) {
			const hasOtherCode = Array.from(sourceFile.statements)
				.some(stmt => !ts.isImportDeclaration(stmt));
			
			if (!hasOtherCode) {
				return '';  // 전체 코드가 사용되지 않는 import 문뿐이면 빈 문자열 반환
			}
			// 모든 import가 사용되지 않음 -> import문 전체 제거
			result = result.slice(0, node.getStart()) + result.slice(node.getEnd());
		} else if (unusedImports.length > 0) {
			// 일부 import만 사용되지 않음 -> 해당 import만 제거
			const usedImports = namedBindings.elements.filter(
				element => usedIdentifiers.has(element.name.text)
			);
			const newImports = usedImports.map(imp => imp.name.text).join(', ');
			const moduleSpecifier = node.moduleSpecifier.text;
			
			result = result.slice(0, node.getStart()) +
					 `import { ${newImports} } from "${moduleSpecifier}";` +
					 result.slice(node.getEnd());
		}
	}

	return result;
};
