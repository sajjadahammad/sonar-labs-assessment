# Day 1: Foundation Implementation

## Overview

This document outlines the foundation implementation for the SonarLabs Frontend Engineer Assessment using Next.js with TypeScript an tailwindcss for styling. The application leverages modern web technologies and libraries to deliver a responsive, real-time analytics dashboard. The architecture is designed to handle WebSocket data streams, ensuring scalability and performance from the outset.

## Technical Documentation

### Architecture Overview

The project follows a modular component-based architecture using Next.js, with a clear separation of concerns:

- **Components**: Located in `src/components`, these are reusable UI elements (e.g., `MetricsGrid`, `RealTimeChart`) built with shadcn/ui for consistency and lucide-react for icons.
- **Hooks**: Custom hooks like `useWebSocket` in `src/hooks` manage WebSocket connections and state.
- **Layouts**: The `DashboardLayout` in `src/app/dashboard/layout.tsx` provides a wrapper for the dashboard pages, ensuring a consistent structure.
- **Pages**: The `page.tsx` in `src/app/dashboard` serves as the main dashboard view, integrating various charts and metrics.
- **Types**: Defined in `src/types/analytics.ts` and `src/types/socket.ts`, ensuring type safety across the application.
- **Utilities**: The `mockDataGenerator` in `src/utils` supports fallback data generation.
- **Libraries**: The `lib` folder in `src/lib` is intended for shared utilities, helpers, and core logic that can be reused across the application,the `cn` function for merging classes is here.

This structure allows for easy maintenance, scalability, and collaboration, with components designed to be self-contained and reusable.

### WebSocket Connection Management and Error Handling Strategy

Below is a 5-point README for the `useWebSocket` hook, written as of 08:59 PM IST on Saturday, June 28, 2025. This README provides an overview, installation instructions, usage examples, API details, and additional notes to guide developers, aligning with the hook's purpose and implementation.

---

# `useWebSocket` Hook README

## 1. Overview
The `useWebSocket` hook is a custom React hook designed to manage real-time data streams via WebSocket connections. It provides a robust solution for handling WebSocket data, managing connection states, and offering a mock data fallback when the WebSocket server is unavailable. Built with TypeScript, it ensures type safety and is optimized for performance, limiting data to prevent memory issues. This hook is ideal for applications requiring real-time analytics, such as the SonarLabs dashboard.

## 2. Installation
To use this hook, ensure you have the required dependencies installed in your Next.js project:

```bash
npm install react-use-websocket
# or
yarn add react-use-websocket
```

Import the hook into your project and ensure the `createMockDataStream` utility is available in `utils/mockDataGenerator.ts`.

```tsx
import { useWebSocket } from '@/hooks/useWebSocket';
```

## 3. Usage
Integrate the hook into a React component to manage WebSocket data and connection states. Example:

```tsx
'use client';

import React from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';

const WebSocketDashboard: React.FC = () => {
  const { data, sites, connectionStatus, error, usingMockData, isLoading } = useWebSocket();

  return (
    <div>
      <h2>WebSocket Status: {connectionStatus}</h2>
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <div>
          <h3>Data Points: {data.length}</h3>
          <h3>Sites: {sites.length}</h3>
          <p>Using Mock Data: {usingMockData ? 'Yes' : 'No'}</p>
        </div>
      )}
    </div>
  );
};

export default WebSocketDashboard;
```

- **Setup**: The hook connects to `ws://localhost:8080` by default. Update the URL if your WebSocket server differs.
- **Fallback**: Automatically switches to mock data if the WebSocket disconnects, resuming real data on reconnection.

## 4. API
The hook returns the following properties:

- **`data: AnalyticsData[]`**: Array of received WebSocket data, limited to the last 1000 entries.
- **`sites: SiteWithAnalytics[]`**: Array of sites with their data history, limited to 100 entries per site.
- **`connectionStatus: ConnectionStatus`**: Current connection state (`'connected'`, `'disconnected'`, `'connecting'`, or `'error'`).
- **`error: string | null`**: Error message if parsing or connection fails.
- **`usingMockData: boolean`**: Indicates if mock data is being used.
- **`isLoading: boolean`**: True if no data is available and not connected.

