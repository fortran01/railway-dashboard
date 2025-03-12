# Railway Dashboard

A React-based dashboard for visualizing railway data, including routes, revenue, and performance metrics.

## Features

- **Popular Routes & Times**: View the most popular routes and peak travel times
- **Revenue Analysis**: Analyze revenue by ticket type, class, month, and day of week
- **Performance Metrics**: Track journey status, delay reasons, and routes with highest delays
- **Cache Invalidation**: Automatic cache invalidation for static assets to ensure users always have the latest version

## Technologies Used

- React
- Recharts for data visualization
- Tailwind CSS for styling
- PapaParse for CSV parsing
- Lodash for data manipulation
- Service Worker for cache management

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Navigate to the project directory:
   ```
   cd railway-dashboard
   ```
3. Install dependencies:
   ```
   npm install
   ```
   or
   ```
   yarn install
   ```

### Running the Application

Start the development server:
```
npm start
```
or
```
yarn start
```

The application will be available at [http://localhost:3000](http://localhost:3000).

### Building for Production

Build the application for production:
```
npm run build
```
or
```
yarn build
```

The build artifacts will be stored in the `build/` directory.

## Cache Invalidation Strategy

This application implements a comprehensive cache invalidation strategy to ensure users always have the latest version:

1. **Content Hashing**: All static assets (JS, CSS, images) include content hashes in their filenames, which change whenever the content changes.

2. **HTML Cache Control**: The HTML files include cache control meta tags to prevent browsers from caching them.

3. **Service Worker**: A custom service worker manages the caching of assets and checks for updates.

4. **Version Tracking**: The application includes version information that's used to detect when a new version is available.

5. **Update Notifications**: Users are notified when a new version is available and given the option to reload.

To update the application version:

1. Change the version number in `.env` and `src/version.js`
2. Update the `data-version` attribute in `public/index.html`
3. Rebuild the application

## Data

The application uses a sample CSV file (`public/railway.csv`) for demonstration purposes. In a production environment, you would replace this with your actual data source.

## Dashboard Sections

1. **Popular Routes & Times**
   - Top 10 popular routes
   - Hourly distribution of journeys

2. **Revenue Analysis**
   - Revenue by ticket type
   - Revenue by ticket class
   - Revenue trends by month
   - Revenue trends by day of week

3. **Performance Metrics**
   - Journey status (on time, delayed, cancelled)
   - Delay reasons
   - Routes with highest average delays
   - Refund requests analysis 