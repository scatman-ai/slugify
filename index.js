import escapeStringRegexp from 'escape-string-regexp';
import transliterate from '@sindresorhus/transliterate';
import builtinOverridableReplacements from './overridable-replacements.js';

const decamelize = string => string
	// Separate capitalized words.
	.replaceAll(/([A-Z]{2,})(\d+)/g, '$1 $2')
	.replaceAll(/([a-z\d]+)([A-Z]{2,})/g, '$1 $2')

	.replaceAll(/([a-z\d])([A-Z])/g, '$1 $2')
	// `[a-rt-z]` matches all lowercase characters except `s`.
	// This avoids matching plural acronyms like `APIs`.
	.replaceAll(/([A-Z]+)([A-Z][a-rt-z\d]+)/g, '$1 $2');

const removeMootSeparators = (string, separator) => {
	const escapedSeparator = escapeStringRegexp(separator);

	return string
		.replaceAll(new RegExp(`(?:${escapedSeparator}){2,}`, 'g'), separator)
		.replaceAll(new RegExp(`^(?:${escapedSeparator})|(?:${escapedSeparator})$`, 'g'), '');
};

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
 * Slugify a string.
 * 
 * Transforms a string into a URL-safe slug by removing or replacing special characters,
 * handling Unicode transliteration, and applying various formatting options.
 * 
 * @param {string} string - The input string to slugify
 * @param {Object} [options] - Configuration options
 * @param {string} [options.separator='-'] - Character(s) to use as separator between words
 * @param {boolean} [options.lowercase=true] - Convert the result to lowercase
 * @param {boolean} [options.decamelize=true] - Convert camelCase to separate words (fooBar → foo bar)
 * @param {Array<[string, string]>} [options.customReplacements=[]] - Custom character/string replacements to apply before other transformations
 * @param {boolean} [options.preserveLeadingUnderscore=false] - Keep leading underscore in the result
 * @param {boolean} [options.preserveTrailingDash=false] - Keep trailing dash in the result
 * @param {string[]} [options.preserveCharacters=[]] - Array of characters to preserve in the output (cannot include separator)
 * @param {string} [options.locale] - Locale for language-specific transliteration and case conversion
 * @param {boolean} [options.transliterate=true] - Whether to transliterate Unicode characters to ASCII
 * 
 * @returns {string} The slugified string
 * 
 * @throws {TypeError} If the input is not a string
 * @throws {Error} If separator is included in preserveCharacters array
 * 
 * @example
 * // Basic usage
 * slugify('I ♥ Dogs');
 * //=> 'i-love-dogs'
 * 
 * @example
 * // Custom separator
 * slugify('foo bar', {separator: '_'});
 * //=> 'foo_bar'
 * 
 * @example
 * // Preserve case
 * slugify('Hello World', {lowercase: false});
 * //=> 'Hello-World'
 * 
 * @example
 * // Custom replacements
 * slugify('foo@bar', {customReplacements: [['@', ' at ']]});
 * //=> 'foo-at-bar'
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
 * Creates a slugify function with a built-in counter to handle duplicate slugs.
 * 
 * Returns a new slugify function that automatically appends numbers to duplicate slugs.
 * The returned function also has a `reset()` method to clear the counter.
 * 
 * @returns {Function & {reset: Function}} A slugify function with counter and reset method
 * 
 * @example
 * const slugify = slugifyWithCounter();
 * 
 * slugify('foo bar');
 * //=> 'foo-bar'
 * 
 * slugify('foo bar');
 * //=> 'foo-bar-2'
 * 
 * slugify.reset();
 * 
 * slugify('foo bar');
 * //=> 'foo-bar'
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
