import { useEffect, useState, type RefObject } from 'react';
import { Platform } from 'react-native';

/** Settings the website sends into the demo. */
export interface DemoConfig {
  theme: 'light' | 'dark';
  preset: 'none' | 'minimal' | 'compact' | 'vibrant' | 'fullWidth';
  collapseMode: 'icons' | 'hide' | 'none';
  actionButton: boolean;
  placement: 'center' | 'start' | 'end';
}

const DEFAULTS: DemoConfig = {
  theme: 'dark',
  preset: 'none',
  collapseMode: 'icons',
  actionButton: false,
  placement: 'center',
};

function fromUrl(): Partial<DemoConfig> {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return {};
  const q = new URLSearchParams(window.location.search);
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(DEFAULTS)) {
    const v = q.get(key);
    if (v !== null) out[key] = key === 'actionButton' ? v === 'true' : v;
  }
  if (
    !q.get('theme') &&
    window.matchMedia?.('(prefers-color-scheme: light)').matches
  ) {
    out.theme = 'light';
  }
  return out as Partial<DemoConfig>;
}

/** Reads settings from the URL, then follows postMessage updates from the page. */
export function useDemoConfig(): DemoConfig {
  const [config, setConfig] = useState<DemoConfig>(() => ({
    ...DEFAULTS,
    ...fromUrl(),
  }));
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      const data = e.data as { type?: string; config?: Partial<DemoConfig> };
      if (data?.type === 'stb-config' && data.config) {
        setConfig((c) => ({ ...c, ...data.config }));
      }
    };
    window.addEventListener('message', onMessage);
    window.parent?.postMessage({ type: 'stb-ready' }, window.location.origin);
    return () => window.removeEventListener('message', onMessage);
  }, []);
  return config;
}

interface Scrollable {
  getScrollableNode?: () => HTMLElement | null;
}

/**
 * Lets a mouse drag a list like a finger, with a little momentum, so the
 * demo feels like a phone. Touch and trackpad scrolling are left alone.
 */
export function useMouseDragScroll(
  ref: RefObject<Scrollable | null>,
  axis: 'x' | 'y' = 'y'
) {
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const node = ref.current?.getScrollableNode?.();
    if (!node) return;
    let down = false;
    let moved = false;
    let start = 0;
    let startScroll = 0;
    let last = 0;
    let lastT = 0;
    let velocity = 0;
    let frame = 0;
    const pos = (e: PointerEvent) => (axis === 'y' ? e.clientY : e.clientX);
    const get = () => (axis === 'y' ? node.scrollTop : node.scrollLeft);
    const set = (v: number) => {
      if (axis === 'y') node.scrollTop = v;
      else node.scrollLeft = v;
    };
    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      cancelAnimationFrame(frame);
      down = true;
      moved = false;
      start = last = pos(e);
      startScroll = get();
      lastT = performance.now();
      velocity = 0;
    };
    const onMove = (e: PointerEvent) => {
      if (!down) return;
      const p = pos(e);
      if (!moved && Math.abs(p - start) < 6) return;
      moved = true;
      const now = performance.now();
      velocity = (last - p) / Math.max(now - lastT, 1);
      last = p;
      lastT = now;
      set(startScroll - (p - start));
      e.preventDefault();
    };
    const onUp = () => {
      if (!down) return;
      down = false;
      if (!moved) return;
      // A gentle glide: capped so a quick flick doesn't fling past half the feed.
      let v = Math.max(-28, Math.min(28, velocity * 16));
      const glide = () => {
        if (Math.abs(v) < 0.4) return;
        set(get() + v);
        v *= 0.94;
        frame = requestAnimationFrame(glide);
      };
      frame = requestAnimationFrame(glide);
    };
    // A drag shouldn't also count as a tap on whatever was under the cursor.
    const onClick = (e: MouseEvent) => {
      if (moved) {
        e.stopPropagation();
        e.preventDefault();
        moved = false;
      }
    };
    node.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove, { passive: false });
    window.addEventListener('pointerup', onUp);
    node.addEventListener('click', onClick, true);
    return () => {
      cancelAnimationFrame(frame);
      node.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      node.removeEventListener('click', onClick, true);
    };
  }, [ref, axis]);
}

/** A round "fingertip" cursor and no text selection, inside the phone. */
export function installTouchCursor(dark: boolean) {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;
  const fill = dark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.22)';
  const ring = dark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.45)';
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='28' height='28'><circle cx='14' cy='14' r='11' fill='${fill}' stroke='${ring}' stroke-width='1.5'/></svg>`;
  const css = `*{cursor:url("data:image/svg+xml,${encodeURIComponent(svg)}") 14 14, pointer !important;-webkit-user-select:none;user-select:none}html,body{overscroll-behavior:none}::-webkit-scrollbar{display:none}*{scrollbar-width:none}`;
  let el = document.getElementById('stb-touch') as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement('style');
    el.id = 'stb-touch';
    document.head.appendChild(el);
  }
  el.textContent = css;
}
