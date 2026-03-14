import escapeStringRegexp from 'escape-string-regexp';
import transliterate from '@sindresorhus/transliterate';
import builtinOverridableReplacements from './overridable-replacements.js';

/**
 * Converts camelCase and PascalCase strings to space-separated words.
 * Handles various patterns like acronyms, numbers, and mixed case scenarios.
 * @param {string} string - The string to decamelize
 * @returns {string} The decamelized string with spaces separating words
 * @private
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
 * Removes redundant separators from a string.
 * Collapses multiple consecutive separators into single ones and removes leading/trailing separators.
 * @param {string} string - The string to clean up
 * @param {string} separator - The separator character to normalize
 * @returns {string} The string with normalized separators
 * @private
 */
const removeMootSeparators = (string, separator) => {
	const escapedSeparator = escapeStringRegexp(separator);

	return string
		.replaceAll(new RegExp(`(?:${escapedSeparator}){2,}`, 'g'), separator)
		.replaceAll(new RegExp(`^(?:${escapedSeparator})|(?:${escapedSeparator})$`, 'g'), '');
};

/**
 * Builds a regular expression pattern for matching characters to replace with separators.
 * The pattern excludes allowed characters based on the provided options.
 * @param {Object} options - Configuration options for building the pattern
 * @param {boolean} options.lowercase - Whether lowercase letters are allowed
 * @param {boolean} options.transliterate - Whether to include Unicode character classes
 * @param {string[]} options.preserveCharacters - Additional characters to preserve
 * @param {string} options.separator - The separator character (cannot be preserved)
 * @returns {RegExp} Regular expression for matching unwanted characters
 * @private
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
 * Handles transliteration, custom replacements, case conversion, and various formatting options.
 * @param {string} string - The input string to slugify
 * @param {Object} [options] - Configuration options
 * @param {string} [options.separator='-'] - Character to use as separator between words
 * @param {boolean} [options.lowercase=true] - Convert the result to lowercase
 * @param {boolean} [options.decamelize=true] - Convert camelCase to separate words
 * @param {Array<[string, string]>} [options.customReplacements=[]] - Custom character replacements
 * @param {boolean} [options.preserveLeadingUnderscore=false] - Keep leading underscore if present
 * @param {boolean} [options.preserveTrailingDash=false] - Keep trailing dash if present
 * @param {string[]} [options.preserveCharacters=[]] - Characters to preserve in the output
 * @param {string} [options.locale] - Locale for language-specific transliteration
 * @param {boolean} [options.transliterate=true] - Whether to transliterate Unicode characters to ASCII
 * @returns {string} The slugified string
 * @throws {TypeError} When the input is not a string
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
 * Creates a slugify function with a counter to handle duplicate strings.
 * Returns a function that appends numbers to duplicate slugs to ensure uniqueness.
 * @returns {Function & {reset: Function}} A slugify function with counter and reset method
 * @example
 * const slugify = slugifyWithCounter();
 * slugify('foo'); // 'foo'
 * slugify('foo'); // 'foo-2'
 * slugify.reset();
 * slugify('foo'); // 'foo'
 */
export function slugifyWithCounter() {
	const occurrences = new Map();

	/**
	 * Slugify function with counter for handling duplicates.
	 * @param {string} string - The string to slugify
	 * @param {Object} [options] - Same options as the main slugify function
	 * @returns {string} The slugified string with counter suffix if needed
	 */
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

	/**
	 * Resets the counter, clearing all stored occurrences.
	 * After calling reset, the counter starts fresh.
	 */
	countable.reset = () => {
		occurrences.clear();
	};

	return countable;
}