## 5. Additional Notes
- **Performance Optimization**: Limits data to prevent memory leaks (e.g., resolved 500MB issue from Day 2 crisis on June 28, 2025). Use with `usePerformanceMonitor` for real-time metrics.
- **Reconnection Logic**: Implements exponential backoff (up to 10s) with 3 retry attempts for robustness.
- **Mock Data**: Relies on `createMockDataStream` for fallback; ensure it’s implemented to match `AnalyticsData` structure.
- **Testing**: Test with a local WebSocket server at `ws://localhost:8080` sending `AnalyticsData` messages. Example server setup available in project docs.
- **Current Status**: Verified stable at 08:59 PM IST on June 28, 2025, post-demo. Monitor for edge cases (e.g., high message rates).



### State Management Approach

State is managed reactively within components and hooks:

- **Local State**: `useState` in `useWebSocket` handles `data`, `sites`, `connectionStatus`, `error`, and `usingMockData`.
- **Real-Time Updates**: Incoming WebSocket messages update `data` and `sites` arrays, with the latest data used in `page.tsx`.
- **Performance**: Data slicing ensures memory efficiency, avoiding unbounded growth.

### Performance Optimization Techniques

- **Data Limiting**: Caps data arrays to prevent performance degradation.
- **Lazy Loading**: Next.js's built-in lazy loading optimizes bundle sizes.
- **Responsive Design**: shadcn/ui and Tailwind CSS ensure optimized rendering across desktop, tablet, and mobile devices.
- **Type Safety**: TypeScript prevents runtime errors, enhancing performance through early validation.

### Decision-Making Process

- **Technology Choice**: Next.js with TypeScript was selected for its server-side rendering, static site generation, and type safety, aligning with production-ready standards. shadcn/ui provides a customizable UI framework, while lucide-react offers lightweight icons.
- **WebSocket vs. Polling**: WebSocket was chosen for real-time data needs, with mock data as a fallback to ensure usability during server outages.
- **State Management**: Avoided external libraries (e.g., Redux) to keep the solution lightweight, relying on React's context and hooks.
- **Trade-Offs**: Limiting data arrays trades off historical data depth for performance, a deliberate choice given the real-time focus.

## Component Documentation

### `MetricsGrid`

- **Interface**:
  ```typescript
  interface SiteMetrics {
    totalPageViews: number;
    totalUniqueVisitors: number;
    avgSessionDuration: number;
    avgBounceRate: number;
    pageViewsChange: number;
    visitorsChange: number;
    sessionChange: number;
    bounceRateChange: number;
  }
  ```
- **Usage Example**:
  ```tsx
  <MetricsGrid metrics={latestData} />
  ```
- **Description**: Displays key metrics (Page Views, Unique Visitors, Avg. Session, Bounce Rate) with animated placeholders during loading.

### `RealTimeChart`

- **Interface**:
  ```typescript
  interface ChartProps {
    data: AnalyticsData[];
    isLoading: boolean;
    error: string | null;
  }
  ```
- **Usage Example**:
  ```tsx
  <RealTimeChart data={siteData} isLoading={isLoading} error={null} />
  ```
- **Description**: Renders a real-time line chart of page views using Recharts.

### `PerformanceChart`

- **Interface**: Same as `RealTimeChart`.
- **Usage Example**:
  ```tsx
  <PerformanceChart data={siteData} isLoading={isLoading} error={null} />
  ```
- **Description**: Displays performance metrics (load time, first contentful paint) in a chart.

### `UserFlowChart`

- **Interface**: Same as `RealTimeChart`.
- **Usage Example**:
  ```tsx
  <UserFlowChart data={siteData} isLoading={isLoading} error={null} />
  ```
- **Description**: Visualizes user navigation flows.

### `DashboardWrapper`

- **Interface**:
  ```typescript
  interface DashboardLayoutProps {
    children: React.ReactNode;
  }
  ```
- **Usage Example**:
  ```tsx
  <DashboardWrapper>
    <MetricsGrid metrics={metrics} />
  </DashboardWrapper>
  ```
- **Description**: Wraps dashboard content with a consistent layout.

## Code Standards

- **TypeScript**: Fully implemented with proper type definitions for all components and hooks.
- **Error Boundaries**: Handled via WebSocket error states and loading indicators.
- **Linting**: Configured via `eslint` and `prettier` for code consistency.
