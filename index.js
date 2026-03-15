import escapeStringRegexp from 'escape-string-regexp';
import transliterate from '@sindresorhus/transliterate';
import builtinOverridableReplacements from './overridable-replacements.js';

/**
 * Converts camelCase strings to space-separated words.
 * @param {string} string - The string to decamelize
 * @returns {string} The decamelized string with spaces between words
 * @example
 * decamelize('fooBar') // 'foo Bar'
 * decamelize('XMLHttpRequest') // 'XML Http Request'
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
 * Removes redundant separators from the beginning, end, and consecutive occurrences.
 * @param {string} string - The string to clean up
 * @param {string} separator - The separator character to normalize
 * @returns {string} The string with normalized separators
 * @example
 * removeMootSeparators('--foo--bar--', '-') // 'foo-bar'
 * removeMootSeparators('__hello___world__', '_') // 'hello_world'
 */
const removeMootSeparators = (string, separator) => {
	const escapedSeparator = escapeStringRegexp(separator);

	return string
		.replaceAll(new RegExp(`(?:${escapedSeparator}){2,}`, 'g'), separator)
		.replaceAll(new RegExp(`^(?:${escapedSeparator})|(?:${escapedSeparator})$`, 'g'), '');
};

/**
 * Builds a regular expression pattern to match characters that should be replaced with separators.
 * @param {Object} options - The slugify options object
 * @param {boolean} options.lowercase - Whether to include uppercase letters in preserved characters
 * @param {boolean} options.transliterate - Whether Unicode characters should be preserved
 * @param {string[]} options.preserveCharacters - Additional characters to preserve
 * @param {string} options.separator - The separator character (cannot be preserved)
 * @returns {RegExp} Regular expression to match characters to be replaced
 * @throws {Error} When separator is included in preserveCharacters
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
 * Converts a string into a URL-friendly slug by transliterating Unicode characters,
 * removing special characters, and joining words with separators.
 * 
 * @param {string} string - The string to slugify
 * @param {Object} [options] - Configuration options
 * @param {string} [options.separator='-'] - Character(s) to use as word separator
 * @param {boolean} [options.lowercase=true] - Convert to lowercase
 * @param {boolean} [options.decamelize=true] - Convert camelCase to separate words
 * @param {Array<[string, string]>} [options.customReplacements=[]] - Custom character replacements
 * @param {boolean} [options.preserveLeadingUnderscore=false] - Keep leading underscore if present
 * @param {boolean} [options.preserveTrailingDash=false] - Keep trailing dash if present
 * @param {string[]} [options.preserveCharacters=[]] - Characters to preserve in output
 * @param {string} [options.locale] - Locale for language-specific transliteration
 * @param {boolean} [options.transliterate=true] - Whether to transliterate Unicode to ASCII
 * @returns {string} The slugified string
 * @throws {TypeError} When input is not a string
 * @throws {Error} When separator is included in preserveCharacters
 * 
 * @example
 * slugify('Hello World!') // 'hello-world'
 * slugify('Foo & Bar', {separator: '_'}) // 'foo_and_bar'
 * slugify('Déjà Vu', {transliterate: false}) // 'déjà-vu'
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
 * Creates a slugify function with an internal counter to handle duplicate slugs.
 * Each subsequent call with the same resulting slug will append an incremented number.
 * 
 * @returns {CountableSlugify} A slugify function with counter and reset method
 * 
 * @example
 * const slugify = slugifyWithCounter();
 * slugify('foo bar') // 'foo-bar'
 * slugify('foo bar') // 'foo-bar-2'
 * slugify('foo bar') // 'foo-bar-3'
 * 
 * slugify.reset();
 * slugify('foo bar') // 'foo-bar'
 */
export function slugifyWithCounter() {
	const occurrences = new Map();

	/**
	 * Slugifies a string with automatic counter suffixing for duplicates.
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
	 * Resets the internal counter, clearing all slug occurrence tracking.
	 * @returns {void}
	 */
	countable.reset = () => {
		occurrences.clear();
	};

	return countable;
}
