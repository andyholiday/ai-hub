// =============================================================================
// Tests: useOrbWander Hook (Pattern P3.1, ADR-007)
// Coverage target: >= 80% on src/components/features/ai-orb/use-orb-wander.ts
// =============================================================================

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// ---------------------------------------------------------------------------
// Framer Motion mock — useMotionValue and useSpring return plain objects
// with get/set so we can inspect target values synchronously.
// ---------------------------------------------------------------------------

vi.mock('framer-motion', () => {
  function makeMotionValue(initial: number) {
    let val = initial;
    return {
      get: () => val,
      set: (v: number) => { val = v; },
    };
  }

  return {
    useMotionValue: (initial: number) => makeMotionValue(initial),
    // useSpring passes through the same MotionValue for test purposes
    useSpring: (mv: ReturnType<typeof makeMotionValue>) => mv,
  };
});

// ---------------------------------------------------------------------------
// Globals setup helpers
// ---------------------------------------------------------------------------

function setupMatchMedia(reducedMotion: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn((query: string) => ({
      matches: reducedMotion && query === '(prefers-reduced-motion: reduce)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

// Mutable references shared between the mock class and tests
let _observeMock = vi.fn();
let _disconnectMock = vi.fn();
let _savedCallback: IntersectionObserverCallback | null = null;

function setupIntersectionObserver() {
  _observeMock = vi.fn();
  _disconnectMock = vi.fn();
  _savedCallback = null;

  // Use a real class so `new IntersectionObserver(cb)` works
  class MockIO {
    constructor(cb: IntersectionObserverCallback) {
      _savedCallback = cb;
    }
    observe = _observeMock;
    disconnect = _disconnectMock;
    unobserve = vi.fn();
  }

  Object.defineProperty(window, 'IntersectionObserver', {
    writable: true,
    configurable: true,
    value: MockIO,
  });

  return {
    get observeMock() { return _observeMock; },
    get disconnectMock() { return _disconnectMock; },
    triggerIntersection(entries: Partial<IntersectionObserverEntry>[]) {
      if (_savedCallback) {
        _savedCallback(entries as IntersectionObserverEntry[], {} as IntersectionObserver);
      }
    },
  };
}

function setupRequestAnimationFrame() {
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    cb(0);
    return 0;
  });
}

function setupWindowSize(width = 1024, height = 768) {
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: width });
  Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: height });
}

// ---------------------------------------------------------------------------
// Import under test (after mocks are declared)
// ---------------------------------------------------------------------------

