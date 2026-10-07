import { createHash } from 'node:crypto';
import { appendFileSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const START = '<!-- github-activity:auto:start -->';
export const END = '<!-- github-activity:auto:end -->';
export const CARD_FILES = ['stats-current.svg', 'stats-last-year.svg', 'languages.svg'];

export function currentYear(date = new Date()) {
  return Number(new Intl.DateTimeFormat('en', {
    timeZone: 'Europe/Berlin', year: 'numeric',
  }).format(date));
}

function assertYear(year) {
  if (!Number.isInteger(year) || year < 2008 || year > 9999) {
    throw new Error('Invalid calendar year');
  }
}

export function cardOptions(year) {
  assertYear(year);
  const shared = {
    username: 'PasBless1', show_icons: true, card_width: 640,
    bg_color: '262626', title_color: 'ffc02a', text_color: '94c87b',
    icon_color: 'ff8b18', border_color: 'd4d4d4',
    disable_animations: true, number_format: 'long',
  };
  return {
    current: { ...shared, commits_year: year, ring_color: 'ffc02a',
      custom_title: "Blessing Asare's GitHub Stats" },
    previous: { ...shared, commits_year: year - 1,
      hide: 'stars,prs,issues,contribs', hide_rank: true,
      custom_title: `Total Commits Last Year (${year - 1})` },
    languages: {
      username: 'PasBless1', layout: 'compact', langs_count: 6, card_width: 640,
      custom_title: 'Most Used Languages', bg_color: 'ffffff',
      title_color: '2f80ed', text_color: '434d58', border_color: 'd4d4d4',
      disable_animations: true,
    },
  };
}

export function assertCard(svg, filename) {
  if (!/<svg\b/.test(svg) || !/<\/svg>\s*$/.test(svg) ||
      /Something went wrong|Could not fetch|Maximum retries exceeded/i.test(svg)) {
    throw new Error(`Refusing to publish an invalid or error card: ${filename}`);
  }
}

export function activityBody(year, cards) {
  assertYear(year);
  const sources = CARD_FILES.map(filename => {
    const svg = cards[filename];
    if (typeof svg !== 'string') throw new Error(`Missing generated card: ${filename}`);
    assertCard(svg, filename);
    // New content gets a new URL, so GitHub does not reuse an older Camo URL.
    const version = createHash('sha256').update(svg).digest('hex').slice(0, 16);
    return `./assets/github-activity/${filename}?v=${version}`;
  });
  const yearLink = value => `https://github.com/PasBless1?tab=overview&amp;from=${value}-01-01&amp;to=${value}-12-31`;
  return `

<p align="center">
  <a href="${yearLink(year)}">
    <img src="${sources[0]}" alt="Blessing Asare's GitHub statistics, including total commits in calendar year ${year}" width="640" />
  </a>
</p>

<p align="center">
  <a href="${yearLink(year - 1)}">
    <img src="${sources[1]}" alt="Total commits last year: Blessing Asare's public GitHub commits in calendar year ${year - 1}" width="640" />
  </a>
</p>

<p align="center">
  <a href="https://github.com/PasBless1?tab=repositories">
    <img src="${sources[2]}" alt="Most used languages across Blessing Asare's public repositories" width="640" />
  </a>
</p>

<p align="center"><sub>Public GitHub activity · Commits shown separately for calendar years ${year - 1} and ${year} · Language percentages reflect repository contents.</sub></p>

`;
}

export function updateReadme(readme, year, cards) {
  if (readme.split(START).length !== 2 || readme.split(END).length !== 2) {
    throw new Error('README must contain exactly one activity marker pair');
  }
  const from = readme.indexOf(START) + START.length;
  const to = readme.indexOf(END);
  if (to < from) throw new Error('Activity markers are in the wrong order');
  return readme.slice(0, from) + activityBody(year, cards) + readme.slice(to);
}

function main(command, suppliedYear) {
  const year = suppliedYear === undefined ? currentYear() : Number(suppliedYear);
  assertYear(year);
  if (command === 'options') {
    if (!process.env.GITHUB_OUTPUT) throw new Error('GITHUB_OUTPUT is required');
    const options = cardOptions(year);
    appendFileSync(process.env.GITHUB_OUTPUT,
      `year=${year}\n` + Object.entries(options)
        .map(([name, value]) => `${name}=${JSON.stringify(value)}\n`).join(''));
  } else if (command === 'apply') {
    const cards = Object.fromEntries(CARD_FILES.map(filename => [filename,
      readFileSync(`assets/github-activity/${filename}`, 'utf8')]));
    const original = readFileSync('README.md', 'utf8');
    const updated = updateReadme(original, year, cards);
    if (updated !== original) writeFileSync('README.md', updated, 'utf8');
  } else {
    throw new Error('Usage: node scripts/profile-stats.mjs options|apply [year]');
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv[2], process.argv[3]);
}
