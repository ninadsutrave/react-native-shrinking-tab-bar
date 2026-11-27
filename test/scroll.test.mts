/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  DEFAULT_SCROLL_BEHAVIOR as B,
  stepScroll,
  type ScrollTracker,
} from '../src/scroll.ts';

// Feed a list of offsets through stepScroll and return the collapsed flags.
function run(offsets: number[], maxY = 5000, behavior = B, start = false) {
  let t: ScrollTracker = { lastY: 0, travel: 0 };
  let collapsed = start;
  return offsets.map((y) => {
    const s = stepScroll(t, collapsed, y, maxY, behavior);
    t = { lastY: s.lastY, travel: s.travel };
    collapsed = s.collapsed;
    return collapsed;
  });
}

test('stays expanded until downward travel passes collapseAfter', () => {
  assert.deepEqual(run([10, 30, 50, 57, 58]), [false, false, false, false, true]);
});

test('expands after upward travel passes expandAfter', () => {
  const r = run([100, 200, 190, 180, 176]);
  assert.deepEqual(r, [true, true, true, true, false]);
});

test('direction jitter does not flip the state', () => {
  // collapse, then small up/down wiggles below expandAfter
  const r = run([100, 200, 190, 200, 185, 195]);
  assert.deepEqual(r, [true, true, true, true, true, true]);
});

test('always expanded near the top', () => {
  assert.deepEqual(run([100, 200, 10], 5000, B), [true, true, false]);
});

test('ignores overscroll past both ends', () => {
  // iOS bounce: negative offsets and offsets beyond maxY are clamped.
  assert.deepEqual(run([-40, -10, 0]), [false, false, false]);
  const r = run([300, 1000, 1080, 1000], 1000);
  assert.deepEqual(r, [true, true, true, true]);
});

test('short content never collapses', () => {
  assert.deepEqual(run([5, 10, 12], 12), [false, false, false]);
});

test('expandAtEnd expands at the bottom of the list', () => {
  const r = run([300, 900, 1000], 1000, { ...B, expandAtEnd: true });
  assert.deepEqual(r, [true, true, false]);
});

test('external expand is respected until the user scrolls collapseAfter again', () => {
  let t: ScrollTracker = { lastY: 0, travel: 0 };
  let s = stepScroll(t, false, 300, 5000, B);
  assert.equal(s.collapsed, true);
  t = s;
  // something (tab change) expanded the bar; a small scroll must not re-collapse
  s = stepScroll(t, false, 310, 5000, B);
  assert.equal(s.collapsed, false);
  s = stepScroll(s, false, 360, 5000, B);
  assert.equal(s.collapsed, true);
});
