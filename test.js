import test from 'ava';
import slugify, {slugifyWithCounter} from './index.js';

test('main', t => {
	t.is(slugify('Foo Bar'), 'foo-bar');
	t.is(slugify('foo bar baz'), 'foo-bar-baz');
	t.is(slugify('foo bar '), 'foo-bar');
	t.is(slugify('       foo bar'), 'foo-bar');
	t.is(slugify('[foo] [bar]'), 'foo-bar');
	t.is(slugify('Foo ÿ'), 'foo-y');
	t.is(slugify('FooBar'), 'foo-bar');
	t.is(slugify('fooBar'), 'foo-bar');
	t.is(slugify('UNICORNS AND RAINBOWS'), 'unicorns-and-rainbows');
	t.is(slugify('Foo & Bar'), 'foo-and-bar');
	t.is(slugify('Foo & Bar'), 'foo-and-bar');
	t.is(slugify('Hællæ, hva skjera?'), 'haellae-hva-skjera');
	t.is(slugify('Foo Bar2'), 'foo-bar2');
	t.is(slugify('I ♥ Dogs'), 'i-love-dogs');
	t.is(slugify('Déjà Vu!'), 'deja-vu');
	t.is(slugify('fooBar 123 $#%'), 'foo-bar-123');
	t.is(slugify('foo🦄'), 'foo-unicorn');
	t.is(slugify('🦄🦄🦄'), 'unicorn-unicorn-unicorn');
	t.is(slugify('foo&bar'), 'foo-and-bar');
	t.is(slugify('foo360BAR'), 'foo360-bar');
	t.is(slugify('FOO360'), 'foo-360');
	t.is(slugify('FOOBar'), 'foo-bar');
	t.is(slugify('APIs'), 'apis');
	t.is(slugify('APISection'), 'api-section');
	t.is(slugify('Util APIs'), 'util-apis');
});

test('possessives and contractions', t => {
	// Straight apostrophes
	t.is(slugify('Conway\'s Law'), 'conways-law');
	t.is(slugify('Conway\'s'), 'conways');
	t.is(slugify('Don\'t Repeat Yourself'), 'dont-repeat-yourself');
	t.is(slugify('my parents\' rules'), 'my-parents-rules');
	t.is(slugify('it-s-hould-not-modify-t-his'), 'it-s-hould-not-modify-t-his');

	// Curly/smart apostrophes
	t.is(slugify('Sindre\u2019s app'), 'sindres-app');
	t.is(slugify('can\u2019t stop'), 'cant-stop');
	t.is(slugify('won\u2019t work'), 'wont-work');
});

test('custom separator', t => {
	t.is(slugify('foo bar', {separator: '_'}), 'foo_bar');
	t.is(slugify('aaa bbb', {separator: ''}), 'aaabbb');
	t.is(slugify('BAR&baz', {separator: '_'}), 'bar_and_baz');
	t.is(slugify('Déjà Vu!', {separator: '-'}), 'deja-vu');
	t.is(slugify('UNICORNS AND RAINBOWS!', {separator: '@'}), 'unicorns@and@rainbows');
	t.is(slugify('[foo] [bar]', {separator: '.'}), 'foo.bar', 'escape regexp special characters');

	// Test multi-character separator collapse
	t.is(slugify('a   b   c', {separator: '__'}), 'a__b__c');
	t.is(slugify('a____b', {separator: '__'}), 'a__b');
	t.is(slugify('__a__b__', {separator: '__'}), 'a__b');
	t.is(slugify('foo---bar', {separator: '---'}), 'foo---bar');
});

test('custom replacements', t => {
	t.is(slugify('foo | bar', {
		customReplacements: [
			['|', ' or '],
		],
	}), 'foo-or-bar');

	t.is(slugify('10 | 20 %', {
		customReplacements: [
			['|', ' or '],
			['%', ' percent '],
		],
	}), '10-or-20-percent');

	t.is(slugify('I ♥ 🦄', {
		customReplacements: [
			['♥', ' amour '],
			['🦄', ' licorne '],
		],
	}), 'i-amour-licorne');

	t.is(slugify('x.y.z', {
		customReplacements: [
			['.', ''],
		],
	}), 'xyz');

	t.is(slugify('Zürich', {
		customReplacements: [
			['ä', 'ae'],
			['ö', 'oe'],
			['ü', 'ue'],
			['ß', 'ss'],
		],
	}), 'zuerich');
});

