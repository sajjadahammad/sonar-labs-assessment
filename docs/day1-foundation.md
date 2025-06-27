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

The `useWebSocket` hook implements real-time data streaming using `react-use-websocket`:

- **Connection States**: Tracks `connecting`, `connected`, `disconnected`, and `error` states, mapped from `ReadyState`.
- **Reconnection Logic**: Utilizes exponential backoff (up to 10 seconds) with a maximum of 3 attempts.
- **Error Handling**: Sets an error state (`error`) on connection failure and logs parsing errors.
- **Fallback Mechanism**: Switches to mock data via `createMockDataStream` when the WebSocket disconnects, mimicking real-time behavior.
- **Data Management**: Limits `data` and `sites` arrays to 1000 and 100 entries respectively to prevent memory overload.

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
