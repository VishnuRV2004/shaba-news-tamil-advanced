// Build a public, read-only static edition from the published archive.
import {cp, mkdir, readFile, rm, writeFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {dirname, join, resolve, sep} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const site = resolve(root, '.pages-build');
const base = process.argv.includes('--root') ? '' : '/shaba-news-tamil-advanced';
if (!site.startsWith(root + sep)) throw Error('Static build path escaped the repository');
await rm(site, {recursive: true, force: true});

async function copy(path) {
  const target = join(site, path);
  await mkdir(dirname(target), {recursive: true});
  await cp(join(root, path), target, {recursive: true});
}

async function write(path, content) {
  const target = join(site, path);
  await mkdir(dirname(target), {recursive: true});
  await writeFile(target, content);
}

for (const path of [
  'package.json', 'tsconfig.json', 'public',
  'components/Folio.tsx', 'components/FolioCursor.tsx',
  'components/folio.css', 'components/folio-navigation.css', 'components/folio-cursor.css',
  'lib/model.ts', 'lib/seed.ts', 'lib/archive.json', 'lib/originals.json',
]) await copy(path);

const globalCss = await readFile(join(root, 'app/globals.css'), 'utf8');
await write('app/globals.css', globalCss.replaceAll('url("/fonts/', `url("${base}/fonts/`));
await write('next.config.ts', `import type {NextConfig} from 'next';\nconst config: NextConfig = {output: 'export', ${base ? `basePath: '${base}', ` : ''}trailingSlash: true};\nexport default config;\n`);
await write('app/layout.tsx', `import './globals.css';\nexport const metadata = {title: 'ஷபா நியூஸ் தமிழ் | உங்கள் ஊரின் செய்திகள்', description: 'தமிழகத்தின் செய்திகள், உங்கள் ஊரின் கதைகள் — ஷபா நியூஸ் தமிழ்.'};\nexport default function Layout({children}: {children: React.ReactNode}) { return <html lang="ta"><body>{children}</body></html>; }\n`);
await write('components/PublicPage.tsx', `import {notFound} from 'next/navigation';
import Folio from './Folio';
import FolioCursor from './FolioCursor';
import {publishedIssue} from '../lib/model';
import {seed} from '../lib/seed';
import originals from '../lib/originals.json';
import './folio-navigation.css';

export const articles = publishedIssue(seed, 'folio').articles;
export default function PublicPage({id, original = false}: {id?: string; original?: boolean}) {
  const article = id ? articles.find(item => item.id === id) : undefined;
  if (id && !article) notFound();
  const source = article && originals[article.id as keyof typeof originals];
  const originalView = Boolean(original && source?.sourceUrl === article?.sourceUrl);
  const data = publishedIssue(seed, 'folio');
  if (originalView && article && source) data.articles = data.articles.map(item => item.id === id ? {...item, body: source.body} : item);
  return <><script src="${base}/folio-navigation.js" async /> <FolioCursor /><Folio {...data} articleId={id} originalView={originalView} /></>;
}
`);
await write('app/page.tsx', `import PublicPage from '../components/PublicPage';\nexport default function Page() { return <PublicPage />; }\n`);
await write('app/folio/page.tsx', `import PublicPage from '../../components/PublicPage';\nexport default function Page() { return <PublicPage />; }\n`);
const storyPage = `import PublicPage, {articles} from '../../../../components/PublicPage';
export const dynamicParams = false;
export function generateStaticParams() { return articles.map(({id}) => ({id})); }
export default async function Page({params}: {params: Promise<{id: string}>}) { return <PublicPage id={(await params).id} />; }
`;
await write('app/folio/story/[id]/page.tsx', storyPage);
await write('app/folio/story/[id]/original/page.tsx', storyPage.replace("../../../../components/PublicPage", "../../../../../components/PublicPage").replace('id={(await params).id}', 'id={(await params).id} original'));

const result = spawnSync(process.execPath, [join(root, 'node_modules/next/dist/bin/next'), 'build'], {
  cwd: site, env: {...process.env, NEXT_PUBLIC_SITE_BASE: base, NEXT_PUBLIC_STATIC_SITE: '1'}, stdio: 'inherit', shell: false,
});
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status || 1);
await write('out/.nojekyll', '');