test('lowercase option', t => {
	t.is(slugify('foo bar', {lowercase: false}), 'foo-bar');
	t.is(slugify('BAR&baz', {lowercase: false}), 'BAR-and-baz');
	t.is(slugify('Déjà Vu!', {separator: '_', lowercase: false}), 'Deja_Vu');
	t.is(slugify('UNICORNS AND RAINBOWS!', {separator: '@', lowercase: false}), 'UNICORNS@AND@RAINBOWS');
	t.is(slugify('[foo] [bar]', {separator: '.', lowercase: false}), 'foo.bar', 'escape regexp special characters');
	t.is(slugify('Foo🦄', {lowercase: false}), 'Foo-unicorn');
});

test('decamelize option', t => {
	t.is(slugify('fooBar'), 'foo-bar');
	t.is(slugify('fooBar', {decamelize: false}), 'foobar');
});

test('supports German umlauts', t => {
	t.is(slugify('ä ö ü Ä Ö Ü ß', {lowercase: false, separator: ' '}), 'ae oe ue Ae Oe Ue ss');
});

test('supports Vietnamese', t => {
	t.is(slugify('ố Ừ Đ', {lowercase: false, separator: ' '}), 'o U D');
});

test('supports Arabic', t => {
	t.is(slugify('ث س و', {lowercase: false, separator: ' '}), 'th s w');
});

test('supports Persian / Farsi', t => {
	t.is(slugify('چ ی پ', {lowercase: false, separator: ' '}), 'ch y p');
});

test('supports Urdu', t => {
	t.is(slugify('ٹ ڈ ھ', {lowercase: false, separator: ' '}), 't d h');
});

test('supports Pashto', t => {
	t.is(slugify('ګ ړ څ', {lowercase: false, separator: ' '}), 'g r c');
});

test('supports Russian', t => {
	t.is(slugify('Ж п ю', {lowercase: false, separator: ' '}), 'Zh p yu');
});

test('supports Romanian', t => {
	t.is(slugify('ș Ț', {lowercase: false, separator: ' '}), 's T');
});

test('supports Turkish', t => {
	t.is(slugify('İ ı Ş ş Ç ç Ğ ğ', {lowercase: false, separator: ' '}), 'I i S s C c G g');
});

test('supports Armenian', t => {
	t.is(slugify('Ե ր ե ւ ա ն', {lowercase: false, separator: ' '}), 'Ye r ye a n');
});

test('leading underscore', t => {
	t.is(slugify('_foo bar', {preserveLeadingUnderscore: true}), '_foo-bar');
	t.is(slugify('_foo_bar', {preserveLeadingUnderscore: true}), '_foo-bar');
	t.is(slugify('__foo__bar', {preserveLeadingUnderscore: true}), '_foo-bar');
	t.is(slugify('____-___foo__bar', {preserveLeadingUnderscore: true}), '_foo-bar');
});

test('trailing dash', t => {
	t.is(slugify('foo bar-', {preserveTrailingDash: true}), 'foo-bar-');
	t.is(slugify('foo-bar--', {preserveTrailingDash: true}), 'foo-bar-');
	t.is(slugify('foo-bar -', {preserveTrailingDash: true}), 'foo-bar-');
	t.is(slugify('foo-bar - ', {preserveTrailingDash: true}), 'foo-bar');
	t.is(slugify('foo-bar ', {preserveTrailingDash: true}), 'foo-bar');
});

test('counter', t => {
	const slugify = slugifyWithCounter();
	t.is(slugify('foo bar'), 'foo-bar');
	t.is(slugify('foo bar'), 'foo-bar-2');

	slugify.reset();

	t.is(slugify('foo'), 'foo');
	t.is(slugify('foo'), 'foo-2');
	t.is(slugify('foo 1'), 'foo-1');
	t.is(slugify('foo-1'), 'foo-1-2');
	t.is(slugify('foo-1'), 'foo-1-3');
	t.is(slugify('foo'), 'foo-3');
	t.is(slugify('foo'), 'foo-4');
	t.is(slugify('foo-1'), 'foo-1-4');
	t.is(slugify('foo-2'), 'foo-2-1');
	t.is(slugify('foo-2'), 'foo-2-2');
	t.is(slugify('foo-2-1'), 'foo-2-1-1');
	t.is(slugify('foo-2-1'), 'foo-2-1-2');
	t.is(slugify('foo-11'), 'foo-11-1');
	t.is(slugify('foo-111'), 'foo-111-1');
	t.is(slugify('foo-111-1'), 'foo-111-1-1');
	t.is(slugify('fooCamelCase', {lowercase: false, decamelize: false}), 'fooCamelCase');
	t.is(slugify('fooCamelCase', {decamelize: false}), 'foocamelcase-2');
	t.is(slugify('_foo'), 'foo-5');
	t.is(slugify('_foo', {preserveLeadingUnderscore: true}), '_foo');
	t.is(slugify('_foo', {preserveLeadingUnderscore: true}), '_foo-2');

	const slugify2 = slugifyWithCounter();
	t.is(slugify2('foo'), 'foo');
	t.is(slugify2('foo'), 'foo-2');

	t.is(slugify2(''), '');
	t.is(slugify2(''), '');
});