import { useOrbWander } from '@/components/features/ai-orb/use-orb-wander';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useOrbWander', () => {
  beforeEach(() => {
    setupWindowSize(1024, 768);
    setupRequestAnimationFrame();
    setupMatchMedia(false);
    setupIntersectionObserver();

    // Default: no anchors in DOM
    vi.spyOn(document, 'querySelectorAll').mockReturnValue(
      [] as unknown as NodeListOf<HTMLElement>,
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  // -------------------------------------------------------------------------
  // 1. prefers-reduced-motion → static position {x:0, y:0}
  // -------------------------------------------------------------------------
  it('returns static position {x:0, y:0} when prefers-reduced-motion is reduce', () => {
    setupMatchMedia(true);

    const { result } = renderHook(() => useOrbWander());

    // Hook bails out early — targetX/Y stay at 0 (useMotionValue initialises to 0)
    expect(result.current.x.get()).toBe(0);
    expect(result.current.y.get()).toBe(0);
  });

  // -------------------------------------------------------------------------
  // 2. No reduced motion → initial target is dock position (bottom-right)
  // -------------------------------------------------------------------------
  it('initialises to dock position (bottom-right) when no anchor is visible', () => {
    const { result } = renderHook(() => useOrbWander());

    // window 1024×768, ORB_SIZE=64, offset=28 → 1024-64-28=932, 768-64-28=676
    expect(result.current.x.get()).toBe(932);
    expect(result.current.y.get()).toBe(676);
  });

  // -------------------------------------------------------------------------
  // 3. IntersectionObserver cleanup on unmount
  // -------------------------------------------------------------------------
  it('disconnects IntersectionObserver on unmount', () => {
    const io = setupIntersectionObserver();

    const { unmount } = renderHook(() => useOrbWander());
    unmount();

    expect(io.disconnectMock).toHaveBeenCalledOnce();
  });

  // -------------------------------------------------------------------------
  // 4. Max 3 targets observed even when 5 anchors exist in the DOM
  // -------------------------------------------------------------------------
  it('observes at most 3 anchor targets even when 5 are present', () => {
    const io = setupIntersectionObserver();

    const fakeAnchors = Array.from({ length: 5 }, (_, i) => {
      const el = document.createElement('div');
      el.dataset['orbAnchor'] = String(i);
      return el;
    });

    vi.spyOn(document, 'querySelectorAll').mockReturnValue(
      fakeAnchors as unknown as NodeListOf<HTMLElement>,
    );

    renderHook(() => useOrbWander());

    expect(io.observeMock).toHaveBeenCalledTimes(3);
  });

  // -------------------------------------------------------------------------
  // 5. Cursor within repulsion radius → push-away vector applied
  // -------------------------------------------------------------------------
  it('applies push-away vector when cursor is within 80px of orb center', () => {
    const { result } = renderHook(() => useOrbWander());

    // After init: dock at (932, 676). Orb center = (932+32, 676+32) = (964, 708)
    // Cursor 40px above center: (964, 668) — dist = 40 < 80 → repulsion
    const initialY = result.current.y.get();

    act(() => {
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 964, clientY: 668 }));
    });

    // Y should increase (orb pushed downward, away from cursor above)
    expect(result.current.y.get()).toBeGreaterThan(initialY);
  });

  // -------------------------------------------------------------------------
  // 6. Cursor outside repulsion radius → no push (target unchanged)
  // -------------------------------------------------------------------------
  it('does not push when cursor is farther than 80px from orb center', () => {
    const { result } = renderHook(() => useOrbWander());

    const initialX = result.current.x.get();
    const initialY = result.current.y.get();

    // Cursor far away (top-left corner, >>80px from dock at bottom-right)
    act(() => {
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 100, clientY: 100 }));
    });

    expect(result.current.x.get()).toBe(initialX);
    expect(result.current.y.get()).toBe(initialY);
  });

  // -------------------------------------------------------------------------
  // 7. Viewport clamping — x stays within [0, innerWidth - ORB_SIZE]
  // -------------------------------------------------------------------------
  it('clamps x target to [0, innerWidth - ORB_SIZE]', () => {
    // tiny window: dock x = 100-64-28=8, orb center x = 40
    setupWindowSize(100, 768);

    const { result } = renderHook(() => useOrbWander());

    // Cursor at x=80 (within 80px of orb center x=40, dist=40)
    act(() => {
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 80, clientY: 708 }));
    });

    expect(result.current.x.get()).toBeGreaterThanOrEqual(0);
    expect(result.current.x.get()).toBeLessThanOrEqual(100 - 64);
  });

  // -------------------------------------------------------------------------
  // 7b. Viewport clamping — y stays within [0, innerHeight - ORB_SIZE]
  // -------------------------------------------------------------------------
  it('clamps y target to [0, innerHeight - ORB_SIZE]', () => {
    // tiny height: dock y = 100-64-28=8, orb center y = 40
    setupWindowSize(1024, 100);

    const { result } = renderHook(() => useOrbWander());

    // Cursor at y=60 (within 80px of orb center y=40, dist=20)
    act(() => {
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 964, clientY: 60 }));
    });

    expect(result.current.y.get()).toBeGreaterThanOrEqual(0);
    expect(result.current.y.get()).toBeLessThanOrEqual(100 - 64);
  });

  // -------------------------------------------------------------------------
  // 8. SSR safety — hook does not access window outside useEffect
  // In jsdom, window always exists. We verify SSR safety by confirming the
  // hook renders without error in a normal environment (all window access is
  // inside useEffect, which only runs client-side). The typeof window guard
  // in the hook prevents server-side execution.
  // -------------------------------------------------------------------------
  it('renders without error in jsdom (SSR guard is inside useEffect — no window access at render time)', () => {
    expect(() => renderHook(() => useOrbWander())).not.toThrow();
  });

  // -------------------------------------------------------------------------
  // 9. mousemove listener removed on unmount
  // -------------------------------------------------------------------------
  it('removes mousemove listener on unmount', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() => useOrbWander());
    unmount();

    expect(removeSpy).toHaveBeenCalledWith('mousemove', expect.any(Function));
  });

  // -------------------------------------------------------------------------
  // 10. IntersectionObserver: anchor becomes visible → target moves to anchor
  // -------------------------------------------------------------------------
  it('moves target to anchor center when an anchor becomes visible', () => {
    const io = setupIntersectionObserver();

    const anchor = document.createElement('div');
    anchor.dataset['orbAnchor'] = 'section-1';
    vi.spyOn(document, 'querySelectorAll').mockReturnValue(
      [anchor] as unknown as NodeListOf<HTMLElement>,
    );

    // Stub getBoundingClientRect to return a known position
    vi.spyOn(anchor, 'getBoundingClientRect').mockReturnValue({
      left: 200, top: 300, width: 400, height: 200,
      right: 600, bottom: 500, x: 200, y: 300, toJSON: () => ({}),
    } as DOMRect);

    const { result } = renderHook(() => useOrbWander());

    // Trigger IntersectionObserver callback with isIntersecting = true
    act(() => {
      io.triggerIntersection([
        { isIntersecting: true, target: anchor } as Partial<IntersectionObserverEntry>,
      ]);
    });

    // Anchor center: left + width/2 - ORB_SIZE/2 = 200 + 200 - 32 = 368
    // Anchor center y:  top + height/2 - ORB_SIZE/2 = 300 + 100 - 32 = 368
    expect(result.current.x.get()).toBe(368);
    expect(result.current.y.get()).toBe(368);
  });

  // -------------------------------------------------------------------------
  // 11. IntersectionObserver: no anchor visible → dock position restored
  // -------------------------------------------------------------------------
  it('returns to dock when no anchor is intersecting', () => {
    const io = setupIntersectionObserver();

    const anchor = document.createElement('div');
    anchor.dataset['orbAnchor'] = 'section-1';
    vi.spyOn(document, 'querySelectorAll').mockReturnValue(
      [anchor] as unknown as NodeListOf<HTMLElement>,
    );
    vi.spyOn(anchor, 'getBoundingClientRect').mockReturnValue({
      left: 200, top: 300, width: 400, height: 200,
      right: 600, bottom: 500, x: 200, y: 300, toJSON: () => ({}),
    } as DOMRect);

    const { result } = renderHook(() => useOrbWander());

    // First: anchor visible
    act(() => {
      io.triggerIntersection([{ isIntersecting: true, target: anchor }]);
    });

    // Then: no anchor visible
    act(() => {
      io.triggerIntersection([{ isIntersecting: false, target: anchor }]);
    });

    // Should dock back to bottom-right: 1024-64-28=932, 768-64-28=676
    expect(result.current.x.get()).toBe(932);
    expect(result.current.y.get()).toBe(676);
  });

  // -------------------------------------------------------------------------
  // 12. mousemove with anchor visible + cursor within repulsion → push with anchor base
  // -------------------------------------------------------------------------
  it('applies push relative to anchor position when cursor is near orb over an anchor', () => {
    const io = setupIntersectionObserver();

    const anchor = document.createElement('div');
    anchor.dataset['orbAnchor'] = 'section-1';
    vi.spyOn(document, 'querySelectorAll').mockReturnValue(
      [anchor] as unknown as NodeListOf<HTMLElement>,
    );
    // Anchor centered at (400, 400) viewport coords
    vi.spyOn(anchor, 'getBoundingClientRect').mockReturnValue({
      left: 300, top: 350, width: 200, height: 100,
      right: 500, bottom: 450, x: 300, y: 350, toJSON: () => ({}),
    } as DOMRect);

    const { result } = renderHook(() => useOrbWander());

    // Move orb to anchor
    act(() => {
      io.triggerIntersection([{ isIntersecting: true, target: anchor }]);
    });

    // Orb now at anchor: x=368, y=368. Orb center = (368+32, 368+32) = (400, 400)
    // Cursor directly above orb center at dist=20 (within 80px)
    act(() => {
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 400, clientY: 380 }));
    });

    // Target should have been pushed (y increased — away from cursor above)
    expect(result.current.y.get()).toBeGreaterThan(368);
  });
});
