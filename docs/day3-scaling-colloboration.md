
# 🚀 Scaling and Collaboration

This analytics dashboard is designed to handle large datasets efficiently while enabling seamless collaboration through scalable data management and shareable configurations.

### 🔌 Real-Time Data Filtering with WebSocket Connectivity

The dashboard integrates WebSocket connectivity to stream real-time analytics data. Metrics such as page views, unique visitors, bounce rates, and session durations update live, ensuring users always access the most current insights. This supports real-time decision-making and collaborative data analysis without requiring manual refreshes.

### 🔗 URL State Management for Shareable Views

Using `useSearchParams` and `useRouter` from Next.js, filter configurations (like date ranges, time ranges, metrics, and site selections) are encoded directly into the URL. This allows users to share dashboard states via link, enabling teams to collaborate on identical data views with ease.

### 📤 Export Functionality (CSV & PDF)

The `ExportToggle` component enables exporting dashboard data in:

* **CSV** format (via [xlsx](https://www.npmjs.com/package/xlsx))
* **PDF** format (via [jsPDF](https://www.npmjs.com/package/jspdf))

Exports include summary metrics and historical data, supporting structured sharing with stakeholders.

### ⚡ Data Virtualization for Performance

To ensure responsiveness at scale, the dashboard applies data point limits:

* `MAX_DATA_POINTS = 1000` for general analytics
* `MAX_SITE_DATA_POINTS = 100` for site-specific analytics

By pruning and slicing incoming data from WebSocket streams, the dashboard maintains efficient rendering and interaction even with high-frequency updates.

### 🧠 Intelligent Data Caching and Pruning

Local caching is handled via **IndexedDB**, with:

* Encryption applied to sensitive fields (`siteId`, `siteName`)
* Real-time data persistence using `saveToIndexedDB`, `loadFromIndexedDB`, and `appendToIndexedDB`
* Automatic pruning (`pruneOldData`) of data older than one hour to maintain storage efficiency

This design reduces backend load and ensures that only relevant data is retained, supporting long-term scalability and consistent performance.

---

These features collectively empower the dashboard to scale effectively while fostering real-time collaboration, actionable insights, and efficient data sharing across teams.

---

