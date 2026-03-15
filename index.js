import escapeStringRegexp from 'escape-string-regexp';
import transliterate from '@sindresorhus/transliterate';
import builtinOverridableReplacements from './overridable-replacements.js';

/**
 * Converts camelCase and PascalCase strings to separate words.
 * Handles various capitalization patterns including acronyms and numbers.
 * @param {string} string - The camelCase string to decamelize
 * @returns {string} The string with words separated by spaces
 * @example
 * // Returns "foo Bar"
 * decamelize('fooBar')
 * 
 * // Returns "API Section"
 * decamelize('APISection')
 * 
 * // Returns "foo 360 BAR"
 * decamelize('foo360BAR')
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
 * Removes redundant separators from a string, collapsing multiple consecutive
 * separators into single ones and removing leading/trailing separators.
 * @param {string} string - The string to clean up
 * @param {string} separator - The separator character to normalize
 * @returns {string} The string with normalized separators
 * @example
 * // Returns "foo-bar-baz"
 * removeMootSeparators('--foo--bar--baz--', '-')
 * 
 * // Returns "hello_world"
 * removeMootSeparators('___hello___world___', '_')
 */
const removeMootSeparators = (string, separator) => {
	const escapedSeparator = escapeStringRegexp(separator);

	return string
		.replaceAll(new RegExp(`(?:${escapedSeparator}){2,}`, 'g'), separator)
		.replaceAll(new RegExp(`^(?:${escapedSeparator})|(?:${escapedSeparator})import escapeStringRegexp from 'escape-string-regexp';
import transliterate from '@sindresorhus/transliterate';
import builtinOverridableReplacements from './overridable-replacements.js';

/**
 * Converts camelCase and PascalCase strings to separate words.
 * Handles various capitalization patterns including acronyms and numbers.
 * @param {string} string - The camelCase string to decamelize
 * @returns {string} The string with words separated by spaces
 * @example
 * // Returns "foo Bar"
 * decamelize('fooBar')
 * 
 * // Returns "API Section"
 * decamelize('APISection')
 * 
 * // Returns "foo 360 BAR"
 * decamelize('foo360BAR')
 */
const decamelize = string => string
	// Separate capitalized words.
	.replaceAll(/([A-Z]{2,})(\d+)/g, '$1 $2')
	.replaceAll(/([a-z\d]+)([A-Z]{2,})/g, '$1 $2')

	.replaceAll(/([a-z\d])([A-Z])/g, '$1 $2')
	// `[a-rt-z]` matches all lowercase characters except `s`.
	// This avoids matching plural acronyms like `APIs`.
	.replaceAll(/([A-Z]+)([A-Z][a-rt-z\d]+)/g, '$1 $2');

, 'g'), '');
};

/**
 * Builds a regular expression pattern to match characters that should be
 * replaced with separators during slugification.
 * @param {Object} options - The slugify options object
 * @param {boolean} options.lowercase - Whether to preserve uppercase characters
 * @param {boolean} options.transliterate - Whether transliteration is enabled
 * @param {string[]} options.preserveCharacters - Characters to preserve in the slug
 * @param {string} options.separator - The separator character (cannot be preserved)
 * @returns {RegExp} A regular expression that matches unwanted characters
 * @throws {Error} When separator is included in preserveCharacters
 * @example
 * // Returns a regex that matches non-alphanumeric characters
 * buildPatternSlug({ lowercase: true, transliterate: true, preserveCharacters: [], separator: '-' })
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
 * removing special characters, and applying various formatting options.
 * @param {string} string - The string to slugify
 * @param {Object} [options={}] - Configuration options for slugification
 * @param {string} [options.separator='-'] - Character used to separate words
 * @param {boolean} [options.lowercase=true] - Convert the result to lowercase
 * @param {boolean} [options.decamelize=true] - Convert camelCase to separate words
 * @param {Array<[string, string]>} [options.customReplacements=[]] - Custom character replacements
 * @param {boolean} [options.preserveLeadingUnderscore=false] - Keep leading underscores
 * @param {boolean} [options.preserveTrailingDash=false] - Keep trailing dashes
 * @param {string[]} [options.preserveCharacters=[]] - Characters to preserve in output
 * @param {boolean} [options.transliterate=true] - Enable Unicode transliteration
 * @param {string} [options.locale] - Locale for language-specific transliteration
 * @returns {string} The slugified string
 * @throws {TypeError} When input is not a string
 * @throws {Error} When separator is included in preserveCharacters
 * @example
 * // Basic usage
 * slugify('Hello World!') // => 'hello-world'
 * 
 * // With custom separator
 * slugify('Foo Bar', { separator: '_' }) // => 'foo_bar'
 * 
 * // Preserve case
 * slugify('Hello World', { lowercase: false }) // => 'Hello-World'
 * 
 * // Custom replacements
 * slugify('AT&T', { customReplacements: [['&', ' and ']] }) // => 'at-and-t'
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
 * Creates a slugify function that automatically appends counters to duplicate slugs.
 * Useful for generating unique identifiers when processing multiple items that might
 * result in identical slugs.
 * @returns {Function & {reset: Function}} A slugify function with counter and reset method
 * @example
 * const slugify = slugifyWithCounter();
 * 
 * slugify('Hello World'); // => 'hello-world'
 * slugify('Hello World'); // => 'hello-world-2'
 * slugify('Hello World'); // => 'hello-world-3'
 * 
 * slugify.reset();
 * slugify('Hello World'); // => 'hello-world'
 */
export function slugifyWithCounter() {
	const occurrences = new Map();

	/**
	 * Slugifies a string and automatically appends a counter for duplicates.
	 * @param {string} string - The string to slugify
	 * @param {Object} [options] - Slugify options (same as main slugify function)
	 * @returns {string} The slugified string with counter if needed
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
	 * Resets the internal counter, allowing slugs to start fresh without numeric suffixes.
	 * @returns {void}
	 */
	countable.reset = () => {
		occurrences.clear();
	};

	return countable;
}
