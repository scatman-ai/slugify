import escapeStringRegexp from 'escape-string-regexp';
import transliterate from '@sindresorhus/transliterate';
import builtinOverridableReplacements from './overridable-replacements.js';

/**
 * Converts camelCase and PascalCase strings to separate words.
 * Handles various capitalization patterns including consecutive capitals,
 * numbers, and acronyms.
 * @param {string} string - The string to decamelize
 * @returns {string} The decamelized string with spaces separating words
 */
const decamelize = string => string
	// Separate capitalized words.
	.replaceAll(/([A-Z]{2,})(\d+)/g, '$1 $2')
	.replaceAll(/([a-z\d]+)([A-Z]{2,})/g, '$1 $2')

	.replaceAll(/([a-z\d])([A-Z])/g, '$1 $2')
	// `[a-rt-z]` matches all lowercase characters except `s`.
	// This avoids matching plural acronyms like `APIs`.
	.replaceAll(/([A-Z]+)([A-Z][a-rt-z\d]+)/g, '$1 $2');

/**
 * Removes redundant separators from a string, including multiple consecutive
 * separators and leading/trailing separators.
 * @param {string} string - The string to clean up
 * @param {string} separator - The separator character to normalize
 * @returns {string} The string with normalized separators
 */
const removeMootSeparators = (string, separator) => {
	const escapedSeparator = escapeStringRegexp(separator);

	return string
		.replaceAll(new RegExp(`(?:${escapedSeparator}){2,}`, 'g'), separator)
		.replaceAll(new RegExp(`^(?:${escapedSeparator})|(?:${escapedSeparator})$`, 'g'), '');
};

/**
 * Builds a regular expression pattern for matching characters to replace
 * with separators during slugification.
 * @param {object} options - The slugify options object
 * @param {boolean} options.lowercase - Whether to include uppercase letters
 * @param {boolean} options.transliterate - Whether to use Unicode-aware pattern
 * @param {string[]} options.preserveCharacters - Characters to preserve
 * @param {string} options.separator - The separator character
 * @returns {RegExp} Regular expression for matching non-slug characters
 */
const buildPatternSlug = options => {
	let negationSetPattern = String.raw`a-z\d`;
	negationSetPattern += options.lowercase ? '' : 'A-Z';

	// When transliteration is disabled, preserve Unicode characters
	if (options.transliterate === false) {
		negationSetPattern += String.raw`\p{L}\p{N}`;
	}

	if (options.preserveCharacters.length > 0) {
		for (const character of options.preserveCharacters) {
			if (character === options.separator) {
				throw new Error(`The separator character \`${options.separator}\` cannot be included in preserved characters: ${options.preserveCharacters}`);
			}

			negationSetPattern += escapeStringRegexp(character);
		}
	}

	const flags = options.transliterate ? 'g' : 'gu';
	return new RegExp(`[^${negationSetPattern}]+`, flags);
};

/**
 * Slugify a string by converting it to a URL-safe format.
 * Handles transliteration, custom replacements, case conversion,
 * and various formatting options.
 * @param {string} string - The string to slugify
 * @param {object} [options={}] - Configuration options
 * @param {string} [options.separator='-'] - Character to use as separator
 * @param {boolean} [options.lowercase=true] - Convert to lowercase
 * @param {boolean} [options.decamelize=true] - Convert camelCase to separate words
 * @param {Array<[string, string]>} [options.customReplacements=[]] - Custom character replacements
 * @param {boolean} [options.preserveLeadingUnderscore=false] - Keep leading underscore
 * @param {boolean} [options.preserveTrailingDash=false] - Keep trailing dash
 * @param {string[]} [options.preserveCharacters=[]] - Characters to preserve in output
 * @param {string} [options.locale] - Locale for transliteration and case conversion
 * @param {boolean} [options.transliterate=true] - Whether to transliterate Unicode to ASCII
 * @returns {string} The slugified string
 * @throws {TypeError} When input is not a string
 */
export default function slugify(string, options) {
	if (typeof string !== 'string') {
		throw new TypeError(`Expected a string, got \`${typeof string}\``);
	}

	options = {
		separator: '-',
		lowercase: true,
		decamelize: true,
		customReplacements: [],
		preserveLeadingUnderscore: false,
		preserveTrailingDash: false,
		preserveCharacters: [],
		transliterate: true,
		...options,
	};

	const shouldPrependUnderscore = options.preserveLeadingUnderscore && string.startsWith('_');
	const shouldAppendDash = options.preserveTrailingDash && string.endsWith('-');

	if (options.transliterate) {
		const customReplacements = new Map([
			...builtinOverridableReplacements,
			...options.customReplacements,
		]);

		string = transliterate(string, {customReplacements, locale: options.locale});
	} else if (options.customReplacements.length > 0) {
		// Apply custom replacements even when transliteration is disabled
		for (const [key, value] of options.customReplacements) {
			string = string.replaceAll(key, value);
		}
	}

	if (options.decamelize) {
		string = decamelize(string);
	}

	const patternSlug = buildPatternSlug(options);

	if (options.lowercase) {
		string = options.locale ? string.toLocaleLowerCase(options.locale) : string.toLowerCase();
	}

	// Detect contractions/possessives by looking for any word followed by a `'t` or `'s`
	// in isolation and then remove it. Handles both straight and curly apostrophes.
	string = string.replaceAll(/([a-zA-Z\d]+)['\u2019]([ts])(\s|$)/g, '$1$2$3');

	string = string.replace(patternSlug, options.separator);
	string = string.replaceAll('\\', '');

	if (options.separator) {
		string = removeMootSeparators(string, options.separator);
	}

	if (shouldPrependUnderscore) {
		string = `_${string}`;
	}

	if (shouldAppendDash) {
		string = `${string}-`;
	}

	return string;
}

/**
 * Creates a slugify function with built-in counter to handle duplicate slugs.
 * The returned function maintains an internal counter and appends numbers
 * to duplicate slugs (e.g., 'foo', 'foo-2', 'foo-3').
 * @returns {object} Object with slugify function and reset method
 * @returns {Function} countable - Slugify function with counter
 * @returns {Function} countable.reset - Method to reset the counter
 */
export function slugifyWithCounter() {
	const occurrences = new Map();

	const countable = (string, options) => {
		string = slugify(string, options);

		if (!string) {
			return '';
		}

		const stringLower = string.toLowerCase();
		const numberless = occurrences.get(stringLower.replace(/(?:-\d+?)+?$/, '')) || 0;
		const counter = occurrences.get(stringLower);
		occurrences.set(stringLower, typeof counter === 'number' ? counter + 1 : 1);
		const newCounter = occurrences.get(stringLower) || 2;
		if (newCounter >= 2 || numberless > 2) {
			string = `${string}-${newCounter}`;
		}

		return string;
	};

	countable.reset = () => {
		occurrences.clear();
	};

	return countable;
}
