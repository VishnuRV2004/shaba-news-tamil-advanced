'use client';

import {useEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type PointerEvent} from 'react';
import {ArrowLeft, ArrowRight, ArrowUpRight, ChevronLeft, ChevronRight, Feather, MapPin, Menu, Search, X} from 'lucide-react';
import type {Article, Edition} from '@/lib/model';
import originals from '@/lib/originals.json';
import './folio.css';

type Section = Edition['sections'][number];
type FolioProps = {edition: Edition; articles: Article[]; articleId?: string; originalView?: boolean};
const dateFormat = new Intl.DateTimeFormat('ta-IN', {day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata'});
const siteBase = process.env.NEXT_PUBLIC_SITE_BASE || '';
const staticSite = process.env.NEXT_PUBLIC_STATIC_SITE === '1';

function formatDate(date: string) {
  const value = new Date(date);
  return Number.isNaN(value.getTime()) ? date : dateFormat.format(value);
}

function subscribeLocation(notify: () => void) {
  window.addEventListener('popstate', notify);
  return () => window.removeEventListener('popstate', notify);
}

function storyHref(id: string, preview: string) {
  return `${siteBase}/folio/story/${encodeURIComponent(id)}${staticSite ? '/' : ''}${preview}`;
}

function Wordmark() {
  return <span className="fo-wordmark"><span className="fo-seal" aria-hidden="true"><Feather size={24} strokeWidth={1.25} /></span><span className="fo-brand-type"><b>ஷபா நியூஸ்</b><small lang="en">SHABA NEWS TAMIL</small></span></span>;
}

function Photo({article, priority = false}: {article: Article; priority?: boolean}) {
  const [failed, setFailed] = useState('');
  return article.image && failed !== article.image
    // eslint-disable-next-line @next/next/no-img-element -- The editor accepts local WebP assets and arbitrary publisher image URLs.
    ? <img src={article.image.startsWith('/') ? siteBase + article.image : article.image} alt="" loading={priority ? 'eager' : 'lazy'} fetchPriority={priority ? 'high' : 'auto'} onError={() => setFailed(article.image)} />
    : <span className="fo-photo-fallback" aria-hidden="true"><Feather size={48} strokeWidth={0.8} /></span>;
}

function Info({article}: {article: Article}) {
  return <span className="fo-info">{article.category && <span>{article.category}</span>}{article.district && <span><MapPin size={12} aria-hidden="true" />{article.district}</span>}</span>;
}

function StoryCard({article, preview, feature = false}: {article: Article; preview: string; feature?: boolean}) {
  return <article className={`fo-card${feature ? ' fo-feature-card' : ''}`}>
    <a href={storyHref(article.id, preview)} className="fo-card-link">
      <div className="fo-card-picture" data-folio-cursor="read" data-fo-photo={article.id}><Photo article={article} /></div>
      <div className="fo-card-text"><Info article={article} /><h3>{article.title}</h3>{feature && article.summary && <p>{article.summary}</p>}
        <span className="fo-card-byline"><time dateTime={article.date}>{formatDate(article.date)}</time><ArrowUpRight size={19} aria-hidden="true" /></span>
      </div>
    </a>
  </article>;
}

const turnDuration = 620;
type Direction = -1 | 1;

function PrintedCover({story, active = false, priority = false}: {story: Article; active?: boolean; priority?: boolean}) {
  return <div className="fo-print" aria-hidden="true">
    <div className="fo-print-mast"><span lang="en">Folio</span><small>ஷபா நியூஸ்<br />தமிழ்</small></div>
    <div className={`fo-print-photo${active ? ' fo-cover-picture' : ''}`} data-fo-photo={active ? story.id : undefined}><Photo article={story} priority={priority} /></div>
    <div className="fo-print-caption"><small>{story.category}</small><b>{story.title}</b></div>
    <div className="fo-print-foot"><span lang="en">SHABA NEWS TAMIL</span><span>{formatDate(story.date)}</span></div>
  </div>;
}

function Cover({section, articles, preview, first}: {section: Section; articles: Article[]; preview: string; first: boolean}) {
  const [turn, setTurn] = useState({active: 0, from: null as number | null, destination: 0, direction: 1 as Direction, nextDirection: 1 as Direction});
  const pointer = useRef<{id: number; x: number; y: number} | null>(null);
  const suppressLink = useRef(false);
  const count = articles.length;
  const active = Math.min(turn.active, count - 1);
  const story = articles[active];
  const departing = turn.from === null ? undefined : articles[turn.from];
  const next = count > 1 ? articles[(active + 1) % count] : undefined;

  function choose(change: {step: Direction} | {index: number}) {
    if (count < 2) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setTurn(current => {
      const target = 'step' in change ? (current.destination + change.step + count) % count : change.index;
      if (current.destination === target) return current;
      const direction = 'step' in change ? change.step : target > current.destination ? 1 : -1;
      if (reduced) return {active: target, from: null, destination: target, direction, nextDirection: direction};
      if (current.from !== null) return {...current, destination: target, nextDirection: direction};
      return {active: target, from: current.active, destination: target, direction, nextDirection: direction};
    });
  }

  useEffect(() => {
    if (turn.from === null) return;
    const timer = window.setTimeout(() => {
      setTurn(current => current.active === current.destination ? {...current, from: null} :
        {...current, from: current.active, active: current.destination, direction: current.nextDirection});
    }, turnDuration);
    return () => window.clearTimeout(timer);
  }, [turn.from, turn.active]);

  function movePointer(event: PointerEvent<HTMLDivElement>) {
    const stage = event.currentTarget;
    const start = pointer.current;
    if (start && event.pointerId === start.id && Math.abs(event.clientX - start.x) > 12 && Math.abs(event.clientX - start.x) > Math.abs(event.clientY - start.y) * 1.35) stage.setPointerCapture(event.pointerId);
    if (event.pointerType !== 'mouse' || !window.matchMedia('(hover: hover) and (prefers-reduced-motion: no-preference)').matches) return;
    const bounds = stage.getBoundingClientRect();
    stage.style.setProperty('--fo-rx', `${(0.5 - (event.clientY - bounds.top) / bounds.height) * 5}deg`);
    stage.style.setProperty('--fo-ry', `${((event.clientX - bounds.left) / bounds.width - 0.5) * 9}deg`);
  }

  function endSwipe(event: PointerEvent<HTMLDivElement>) {
    const start = pointer.current;
    pointer.current = null;
    if (!start || event.pointerId !== start.id) return;
    const dx = event.clientX - start.x;
    if (Math.abs(dx) < 38 || Math.abs(dx) < Math.abs(event.clientY - start.y) * 1.35) return;
    suppressLink.current = true;
    choose({step: dx < 0 ? 1 : -1});
  }

  return <section id={`fo-${section.id}`} className="fo-cover-section" aria-label={section.title} style={{'--fo-turn-duration': `${turnDuration}ms`} as CSSProperties} onKeyDown={event => {
    if (count < 2 || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {event.preventDefault(); choose({step: event.key === 'ArrowRight' ? 1 : -1});}
    else if (event.key === 'Home' || event.key === 'End') {event.preventDefault(); choose({index: event.key === 'Home' ? 0 : count - 1});}
  }}>
    <div className="fo-cover-frame"><article className="fo-cover">
      <div className="fo-cover-content">
        <div className="fo-cover-label"><span aria-hidden="true" />{section.title}</div>
        <div className="fo-cover-copy" key={story.id}><Info article={story} />
          <h2><a href={storyHref(story.id, preview)}>{story.title}</a></h2>
          {story.summary && <p>{story.summary}</p>}
          <a className="fo-read" href={storyHref(story.id, preview)}>செய்தியை வாசிக்க <ArrowUpRight size={17} aria-hidden="true" /></a>
        </div>
        {next && <div className="fo-pager" aria-label="அட்டைப்படச் செய்திகள்"><button type="button" aria-label="முந்தைய அட்டைப்படச் செய்தி" onClick={() => choose({step: -1})}><ChevronLeft size={16} aria-hidden="true" />முந்தைய</button>
          <output aria-live="polite" aria-atomic="true">{String(active + 1).padStart(2, '0')} <i>/</i> {String(count).padStart(2, '0')}</output>
          <button type="button" aria-label="அடுத்த அட்டைப்படச் செய்தி" onClick={() => choose({step: 1})}>அடுத்த <ChevronRight size={16} aria-hidden="true" /></button></div>}
      </div>
      <div className="fo-bookstage" tabIndex={next ? 0 : undefined} role="group" aria-label={next ? 'அட்டைப்படங்கள். இடது அல்லது வலது அம்புக்குறியால் புரட்டவும்.' : section.title}
        onPointerDown={event => {if (event.isPrimary && event.button === 0) {suppressLink.current = false; pointer.current = {id: event.pointerId, x: event.clientX, y: event.clientY};}}}
        onPointerMove={movePointer} onPointerUp={endSwipe} onPointerCancel={() => {pointer.current = null;}}
        onPointerLeave={event => {event.currentTarget.style.removeProperty('--fo-rx'); event.currentTarget.style.removeProperty('--fo-ry');}}
        onDragStart={event => event.preventDefault()} onClickCapture={event => {if (suppressLink.current && event.detail > 0) {event.preventDefault(); event.stopPropagation();}}}>
        <div className="fo-desk-shadow" aria-hidden="true" />
        <div className="fo-book-front">
          <span className="fo-page-edge fo-edge-right" aria-hidden="true" /><span className="fo-page-edge fo-edge-bottom" aria-hidden="true" />
          <a className="fo-magazine-link" data-folio-cursor="read" href={storyHref(story.id, preview)} aria-label={`${story.title} — செய்தியை வாசிக்க`} draggable={false}>
            <PrintedCover story={story} active priority={first} />
          </a>
          {departing && <div key={`${departing.id}-${story.id}`} className="fo-turn-leaf" data-direction={turn.direction > 0 ? 'next' : 'previous'} aria-hidden="true">
            <div className="fo-leaf-face"><PrintedCover story={departing} /></div>
            <div className="fo-leaf-reverse"><PrintedCover story={story} /></div>
          </div>}
        </div>
        {next && <div className="fo-book-back" aria-hidden="true"><PrintedCover story={next} /></div>}
      </div>
    </article></div>
    {next && <div className="fo-cover-index" aria-label="அட்டைப்படத் தேர்வு">{articles.map((item, i) => <button key={item.id} aria-pressed={active === i} onClick={() => choose({index: i})}>
      <span className="fo-index-img" data-fo-photo={item.id}><Photo article={item} /></span><span className="fo-index-text"><small>{item.category}</small><b>{item.title}</b></span>
    </button>)}</div>}
  </section>;
}

function Collection({section, articles, preview}: {section: Section; articles: Article[]; preview: string}) {
  return <section id={`fo-${section.id}`} className={`fo-collection fo-collection-${section.type}`}>
    <div className="fo-section-heading"><h2>{section.title}</h2><span aria-hidden="true" /><Feather size={22} strokeWidth={1} aria-hidden="true" /></div>
    {articles.length ? <div className="fo-cards">{articles.map(article => <StoryCard key={article.id} article={article} preview={preview} feature={section.type === 'feature'} />)}</div> : <p className="fo-empty">இந்தப் பகுதியில் செய்திகள் எதுவும் இல்லை.</p>}
  </section>;
}

function Story({article, preview, originalView}: {article: Article; preview: string; originalView: boolean}) {
  const original = originals[article.id as keyof typeof originals];
  const sourceHref = original?.sourceUrl === article.sourceUrl
    ? `${storyHref(article.id, '')}${staticSite ? 'original/' : '/original'}${preview}`
    : article.sourceUrl;
  const localSource = sourceHref.startsWith('/');
  return <article className="fo-story"><a className="fo-back" href={originalView ? storyHref(article.id, preview) : `${siteBase}/folio${staticSite ? '/' : ''}${preview}`}><ArrowLeft size={16} /> {originalView ? 'செய்திச் சுருக்கத்திற்குத் திரும்ப' : 'முதற்பக்கத்திற்குத் திரும்ப'}</a>
    <div className="fo-story-intro"><Info article={article} /><h1>{article.title}</h1>{article.summary && <p>{article.summary}</p>}
      <div className="fo-story-meta">{article.author && <span>{article.author}</span>}<time dateTime={article.date}>{formatDate(article.date)}</time></div>
    </div>
    {article.image && <figure className="fo-story-photo" data-fo-photo={article.id}><Photo article={article} priority /></figure>}
    <div className="fo-story-body">{article.body.split(/\n+/).filter(Boolean).map((p, i) => <p key={i}>{p}</p>)}
      {!originalView && /^(https?:\/\/|\/)/i.test(sourceHref) && <a className="fo-source" href={sourceHref} target={localSource ? undefined : '_blank'} rel={localSource ? undefined : 'noreferrer'}>மூலச் செய்தி <ArrowUpRight size={16} /></a>}
    </div>
  </article>;
}

export default function Folio({edition, articles, articleId, originalView = false}: FolioProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const firstInput = useRef<HTMLInputElement>(null);
  const opener = useRef<HTMLButtonElement | null>(null);
  const [panel, setPanel] = useState<'search' | 'menu'>('search');
  const [query, setQuery] = useState('');
  const preview = useSyncExternalStore(subscribeLocation, () => new URLSearchParams(window.location.search).get('preview') === 'draft' ? '?preview=draft' : '', () => '');
  const map = new Map(articles.map(article => [article.id, article]));
  const sections = edition.sections.filter(section => section.visible).map(section => ({section, items: section.articleIds.map(id => map.get(id)).filter((article): article is Article => Boolean(article))}));
  const editionArticles = [...new Map(sections.flatMap(({items}) => items).map(article => [article.id, article])).values()];
  const story = articleId ? map.get(articleId) : undefined;
  const related = story ? editionArticles.filter(item => item.id !== story.id)
    .sort((a, b) => Number(b.category === story.category) - Number(a.category === story.category) || Number(b.district === story.district) - Number(a.district === story.district)).slice(0, 3) : [];
  const issueDate = editionArticles.map(article => article.date).filter(Boolean).sort().at(-1);
  const search = query.trim().toLocaleLowerCase('ta-IN');
  const results = editionArticles.filter(article => [article.title, article.summary, article.district, article.category, article.author].some(field => field.toLocaleLowerCase('ta-IN').includes(search)));
  const home = `${siteBase}/folio${staticSite ? '/' : ''}${preview}`;
  function openPanel(next: typeof panel, button: HTMLButtonElement) {
    opener.current = button;
    setPanel(next);
    setQuery('');
    dialog.current?.showModal();
    requestAnimationFrame(() => {
      if (next === 'search') firstInput.current?.focus();
      else dialog.current?.querySelector<HTMLAnchorElement>('nav a')?.focus();
    });
  }
  return <div className="fo-root" data-density={edition.density} style={{'--fo-accent': edition.accent} as CSSProperties} lang="ta">
    <a className="fo-skip" href="#fo-main">உள்ளடக்கத்திற்குச் செல்ல</a>
    <header className="fo-header"><div className="fo-wrap fo-header-inner">
      <a className="fo-home" href={home} aria-label="ஷபா நியூஸ் தமிழ் முதற்பக்கம்"><Wordmark /></a>
      <nav className="fo-nav" aria-label="பிரிவுகள்"><a className={!articleId ? 'fo-current' : ''} href={home} aria-current={!articleId ? 'page' : undefined}>முகப்பு</a>{sections.slice(0, 3).map(({section}) => <a href={`${home}#fo-${section.id}`} key={section.id}>{section.title}</a>)}</nav>
      <div className="fo-tools"><button type="button" className="fo-search-btn" aria-label="செய்திகளைத் தேடுக" onClick={e => openPanel('search', e.currentTarget)}><Search size={18} /><span>தேடுக</span></button><button type="button" className="fo-menu-btn" aria-label="அனைத்துப் பிரிவுகளும்" onClick={e => openPanel('menu', e.currentTarget)}><Menu size={21} /></button></div>
    </div></header>
    <main id="fo-main" className="fo-wrap fo-main" tabIndex={-1}>
      {articleId ? story ? <><Story article={story} preview={preview} originalView={originalView} />
        {related.length > 0 && <section className="fo-collection fo-related" aria-labelledby="fo-related-heading">
          <div className="fo-section-heading"><h2 id="fo-related-heading">தொடர்புடைய செய்திகள்</h2><span aria-hidden="true" /></div>
          <div className="fo-cards">{related.map(item => <StoryCard key={item.id} article={item} preview={preview} />)}</div>
        </section>}</> : <section className="fo-empty"><h1>செய்தி கிடைக்கவில்லை</h1><a href={home}>முதற்பக்கத்திற்குத் திரும்ப</a></section> : <>
        <div className="fo-issue"><h1><span className="fo-edition-tag" lang="en">Folio</span><span className="fo-issue-mark" aria-hidden="true" />{edition.name}</h1>{issueDate && <time dateTime={issueDate}>{formatDate(issueDate)}</time>}</div>
        {sections.map(({section, items}, i) => section.type === 'lead' && items.length ? <Cover key={section.id} section={section} articles={items} preview={preview} first={i === 0} /> : <Collection key={section.id} section={section} articles={items} preview={preview} />)}
        {!sections.length && <p className="fo-empty">இந்த இதழில் செய்திகள் எதுவும் இல்லை.</p>}
      </>}
    </main>
    <footer className="fo-footer" id="fo-content-ready"><div className="fo-wrap"><a href={home}><Wordmark /></a><a href="#fo-main">மேலே செல்ல <ArrowRight size={15} /></a></div></footer>
    <dialog ref={dialog} className="fo-dialog" aria-labelledby="fo-dialog-title" onKeyDown={e => {if (e.key === 'Escape') {e.preventDefault(); dialog.current?.close();}}} onClose={() => opener.current?.focus()} onClick={e => {if (e.target === e.currentTarget) dialog.current?.close();}}>
      <div className="fo-dialog-body"><div className="fo-dialog-head"><h2 id="fo-dialog-title">{panel === 'search' ? 'செய்திகளைத் தேடுக' : 'அனைத்துப் பிரிவுகளும்'}</h2><button aria-label="மூடுக" onClick={() => dialog.current?.close()}><X size={21} /></button></div>
        {panel === 'search' ? <><label className="fo-input"><Search size={19} /><input ref={firstInput} type="search" autoComplete="off" aria-label="தலைப்பு, இடம் அல்லது பிரிவு" placeholder="தலைப்பு, இடம் அல்லது பிரிவு…" value={query} onChange={e => setQuery(e.target.value)} /></label>
          <span className="fo-sr" role="status">{results.length} செய்திகள்</span><div className="fo-results" aria-label="தேடல் முடிவுகள்">{results.map(article => <a key={article.id} href={storyHref(article.id, preview)}><span><small>{article.category}</small>{article.title}</span><ArrowUpRight size={17} /></a>)}{!results.length && <p role="status">செய்திகள் எதுவும் கிடைக்கவில்லை.</p>}</div>
        </> : <nav className="fo-results" aria-label="இதழின் பிரிவுகள்"><a href={home} onClick={() => dialog.current?.close()}>முகப்பு <ArrowRight size={16} /></a>{sections.map(({section}) => <a href={`${home}#fo-${section.id}`} key={section.id} onClick={() => dialog.current?.close()}>{section.title}<ArrowRight size={16} /></a>)}</nav>}
      </div>
    </dialog>
  </div>;
}
