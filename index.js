import escapeStringRegexp from 'escape-string-regexp';
import transliterate from '@sindresorhus/transliterate';
import builtinOverridableReplacements from './overridable-replacements.js';

/**
 * Converts camelCase and PascalCase strings to space-separated words.
 * Handles various patterns including consecutive capitals, numbers, and acronyms.
 * 
 * @param {string} string - The string to decamelize
 * @returns {string} The decamelized string with spaces between words
 * 
 * @example
 * decamelize('fooBar') // => 'foo Bar'
 * decamelize('XMLHttpRequest') // => 'XML Http Request'
 * decamelize('APIs') // => 'APIs' (preserves plural acronyms)
 * decamelize('foo360BAR') // => 'foo 360 BAR'
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
 * Removes redundant separators from a string by collapsing consecutive
 * separators into single ones and trimming separators from start/end.
 * 
 * @param {string} string - The string to clean up
 * @param {string} separator - The separator character(s) to normalize
 * @returns {string} String with normalized separators
 * 
 * @example
 * removeMootSeparators('foo---bar', '-') // => 'foo-bar'
 * removeMootSeparators('-foo-bar-', '-') // => 'foo-bar'
 * removeMootSeparators('a____b', '__') // => 'a__b'
 */
const removeMootSeparators = (string, separator) => {
	const escapedSeparator = escapeStringRegexp(separator);

	return string
		.replaceAll(new RegExp(`(?:${escapedSeparator}){2,}`, 'g'), separator)
		.replaceAll(new RegExp(`^(?:${escapedSeparator})|(?:${escapedSeparator})import escapeStringRegexp from 'escape-string-regexp';
import transliterate from '@sindresorhus/transliterate';
import builtinOverridableReplacements from './overridable-replacements.js';

/**
 * Converts camelCase and PascalCase strings to space-separated words.
 * Handles various patterns including consecutive capitals, numbers, and acronyms.
 * 
 * @param {string} string - The string to decamelize
 * @returns {string} The decamelized string with spaces between words
 * 
 * @example
 * decamelize('fooBar') // => 'foo Bar'
 * decamelize('XMLHttpRequest') // => 'XML Http Request'
 * decamelize('APIs') // => 'APIs' (preserves plural acronyms)
 * decamelize('foo360BAR') // => 'foo 360 BAR'
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
 * replaced with separators during slugification. Creates a negation set
 * that preserves allowed characters and matches everything else for removal.
 * 
 * @param {Object} options - Slugify options object
 * @param {boolean} options.lowercase - Whether to preserve uppercase letters
 * @param {boolean} options.transliterate - Whether transliteration is enabled
 * @param {string[]} options.preserveCharacters - Characters to preserve in output
 * @param {string} options.separator - The separator character (validates against preserveCharacters)
 * @returns {RegExp} Regular expression to match characters to replace
 * @throws {Error} When separator is included in preserveCharacters
 * 
 * @example
 * // Basic pattern for lowercase ASCII + digits
 * buildPatternSlug({lowercase: true, transliterate: true, preserveCharacters: [], separator: '-'})
 * // => /[^a-z\d]+/g
 * 
 * // Pattern preserving uppercase and Unicode when transliteration disabled
 * buildPatternSlug({lowercase: false, transliterate: false, preserveCharacters: ['#'], separator: '-'})
 * // => /[^a-zA-Z\d\p{L}\p{N}#]+/gu
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
