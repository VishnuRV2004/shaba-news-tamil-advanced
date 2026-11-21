import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireEditorPage } from '../lib/editor';
import { publishedIssue } from '../lib/model';
import { issue, studio } from '../lib/storage';
import Folio from './Folio';
import FolioCursor from './FolioCursor';
import './folio-navigation.css';

export default async function EditionPage({ story, draft }: { story?: string; draft: boolean }) {
  if (draft) {
    const path = story ? `/folio/story/${encodeURIComponent(story)}` : '/folio';
    await requireEditorPage(path + '?preview=draft');
  }
  const data = draft
    ? publishedIssue((await studio()).state, 'folio')
    : await issue('folio');
  if (story && !data.articles.some(article => article.id === story)) notFound();

  return <>
    <link rel="expect" blocking="render" href="#fo-content-ready" media="(prefers-reduced-motion: no-preference)" />
    <script src="/folio-navigation.js" async blocking="render" />
    <FolioCursor />
    {draft && <aside lang="en" className="draft-strip">Draft preview · Only editors can see these changes <Link href="/admin" prefetch={false}>Return to desk</Link></aside>}
    <Folio {...data} articleId={story} />
  </>;
}
