// Refresh full text for the archived Shaba stories without a scraper dependency.
import { readFile, writeFile } from 'node:fs/promises';

const archive = JSON.parse(await readFile(new URL('../lib/archive.json', import.meta.url), 'utf8'));
const originals = {};

function articleText(html) {
  const start = html.search(/<div\b[^>]*class=['"][^'"]*\bpost-body\b[^'"]*\bentry-content\b[^'"]*['"][^>]*>/i);
  if (start < 0) throw Error('Article body missing');
  const tokens = html.slice(start).match(/<!--[\s\S]*?-->|<[^>]+>|[^<]+/g) ?? [];
  const parts = [];
  let depth = 0;
  let skip = false;
  for (const token of tokens) {
    if (/^<div\b/i.test(token)) depth++;
    if (/^<\/(script|style)/i.test(token)) skip = false;
    if (depth && !skip) {
      if (/^<\/?(?:p|div|h[1-4]|li|blockquote)\b|^<br\b/i.test(token)) parts.push('\n');
      else if (!token.startsWith('<')) parts.push(token);
    }
    if (/^<(script|style)\b/i.test(token)) skip = true;
    if (/^<\/div\b/i.test(token) && --depth === 0) break;
  }
  if (depth !== 0) throw Error('Article body not closed');
  const decoded = parts.join('').replace(/&#(x[0-9a-f]+|\d+);/gi, (_, value) => String.fromCodePoint(value[0].toLowerCase() === 'x' ? parseInt(value.slice(1), 16) : Number(value)))
    .replace(/&(amp|nbsp|quot|apos|lt|gt);/gi, (_, name) => ({amp: '&', nbsp: ' ', quot: '"', apos: "'", lt: '<', gt: '>'})[name.toLowerCase()]);
  return decoded.split(/\n+/).map(line => line.replace(/\s+/g, ' ').trim()).filter(line => line && line !== 'শেয়ার করুন').join('\n\n');
}

for (const article of archive) {
  const url = article.sourceUrl;
  if (!url.startsWith('https://www.shabanewstamil.com/')) throw Error(`Unexpected source URL: ${url}`);
  const response = await fetch(url, {signal: AbortSignal.timeout(20_000)});
  if (!response.ok) throw Error(`${url}: HTTP ${response.status}`);
  const body = articleText(await response.text());
  if (body.length < article.body.length) throw Error(`Missing full article: ${article.id}`);
  originals[article.id] = {sourceUrl: url, body};
  console.log(`${article.id}: ${body.length} characters`);
}
await writeFile(new URL('../lib/originals.json', import.meta.url), JSON.stringify(originals, null, 2) + '\n');
