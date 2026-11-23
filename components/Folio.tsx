'use client';

import {useEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type PointerEvent} from 'react';
import {ArrowLeft, ArrowRight, ArrowUpRight, Bookmark, CalendarDays, Check, ChevronLeft, ChevronRight, Globe2, House, MapPin, Menu, Moon, Newspaper, Pause, Play, Printer, Search, Share2, Sun, Type, X} from 'lucide-react';
import type {Article, Edition} from '@/lib/model';
import originals from '@/lib/originals.json';
import './folio.css';

type Section = Edition['sections'][number];
type FolioProps = {edition: Edition; articles: Article[]; articleId?: string; originalView?: boolean};
const siteBase = process.env.NEXT_PUBLIC_SITE_BASE || '';
const staticSite = process.env.NEXT_PUBLIC_STATIC_SITE === '1';
const dateFormat = new Intl.DateTimeFormat('ta-IN', {day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata'});
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
  return <span className="fo-wordmark"><b><span>ஷபா</span> நியூஸ்</b><small lang="en"><i />SHABA NEWS TAMIL<i /></small></span>;
}
function Photo({article, priority = false}: {article: Article; priority?: boolean}) {
  const [failed, setFailed] = useState('');
  return article.image && failed !== article.image
    // eslint-disable-next-line @next/next/no-img-element -- Publisher photos and uploaded local images use their original URLs.
    ? <img src={article.image.startsWith('/') ? siteBase + article.image : article.image} alt="" loading={priority ? 'eager' : 'lazy'} fetchPriority={priority ? 'high' : 'auto'} onError={() => setFailed(article.image)} />
    : <span className="fo-photo-fallback" aria-hidden="true"><Newspaper size={40} strokeWidth={1} /></span>;
}
function Info({article}: {article: Article}) {
  return <span className="fo-info"><span>{article.category}</span><span><MapPin size={12} aria-hidden="true" />{article.district}</span></span>;
}
function tilt(event: PointerEvent<HTMLElement>) {
  if (event.pointerType !== 'mouse' || !matchMedia('(hover:hover) and (prefers-reduced-motion:no-preference)').matches || event.currentTarget.closest('[data-motion="off"]')) return;
  const bounds = event.currentTarget.getBoundingClientRect();
  event.currentTarget.style.setProperty('--tilt-x', `${(0.5 - (event.clientY - bounds.top) / bounds.height) * 5}deg`);
  event.currentTarget.style.setProperty('--tilt-y', `${((event.clientX - bounds.left) / bounds.width - 0.5) * 7}deg`);
}
function resetTilt(event: PointerEvent<HTMLElement>) {
  event.currentTarget.style.removeProperty('--tilt-x');
  event.currentTarget.style.removeProperty('--tilt-y');
}
function StoryCard({article, preview, feature = false}: {article: Article; preview: string; feature?: boolean}) {
  return <article className={`fo-card${feature ? ' fo-feature-card' : ''}`} onPointerMove={tilt} onPointerLeave={resetTilt}>
    <a href={storyHref(article.id, preview)} className="fo-card-link">
      <div className="fo-card-picture" data-folio-cursor="read" data-fo-photo={article.id}><Photo article={article} /></div>
      <div className="fo-card-text"><Info article={article} /><h3>{article.title}</h3>{article.summary && <p>{article.summary}</p>}
        <span className="fo-card-byline"><time dateTime={article.date}>{formatDate(article.date)}</time><ArrowUpRight size={18} aria-hidden="true" /></span>
      </div>
    </a>
  </article>;
}
function SectionHeading({title, count, number}: {title: string; count: number; number: number}) {
  return <div className="fo-section-heading"><span className="fo-section-number" aria-hidden="true">{String(number).padStart(2, '0')}</span><h2>{title}</h2><span className="fo-section-rule" /><span className="fo-section-count">{count} செய்திகள்</span></div>;
}
function Cover({section, articles, preview, number}: {section: Section; articles: Article[]; preview: string; number: number}) {
  const [index, setIndex] = useState(0);
  const active = Math.min(index, articles.length - 1);
  const story = articles[active];
  if (!story) return null;
  const choose = (step: number) => setIndex((active + step + articles.length) % articles.length);
  return <section id={`fo-${section.id}`} className="fo-collection fo-front" aria-label={section.title}>
    <SectionHeading title={section.title} count={articles.length} number={number} />
    <div className="fo-front-layout">
      <div className="fo-hero-scene" onPointerMove={tilt} onPointerLeave={resetTilt}>
        <div className="fo-hero-shadow" aria-hidden="true" /><div className="fo-hero-layer" aria-hidden="true" />
        <article className="fo-hero-card" key={story.id}>
          <a href={storyHref(story.id, preview)} className="fo-hero-link">
            <div className="fo-cover-picture" data-folio-cursor="read" data-fo-photo={story.id}><Photo article={story} priority /><span className="fo-hero-category"><Newspaper size={14} />{story.category}</span></div>
            <div className="fo-hero-copy"><span className="fo-hero-eyebrow">முக்கியச் செய்தி <span /> {story.district}</span><h3>{story.title}</h3><p>{story.summary}</p><span className="fo-hero-bottom"><time dateTime={story.date}>{formatDate(story.date)}</time><span>செய்தியை வாசிக்க <ArrowUpRight size={17} /></span></span></div>
          </a>
        </article>
        {articles.length > 1 && <div className="fo-hero-controls" aria-label="முகப்புச் செய்தித் தேர்வு"><div className="fo-hero-dots">{articles.map((item, position) => <button type="button" key={item.id} aria-label={`${position + 1}: ${item.title}`} aria-pressed={active === position} onClick={() => setIndex(position)} />)}</div><span aria-live="polite">{String(active + 1).padStart(2, '0')} <i>/ {String(articles.length).padStart(2, '0')}</i></span><button type="button" aria-label="முந்தைய முகப்புச் செய்தி" onClick={() => choose(-1)}><ChevronLeft size={18} /></button><button type="button" aria-label="அடுத்த முகப்புச் செய்தி" onClick={() => choose(1)}><ChevronRight size={18} /></button></div>}
      </div>
      <aside className="fo-briefing"><div className="fo-briefing-heading"><span className="fo-slashes" aria-hidden="true">///</span><h3>செய்திப் பார்வை</h3><span lang="en">IN BRIEF</span></div>{articles.filter(item => item.id !== story.id).map((item, position) => <a href={storyHref(item.id, preview)} key={item.id} className="fo-briefing-link"><span className="fo-briefing-number">{String(position + 1).padStart(2, '0')}</span><div><span className="fo-tag">{item.category}</span><h4>{item.title}</h4><span className="fo-briefing-meta">{item.district} · {formatDate(item.date)}</span></div><div className="fo-briefing-photo" data-fo-photo={item.id}><Photo article={item} /></div></a>)}<div className="fo-editor-note"><Globe2 size={23} strokeWidth={1} /><div><b>உங்கள் ஊர். உங்கள் குரல்.</b><p>நிகழ்வுகளின் பின்னணியையும் தெரிந்துகொள்ளுங்கள்.</p></div></div></aside>
    </div>
  </section>;
}
function Collection({section, articles, preview, number}: {section: Section; articles: Article[]; preview: string; number: number}) {
  return <section id={`fo-${section.id}`} className={`fo-collection fo-collection-${section.type}`} aria-label={section.title}><SectionHeading title={section.title} count={articles.length} number={number} />{articles.length ? <div className="fo-cards">{articles.map(article => <StoryCard key={article.id} article={article} preview={preview} feature={section.type === 'feature'} />)}</div> : <p className="fo-empty">இந்தப் பகுதியில் செய்திகள் எதுவும் இல்லை.</p>}</section>;
}

function Story({article, preview, originalView, saved, onSave}: {article: Article; preview: string; originalView: boolean; saved: boolean; onSave: () => void}) {
  const [textSize, setTextSize] = useState(1);
  const [sizeOpen, setSizeOpen] = useState(false);
  const [shareStatus, setShareStatus] = useState('');
  const [shareLink, setShareLink] = useState('');
  useEffect(() => {
    try {const size = Number(localStorage.getItem('shaba-text-size')); if ([0, 1, 2].includes(size) && localStorage.getItem('shaba-text-size') !== null) setTextSize(size);} catch { /* Reading preferences work without storage. */ }
  }, []);
  function chooseTextSize(size: number) {
    setTextSize(size); setSizeOpen(false);
    try {localStorage.setItem('shaba-text-size', String(size));} catch { /* Storage is optional. */ }
  }
  async function share() {
    const url = new URL(location.href); url.searchParams.delete('preview');
    setShareStatus(''); setShareLink('');
    if (navigator.share) {
      try {await navigator.share({title: article.title, url: url.href}); return;} catch (error) {if (error instanceof Error && error.name === 'AbortError') return;}
    }
    try {await navigator.clipboard.writeText(url.href); setShareStatus('இணைப்பு நகலெடுக்கப்பட்டது');}
    catch {setShareLink(url.href); setShareStatus('இணைப்பை நகலெடுத்துப் பகிரவும்');}
  }
  const original = originals[article.id as keyof typeof originals];
  const sourceHref = original?.sourceUrl === article.sourceUrl
    ? `${storyHref(article.id, '')}${staticSite ? 'original/' : '/original'}${preview}`
    : article.sourceUrl;
  const localSource = sourceHref.startsWith('/');
  return <article className="fo-story" data-text-size={textSize}><a className="fo-back" href={originalView ? storyHref(article.id, preview) : `${siteBase}/folio${staticSite ? '/' : ''}${preview}`}><ArrowLeft size={16} /> {originalView ? 'செய்திச் சுருக்கத்திற்குத் திரும்ப' : 'முதற்பக்கத்திற்குத் திரும்ப'}</a>
    <div className="fo-story-intro"><Info article={article} /><h1>{article.title}</h1>{article.summary && <p>{article.summary}</p>}
      <div className="fo-story-meta">{article.author && <span>{article.author}</span>}<time dateTime={article.date}>{formatDate(article.date)}</time><span className="fo-reading-time">{Math.max(1, Math.ceil(article.body.trim().split(/\s+/).length / 180))} நிமிட வாசிப்பு</span></div>
      <div className="fo-story-actions" aria-label="வாசிப்பு வசதிகள்">
        <button type="button" onClick={onSave} aria-pressed={saved}><Bookmark size={17} fill={saved ? 'currentColor' : 'none'} />{saved ? 'சேமிக்கப்பட்டது' : 'சேமிக்க'}</button>
        <button type="button" onClick={share}>{shareStatus === 'இணைப்பு நகலெடுக்கப்பட்டது' ? <Check size={17} /> : <Share2 size={17} />}பகிர்</button>
        <div className="fo-text-control"><button type="button" aria-expanded={sizeOpen} aria-controls="fo-text-sizes" onClick={() => setSizeOpen(value => !value)}><Type size={18} />எழுத்து அளவு</button>
          {sizeOpen && <div id="fo-text-sizes" className="fo-text-sizes" role="group" aria-label="எழுத்து அளவைத் தேர்ந்தெடுக்க">{['சிறியது', 'இயல்பு', 'பெரியது'].map((label, index) => <button type="button" key={label} aria-pressed={textSize === index} onClick={() => chooseTextSize(index)}>{label}</button>)}</div>}
        </div>
        <button type="button" onClick={() => window.print()}><Printer size={17} />அச்சிடு</button>
      </div>
      {shareStatus && <p className="fo-share-status" role="status">{shareStatus}</p>}
      {shareLink && <input className="fo-share-link" aria-label="பகிர வேண்டிய இணைப்பு" readOnly value={shareLink} onFocus={event => event.currentTarget.select()} />}
    </div>
    {article.image && <figure className="fo-story-photo" data-fo-photo={article.id}><Photo article={article} priority /></figure>}
    <div className="fo-story-body">{article.body.split(/\n+/).filter(Boolean).map((p, i) => <p key={i}>{p}</p>)}
      {!originalView && /^(https?:\/\/|\/)/i.test(sourceHref) && <a className="fo-source" href={sourceHref} target={localSource ? undefined : '_blank'} rel={localSource ? undefined : 'noreferrer'}>மூலச் செய்தி <ArrowUpRight size={16} /></a>}
    </div>
  </article>;
}



export default function Folio({edition, articles, articleId, originalView = false}: FolioProps) {
  const root = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const firstInput = useRef<HTMLInputElement>(null);
  const opener = useRef<HTMLButtonElement | null>(null);
  const [panel, setPanel] = useState<'search' | 'menu' | 'saved'>('search');
  const [query, setQuery] = useState('');
  const [saved, setSaved] = useState<string[]>([]);
  const [district, setDistrict] = useState('அனைத்தும்');
  const [theme, setTheme] = useState('light');
  const [motion, setMotion] = useState(true);
  const [headline, setHeadline] = useState(0);
  const [activeSection, setActiveSection] = useState('');
  useEffect(() => {
    try {
      const ids: unknown = JSON.parse(localStorage.getItem('shaba-saved-stories') || '[]');
      if (Array.isArray(ids)) setSaved(ids.filter((id): id is string => typeof id === 'string'));
      setTheme(localStorage.getItem('shaba-theme') === 'dark' ? 'dark' : 'light');
      setMotion(localStorage.getItem('shaba-motion') !== 'off');
    } catch { /* Reading preferences work without storage. */ }
    const selected = new URLSearchParams(location.search).get('district');
    if (selected && articles.some(item => item.district === selected)) setDistrict(selected);
  }, []);
  useEffect(() => {
    const node = root.current;
    if (!node) return;
    let frame = 0;
    const updateSection = () => {
      frame = 0;
      const current = [...node.querySelectorAll<HTMLElement>('.fo-collection')].filter(element => element.getBoundingClientRect().top < 145).at(-1);
      setActiveSection(current?.id || '');
    };
    const scroll = () => {if (!frame) frame = requestAnimationFrame(updateSection);};
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('fo-revealed');
      }
    }), {rootMargin: '-5% 0px -15% 0px', threshold: 0.08});
    node.querySelectorAll('.fo-collection').forEach(element => observer.observe(element));
    updateSection(); window.addEventListener('scroll', scroll, {passive:true});
    return () => {observer.disconnect(); cancelAnimationFrame(frame); window.removeEventListener('scroll', scroll);};
  }, [articleId, district]);
  useEffect(() => {
    if (!articleId) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const body = root.current?.querySelector('.fo-story-body');
      if (!body || !root.current) return;
      const bounds = body.getBoundingClientRect();
      const progress = Math.max(0, Math.min(1, (innerHeight - bounds.top) / Math.max(1, bounds.height + innerHeight * 0.4)));
      root.current.style.setProperty('--reading-progress', String(progress));
    };
    const scroll = () => {if (!frame) frame = requestAnimationFrame(update);};
    update(); window.addEventListener('scroll', scroll, {passive:true}); window.addEventListener('resize', scroll);
    return () => {cancelAnimationFrame(frame); window.removeEventListener('scroll', scroll); window.removeEventListener('resize', scroll);};
  }, [articleId]);
  function toggleSaved(id: string) {
    const next = saved.includes(id) ? saved.filter(item => item !== id) : [...saved, id];
    setSaved(next);
    try {localStorage.setItem('shaba-saved-stories', JSON.stringify(next));} catch { /* Storage is optional. */ }
  }
  function changeTheme() {const next = theme === 'light' ? 'dark' : 'light'; setTheme(next); try {localStorage.setItem('shaba-theme', next);} catch { /* Storage is optional. */ }}
  function changeMotion() {setMotion(!motion); try {localStorage.setItem('shaba-motion', motion ? 'off' : 'on');} catch { /* Storage is optional. */ }}
  const preview = useSyncExternalStore(subscribeLocation, () => new URLSearchParams(window.location.search).get('preview') === 'draft' ? '?preview=draft' : '', () => '');
  const map = new Map(articles.map(article => [article.id, article]));
  const sections = edition.sections.filter(section => section.visible).map(section => ({section, items: section.articleIds.map(id => map.get(id)).filter((article): article is Article => Boolean(article))}));
  const editionArticles = [...new Map(sections.flatMap(({items}) => items).map(article => [article.id, article])).values()];
  const latest = [...editionArticles].sort((a, b) => b.date.localeCompare(a.date));
  const currentHeadline = latest[headline % Math.max(1, latest.length)];
  const districts = ['அனைத்தும்', ...new Set(editionArticles.map(item => item.district).filter(Boolean))];
  const story = articleId ? map.get(articleId) : undefined;
  const related = story ? latest.filter(item => item.id !== story.id).sort((a, b) => Number(b.category === story.category) - Number(a.category === story.category)).slice(0, 3) : [];
  const search = query.trim().toLocaleLowerCase('ta-IN');
  const results = latest.filter(article => (panel !== 'saved' || saved.includes(article.id)) && [article.title, article.summary, article.district, article.category, article.author].some(field => field.toLocaleLowerCase('ta-IN').includes(search)));
  const home = `${siteBase}/folio${staticSite ? '/' : ''}${preview}`;
  function openPanel(next: typeof panel, button: HTMLButtonElement) {
    opener.current = button; setPanel(next); setQuery(''); dialog.current?.showModal();
    requestAnimationFrame(() => {if (next !== 'menu') firstInput.current?.focus(); else dialog.current?.querySelector<HTMLAnchorElement>('nav a')?.focus();});
  }
  return <div ref={root} className="fo-root" data-theme={theme} data-motion={motion ? 'on' : 'off'} data-density={edition.density} lang="ta">
    <a className="fo-skip" href="#fo-main">உள்ளடக்கத்திற்குச் செல்ல</a>
    <div className="fo-utility"><div className="fo-wrap"><span><CalendarDays size={13} />{latest[0] ? formatDate(latest[0].date) : 'ஷபா நியூஸ் தமிழ்'}</span><span><Globe2 size={13} />தமிழ்நாடு <i /> <span lang="en">THE DIGITAL EDITION</span></span></div></div>
    <header className="fo-header"><div className="fo-wrap fo-masthead"><button type="button" className="fo-menu-btn" onClick={event => openPanel('menu', event.currentTarget)} aria-label="பிரிவுகள் மற்றும் மாவட்டங்கள்"><Menu size={19} /><span>பிரிவுகள்</span></button><a href={home} className="fo-home" aria-label="ஷபா நியூஸ் தமிழ் முதற்பக்கம்"><Wordmark /></a><div className="fo-mast-tools"><button type="button" className="fo-theme-button" onClick={changeTheme} aria-label={theme === 'light' ? 'இரவு நிறத்திற்கு மாற்று' : 'பகல் நிறத்திற்கு மாற்று'}>{theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}</button><button type="button" className="fo-saved-btn" onClick={event => openPanel('saved', event.currentTarget)} aria-label="சேமித்த செய்திகள்"><Bookmark size={17} /><span>சேமித்தவை</span>{saved.length > 0 && <small>{saved.length}</small>}</button></div></div></header>
    <div className="fo-navigation"><div className="fo-wrap"><nav className="fo-nav" aria-label="செய்திப் பிரிவுகள்"><a href={home} className={!articleId && !activeSection ? 'fo-current' : ''}><House size={15} />முகப்பு</a>{sections.map(({section}) => <a key={section.id} href={`${home}#fo-${section.id}`} className={!articleId && activeSection === `fo-${section.id}` ? 'fo-current' : ''}>{section.title}</a>)}</nav><button type="button" className="fo-motion-button" onClick={changeMotion} aria-pressed={motion} aria-label={motion ? 'அசைவுகளை நிறுத்து' : 'அசைவுகளை இயக்கு'} title={motion ? 'அசைவுகளை நிறுத்து' : 'அசைவுகளை இயக்கு'}>{motion ? <Pause size={14} /> : <Play size={14} />}</button><button type="button" className="fo-search-btn" onClick={event => openPanel('search', event.currentTarget)} aria-label="செய்திகளைத் தேடுக"><Search size={17} /><span>தேடுக</span></button></div>{articleId && <div className="fo-reading-progress" aria-hidden="true" />}</div>
    <main id="fo-main" className="fo-wrap fo-main" tabIndex={-1}>{articleId ? story ? <><Story article={story} preview={preview} originalView={originalView} saved={saved.includes(story.id)} onSave={() => toggleSaved(story.id)} />{related.length > 0 && <section className="fo-collection fo-related"><SectionHeading title="தொடர்ந்து வாசிக்க" count={related.length} number={1} /><div className="fo-cards">{related.map(item => <StoryCard key={item.id} article={item} preview={preview} />)}</div></section>}</> : <section className="fo-empty"><h1>செய்தி கிடைக்கவில்லை</h1><a href={home}>முகப்பிற்குத் திரும்ப</a></section> : <>
      <h1 className="fo-sr">ஷபா நியூஸ் தமிழ் — தமிழகத்தின் செய்திகள்</h1>
      {currentHeadline && <div className="fo-headlines"><span className="fo-headline-label"><i />புதியவை</span><a href={storyHref(currentHeadline.id, preview)} key={currentHeadline.id}>{currentHeadline.title}</a><div><button type="button" aria-label="முந்தைய தலைப்பு" onClick={() => setHeadline((headline + latest.length - 1) % latest.length)}><ChevronLeft size={15} /></button><button type="button" aria-label="அடுத்த தலைப்பு" onClick={() => setHeadline((headline + 1) % latest.length)}><ChevronRight size={15} /></button></div></div>}
      <div className="fo-districts"><span><MapPin size={14} />உங்கள் மாவட்டம்</span><div role="group" aria-label="மாவட்டச் செய்திகள்">{districts.map(item => <button type="button" key={item} aria-pressed={district === item} onClick={() => setDistrict(item)}>{item}</button>)}</div><span className="fo-edition-label" lang="en">NEWS. CONTEXT. PERSPECTIVE.</span></div>
      {district !== 'அனைத்தும்' && <div className="fo-filter-notice" role="status">{district} மாவட்டச் செய்திகள் <button type="button" onClick={() => setDistrict('அனைத்தும்')}>அனைத்தையும் காண்க <X size={13} /></button></div>}
      {sections.map(({section, items}, position) => {
        const filtered = items.filter(item => district === 'அனைத்தும்' || item.district === district);
        if (district !== 'அனைத்தும்' && !filtered.length) return null;
        return section.type === 'lead' && filtered.length
          ? <Cover key={`${section.id}-${district}`} section={section} articles={filtered} preview={preview} number={position + 1} />
          : <Collection key={section.id} section={section} articles={filtered} preview={preview} number={position + 1} />;
      })}
    </>}</main>
    <footer className="fo-footer" id="fo-content-ready"><div className="fo-wrap"><a href={home}><Wordmark /></a><p>உங்கள் ஊரின் செய்திகள்.<br />உலகத்தைப் பார்க்கும் புதிய பார்வை.</p><a href="#fo-main">மேலே செல்ல <ArrowUpRight size={17} /></a></div><div className="fo-wrap fo-footer-bottom"><span>ஷபா நியூஸ் தமிழ்</span><span lang="en">INDEPENDENT SPIRIT. LOCAL VOICE.</span></div></footer>
    <dialog ref={dialog} className="fo-dialog" aria-labelledby="fo-dialog-title" onClose={() => opener.current?.focus()} onClick={event => {if (event.target === event.currentTarget) dialog.current?.close();}}><div className="fo-dialog-body"><div className="fo-dialog-head"><h2 id="fo-dialog-title">{panel === 'saved' ? 'சேமித்த செய்திகள்' : panel === 'search' ? 'செய்திகளைத் தேடுக' : 'பிரிவுகள் மற்றும் மாவட்டங்கள்'}</h2><button type="button" aria-label="மூடுக" onClick={() => dialog.current?.close()}><X size={21} /></button></div>{panel !== 'menu' ? <><label className="fo-input"><Search size={19} /><input ref={firstInput} type="search" autoComplete="off" aria-label="தலைப்பு, இடம் அல்லது பிரிவு" placeholder="தலைப்பு, இடம் அல்லது பிரிவு…" value={query} onChange={event => setQuery(event.target.value)} /></label><span className="fo-sr" role="status">{results.length} செய்திகள்</span><div className="fo-results">{results.map(item => <a key={item.id} href={storyHref(item.id, preview)}><span><small>{item.category} · {item.district}</small>{item.title}</span><ArrowUpRight size={17} /></a>)}{!results.length && <p role="status">{panel === 'saved' ? 'நீங்கள் சேமிக்கும் செய்திகள் இங்கே தோன்றும்.' : 'செய்திகள் எதுவும் கிடைக்கவில்லை.'}</p>}</div></> : <><nav className="fo-results" aria-label="செய்திப் பிரிவுகள்"><a href={home} onClick={() => dialog.current?.close()}>முகப்பு <ArrowRight size={16} /></a>{sections.map(({section}) => <a href={`${home}#fo-${section.id}`} key={section.id} onClick={() => dialog.current?.close()}>{section.title}<ArrowRight size={16} /></a>)}</nav><div className="fo-menu-districts"><h3>மாவட்டங்கள்</h3>{districts.slice(1).map(item => <a key={item} href={`${siteBase}/folio${staticSite ? '/' : ''}?district=${encodeURIComponent(item)}${preview ? '&preview=draft' : ''}#fo-main`} onClick={() => dialog.current?.close()}>{item}<ArrowUpRight size={14} /></a>)}</div></>}</div></dialog>
  </div>;
}
