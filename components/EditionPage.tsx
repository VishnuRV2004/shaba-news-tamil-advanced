import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireEditorPage } from '../lib/editor';
import { publishedIssue } from '../lib/model';
import { issue, studio } from '../lib/storage';
import originals from '../lib/originals.json';
import Folio from './Folio';
import FolioCursor from './FolioCursor';
import './folio-navigation.css';

export default async function EditionPage({ story, draft, original = false }: { story?: string; draft: boolean; original?: boolean }) {
  if (draft) {
    const path = story ? `/folio/story/${encodeURIComponent(story)}` : '/folio';
    await requireEditorPage(path + '?preview=draft');
  }
  const data = draft
    ? publishedIssue((await studio()).state, 'folio')
    : await issue('folio');
  if (story && !data.articles.some(article => article.id === story)) notFound();
  let originalView = false;
  if (story && original) {
    const article = data.articles.find(item => item.id === story);
    const source = originals[story as keyof typeof originals];
    if (article && source?.sourceUrl === article.sourceUrl) {
      data.articles = data.articles.map(item => item.id === story ? {...item, body: source.body} : item);
      originalView = true;
    }
  }

  return <>
    <link rel="expect" blocking="render" href="#fo-content-ready" media="(prefers-reduced-motion: no-preference)" />
    <script src={`${process.env.NEXT_PUBLIC_SITE_BASE || ''}/folio-navigation.js`} async blocking="render" />
    <FolioCursor />
    {draft && <aside lang="en" className="draft-strip">Draft preview · Only editors can see these changes <Link href="/admin" prefetch={false}>Return to desk</Link></aside>}
    <Folio {...data} articleId={story} originalView={originalView} />
  </>;
}
