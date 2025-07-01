
# Technical Architecture & Design Decisions

This document provides an overview of the technical architecture, key design decisions, and a detailed explanation of the folder structure for the SonarLabs Analytics Dashboard. It also covers the testing strategy, CI/CD pipeline with GitHub Actions, Docker configuration, rollback mechanism, and notes on potential optimizations.

---

## 🏗️ High-Level Architecture

- **Framework:** Next.js (App Router, SSR, SSG)
- **Language:** TypeScript
- **UI:** Tailwind CSS, shadcn/ui, lucide-react
- **State Management:** Redux Toolkit
- **Data Streaming:** WebSocket (with mock fallback)
- **Data Storage:** IndexedDB (encrypted)
- **Visualization:** D3.js, Recharts
- **Testing:** Vitest
- **Containerization:** Docker
- **Monitoring:** Sentry, StatsD (stubbed)
- **CI/CD:** GitHub Actions

---

## ⚙️ Key Design Decisions

- **Next.js App Router:** Enables server-side rendering, static site generation, and modern routing for scalability and performance. However, heavy reliance on client-side methods limited deeper exploration in this project.
- **TypeScript:** Ensures type safety and maintainability, though type organization could be improved (see constraints below).
- **Component-Driven UI:** Modular, reusable UI elements styled with Tailwind CSS and shadcn/ui.
- **WebSocket for Real-Time Data:** Chosen over polling for low-latency, real-time analytics. Mock data fallback ensures demo reliability.
- **IndexedDB with Encryption:** Local storage for analytics data, encrypted for privacy and security.
- **RBAC:** Role-based access control enforced for security and feature gating.
- **Performance Optimization:** Data capping, memoization, and virtualization ensure smooth UX at scale. Web Workers were used minimally for IndexedDB; further usage could optimize performance but was limited due to lack of experience (see below).
- **Extensibility:** Modular folder structure with clear separation of concerns for maintainability and future growth.

---

## 📁 Folder Structure & Explanation

```
sonarlabs-assesment/
├── docs/                  # Technical documentation, daily reports, and architecture notes
├── public/                # Static assets (SVGs, images, favicon)
├── src/
│   ├── app/               # Next.js app directory (routing, layouts, pages)
│   │   ├── dashboard/     # Main dashboard and sub-pages (collaboration, d3, performance, reports, settings, site-management, individualsites)
│   │   ├── login/         # Login page
│   │   ├── unauthorized/  # Unauthorized access page
│   │   ├── globals.css    # Global styles
│   │   └── layout.tsx     # Root layout
│   ├── components/        # Reusable UI components
│   │   ├── charts/        # Chart components (D3, Recharts, custom)
│   │   ├── custom/        # Custom dashboard widgets (metrics, filters, header, etc.)
│   │   ├── loadings/      # Loading skeletons and spinners
│   │   ├── ui/            # UI primitives (button, card, table, etc.)
│   │   └── ...            # Navigation, sidebar, version switcher, etc.
│   ├── hooks/             # Custom React hooks (auth, websocket, performance monitor, etc.)
│   ├── lib/               # Shared libraries (config, logger, monitoring, utils)
│   ├── providers/         # Context and theme providers (Redux, Theme)
│   ├── store/             # Redux store and feature slices
│   ├── types/             # TypeScript type definitions
│   ├── utils/             # Utility functions (encryption, IndexedDB, mock data)
│   ├── workers/           # Web worker clients (IndexedDB)
├── tests/                 # Unit and integration tests
│   ├── hooks/             # Tests for custom React hooks
│   ├── helperfunctions/             # Tests for utility functions
│   └── ...                # Component and integration tests
├── .github/               # GitHub Actions workflows
│   └── workflows/         # CI/CD pipeline configuration
├── Dockerfile             # Docker container configuration
├── rollback.sh            # Script for rolling back to previous version
├── package.json           # Project metadata and scripts
├── README.md              # Project overview and instructions
├── SECURITY.md            # Security implementation and considerations
├── PERFORMANCE.md         # Performance analysis and benchmarking
├── DEPLOYMENT.md          # Deployment procedures
├── ARCHITECTURE.md        # (This file)
└── ...                    # Other config and support files
```

### Folder Details

