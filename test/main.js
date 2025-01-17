const { getMacro, prettify } = require('./_utils');
const test = require('ava').default;

const macros = ['typescript', 'babel', 'babel-ts'].map((parser) => getMacro(parser));

for (const macro of macros) {
	test(
		'removes partially unused imports',
		macro,
		`import { useEffect, useState } from "react";

		const Component = () => {
			useEffect(() => {}, []);
			return null;
		};`,
		'import { useEffect } from "react";',
	);

	test(
		'removes completely unused imports',
		macro,
		`import { useState } from "react";

		const Component = () => {
			return null;
		};`,
		'const Component = () => {',
		{ transformer: (res) => res.split('\n')[0] }
	);
}

test('skips when formatting a range', async (t) => {
	const code = 'import { useState } from "react";';
	const formattedCode = await prettify(code, { rangeEnd: 10 });
	t.is(formattedCode, code);
});