test('preserve characters', t => {
	t.is(slugify('foo#bar', {preserveCharacters: []}), 'foo-bar');
	t.is(slugify('foo.bar', {preserveCharacters: []}), 'foo-bar');
	t.is(slugify('foo?bar ', {preserveCharacters: ['#']}), 'foo-bar');
	t.is(slugify('foo#bar', {preserveCharacters: ['#']}), 'foo#bar');
	t.is(slugify('foo_bar#baz', {preserveCharacters: ['#']}), 'foo-bar#baz');
	t.is(slugify('foo.bar#baz-quux', {preserveCharacters: ['.', '#']}), 'foo.bar#baz-quux');
	t.is(slugify('foo.bar#baz-quux', {separator: '.', preserveCharacters: ['-']}), 'foo.bar.baz-quux');
	t.throws(() => {
		slugify('foo', {separator: '-', preserveCharacters: ['-']});
	});
	t.throws(() => {
		slugify('foo', {separator: '.', preserveCharacters: ['.']});
	});
});

test('locale option', t => {
	// Locale-specific transliteration
	t.is(slugify('Räksmörgås'), 'raeksmoergas');
	t.is(slugify('Räksmörgås', {locale: 'sv'}), 'raksmorgas');
	t.is(slugify('Räksmörgås', {locale: 'de'}), 'raeksmoergas');
	t.is(slugify('Fön', {locale: 'de'}), 'foen');
	t.is(slugify('Fön', {locale: 'sv'}), 'fon');

	// Locale-specific lowercasing demonstrates locale awareness
	// Note: Some locales may have complex behavior with transliteration
	t.is(slugify('TEST', {locale: 'tr'}), 'test'); // Basic test
	t.is(slugify('TEST'), 'test'); // Default behavior same for basic ASCII
});

test('transliterate option disabled', t => {
	// Test what happens when transliteration is disabled
	// ASCII characters work normally
	t.is(slugify('foo bar', {transliterate: false}), 'foo-bar');
	t.is(slugify('hello world', {transliterate: false}), 'hello-world');

	// Non-ASCII characters are preserved instead of transliterated
	t.is(slugify('Déjà Vu', {transliterate: false}), 'déjà-vu');
	t.is(slugify('Räksmörgås', {transliterate: false}), 'räksmörgås');
	t.is(slugify('你好世界', {transliterate: false}), '你好世界');
	t.is(slugify('مرحبا', {transliterate: false}), 'مرحبا');

	// Custom replacements should still work when transliterate is disabled
	t.is(slugify('foo & bar', {transliterate: false, customReplacements: [['&', ' and ']]}), 'foo-and-bar');

	// Built-in replacements (like & -> and) are disabled when transliterate is false
	t.is(slugify('foo & bar', {transliterate: false}), 'foo-bar');

	// Mixed ASCII and non-ASCII
	t.is(slugify('Hello Déjà Vu', {transliterate: false}), 'hello-déjà-vu');

	// Ensure transliterate: true still works normally (default behavior)
	t.is(slugify('Déjà Vu'), 'deja-vu');
	t.is(slugify('foo & bar'), 'foo-and-bar');
});

test('edge cases - empty and whitespace strings', t => {
	t.is(slugify(''), '');
	t.is(slugify(' '), '');
	t.is(slugify('   '), '');
	t.is(slugify('\t\n\r'), '');
	t.is(slugify('\u00A0'), ''); // Non-breaking space
	t.is(slugify('\u2000\u2001\u2002'), ''); // Various Unicode spaces
});