- **docs/**: Contains technical documentation, daily progress, and architecture/design notes.
- **public/**: Static files served directly (images, SVGs, favicon).
- **src/app/**: Next.js app directory for routing, layouts, and top-level pages. `dashboard/` includes all dashboard-related routes and sub-pages.
- **src/components/**: Reusable UI components, organized by type (charts, custom widgets, loading states, UI primitives).
- **src/hooks/**: Custom React hooks for authentication, WebSocket management, performance monitoring, etc.
- **src/lib/**: Shared libraries and utilities (configuration, logging, monitoring, helper functions).
- **src/providers/**: Context providers for Redux and theming.
- **src/store/**: Redux store setup and feature slices (e.g., authentication).
- **src/types/**: TypeScript type definitions for analytics, charts, sockets, etc. Could have been more organized with a hierarchical structure, but time constraints limited refactoring.
- **src/utils/**: Utility functions for encryption, IndexedDB, mock data generation, etc.
- **src/workers/**: Web worker clients for off-main-thread operations (e.g., IndexedDB). Limited usage due to lack of experience; could have been extended for tasks like data processing or heavy computations to optimize performance.
- **tests/**: Unit and integration tests for hooks, utilities, and components.
  - **hooks/**: Contains tests for custom React hooks (e.g., `useAuth`, `useWebSocket`) to ensure correct behavior and edge cases (e.g., WebSocket reconnection, auth state changes).
  - **utils/**: Tests for utility functions (e.g., encryption, IndexedDB operations, mock data generation) to verify correctness and performance.
  - Other tests include component tests (e.g., rendering, interaction) and integration tests for critical flows (e.g., dashboard data loading, RBAC enforcement).
- **.github/workflows/**: GitHub Actions workflows for CI/CD, including linting, testing, building, and deploying the application.
- **Dockerfile**: Configures the Docker container for consistent development and production environments.
- **rollback.sh**: Shell script for rolling back to a previous version in case of deployment issues.

---

## 🚀 CI/CD with GitHub Actions

The `.github/workflows/` directory contains GitHub Actions workflows for automating the build, test, and deployment pipeline:

- **CI Workflow (`ci.yml`)**:
  - Triggered on pull requests and pushes to `main` or feature branches.
  - Steps:
    1. Checkout code.
    2. Set up Node.js environment.
    3. Install dependencies (`npm ci`).
    4. Run linter (`npm run lint`).
    5. Execute tests with Vitest (`npm test`).
    6. Build the Next.js app (`npm run build`).
    - Reports test coverage and linting errors to ensure code quality.
- **CD Workflow (`deploy.yml`)**:
  - Triggered on pushes to `main` or tagged releases.
  - Steps:
    1. Checkout code.
    2. Build Docker image using `Dockerfile`.
    3. Push image to a container registry (e.g., Docker Hub, AWS ECR).
    4. Deploy to production environment (e.g., AWS ECS, Kubernetes).
    - Includes health checks and rollback triggers if deployment fails.
- **Environment Variables**: Secrets (e.g., registry credentials, Sentry DSN) are stored in GitHub Secrets for security.

The workflows ensure consistent builds, automated testing, and reliable deployments with minimal manual intervention.

---

## 🐳 Dockerfile

The `Dockerfile` at the project root defines the container setup for development and production:

- **Base Image**: Uses `node:18-alpine` for a lightweight Node.js environment.
- **Steps**:
  1. Copies `package.json` and `package-lock.json` for dependency installation.
  2. Installs dependencies with `npm ci`.
  3. Copies source code (`src/`, `public/`, etc.).
  4. Builds the Next.js app (`npm run build`).
  5. Exposes port 3000 for the Next.js server.
  6. Runs `npm start` for production.
- **Multi-Stage Build**: Uses a multi-stage build to reduce image size by separating build and runtime dependencies.
- **Health Checks**: Includes health check endpoints for monitoring in production.

The Dockerfile ensures consistent environments across development, testing, and production.

---

## 🔄 Rollback Script (`rollback.sh`)

The `rollback.sh` script at the root enables rolling back to a previous version in case of deployment failures:

- **Purpose**: Reverts to the last stable Docker image or application state.
- **Steps**:
  1. Retrieves the previous image tag from the container registry (e.g., `sonarlabs:latest-1`).
  2. Stops and removes the current container.
  3. Pulls and deploys the previous image.
  4. Verifies the deployment with a health check.
- **Usage**: Run `./rollback.sh` in the deployment environment.
- **Considerations**: Assumes versioned image tags (e.g., `sonarlabs:latest`, `sonarlabs:latest-1`) and a container orchestration tool (e.g., Docker Compose, Kubernetes).

This script mitigates risks during production updates by providing a quick rollback mechanism.

---

## 🛠️ Optimization and Constraints

- **Web Workers**: Web Workers were used minimally (e.g., for IndexedDB operations in `src/workers/`). They could have been leveraged further for tasks like data processing, chart rendering, or heavy computations to offload work from the main thread and improve performance. However, limited experience with Web Workers constrained their adoption in this project.
- **TypeScript Organization**: The `src/types/` directory contains TypeScript type definitions, but they could have been better organized (e.g., using a hierarchical structure or separate files for each module). Time constraints prevented refactoring for optimal clarity and maintainability.

---

## 🚀 Future Development Roadmap



### Planned Features & How to Implement Them

#### a. **User Chat System**
- **Goal**: Enable real-time communication between users within the application.
- **How to Implement**:
  1. Integrate a real-time messaging service (e.g., WebSockets with Socket.io or a third-party service like Firebase).
  2. Design chat UI components (chat window, message bubbles, user list).
  3. Implement backend endpoints or socket handlers for message delivery and storage.
  4. Add notifications for new messages (see Notifications section below).
  5. Test for reliability, security, and scalability.

#### b. **Notification System**
- **Goal**: Provide users with timely alerts about important events (e.g., new messages, system updates, report completions).
- **How to Implement**:
  1. Set up a notification service (in-app and optionally email/push notifications).
  2. Create a notification center UI component.
  3. Trigger notifications from backend events (e.g., when a chat message is received or a report is generated).
  4. Allow users to configure notification preferences.
  5. Integrate notification checks into the main app layout.

#### c. **Better Report Generation**
- **Goal**: Enhance the reporting module to provide more detailed, customizable, and exportable reports.
- **How to Implement**:
  1. Refactor the report generation logic to support custom filters, date ranges, and data visualizations.
  2. Add options to export reports in multiple formats (PDF, CSV, Excel).
  3. Use charting libraries (e.g., Chart.js, Recharts) for visual summaries.
  4. Implement scheduled report generation and delivery via email or in-app notifications.
  5. Gather user feedback to iterate on report features.

#### d. **Expanded Web Worker Usage**
- **Goal**: Offload heavy computations (e.g., data processing, chart rendering) from the main thread to improve UI responsiveness.
- **How to Implement**:
  1. Identify performance bottlenecks in the app (e.g., large data parsing, complex calculations).
  2. Create new worker scripts in `src/workers/` for these tasks.
  3. Use the `Worker` API to communicate between the main thread and workers.
  4. Refactor existing code to delegate appropriate tasks to workers.
  5. Test for performance improvements and stability.

#### e. **Automated End-to-End (E2E) Testing**
- **Goal**: Ensure critical user flows work as expected and prevent regressions.
- **How to Implement**:
  1. Choose a testing framework (e.g., Cypress or Playwright).
  2. Set up the framework in the project (`npm install cypress --save-dev`).
  3. Write E2E test cases for key flows (login, dashboard navigation, chat, notifications, report generation).
  4. Integrate E2E tests into the CI pipeline for automated checks on every pull request.

#### f. **Internationalization (i18n) Support**
- **Goal**: Make the application accessible to users in multiple languages.
- **How to Implement**:
  1. Integrate an i18n library (e.g., `next-i18next` for Next.js).
  2. Extract all user-facing strings into translation files.
  3. Add language switcher UI and persist user preference.
  4. Test the app in different languages and update documentation.

#### g. **Accessibility (a11y) Improvements**
- **Goal**: Ensure the app is usable by people with disabilities.
- **How to Implement**:
  1. Audit the UI using tools like Lighthouse or axe.
  2. Fix issues such as missing ARIA labels, insufficient color contrast, and keyboard navigation gaps.
  3. Add automated accessibility checks to the CI pipeline.





## 📝 References

- See `docs/day1-foundation.md` for initial architecture rationale.
- See `docs/day4-production-readiness.md` for production-readiness features and future recommendations.
- See `README.md` for a high-level project overview.
- See `DEPLOYMENT.md` for detailed CI/CD and deployment instructions.
- See `PERFORMANCE.md` for performance optimization details.

---

This updated document provides a comprehensive overview of the architecture, folder structure, testing strategy, CI/CD pipeline, Docker configuration, rollback mechanism, and constraints faced during development. Let me know if you need further clarification or additional details!