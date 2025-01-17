const { sep, posix } = require('path');
const { applyTextChanges } = require('./apply-text-changes');
const { getLanguageService } = require('./get-language-service');

/**
 * Remove unused imports from the given code.
 *
 * @param {string} code
 * @param {import('prettier').ParserOptions} options
 */
module.exports.organize = (
	code,
	{ filepath = 'file.ts', parentParser, parser },
) => {
	if (parentParser === 'vue') {
		return code;
	}

	if (sep !== posix.sep) {
		filepath = filepath.split(sep).join(posix.sep);
	}

	const languageService = getLanguageService(parser, filepath, code);
	const sourceFile = languageService.getProgram()?.getSourceFile(filepath);
	
	if (!sourceFile) return code;

	// Get all diagnostics related to unused imports
	const diagnostics = languageService.getSemanticDiagnostics(filepath)
		.filter(diagnostic => 
			diagnostic.code === 6192 || // unused import
			diagnostic.code === 6133    // unused declaration
		);

	if (diagnostics.length === 0) return code;

	// Get and apply code fixes for each diagnostic
	let result = code;
	for (const diagnostic of diagnostics) {
		if (!diagnostic.start || !diagnostic.length) continue;
		
		const fixes = languageService.getCodeFixesAtPosition(
			filepath,
			diagnostic.start,
			diagnostic.start + diagnostic.length,
			[diagnostic.code],
			{},
			{}
		);

		// Apply the fix that removes unused declarations
		const fix = fixes.find(fix => fix.fixName === "unusedIdentifier_delete");
		if (fix && fix.changes.length > 0) {
			result = applyTextChanges(result, fix.changes[0].textChanges);
		}
	}

	return result;
};
