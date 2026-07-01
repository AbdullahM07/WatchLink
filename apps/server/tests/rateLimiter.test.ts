import { beforeEach, describe, expect, it, vi } from 'vitest';
import { allow, clearForSocket } from '../src/realtime/rateLimiter';

describe('rateLimiter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('allows up to the configured number of points within the window', () => {
    for (let i = 0; i < 3; i++) {
      expect(allow('socketA:chat', 3, 1000)).toBe(true);
    }
  });

  it('rejects once the point budget is exhausted', () => {
    for (let i = 0; i < 3; i++) allow('socketB:chat', 3, 1000);
    expect(allow('socketB:chat', 3, 1000)).toBe(false);
  });

  it('replenishes points once the window elapses', () => {
    for (let i = 0; i < 3; i++) allow('socketC:chat', 3, 1000);
    expect(allow('socketC:chat', 3, 1000)).toBe(false);

    vi.advanceTimersByTime(1001);

    expect(allow('socketC:chat', 3, 1000)).toBe(true);
  });

  it('tracks separate keys independently', () => {
    for (let i = 0; i < 3; i++) allow('socketD:chat', 3, 1000);
    expect(allow('socketD:chat', 3, 1000)).toBe(false);
    expect(allow('socketD:reaction', 3, 1000)).toBe(true);
  });

  it('clearForSocket drops every bucket for that socket only', () => {
    for (let i = 0; i < 3; i++) allow('socketE:chat', 3, 1000);
    allow('socketF:chat', 3, 1000);
    expect(allow('socketE:chat', 3, 1000)).toBe(false);

    clearForSocket('socketE');

    expect(allow('socketE:chat', 3, 1000)).toBe(true);
    // socketF's bucket is untouched.
    expect(allow('socketF:chat', 3, 1000)).toBe(true);
    expect(allow('socketF:chat', 3, 1000)).toBe(true);
    expect(allow('socketF:chat', 3, 1000)).toBe(false);
  });
});
