/**
 * Find the first quote mark (either " or ') starting backwards from the cursor position.
 *
 * This will help identify the attribute value being edited when inside
 * a template expression. Especially when multiple attributes are on the
 * same line.
 *
 * @param  {string} text           The text to search within.
 * @param  {number} cursorPosition The position of the cursor.
 * @return {number}                The position of the found quote mark, or -1 if not found.
 */
const findQuoteBackwards = function (text: string, cursorPosition: number): number {
	const quoteMarks = new Set(['"', '\'']);
	const shortCircuitMarks = new Set(['<', '>', '\n']);

	// Search backwards from the cursor position
	for (let index = cursorPosition - 1; index >= 0; index--) {
		const char = text[index];
		if (quoteMarks.has(char)) {
			return index;
		}

		// stop at certain characters that would indicate we've gone too far
		if (shortCircuitMarks.has(char)) {
			break;
		}
	}

	 // Not found
	return -1;
};

export { findQuoteBackwards };