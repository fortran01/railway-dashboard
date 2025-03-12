# Railway Dashboard

A React-based dashboard for visualizing railway data, including routes, revenue, and performance metrics.

- [Railway Dashboard](#railway-dashboard)
   - [Features](#features)
   - [Data Processing \& Computations](#data-processing--computations)
      - [1. Popular Routes \& Times](#1-popular-routes--times)
      - [2. Revenue Analysis](#2-revenue-analysis)
      - [3. Performance Metrics](#3-performance-metrics)
   - [Technologies Used](#technologies-used)
   - [Getting Started](#getting-started)
      - [Prerequisites](#prerequisites)
      - [Installation](#installation)
      - [Running the Application](#running-the-application)
      - [Building for Production](#building-for-production)
   - [Cache Invalidation Strategy](#cache-invalidation-strategy)
   - [Data](#data)
   - [Dashboard Sections](#dashboard-sections)

## Features

- **Popular Routes & Times**: View the most popular routes and peak travel times
- **Revenue Analysis**: Analyze revenue by ticket type, class, month, and day of week
- **Performance Metrics**: Track journey status, delay reasons, and routes with highest delays
- **Cache Invalidation**: Automatic cache invalidation for static assets to ensure users always have the latest version

## Data Processing & Computations

The dashboard performs various data aggregations and computations to generate insights:

### 1. Popular Routes & Times

- **Top Routes**: Counts the frequency of each unique route (departure to arrival station) and displays the top 10 most frequent routes.
  ```javascript
  // Group by route and count occurrences
  const routeCounts = {};
  data.forEach((record) => {
    const route = `${record["Departure Station"]} to ${record["Arrival Destination"]}`;
    routeCounts[route] = (routeCounts[route] || 0) + 1;
  });
  ```

- **Hourly Distribution**: Extracts the hour from departure times and counts journeys per hour to identify peak travel times.
  ```javascript
  // Group by hour and count occurrences
  const hourCounts = {};
  data.forEach((record) => {
    if (record["Departure Time"]) {
      const hour = record["Departure Time"].split(":")[0];
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    }
  });
  ```

### 2. Revenue Analysis

- **Revenue by Ticket Type**: Uses Lodash to group records by ticket type and sum the price for each group.
  ```javascript
  const ticketTypeRevenue = _(data)
    .groupBy("Ticket Type")
    .mapValues((group) => _.sumBy(group, "Price"))
    .value();
  ```

- **Revenue by Ticket Class**: Groups records by ticket class and calculates total revenue for each class.
  ```javascript
  const ticketClassRevenue = _(data)
    .groupBy("Ticket Class")
    .mapValues((group) => _.sumBy(group, "Price"))
    .value();
  ```

- **Revenue by Month**: Extracts month from journey dates, groups by month, and calculates total revenue per month.
  ```javascript
  // Extract month from date
  data.forEach((record) => {
    if (record["Date of Journey"]) {
      const date = new Date(record["Date of Journey"]);
      record.month = date.getMonth() + 1;
      record.monthName = ["January", "February", ...][record.month - 1];
    }
  });
  
  // Group by month and sum revenue
  const revenueByMonth = _(data)
    .filter((record) => record.monthName)
    .groupBy("monthName")
    .mapValues((group) => _.sumBy(group, "Price"))
    .value();
  ```

- **Revenue by Day of Week**: Extracts day of week from journey dates, groups by day, and calculates total revenue per day.
  ```javascript
  // Extract day of week from date
  data.forEach((record) => {
    if (record["Date of Journey"]) {
      const date = new Date(record["Date of Journey"]);
      record.dayOfWeek = date.getDay();
      record.dayName = ["Sunday", "Monday", ...][record.dayOfWeek];
    }
  });
  
  // Group by day and sum revenue
  const revenueByDayOfWeek = _(data)
    .filter((record) => record.dayName)
    .groupBy("dayName")
    .mapValues((group) => _.sumBy(group, "Price"))
    .value();
  ```

### 3. Performance Metrics

- **Journey Status**: Counts journeys by status (on time, delayed, cancelled) using Lodash's countBy.
  ```javascript
  const journeyStatusCounts = _(data).countBy("Journey Status").value();
  ```

- **Delay Reasons**: For delayed journeys, normalizes and categorizes delay reasons, then counts occurrences.
  ```javascript
  // Normalize delay reasons into standard categories
  function normalizeDelayReason(reason) {
    if (!reason) return "Unknown";
    reason = reason.toLowerCase();
    if (reason.includes("signal")) return "Signal Failure";
    if (reason.includes("technical")) return "Technical Issue";
    // ... other normalizations
  }
  
  // Count occurrences of each normalized reason
  const delayReasonCounts = {};
  data.forEach((record) => {
    if (record["Journey Status"] === "Delayed" && record["Reason for Delay"]) {
      const reason = normalizeDelayReason(record["Reason for Delay"]);
      delayReasonCounts[reason] = (delayReasonCounts[reason] || 0) + 1;
    }
  });
  ```

- **Routes with Highest Delays**: Calculates average delay time for each route by comparing scheduled and actual arrival times.
  ```javascript
  const delayByRoute = _(data)
    .filter((record) => record["Journey Status"] === "Delayed")
    .groupBy((record) => `${record["Departure Station"]} to ${record["Arrival Destination"]}`)
    .mapValues((group) => {
      let totalDelayMinutes = 0;
      let count = 0;
      
      group.forEach((record) => {
        if (record["Arrival Time"] && record["Actual Arrival Time"]) {
          // Calculate delay in minutes
          const scheduledArr = new Date(`2023-01-01 ${record["Arrival Time"]}`);
          const actualArr = new Date(`2023-01-01 ${record["Actual Arrival Time"]}`);
          const delayMinutes = (actualArr - scheduledArr) / (1000 * 60);
          
          if (delayMinutes > 0) {
            totalDelayMinutes += delayMinutes;
            count++;
          }
        }
      });
      
      return count > 0 ? { avgDelay: totalDelayMinutes / count, count: count } : null;
    })
    .value();
  ```

- **Refund Requests Analysis**: Compares refund requests for delayed and cancelled journeys.

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