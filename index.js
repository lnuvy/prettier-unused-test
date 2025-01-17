// @ts-nocheck

const { parsers: babelParsers } = require('prettier/parser-babel');
const { parsers: htmlParsers } = require('prettier/parser-html');
const { parsers: typescriptParsers } = require('prettier/parser-typescript');

const { organize } = require('./lib/organize');

const organizeImports = (code, options) => {
	if (code.includes('// organize-imports-ignore') || code.includes('// tslint:disable:ordered-imports')) {
		return code;
	}

	const isRange =
		Boolean(options.originalText) ||
		options.rangeStart !== 0 ||
		(options.rangeEnd !== Infinity && options.rangeEnd !== code.length);

	if (isRange) {
		return code;
	}

	try {
		return organize(code, options);
	} catch (error) {
		if (process.env.DEBUG) {
			console.error(error);
		}
		return code;
	}
};

const withOrganizeImportsProcess = (parser) => {
	return {
		...parser,
		preprocess: (code, options) => {
			const preprocessed = parser.preprocess ? parser.preprocess(code, options) : code;
			return organizeImports(preprocessed, options);
		}
	};
};

module.exports = {
	options: {},
	parsers: {
		babel: withOrganizeImportsProcess(babelParsers.babel),
		'babel-ts': withOrganizeImportsProcess(babelParsers['babel-ts']),
		typescript: withOrganizeImportsProcess(typescriptParsers.typescript),
		vue: withOrganizeImportsProcess(htmlParsers.vue),
	},
};
