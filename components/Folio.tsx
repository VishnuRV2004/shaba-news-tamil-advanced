'use client';

import {useEffect, useRef, useState, useSyncExternalStore, type CSSProperties} from 'react';
import {ArrowLeft, ArrowRight, ArrowUpRight, Bookmark, Check, ChevronRight, Feather, MapPin, Menu, Search, Share2, X} from 'lucide-react';
import type {Article, Edition} from '@/lib/model';
import originals from '@/lib/originals.json';
import './folio.css';

type FolioProps = {edition: Edition; articles: Article[]; articleId?: string; originalView?: boolean};
const siteBase = process.env.NEXT_PUBLIC_SITE_BASE || '';
const staticSite = process.env.NEXT_PUBLIC_STATIC_SITE === '1';
const dateFormat = new Intl.DateTimeFormat('ta-IN', {day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata'});
const dateShort = new Intl.DateTimeFormat('ta-IN', {day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata'});

function formatDate(date: string, short = false) {
  const value = new Date(date);
  return Number.isNaN(value.getTime()) ? date : (short ? dateShort : dateFormat).format(value);
}
function subscribeLocation(notify: () => void) {
  window.addEventListener('popstate', notify);
  return () => window.removeEventListener('popstate', notify);
}
function storyHref(id: string, preview: string) {
  return `${siteBase}/folio/story/${encodeURIComponent(id)}${staticSite ? '/' : ''}${preview}`;
}
function Wordmark() {
  return <span className="fo-wordmark"><span className="fo-seal" aria-hidden="true"><Feather size={23} strokeWidth={1.5} /></span><span className="fo-brand-type"><b>ஷபா நியூஸ்</b><small lang="en">SHABA NEWS TAMIL</small></span></span>;
}
function Photo({article, priority = false}: {article: Article; priority?: boolean}) {
  const [failed, setFailed] = useState('');
  return article.image && failed !== article.image
    // eslint-disable-next-line @next/next/no-img-element -- The editor accepts local WebP assets and publisher image URLs.
    ? <img src={article.image.startsWith('/') ? siteBase + article.image : article.image} alt="" loading={priority ? 'eager' : 'lazy'} fetchPriority={priority ? 'high' : 'auto'} onError={() => setFailed(article.image)} />
    : <span className="fo-photo-fallback" aria-hidden="true"><Feather size={44} strokeWidth={1} /></span>;
}
function StoryCard({article, preview, variant = 'grid', priority = false}: {article: Article; preview: string; variant?: 'hero' | 'grid' | 'row' | 'compact'; priority?: boolean}) {
  return <article className={`fo-card fo-card-${variant}`}><a className="fo-card-link" href={storyHref(article.id, preview)}>
    <div className="fo-card-picture" data-folio-cursor="read" data-fo-photo={article.id}><Photo article={article} priority={priority} /></div>
    <div className="fo-card-text"><span className="fo-kicker">{article.category}<i />{article.district}</span><h3>{article.title}</h3>{variant === 'hero' && article.summary && <p>{article.summary}</p>}
      <span className="fo-card-byline"><time dateTime={article.date}>{formatDate(article.date, true)}</time><ArrowUpRight size={18} aria-hidden="true" /></span></div>
  </a></article>;
}
function Story({article, preview, originalView, saved, onSave}: {article: Article; preview: string; originalView: boolean; saved: boolean; onSave: () => void}) {
  const [shared, setShared] = useState(false);
  const original = originals[article.id as keyof typeof originals];
  const sourceHref = original?.sourceUrl === article.sourceUrl ? `${storyHref(article.id, '')}${staticSite ? 'original/' : '/original'}${preview}` : article.sourceUrl;
  const localSource = sourceHref.startsWith('/');
  async function share() {
    try {
      if (navigator.share) await navigator.share({title: article.title, url: location.href});
      else {await navigator.clipboard.writeText(location.href); setShared(true); window.setTimeout(() => setShared(false), 2500);}
    } catch { /* Dismissing the native share sheet needs no error message. */ }
  }
  return <article className="fo-story"><a className="fo-back" href={originalView ? storyHref(article.id, preview) : `${siteBase}/folio${staticSite ? '/' : ''}${preview}`}><ArrowLeft size={16} />{originalView ? 'சுருக்கத்திற்குத் திரும்ப' : 'முகப்பிற்குத் திரும்ப'}</a>
    <div className="fo-story-intro"><div className="fo-kicker">{article.category}<i />{article.district}</div><h1>{article.title}</h1>{article.summary && <p>{article.summary}</p>}
      <div className="fo-story-meta"><span>{article.author || 'ஷபா செய்திப் பிரிவு'}</span><time dateTime={article.date}>{formatDate(article.date)}</time></div>
      <div className="fo-story-actions"><button type="button" onClick={onSave} aria-pressed={saved}><Bookmark size={17} fill={saved ? 'currentColor' : 'none'} />{saved ? 'சேமிக்கப்பட்டது' : 'சேமிக்க'}</button><button type="button" onClick={share}>{shared ? <Check size={17} /> : <Share2 size={17} />}{shared ? 'இணைப்பு நகலெடுக்கப்பட்டது' : 'பகிர்'}</button></div>
    </div>
    {article.image && <figure className="fo-story-photo" data-fo-photo={article.id}><Photo article={article} priority /><figcaption>ஷபா நியூஸ் தமிழ்</figcaption></figure>}
    <div className="fo-story-body">{article.body.split(/\n+/).filter(Boolean).map((paragraph, index) => <p key={index}>{paragraph}</p>)}
      {!originalView && /^(https?:\/\/|\/)/i.test(sourceHref) && <a className="fo-source" href={sourceHref} target={localSource ? undefined : '_blank'} rel={localSource ? undefined : 'noreferrer'}>மூலச் செய்தி <ArrowUpRight size={17} /></a>}
    </div>
  </article>;
}

export default function Folio({edition, articles, articleId, originalView = false}: FolioProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const firstInput = useRef<HTMLInputElement>(null);
  const opener = useRef<HTMLButtonElement | null>(null);
  const [panel, setPanel] = useState<'search' | 'menu'>('search');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('அனைத்தும்');
  const [district, setDistrict] = useState('அனைத்து மாவட்டங்கள்');
  const [showSaved, setShowSaved] = useState(false);
  const [saved, setSaved] = useState<string[]>([]);
  const preview = useSyncExternalStore(subscribeLocation, () => new URLSearchParams(window.location.search).get('preview') === 'draft' ? '?preview=draft' : '', () => '');
  useEffect(() => {try {setSaved(JSON.parse(localStorage.getItem('shaba-saved-stories') || '[]'));} catch { /* Storage is optional. */ }}, []);
  useEffect(() => {const params = new URLSearchParams(window.location.search); setCategory(params.get('category') || 'அனைத்தும்'); setShowSaved(params.get('saved') === '1');}, []);
  const map = new Map(articles.map(article => [article.id, article]));
  const sections = edition.sections.filter(section => section.visible).map(section => ({section, items: section.articleIds.map(id => map.get(id)).filter((article): article is Article => Boolean(article))}));
  const editionArticles = [...new Map(sections.flatMap(({items}) => items).map(article => [article.id, article])).values()];
  const latest = [...editionArticles].sort((a, b) => b.date.localeCompare(a.date));
  const lead = sections.find(({section}) => section.type === 'lead')?.items || latest;
  const hero = lead[0] || latest[0];
  const categories = ['அனைத்தும்', ...new Set(editionArticles.map(article => article.category))];
  const districts = ['அனைத்து மாவட்டங்கள்', ...new Set(editionArticles.map(article => article.district).filter(Boolean))];
  const filtered = latest.filter(article => (category === 'அனைத்தும்' || article.category === category) && (district === 'அனைத்து மாவட்டங்கள்' || article.district === district) && (!showSaved || saved.includes(article.id)));
  const story = articleId ? map.get(articleId) : undefined;
  const related = story ? latest.filter(item => item.id !== story.id).sort((a, b) => Number(b.category === story.category) - Number(a.category === story.category)).slice(0, 3) : [];
  const search = query.trim().toLocaleLowerCase('ta-IN');
  const results = latest.filter(article => [article.title, article.summary, article.district, article.category, article.author].some(field => field.toLocaleLowerCase('ta-IN').includes(search)));
  const home = `${siteBase}/folio${staticSite ? '/' : ''}${preview}`;
  const browseHref = (key: 'category' | 'saved', value: string) => `${siteBase}/folio${staticSite ? '/' : ''}?${key}=${encodeURIComponent(value)}${preview ? '&preview=draft' : ''}#fo-latest`;
  function openPanel(next: typeof panel, button: HTMLButtonElement) {
    opener.current = button; setPanel(next); setQuery(''); dialog.current?.showModal();
    requestAnimationFrame(() => {if (next === 'search') firstInput.current?.focus(); else dialog.current?.querySelector<HTMLAnchorElement>('nav a')?.focus();});
  }
  function toggleSaved(id: string) {
    setSaved(current => {
      const next = current.includes(id) ? current.filter(item => item !== id) : [...current, id];
      try {localStorage.setItem('shaba-saved-stories', JSON.stringify(next));} catch { /* Storage is optional. */ }
      return next;
    });
  }
  return <div className="fo-root" data-density={edition.density} style={{'--fo-accent': edition.accent} as CSSProperties} lang="ta">
    <a className="fo-skip" href="#fo-main">உள்ளடக்கத்திற்குச் செல்ல</a>
    <div className="fo-utility"><div className="fo-wrap"><span>தமிழகத்தின் குரல். உங்கள் ஊரின் செய்திகள்.</span><span lang="en">SHABA NEWS TAMIL</span></div></div>
    <header className="fo-header"><div className="fo-wrap fo-header-inner"><a className="fo-home" href={home} aria-label="ஷபா நியூஸ் தமிழ் முதற்பக்கம்"><Wordmark /></a><span className="fo-header-line">உண்மையை உரக்கச் சொல்வோம்</span><div className="fo-tools"><button type="button" className="fo-search-btn" onClick={event => openPanel('search', event.currentTarget)}><Search size={18} /><span>தேடுக</span></button><button type="button" className="fo-menu-btn" aria-label="பட்டியல்" onClick={event => openPanel('menu', event.currentTarget)}><Menu size={22} /></button></div></div></header>
    <nav className="fo-nav" aria-label="செய்திப் பிரிவுகள்"><div className="fo-wrap"><a href={home} className={!articleId ? 'fo-current' : ''}>முகப்பு</a><a href={`${home}#fo-latest`}>அண்மைச் செய்திகள்</a>{categories.slice(1, 6).map(item => <a key={item} href={browseHref('category', item)}>{item}</a>)}<a href={browseHref('saved', '1')}>சேமித்தவை</a></div></nav>
    <main id="fo-main" className="fo-wrap fo-main" tabIndex={-1}>{articleId ? story ? <><Story article={story} preview={preview} originalView={originalView} saved={saved.includes(story.id)} onSave={() => toggleSaved(story.id)} />{related.length > 0 && <section className="fo-related" aria-labelledby="fo-related-title"><div className="fo-section-heading"><h2 id="fo-related-title">தொடர்புடைய செய்திகள்</h2><span /></div><div className="fo-grid">{related.map(item => <StoryCard key={item.id} article={item} preview={preview} />)}</div></section>}</> : <section className="fo-empty"><h1>செய்தி கிடைக்கவில்லை</h1><a href={home}>முகப்பிற்குத் திரும்ப</a></section> : <>
      <div className="fo-page-date"><span><i />செய்தித் தொகுப்பு</span>{latest[0] && <time dateTime={latest[0].date}>கடைசிப் பதிவு · {formatDate(latest[0].date)}</time>}</div>
      {hero && <section className="fo-lead" aria-labelledby="fo-lead-heading"><div className="fo-lead-head"><span className="fo-eyebrow">முக்கியச் செய்திகள்</span><h1 id="fo-lead-heading">தமிழகச் செய்திகள்,<br /><em>உங்கள் பார்வையில்.</em></h1><p>உங்கள் ஊரில் நடக்கும் முக்கிய நிகழ்வுகள் — தெளிவாகவும் எளிதாகவும்.</p></div><div className="fo-lead-grid"><StoryCard article={hero} preview={preview} variant="hero" priority /><div className="fo-lead-side">{lead.filter(item => item.id !== hero.id).slice(0, 2).map(item => <StoryCard key={item.id} article={item} preview={preview} variant="compact" />)}<div className="fo-lead-note"><span className="fo-eyebrow">ஷபா நியூஸ்</span><p>ஊரின் கதை<br />உங்களிடம்.</p><a href="#fo-latest">மேலும் வாசிக்க <ArrowRight size={17} /></a></div></div></div></section>}
      <section id="fo-latest" className="fo-latest" aria-labelledby="fo-latest-title"><div className="fo-section-heading"><div><span className="fo-eyebrow">THE NEWSROOM</span><h2 id="fo-latest-title">{showSaved ? 'சேமித்த செய்திகள்' : 'அண்மைச் செய்திகள்'}</h2></div><span /></div><div className="fo-filter-bar"><div className="fo-category-tabs" aria-label="செய்தி வகை">{categories.map(item => <button type="button" key={item} aria-pressed={category === item} onClick={() => setCategory(item)}>{item}</button>)}</div><div className="fo-filter-tools"><label className="fo-district"><MapPin size={15} /><select aria-label="மாவட்டம்" value={district} onChange={event => setDistrict(event.target.value)}>{districts.map(item => <option key={item}>{item}</option>)}</select></label><button type="button" className="fo-saved-filter" aria-pressed={showSaved} onClick={() => setShowSaved(value => !value)}><Bookmark size={16} fill={showSaved ? 'currentColor' : 'none'} />சேமித்தவை</button></div></div><div className="fo-news-layout"><div className="fo-news-list">{filtered.map(item => <StoryCard key={item.id} article={item} preview={preview} variant="row" />)}{!filtered.length && <p className="fo-empty">இந்தத் தேர்வில் செய்திகள் எதுவும் இல்லை.</p>}</div><aside className="fo-sidebar"><div className="fo-sidebar-title"><span className="fo-eyebrow">LATEST UPDATES</span><h3>புதிய பதிவுகள்</h3></div>{latest.slice(0, 5).map((item, index) => <a key={item.id} href={storyHref(item.id, preview)}><span>{String(index + 1).padStart(2, '0')}</span><b>{item.title}</b><ChevronRight size={16} /></a>)}</aside></div></section>
    </>}</main>
    <footer className="fo-footer" id="fo-content-ready"><div className="fo-wrap"><div><a href={home}><Wordmark /></a><p>உங்கள் ஊரின் செய்திகள், உங்கள் மொழியில்.</p></div><a href="#fo-main">மேலே செல்ல <ArrowRight size={16} /></a></div></footer>
    <dialog ref={dialog} className="fo-dialog" aria-labelledby="fo-dialog-title" onClose={() => opener.current?.focus()} onClick={event => {if (event.target === event.currentTarget) dialog.current?.close();}}><div className="fo-dialog-body"><div className="fo-dialog-head"><h2 id="fo-dialog-title">{panel === 'search' ? 'செய்திகளைத் தேடுக' : 'செய்திப் பிரிவுகள்'}</h2><button type="button" aria-label="மூடுக" onClick={() => dialog.current?.close()}><X size={21} /></button></div>{panel === 'search' ? <><label className="fo-input"><Search size={19} /><input ref={firstInput} type="search" autoComplete="off" aria-label="தலைப்பு, இடம் அல்லது பிரிவு" placeholder="தலைப்பு, இடம் அல்லது பிரிவு…" value={query} onChange={event => setQuery(event.target.value)} /></label><span className="fo-sr" role="status">{results.length} செய்திகள்</span><div className="fo-results">{results.map(item => <a key={item.id} href={storyHref(item.id, preview)}><span><small>{item.category} · {item.district}</small>{item.title}</span><ArrowUpRight size={17} /></a>)}{!results.length && <p>செய்திகள் எதுவும் கிடைக்கவில்லை.</p>}</div></> : <nav className="fo-results" aria-label="செய்திப் பிரிவுகள்"><a href={home} onClick={() => dialog.current?.close()}>முகப்பு <ArrowRight size={16} /></a>{categories.slice(1).map(item => <a key={item} href={browseHref('category', item)}>{item}<ArrowRight size={16} /></a>)}</nav>}</div></dialog>
  </div>;
}
