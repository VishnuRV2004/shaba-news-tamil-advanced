'use client';

import {useEffect, useRef} from 'react';
import {ArrowUpRight} from 'lucide-react';
import './folio-cursor.css';

export default function FolioCursor() {
  const lens = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const cue = lens.current;
    if (!cue) return;
    const media = window.matchMedia('(any-hover: hover) and (any-pointer: fine) and (prefers-reduced-motion: no-preference) and (forced-colors: none)');
    let active: HTMLElement | null = null;
    let point: {x: number; y: number} | null = null;
    let frame = 0;

    const hide = (soft = false) => {
      if (soft && active) cue.setAttribute('data-exiting', '');
      if (!soft) cue.removeAttribute('data-exiting');
      active?.removeAttribute('data-fo-lens');
      active = null;
      cue.removeAttribute('data-visible');
      cue.removeAttribute('data-pressed');
    };
    function reset() {
      point = null;
      hide();
    }

    const paint = (target: Element | null, softExit = false) => {
      const photo = target?.closest<HTMLElement>('.fo-root [data-folio-cursor="read"]');
      if (!point || !photo?.closest('a[href]') || photo.closest('[data-motion="off"]')) {
        hide(softExit);
        return;
      }
      if (active !== photo) {
        active?.removeAttribute('data-fo-lens');
        active = photo;
        photo.setAttribute('data-fo-lens', '');
      }
      cue.removeAttribute('data-exiting');
      cue.style.transform = `translate3d(${point.x}px,${point.y}px,0)`;
      cue.toggleAttribute('data-visible', true);
    };

    const track = (event: PointerEvent) => {
      if (!media.matches || event.pointerType !== 'mouse' || (event.buttons & ~1) !== 0) {
        reset();
        return;
      }
      point = {x: event.clientX, y: event.clientY};
      paint(event.target instanceof Element ? event.target : null, event.type === 'pointerover' || event.type === 'pointermove');
      cue.toggleAttribute('data-pressed', Boolean(active && (event.buttons & 1)));
    };

    function onScroll() {
      if (!point || frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        if (point) paint(document.elementFromPoint(point.x, point.y));
      });
    }

    const controller = new AbortController();
    const options = {signal: controller.signal, passive: true};
    for (const event of ['pointerover', 'pointermove', 'pointerdown', 'pointerup'] as const) window.addEventListener(event, track, options);
    for (const event of ['blur', 'keydown', 'pointercancel', 'pagehide', 'pageshow', 'pageswap', 'popstate']) window.addEventListener(event, reset, options);
    window.addEventListener('click', reset, {...options, capture: true});
    window.addEventListener('scroll', onScroll, {...options, capture: true});
    window.addEventListener('resize', onScroll, options);
    document.documentElement.addEventListener('pointerleave', reset, options);
    document.addEventListener('visibilitychange', reset, options);
    media.addEventListener('change', reset, options);
    cue.addEventListener('animationend', event => {
      if (event.animationName === 'fo-lens-exit') cue.removeAttribute('data-exiting');
    }, options);
    return () => {
      controller.abort();
      window.cancelAnimationFrame(frame);
      reset();
    };
  }, []);

  return <span className="fo-cursor" ref={lens} aria-hidden="true">
    <span className="fo-cursor-disc"><ArrowUpRight size={19} strokeWidth={1.7} /></span>
  </span>;
}
