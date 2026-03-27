import test from 'ava';
import slugify from '../index.js';

test('slugify basic functionality', t => {
  t.is(slugify('Hello World'), 'hello-world');
  t.is(slugify('I ♥ Dogs'), 'i-love-dogs');
  t.is(slugify('fooBar 123 $#%'), 'foo-bar-123');
  t.is(slugify('Déjà Vu!'), 'deja-vu');
});

test('slugify with options', t => {
  t.is(slugify('Hello World', { separator: '_' }), 'hello_world');
  t.is(slugify('Hello World', { lowercase: false }), 'Hello-World');
  t.is(slugify('fooBar', { decamelize: false }), 'foobar');
  t.is(slugify('foo@bar', { customReplacements: [['@', ' at ']] }), 'foo-at-bar');
});

test('slugify preserve options', t => {
  t.is(slugify('_foo_bar', { preserveLeadingUnderscore: true }), '_foo-bar');
  t.is(slugify('foo-bar-', { preserveTrailingDash: true }), 'foo-bar-');
  t.is(slugify('foo#bar', { preserveCharacters: ['#'] }), 'foo#bar');
});

test('slugify locale and transliterate options', t => {
  t.is(slugify('Räksmörgås', { locale: 'sv' }), 'raksmorgas');
  t.is(slugify('Déjà Vu', { transliterate: false }), 'déjà-vu');
});