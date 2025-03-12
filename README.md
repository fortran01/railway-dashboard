# Railway Dashboard

A React-based dashboard for visualizing railway data, including routes, revenue, and performance metrics.

- [Railway Dashboard](#railway-dashboard)
   - [Features](#features)
   - [Data Processing \& Computations](#data-processing--computations)
      - [1. Popular Routes \& Times](#1-popular-routes--times)
      - [2. Revenue Analysis](#2-revenue-analysis)
      - [3. Performance Metrics](#3-performance-metrics)
   - [CSV Data Loading](#csv-data-loading)
   - [Technologies Used](#technologies-used)
   - [Getting Started](#getting-started)
      - [Prerequisites](#prerequisites)
      - [Installation](#installation)
      - [Running the Application](#running-the-application)
      - [Building for Production](#building-for-production)
      - [Deploying to GitHub Pages](#deploying-to-github-pages)
   - [Cache Invalidation Strategy](#cache-invalidation-strategy)
   - [Data](#data)

## Features

- **Popular Routes & Times**: View the most popular routes and peak travel times
- **Revenue Analysis**: Analyze revenue by ticket type, class, month, and day of week
- **Performance Metrics**: Track journey status, delay reasons, and routes with highest delays
- **Robust CSV Parsing**: Intelligent column mapping and error handling for flexible data input
- **Responsive Design**: Optimized for both desktop and mobile viewing

## Data Processing & Computations

The dashboard performs various data aggregations and computations to generate insights:

### 1. Popular Routes & Times

- **Top Routes**: Counts the frequency of each unique route (departure to arrival station) and displays the top 10 most frequent routes.
  ```javascript
  // Group by route and count occurrences
  const routeCounts = {};
  data.forEach((record) => {
    if (record["Departure Station"] && record["Arrival Destination"]) {
      const route = `${record["Departure Station"]} to ${record["Arrival Destination"]}`;
      routeCounts[route] = (routeCounts[route] || 0) + 1;
    }
  });

  const topRoutes = Object.entries(routeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([route, count]) => ({ route, count }));
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

  const hourlyDistribution = Object.entries(hourCounts)
    .map(([hour, count]) => ({
      hour: parseInt(hour),
      count,
      formattedHour: `${hour}:00`,
    }))
    .sort((a, b) => a.hour - b.hour);
  ```

### 2. Revenue Analysis

- **Revenue by Ticket Type**: Uses Lodash to group records by ticket type and sum the price for each group.
  ```javascript
  const revenueByTicketType = [];
  const ticketTypeRevenue = _(data)
    .groupBy("Ticket Type")
    .mapValues((group) => _.sumBy(group, "Price"))
    .value();

  Object.entries(ticketTypeRevenue).forEach(([type, revenue]) => {
    revenueByTicketType.push({ name: type, value: revenue });
  });
  ```

- **Revenue by Ticket Class**: Groups records by ticket class and calculates total revenue for each class.
  ```javascript
  const revenueByTicketClass = [];
  const ticketClassRevenue = _(data)
    .groupBy("Ticket Class")
    .mapValues((group) => _.sumBy(group, "Price"))
    .value();

  Object.entries(ticketClassRevenue).forEach(([cls, revenue]) => {
    revenueByTicketClass.push({ name: cls, value: revenue });
  });
  ```

- **Revenue by Month**: Extracts month from journey dates, groups by month, and calculates total revenue per month.
  ```javascript
  data.forEach((record) => {
    if (record["Date of Journey"]) {
      try {
        const date = new Date(record["Date of Journey"]);
        record.month = date.getMonth() + 1; // 1 = January, 2 = February, etc.
        record.monthName = [
          "January", "February", "March", "April", "May", "June",
          "July", "August", "September", "October", "November", "December"
        ][record.month - 1];
      } catch (e) {
        // Skip invalid dates
      }
    }
  });
  
  const revenueByMonth = _(data)
    .filter((record) => record.monthName)
    .groupBy("monthName")
    .mapValues((group) => _.sumBy(group, "Price"))
    .value();
  ```

- **Revenue by Day of Week**: Extracts day of week from journey dates, groups by day, and calculates total revenue per day.
  ```javascript
  data.forEach((record) => {
    if (record["Date of Journey"]) {
      try {
        const date = new Date(record["Date of Journey"]);
        record.dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
        record.dayName = [
          "Sunday", "Monday", "Tuesday", "Wednesday", 
          "Thursday", "Friday", "Saturday"
        ][record.dayOfWeek];
      } catch (e) {
        // Skip invalid dates
      }
    }
  });
  
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

  const journeyStatus = Object.entries(journeyStatusCounts).map(
    ([status, count]) => ({ name: status, value: count })
  );
  ```

- **Delay Reasons**: For delayed journeys, normalizes and categorizes delay reasons, then counts occurrences.
  ```javascript
  function normalizeDelayReason(reason) {
    if (!reason) return "Unknown";
    reason = reason.toLowerCase();
    if (reason.includes("signal")) return "Signal Failure";
    if (reason.includes("technical") || reason.includes("issue"))
      return "Technical Issue";
    if (reason.includes("weather")) return "Weather Conditions";
    if (reason.includes("staff") || reason.includes("staffing"))
      return "Staff Shortage";
    if (reason.includes("traffic")) return "Traffic";
    return reason;
  }
  
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
          try {
            const scheduledArr = new Date(`2023-01-01 ${record["Arrival Time"]}`);
            const actualArr = new Date(`2023-01-01 ${record["Actual Arrival Time"]}`);
            const delayMinutes = (actualArr - scheduledArr) / (1000 * 60);
            
            if (delayMinutes > 0) {
              totalDelayMinutes += delayMinutes;
              count++;
            }
          } catch (e) {
            // Skip records with invalid time formats
          }
        }
      });
      
      return count > 0 ? { avgDelay: totalDelayMinutes / count, count: count } : null;
    })
    .value();
  ```

- **Refund Requests Analysis**: Dynamically calculates refund requests for delayed and cancelled journeys from the data.
  ```javascript
  const refundRequestsByStatus = _(data)
    .filter(
      (record) =>
        record["Journey Status"] === "Delayed" ||
        record["Journey Status"] === "Cancelled"
    )
    .groupBy("Journey Status")
    .mapValues((group) => ({
      requestedRefund: _.filter(
        group,
        (record) => record["Refund Request"] === "Yes"
      ).length,
      noRefund: _.filter(
        group,
        (record) => record["Refund Request"] === "No"
      ).length,
    }))
    .value();

  const refundRequests = Object.entries(refundRequestsByStatus).map(
    ([status, counts]) => ({
      status,
      requestedRefund: counts.requestedRefund,
      noRefund: counts.noRefund,
    })
  );
  ```

## CSV Data Loading

The dashboard includes robust CSV parsing with several features:

1. **Multiple Fetch Attempts**: Tries multiple paths to locate the CSV file
   ```javascript
   // First try with process.env.PUBLIC_URL
   try {
     response = await fetch(`${process.env.PUBLIC_URL}/railway.csv`);
     // ...
   } catch (fetchError) {
     // Try with a direct path as fallback
     response = await fetch("/railway.csv");
     // ...
   }
   ```

2. **Content Validation**: Verifies that the response is actually CSV data and not HTML
   ```javascript
   if (contentType && contentType.includes("text/html")) {
     throw new Error("Received HTML instead of CSV data...");
   }

   if (csvText.trim().startsWith("<!DOCTYPE") || csvText.trim().startsWith("<html")) {
     throw new Error("Received HTML instead of CSV data...");
   }
   ```

3. **Intelligent Column Mapping**: Maps alternative column names to expected column names
   ```javascript
   const columnMapping = {
     "Departure Station": ["DepartureStation", "Departure_Station", "From"],
     "Arrival Destination": ["ArrivalDestination", "Arrival_Destination", "To", "Destination"],
     // ... other mappings
   };
   ```

4. **Error Handling**: Provides detailed error messages for CSV parsing issues
   ```javascript
   if (criticalErrors.length > 0) {
     setError(`CSV parsing errors: ${criticalErrors.map((e) => e.message).join(", ")}`);
     // ...
   }
   ```

## Technologies Used

- React
- Recharts for data visualization
- Tailwind CSS for styling
- PapaParse for CSV parsing
- Lodash for data manipulation

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

### Deploying to GitHub Pages

To deploy the application to GitHub Pages:

1. **Install the GitHub Pages package** (if not already installed):
   ```
   npm install --save-dev gh-pages
   ```
   or
   ```
   yarn add --dev gh-pages
   ```

2. **Add the following scripts to your `package.json`**:
   ```json
   "scripts": {
     // ... existing scripts
     "predeploy": "npm run build",
     "deploy": "gh-pages -d build"
   }
   ```

3. **Add the homepage field to your `package.json`**:
   ```json
   "homepage": "https://username.github.io/railway-dashboard"
   ```
   Replace `username` with your GitHub username.

4. **Deploy the application**:
   ```
   npm run deploy
   ```
   or
   ```
   yarn deploy
   ```

5. **Configure GitHub repository settings**:
   - Go to your GitHub repository
   - Navigate to Settings > Pages
   - Ensure the source is set to the `gh-pages` branch
   - Your site will be published at the URL specified in your homepage field

6. **For custom domains** (optional):
   - Add your custom domain in the GitHub Pages settings
   - Create a `CNAME` file in the `public/` directory with your domain name
   - Update the homepage field in `package.json` to match your custom domain

Note: When using GitHub Pages with a project site (not a user or organization site), make sure all asset paths in your code use relative paths or leverage `process.env.PUBLIC_URL` for correct path resolution.

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

The application uses a sample CSV file (`public/railway.csv`) for demonstration purposes. The CSV file should include the following columns:

- Departure Station
- Arrival Destination
- Departure Time
- Arrival Time
- Actual Arrival Time
- Journey Status
- Reason for Delay
- Ticket Type
- Ticket Class
- Price
- Date of Journey
- Refund Request

The application includes intelligent column mapping to handle slight variations in column names.
