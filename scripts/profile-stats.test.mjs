import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { START, END, CARD_FILES, currentYear, cardOptions, updateReadme } from './profile-stats.mjs';

const cards = Object.fromEntries(CARD_FILES.map(filename => [filename,
  `<svg xmlns="http://www.w3.org/2000/svg"><text>${filename}: 123</text></svg>`]));
const source = `## Hello, I am Blessing Asare 👋\n\nUnchanged biography.\n\n## GitHub activity\n\n${START}\nOld cards\n${END}\n\nUnchanged contact links.\n`;

test('year follows Europe/Berlin, including New Year', () => {
  assert.equal(currentYear(new Date('2026-12-31T22:59:59Z')), 2026);
  assert.equal(currentYear(new Date('2026-12-31T23:00:00Z')), 2027);
});

test('options preserve the approved palette and both calendar years', () => {
  const options = cardOptions(2026);
  assert.equal(options.current.username, 'PasBless1');
  assert.equal(options.current.commits_year, 2026);
  assert.equal(options.previous.commits_year, 2025);
  assert.equal(options.previous.custom_title, 'Total Commits Last Year (2025)');
  assert.equal(options.previous.hide_rank, true);
  assert.equal(options.current.bg_color, '262626');
  assert.equal(options.current.title_color, 'ffc02a');
  assert.equal(options.current.text_color, '94c87b');
  assert.equal(options.languages.langs_count, 6);
  assert.equal(options.languages.bg_color, 'ffffff');
});

test('README changes are strictly inside the activity markers', () => {
  const output = updateReadme(source, 2026, cards);
  assert.equal(output.split(START)[0], source.split(START)[0]);
  assert.equal(output.split(END)[1], source.split(END)[1]);
  assert.equal((output.match(/<img /g) || []).length, 3);
  assert.equal((output.match(/\?v=[a-f0-9]{16}/g) || []).length, 3);
  assert.match(output, /from=2026-01-01&amp;to=2026-12-31/);
  assert.match(output, /from=2025-01-01&amp;to=2025-12-31/);
});

test('unchanged cards do not generate repeated README edits', () => {
  const first = updateReadme(source, 2026, cards);
  assert.equal(updateReadme(first, 2026, cards), first);
});

test('a changed card gets a fresh image URL without changing other URLs', () => {
  const first = updateReadme(source, 2026, cards);
  const changed = { ...cards, 'stats-current.svg': cards['stats-current.svg'].replace('123', '124') };
  const urls = text => [...text.matchAll(/<img src="([^"]+)"/g)].map(match => match[1]);
  const [before, after] = [urls(first), urls(updateReadme(first, 2026, changed))];
  assert.notEqual(before[0], after[0]);
  assert.deepEqual(before.slice(1), after.slice(1));
});

test('year rollover updates dates, titles and accessibility text', () => {
  const output = updateReadme(source, 2027, cards);
  assert.match(output, /calendar years 2026 and 2027/);
  assert.doesNotMatch(output, /2025/);
  assert.equal(cardOptions(2027).previous.custom_title, 'Total Commits Last Year (2026)');
});

test('missing or duplicate markers fail without rewriting other content', () => {
  assert.throws(() => updateReadme(source.replace(START, ''), 2026, cards), /marker/);
  assert.throws(() => updateReadme(source + START, 2026, cards), /marker/);
  assert.throws(() => updateReadme(`${END}${START}`, 2026, cards), /order/);
});

test('missing, invalid, and API-error cards are never accepted', () => {
  assert.throws(() => updateReadme(source, 2026, {}), /Missing/);
  for (const bad of ['', 'Not SVG', '<svg>incomplete', '<svg>Something went wrong</svg>']) {
    assert.throws(() => updateReadme(source, 2026, { ...cards, 'stats-current.svg': bad }), /invalid or error/);
  }
});

test('invalid year input fails closed', () => {
  for (const year of [NaN, 0, 2026.5, 10000]) {
    assert.throws(() => cardOptions(year), /calendar year/);
  }
});

test('actual reviewed README keeps all wording and banner outside the cards', () => {
  const readme = readFileSync(new URL('../README.md', import.meta.url), 'utf8');
  const output = updateReadme(readme, 2026, cards);
  assert.equal(output.split(START)[0], readme.split(START)[0]);
  assert.equal(output.split(END)[1], readme.split(END)[1]);
  assert.match(output, /profile-header-polished\.svg/);
});
