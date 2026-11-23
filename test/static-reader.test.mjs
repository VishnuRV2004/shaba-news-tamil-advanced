// Run after npm run build:static. Protect the shareable site from missing routes and assets.
import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync, readFileSync, readdirSync} from 'node:fs';
import {join} from 'node:path';

const output = '.pages-build/out';
test('every published story and source link resolves inside the static site', () => {
  const stories = readdirSync(join(output, 'folio/story'), {withFileTypes:true}).filter(entry => entry.isDirectory());
  assert.ok(stories.length > 0, 'The static edition must contain stories');
  const pages = ['index.html', 'folio/index.html'];
  for (const {name} of stories) {
    const path = `folio/story/${name}/`;
    const summary = readFileSync(join(output, path, 'index.html'), 'utf8');
    assert.ok(summary.includes(`href="/${path}original/"`), `${name} must link to the local full report`);
    const original = readFileSync(join(output, path, 'original/index.html'), 'utf8');
    assert.ok(original.includes('<h1'), `${name} needs a full report`);
    pages.push(path + 'index.html', path + 'original/index.html');
  }
  for (const page of pages) {
    const html = readFileSync(join(output, page), 'utf8');
    for (const match of html.matchAll(/(?:href|src)="(\/[^"?#]*)(?:[?#][^"]*)?"/g)) {
      const path = decodeURIComponent(match[1]);
      if (path.startsWith('//')) continue;
      const target = join(output, path.slice(1));
      assert.ok(existsSync(path.endsWith('/') ? join(target, 'index.html') : target), `${page}: missing ${path}`);
    }
  }
});
