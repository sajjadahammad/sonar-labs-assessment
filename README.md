# SonarLabs Analytics Dashboard

A modern, production-ready analytics dashboard built with Next.js, TypeScript, and Tailwind CSS. Designed for real-time data visualization, secure collaboration, and scalable performance, this project is the solution for monitoring, analyzing, and sharing web analytics efficiently.

---

## 🚀 Features

- **Real-Time Analytics**: Live data streaming via WebSocket, with fallback to mock data for demos.
- **Role-Based Access Control (RBAC)**: Mock OAuth 2.0 authentication with roles: `admin`, `analyst`, `viewer`.
- **Sensitive Data Encryption**: AES-GCM encryption for fields like `siteName` and `siteId` in IndexedDB.
- **D3 Sunburst Chart**: Hierarchical, interactive traffic breakdown using D3.js.
- **Export & Share**: Export analytics as CSV (xlsx) or PDF (jsPDF). Share dashboard state via URL.
- **Production-Ready**: Dockerfile, CI/CD workflow, error logging, and monitoring hooks (Sentry, StatsD).
- **Performance Optimized**: Data pruning, virtualization, and memoization for smooth UX at scale.
- **Extensible Architecture**: Modular components, hooks, and utilities for easy maintenance and growth.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router, SSR, SSG)
- **Language**: TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **State Management**: Redux Toolkit
- **Data Visualization**: D3.js, Recharts
- **WebSocket**: react-use-websocket
- **Export**: xlsx, jsPDF
- **Monitoring**: Sentry, StatsD
- **Testing**: Vitest
- **Containerization**: Docker

---

## 📦 Getting Started

### 1. Install Dependencies

```bash
npm install
# or
yarn install
```

### 2. Run the Development Server

```bash
npm run dev
# or
yarn dev
```

> **Note:** To receive real-time analytics data, ensure a WebSocket server is running at `ws://localhost:8080`. If the server is not available, the dashboard will use mock data for demonstration purposes.

Visit [http://localhost:3000](http://localhost:3000) to view the dashboard.

### 3. Build for Production

```bash
npm run build
npm start
```

### 4. Run Tests

```bash
npm test
```

### 5. Docker (Optional)

Build and run the app in a container:

```bash
docker build -t sonarlabs-dashboard .
docker run -p 3000:3000 sonarlabs-dashboard
```

---

## 🔐 Authentication & Roles

- **Demo Users**: Use `admin@analytics.com` / `password123` for admin access.
- **Roles**: UI and API access are gated by role (admin, analyst, viewer).
- **Auth State**: Managed via Redux and persisted in localStorage.

---

## 📊 Data & Visualization

- **WebSocket**: Real-time analytics, with auto-reconnect and mock fallback.
- **IndexedDB**: Encrypted local storage for analytics data, pruned hourly.
- **Charts**: Real-time, performance, user flow, and sunburst charts.
- **Export**: Download analytics as CSV or PDF. Share dashboard state via URL.

---

## 🏗️ Architecture

- **Components**: `src/components` (UI, charts, custom, loading, etc.)
- **Hooks**: `src/hooks` (WebSocket, auth, performance monitor, etc.)
- **State**: Redux store in `src/store`
- **Types**: TypeScript types in `src/types`
- **Utilities**: Encryption, IndexedDB, mock data, logger, etc.
- **Providers**: Theme and Redux providers
- **Monitoring**: Sentry and StatsD integration

---

## 📝 Documentation

- [ARCHITECTURE.md](ARCHITECTURE.md): High-level design
- [PERFORMANCE.md](PERFORMANCE.md): Performance strategies
- [SECURITY.md](SECURITY.md): Security features
- [DEPLOYMENT.md](DEPLOYMENT.md): Deployment instructions
- [docs/](docs/): Daily implementation and technical reports

---

## 🤝 Contributing

1. Fork the repo and create a new branch.
2. Make your changes and add tests if applicable.
3. Run `npm test` to ensure all tests pass.
4. Submit a pull request with a clear description.

---

## 📄 License

This project is for assessment and demonstration purposes. For other uses, please contact the author.

---

## 💡 Credits & Inspiration

- Built for the SonarLabs Frontend Engineer Assessment.
- Inspired by best practices in analytics, security, and scalable web architecture.

---

## 📬 Contact

For questions or feedback, please open an issue or contact the maintainer.