test('edge cases - consecutive separators and special characters', t => {
	t.is(slugify('foo---bar'), 'foo-bar');
	t.is(slugify('foo___bar'), 'foo-bar');
	t.is(slugify('foo   bar'), 'foo-bar');
	t.is(slugify('foo!!!bar'), 'foo-bar');
	t.is(slugify('foo@@@bar'), 'foo-bar');
	t.is(slugify('foo###bar'), 'foo-bar');
	t.is(slugify('foo$$bar'), 'foo-bar');
	t.is(slugify('foo%%%bar'), 'foo-bar');
	t.is(slugify('foo^^^bar'), 'foo-bar');
	t.is(slugify('foo***bar'), 'foo-bar');
	t.is(slugify('foo...bar'), 'foo-bar');
	t.is(slugify('foo,,,bar'), 'foo-bar');
	t.is(slugify('foo;;;bar'), 'foo-bar');
	t.is(slugify('foo:::bar'), 'foo-bar');
	t.is(slugify('foo???bar'), 'foo-bar');
	t.is(slugify('foo///bar'), 'foo-bar');
	t.is(slugify('foo\\\\bar'), 'foo-bar');
	t.is(slugify('foo|||bar'), 'foo-bar');
	t.is(slugify('foo+++bar'), 'foo-bar');
	t.is(slugify('foo===bar'), 'foo-bar');
	t.is(slugify('foo~~~bar'), 'foo-bar');
	t.is(slugify('foo```bar'), 'foo-bar');
});

test('edge cases - mixed consecutive separators', t => {
	t.is(slugify('foo-_-bar'), 'foo-bar');
	t.is(slugify('foo _- bar'), 'foo-bar');
	t.is(slugify('foo!@#$%bar'), 'foo-bar');
	t.is(slugify('foo^&*()bar'), 'foo-bar');
	t.is(slugify('foo[]{}bar'), 'foo-bar');
	t.is(slugify('foo<>bar'), 'foo-bar');
	t.is(slugify('foo"\'\'"bar'), 'foo-bar');
});

test('edge cases - unicode characters and emoji', t => {
	// Extended Unicode characters
	t.is(slugify('🌟✨⭐'), 'star-sparkles-star');
	t.is(slugify('🚀🛸🌌'), 'rocket-flying-saucer-milky-way');
	t.is(slugify('💻📱⌨️'), 'laptop-computer-mobile-phone-keyboard');
	t.is(slugify('🎵🎶🎼'), 'musical-note-musical-notes-musical-score');
	t.is(slugify('🔥💧⚡'), 'fire-droplet-high-voltage');
	
	// Mixed emoji and text
	t.is(slugify('Hello 👋 World 🌍'), 'hello-waving-hand-world-globe-showing-europe-africa');
	t.is(slugify('Coffee ☕ Time ⏰'), 'coffee-hot-beverage-time-alarm-clock');
	t.is(slugify('I ❤️ JavaScript'), 'i-red-heart-javascript');
	
	// Unicode symbols and mathematical operators
	t.is(slugify('α + β = γ'), 'alpha-beta-gamma');
	t.is(slugify('∑ ∏ ∫'), 'summation-product-integral');
	t.is(slugify('≤ ≥ ≠'), 'less-than-or-equal-to-greater-than-or-equal-to-not-equal-to');
	t.is(slugify('∞ ∅ ∆'), 'infinity-empty-set-increment');
	
	// Various Unicode blocks
	t.is(slugify('→ ← ↑ ↓'), 'rightwards-arrow-leftwards-arrow-upwards-arrow-downwards-arrow');
	t.is(slugify('★ ☆ ♠ ♥ ♦ ♣'), 'black-star-white-star-black-spade-suit-black-heart-suit-black-diamond-suit-black-club-suit');
	t.is(slugify('© ® ™'), 'copyright-sign-registered-sign-trade-mark-sign');
});

test('edge cases - unicode with transliterate disabled', t => {
	// Emoji should be stripped when transliterate is false
	t.is(slugify('Hello 👋 World', {transliterate: false}), 'hello-world');
	t.is(slugify('🌟✨⭐', {transliterate: false}), '');
	t.is(slugify('Test 🔥 Content', {transliterate: false}), 'test-content');
	
	// Unicode letters should be preserved
	t.is(slugify('Déjà Vu 🚀', {transliterate: false}), 'déjà-vu');
	t.is(slugify('Café ☕ Shop', {transliterate: false}), 'café-shop');
});

test('edge cases - leading and trailing separators', t => {
	t.is(slugify('---foo---'), 'foo');
	t.is(slugify('___bar___'), 'bar');
	t.is(slugify('...baz...'), 'baz');
	t.is(slugify('!!!qux!!!'), 'qux');
	t.is(slugify('@@@test@@@'), 'test');
	t.is(slugify('###hello###'), 'hello');
	t.is(slugify('   world   '), 'world');
	
	// Mixed leading/trailing characters
	t.is(slugify('-_-foo-_-'), 'foo');
	t.is(slugify('!@#bar#@!'), 'bar');
	t.is(slugify(' . _ - baz - _ . '), 'baz');
});

