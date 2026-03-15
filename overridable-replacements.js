/**
 * Default character replacements used during slugification.
 * These can be overridden by providing custom replacements with the same keys.
 * @type {Array<[string, string]>} Array of [character, replacement] pairs
 */
const overridableReplacements = [
	['&', ' and '],
	['🦄', ' unicorn '],
	['♥', ' love '],
];

export default overridableReplacements;
