import { renderHook, act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useWebSocketInternal } from '@/hooks/use-websocket-internal';
import { ReadyState } from 'react-use-websocket';
import { SiteAnalyticsData } from '@/types/socket';

// Mock IndexedDB functions
vi.mock('@/utils/indexDB', () => ({
  loadFromIndexedDB: vi.fn().mockResolvedValue([]),
  saveToIndexedDB: vi.fn().mockResolvedValue(undefined),
  pruneOldData: vi.fn(),
}));

// Mock mockDataGenerator
const mockCleanup = vi.fn();
const mockHandler = vi.fn();
vi.mock('@/utils/mockDataGenerator', () => ({
  createMockDataStream: vi.fn((handler: (data: SiteAnalyticsData) => void) => {
    mockHandler.mockImplementation(handler);
    return mockCleanup;
  }),
}));

// Mock react-use-websocket
const mockLastMessage = {
  data: JSON.stringify({
    siteId: 'site_001',
    siteName: 'Test Site',
    timestamp: new Date().toISOString(),
    visitors: 100,
  }),
};

let readyState = ReadyState.CONNECTING;

vi.mock('react-use-websocket', async () => {
  const actual = await vi.importActual<any>('react-use-websocket');
  return {
    ...actual,
    default: vi.fn().mockImplementation(() => ({
      lastMessage: mockLastMessage,
      readyState,
    })),
    ReadyState: actual.ReadyState,
  };
});


describe('useWebSocket hook', () => {
    beforeEach(() => {
      readyState = ReadyState.CONNECTING;
      vi.clearAllMocks();
    });
  
    it('should initialize with empty data and disconnected status', async () => {
      const { result } = renderHook(() => useWebSocketInternal());
  
      expect(result.current.data).toEqual([]);
      expect(result.current.sites).toEqual([]);
      expect(result.current.connectionStatus).toBe('connected');
    });
  
    it('should set connected state when WebSocket is open', async () => {
      readyState = ReadyState.OPEN;
      const { result } = renderHook(() => useWebSocketInternal());
  
      expect(result.current.connectionStatus).toBe('connected');
      expect(result.current.usingMockData).toBe(false);
    });
  
    it('should use mock data when WebSocket is not open', async () => {
      readyState = ReadyState.CLOSED;
      const { result } = renderHook(() => useWebSocketInternal());
  
      // Wait for effect to run
      await act(() => new Promise((r) => setTimeout(r, 200)));
  
      expect(result.current.connectionStatus).toBe('connected');
      expect(result.current.usingMockData).toBe(true);
    });
  
    it('should parse incoming WebSocket messages and update data', async () => {
      readyState = ReadyState.OPEN;
  
      const { result } = renderHook(() => useWebSocketInternal());
  
      await act(() => new Promise((r) => setTimeout(r, 200)));
  
      expect(result.current.data.length).toBeGreaterThan(0);
      expect(result.current.sites.length).toBeGreaterThan(0);
      expect(result.current.sites[0].siteId).toBe('site_001');
    });
  
    it('should cache data to IndexedDB', async () => {
      readyState = ReadyState.OPEN;
  
      const { result } = renderHook(() => useWebSocketInternal());
  
      await act(() => new Promise((r) => setTimeout(r, 200)));
  
      const { saveToIndexedDB } = await import('@/utils/indexDB');
      expect(saveToIndexedDB).toHaveBeenCalled();
    });
  
    it('should call pruneOldData periodically', async () => {
      const { pruneOldData } = await import('@/utils/indexDB');
      vi.useFakeTimers();
  
      renderHook(() => useWebSocketInternal());
  
      vi.advanceTimersByTime(5 * 60 * 1000); // 5 minutes
      expect(pruneOldData).toHaveBeenCalled();
  
      vi.useRealTimers();
    });
  
    it('should clean up mock data stream on unmount', async () => {
      readyState = ReadyState.CLOSED;
  
      const { unmount } = renderHook(() => useWebSocketInternal());
      await act(() => new Promise((r) => setTimeout(r, 200)));
  
      unmount();
      expect(mockCleanup).toHaveBeenCalled();
    });
  });
  