test('edge cases - numbers and mixed alphanumeric', t => {
	t.is(slugify('123'), '123');
	t.is(slugify('0'), '0');
	t.is(slugify('3.14159'), '3-14159');
	t.is(slugify('1,000,000'), '1-000-000');
	t.is(slugify('v1.2.3'), 'v1-2-3');
	t.is(slugify('2023-12-31'), '2023-12-31');
	t.is(slugify('foo123bar'), 'foo123bar');
	t.is(slugify('123foo456bar789'), '123foo456bar789');
	
	// Scientific notation
	t.is(slugify('1e10'), '1e10');
	t.is(slugify('3.14e-5'), '3-14e-5');
	t.is(slugify('6.022e+23'), '6-022e-23');
});

test('edge cases - very long strings', t => {
	const longString = 'a'.repeat(1000);
	t.is(slugify(longString), longString);
	
	const longStringWithSpaces = Array(100).fill('word').join(' ');
	const expected = Array(100).fill('word').join('-');
	t.is(slugify(longStringWithSpaces), expected);
	
	const longStringWithSpecialChars = Array(100).fill('word!!!').join(' ');
	const expectedSpecial = Array(100).fill('word').join('-');
	t.is(slugify(longStringWithSpecialChars), expectedSpecial);
});

test('edge cases - single characters', t => {
	t.is(slugify('a'), 'a');
	t.is(slugify('A'), 'a');
	t.is(slugify('1'), '1');
	t.is(slugify('!'), '');
	t.is(slugify('@'), '');
	t.is(slugify('#'), '');
	t.is(slugify('
), '');
	t.is(slugify('%'), '');
	t.is(slugify('^'), '');
	t.is(slugify('&'), 'and');
	t.is(slugify('*'), '');
	t.is(slugify('('), '');
	t.is(slugify(')'), '');
	t.is(slugify('-'), '');
	t.is(slugify('_'), '');
	t.is(slugify('='), '');
	t.is(slugify('+'), '');
	t.is(slugify('['), '');
	t.is(slugify(']'), '');
	t.is(slugify('{'), '');
	t.is(slugify('}'), '');
	t.is(slugify('|'), '');
	t.is(slugify('\\'), '');
	t.is(slugify(';'), '');
	t.is(slugify(':'), '');
	t.is(slugify('\''), '');
	t.is(slugify('"'), '');
	t.is(slugify(','), '');
	t.is(slugify('.'), '');
	t.is(slugify('<'), '');
	t.is(slugify('>'), '');
	t.is(slugify('/'), '');
	t.is(slugify('?'), '');
	t.is(slugify('~'), '');
	t.is(slugify('`'), '');
});

test('edge cases - complex real-world examples', t => {
	// File paths and URLs
	t.is(slugify('C:\\Users\\John\\Documents\\file.txt'), 'c-users-john-documents-file-txt');
	t.is(slugify('https://www.example.com/path?query=value'), 'https-www-example-com-path-query-value');
	t.is(slugify('/home/user/.bashrc'), 'home-user-bashrc');
	
	// Code snippets
	t.is(slugify('function() { return true; }'), 'function-return-true');
	t.is(slugify('if (x === null) { throw new Error(); }'), 'if-x-null-throw-new-error');
	t.is(slugify('<div class="container"></div>'), 'div-class-container-div');
	
	// Email addresses
	t.is(slugify('user@example.com'), 'user-example-com');
	t.is(slugify('john.doe+tag@company.co.uk'), 'john-doe-tag-company-co-uk');
	
	// Social media handles and hashtags
	t.is(slugify('@username'), 'username');
	t.is(slugify('#hashtag'), 'hashtag');
	t.is(slugify('@user_name #cool_tag'), 'user-name-cool-tag');
	
	// Chemical formulas and scientific notation
	t.is(slugify('H₂SO₄'), 'h2so4');
	t.is(slugify('CO₂ + H₂O → H₂CO₃'), 'co2-h2o-h2co3');
	t.is(slugify('E = mc²'), 'e-mc2');
	
	// International phone numbers
	t.is(slugify('+1 (555) 123-4567'), '1-555-123-4567');
	t.is(slugify('+44 20 7946 0958'), '44-20-7946-0958');
});
