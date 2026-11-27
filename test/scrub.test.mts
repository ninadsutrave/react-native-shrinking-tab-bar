/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isScrubGesture, slotAtX } from '../src/scrub.ts';

// 4 tabs of 80pt, bar centred at x = 200, no shift: tab centres at 80, 160, 240, 320.
const at = (x: number, shift = 0, itemW = 80) => slotAtX(x, 200, shift, itemW, 4);

test('tab centres map to whole slots', () => {
  assert.equal(at(80), 0);
  assert.equal(at(160), 1);
  assert.equal(at(240), 2);
  assert.equal(at(320), 3);
});

test('between two tabs gives a fraction', () => {
  assert.equal(at(200), 1.5);
});

test('positions past either end are clamped', () => {
  assert.equal(at(-500), 0);
  assert.equal(at(900), 3);
});

test('follows the bar when it shifts and shrinks', () => {
  // collapsed to 60pt tabs and anchored 40pt left: centres at 70, 130, 190, 250
  assert.equal(at(70, -40, 60), 0);
  assert.equal(at(250, -40, 60), 3);
});

test('a single tab is always slot 0', () => {
  assert.equal(slotAtX(999, 200, 0, 80, 1), 0);
});

test('only clearly horizontal drags count as scrubs', () => {
  assert.equal(isScrubGesture(4, 0), false); // too short: still a tap
  assert.equal(isScrubGesture(20, 2), true);
  assert.equal(isScrubGesture(20, 18), false); // diagonal: leave it alone
  assert.equal(isScrubGesture(-20, 3), true);
});
