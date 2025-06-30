
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createMockDataStream } from '@/utils/mockDataGenerator';
import type { SiteAnalyticsData } from '@/types/socket';

describe('createMockDataStream', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    // Mock Math.random for predictable results
    let randomCount = 0;
    const randomValues = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.0];
    vi.spyOn(Math, 'random').mockImplementation(() => randomValues[randomCount++ % randomValues.length]);
    // Mock console.log for each test
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('generates initial batch of 20 data points with staggered timestamps', () => {
    const callback = vi.fn();
    createMockDataStream(callback);

    expect(callback).toHaveBeenCalledTimes(20);
    const calls = callback.mock.calls;

    // Verify timestamps are staggered (2000ms apart)
    calls.forEach(([data], index) => {
      const expectedTimestamp = new Date(Date.now() - (20 - index) * 2000).toISOString();
      expect(data.timestamp).toBe(expectedTimestamp);
    });

    // Verify first data point has expected values based on mocked Math.random
    const firstData: SiteAnalyticsData = calls[0][0];
    expect(firstData).toMatchObject({
      siteId: 'site_001', // First site due to Math.random() = 0.1
      siteName: 'E-commerce Store',
      pageViews: expect.any(Number),
      uniqueVisitors: expect.any(Number),
      bounceRate: expect.any(Number),
      avgSessionDuration: expect.any(Number),
      topPages: [
        { path: '/', views: expect.any(Number) },
        { path: '/products', views: expect.any(Number) },
        { path: '/about', views: expect.any(Number) },
      ],
      performanceMetrics: {
        loadTime: expect.any(Number),
        firstContentfulPaint: expect.any(Number),
        largestContentfulPaint: expect.any(Number),
      },
      userFlow: [
        { from: '/', to: '/products', count: expect.any(Number) },
        { from: '/products', to: '/checkout', count: expect.any(Number) },
      ],
    });
  });

  it('generates data points within expected ranges', () => {
    const callback = vi.fn();
    createMockDataStream(callback);

    const data: SiteAnalyticsData = callback.mock.calls[0][0];
    expect(data.pageViews).toBeGreaterThanOrEqual(50);
    expect(data.pageViews).toBeLessThanOrEqual(550);
    expect(data.uniqueVisitors).toBeGreaterThanOrEqual(30);
    expect(data.uniqueVisitors).toBeLessThanOrEqual(330);
    expect(data.bounceRate).toBeGreaterThanOrEqual(0.2);
    expect(data.bounceRate).toBeLessThanOrEqual(0.8);
    expect(data.avgSessionDuration).toBeGreaterThanOrEqual(60);
    expect(data.avgSessionDuration).toBeLessThanOrEqual(660);
    expect(data.topPages[0].views).toBeGreaterThanOrEqual(20);
    expect(data.topPages[0].views).toBeLessThanOrEqual(70);
    expect(data.performanceMetrics.loadTime).toBeGreaterThanOrEqual(0.5);
    expect(data.performanceMetrics.loadTime).toBeLessThanOrEqual(3.5);
  });

  it('starts continuous stream with random intervals between 1500ms and 2500ms', () => {
    const callback = vi.fn();
    createMockDataStream(callback);

    // Initial batch
    expect(callback).toHaveBeenCalledTimes(20);

    // Advance time to trigger first interval (1500 + 0.1 * 1000 = 1600ms)
    vi.advanceTimersByTime(1600);
    expect(callback).toHaveBeenCalledTimes(21);

    // Advance time for next interval (1500 + 0.2 * 1000 = 1700ms)
    vi.advanceTimersByTime(1700);
    expect(callback).toHaveBeenCalledTimes(22);
  });

  it('logs mock data points to console', () => {
    const callback = vi.fn();
    createMockDataStream(callback);

    // Advance time to trigger a streamed data point
    vi.advanceTimersByTime(1600);

    // Initial batch (20) + 1 streamed = 21 calls
    expect(consoleLogSpy).toHaveBeenCalledTimes(1); // Only streamed data is logged
    expect(consoleLogSpy).toHaveBeenCalledWith('Mock data point:', expect.any(Object));
  });

  it('returns a cleanup function that stops the interval', () => {
    const clearIntervalSpy = vi.spyOn(global, 'clearInterval');
    const callback = vi.fn();
    const cleanup = createMockDataStream(callback);

    cleanup();

    expect(clearIntervalSpy).toHaveBeenCalled();
    // Advance time to confirm no further data points are generated
    vi.advanceTimersByTime(5000);
    expect(callback).toHaveBeenCalledTimes(20); // Only initial batch
  });

  it('selects random sites from predefined list', () => {
    const callback = vi.fn();
    createMockDataStream(callback);

    const sites = new Set(callback.mock.calls.map(([data]) => data.siteId));
    expect(sites.size).toBeGreaterThan(1); // Should use multiple sites
    expect(sites).toContain('site_001');
    expect(sites).toContain('site_002');
    // Not all sites may be used due to random selection
  });
});
