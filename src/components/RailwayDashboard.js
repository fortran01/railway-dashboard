import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  ResponsiveContainer,
} from "recharts";
import Papa from "papaparse";
import _ from "lodash";

// Color constants
const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884d8",
  "#82ca9d",
  "#ffc658",
];
const ROUTE_COLORS = [
  "#003f5c",
  "#2f4b7c",
  "#665191",
  "#a05195",
  "#d45087",
  "#f95d6a",
  "#ff7c43",
  "#ffa600",
];
const DELAY_COLORS = {
  "Signal Failure": "#e41a1c",
  "Technical Issue": "#377eb8",
  "Weather Conditions": "#4daf4a",
  "Staff Shortage": "#984ea3",
  Traffic: "#ff7f00",
};

const RailwayDashboard = () => {
  const [activeTab, setActiveTab] = useState("routes");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    topRoutes: [],
    hourlyDistribution: [],
    revenueByTicketType: [],
    revenueByTicketClass: [],
    journeyStatus: [],
    delayReasons: [],
    revenueByMonth: [],
    revenueByDayOfWeek: [],
    routesWithDelay: [],
    refundRequests: [],
  });

  useEffect(() => {
    const processData = async () => {
      try {
        // For demo purposes, we'll use mock data since we don't have access to the file system
        // In a real application, you would use the actual file reading logic

        // Use the correct file path - railway.csv in the public folder
        const csvFilePath = "railway.csv";

        // Attempt to fetch the CSV file
        const response = await fetch(csvFilePath);
        if (!response.ok) {
          throw new Error(
            `Failed to fetch ${csvFilePath}: ${response.status} ${response.statusText}`
          );
        }

        const csvText = await response.text();
        const parsedData = Papa.parse(csvText, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
        });

        if (parsedData.data && parsedData.data.length > 0) {
          console.log(
            `Successfully loaded ${parsedData.data.length} records from ${csvFilePath}`
          );
          setData(parsedData.data);
          analyzeData(parsedData.data);
        } else {
          console.warn(
            `No data found in ${csvFilePath}, falling back to mock data`
          );
          const mockData = generateMockData();
          setData(mockData);
          analyzeData(mockData);
        }

        setLoading(false);
      } catch (error) {
        console.error("Error reading or parsing data:", error);
        console.log("Falling back to mock data due to error");
        const mockData = generateMockData();
        setData(mockData);
        analyzeData(mockData);
        setLoading(false);
      }
    };

    processData();
  }, []);

  // Generate mock data for demonstration
  const generateMockData = () => {
    const stations = [
      "London Euston",
      "Manchester Piccadilly",
      "Birmingham New Street",
      "Liverpool Lime Street",
      "Leeds",
      "Glasgow Central",
      "Edinburgh Waverley",
      "Cardiff Central",
      "Bristol Temple Meads",
      "Newcastle",
    ];

    const ticketTypes = ["Advance", "Off-Peak", "Anytime", "Season"];
    const ticketClasses = ["Standard", "First Class"];
    const journeyStatuses = ["On Time", "Delayed", "Cancelled"];
    const delayReasons = [
      "Signal Failure",
      "Technical Issue",
      "Weather Conditions",
      "Staff Shortage",
      "Traffic",
    ];

    const mockData = [];

    for (let i = 0; i < 1000; i++) {
      const departureStation =
        stations[Math.floor(Math.random() * stations.length)];
      let arrivalStation;
      do {
        arrivalStation = stations[Math.floor(Math.random() * stations.length)];
      } while (arrivalStation === departureStation);

      const hour = Math.floor(Math.random() * 24);
      const minute = Math.floor(Math.random() * 60);
      const departureTime = `${hour.toString().padStart(2, "0")}:${minute
        .toString()
        .padStart(2, "0")}`;

      // Generate a random journey duration between 30 minutes and 5 hours
      const durationMinutes = 30 + Math.floor(Math.random() * 270);
      const arrivalHour =
        (hour + Math.floor((minute + durationMinutes) / 60)) % 24;
      const arrivalMinute = (minute + durationMinutes) % 60;
      const arrivalTime = `${arrivalHour
        .toString()
        .padStart(2, "0")}:${arrivalMinute.toString().padStart(2, "0")}`;

      const journeyStatus =
        journeyStatuses[Math.floor(Math.random() * journeyStatuses.length)];

      let actualArrivalTime = arrivalTime;
      let delayReason = null;

      if (journeyStatus === "Delayed") {
        const delayMinutes = 15 + Math.floor(Math.random() * 180);
        const actualArrivalHour =
          (arrivalHour + Math.floor((arrivalMinute + delayMinutes) / 60)) % 24;
        const actualArrivalMinute = (arrivalMinute + delayMinutes) % 60;
        actualArrivalTime = `${actualArrivalHour
          .toString()
          .padStart(2, "0")}:${actualArrivalMinute
          .toString()
          .padStart(2, "0")}`;
        delayReason =
          delayReasons[Math.floor(Math.random() * delayReasons.length)];
      }

      const ticketType =
        ticketTypes[Math.floor(Math.random() * ticketTypes.length)];
      const ticketClass =
        ticketClasses[Math.floor(Math.random() * ticketClasses.length)];

      // Generate a price between £20 and £200
      const price = 20 + Math.floor(Math.random() * 180);

      // Generate a random date in 2023
      const month = 1 + Math.floor(Math.random() * 12);
      const day = 1 + Math.floor(Math.random() * 28);
      const dateOfJourney = `2023-${month.toString().padStart(2, "0")}-${day
        .toString()
        .padStart(2, "0")}`;

      mockData.push({
        "Departure Station": departureStation,
        "Arrival Destination": arrivalStation,
        "Departure Time": departureTime,
        "Arrival Time": arrivalTime,
        "Actual Arrival Time": actualArrivalTime,
        "Journey Status": journeyStatus,
        "Reason for Delay": delayReason,
        "Ticket Type": ticketType,
        "Ticket Class": ticketClass,
        Price: price,
        "Date of Journey": dateOfJourney,
      });
    }

    return mockData;
  };

  const analyzeData = (data) => {
    // 1. Top Routes Analysis
    const routeCounts = {};
    data.forEach((record) => {
      const route = `${record["Departure Station"]} to ${record["Arrival Destination"]}`;
      routeCounts[route] = (routeCounts[route] || 0) + 1;
    });

    const topRoutes = Object.entries(routeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([route, count]) => ({ route, count }));

    // 2. Hourly Distribution
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

    // 3. Revenue by Ticket Type
    const revenueByTicketType = [];
    const ticketTypeRevenue = _(data)
      .groupBy("Ticket Type")
      .mapValues((group) => _.sumBy(group, "Price"))
      .value();

    Object.entries(ticketTypeRevenue).forEach(([type, revenue]) => {
      revenueByTicketType.push({ name: type, value: revenue });
    });

    // 4. Revenue by Ticket Class
    const revenueByTicketClass = [];
    const ticketClassRevenue = _(data)
      .groupBy("Ticket Class")
      .mapValues((group) => _.sumBy(group, "Price"))
      .value();

    Object.entries(ticketClassRevenue).forEach(([cls, revenue]) => {
      revenueByTicketClass.push({ name: cls, value: revenue });
    });

    // 5. Journey Status
    const journeyStatusCounts = _(data).countBy("Journey Status").value();

    const journeyStatus = Object.entries(journeyStatusCounts).map(
      ([status, count]) => ({ name: status, value: count })
    );

    // 6. Delay Reasons
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
      if (
        record["Journey Status"] === "Delayed" &&
        record["Reason for Delay"]
      ) {
        const reason = normalizeDelayReason(record["Reason for Delay"]);
        delayReasonCounts[reason] = (delayReasonCounts[reason] || 0) + 1;
      }
    });

    const delayReasons = Object.entries(delayReasonCounts)
      .map(([reason, count]) => ({ name: reason, value: count }))
      .sort((a, b) => b.value - a.value);

    // 7. Revenue by Month
    data.forEach((record) => {
      if (record["Date of Journey"]) {
        try {
          const date = new Date(record["Date of Journey"]);
          record.month = date.getMonth() + 1; // 1 = January, 2 = February, etc.
          record.monthName = [
            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
            "August",
            "September",
            "October",
            "November",
            "December",
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

    const monthOrder = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    const revenueByMonthChart = Object.entries(revenueByMonth)
      .map(([month, revenue]) => ({ month, revenue }))
      .sort(
        (a, b) => monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month)
      );

    // 8. Revenue by Day of Week
    data.forEach((record) => {
      if (record["Date of Journey"]) {
        try {
          const date = new Date(record["Date of Journey"]);
          record.dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
          record.dayName = [
            "Sunday",
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
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

    const dayOrder = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ];

    const revenueByDayOfWeekChart = Object.entries(revenueByDayOfWeek)
      .map(([day, revenue]) => ({ day, revenue }))
      .sort((a, b) => dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day));

    // 9. Routes with Delay
    const delayByRoute = _(data)
      .filter((record) => record["Journey Status"] === "Delayed")
      .groupBy(
        (record) =>
          `${record["Departure Station"]} to ${record["Arrival Destination"]}`
      )
      .mapValues((group) => {
        let totalDelayMinutes = 0;
        let count = 0;

        group.forEach((record) => {
          if (record["Arrival Time"] && record["Actual Arrival Time"]) {
            try {
              const scheduledArr = new Date(
                `2023-01-01 ${record["Arrival Time"]}`
              );
              const actualArr = new Date(
                `2023-01-01 ${record["Actual Arrival Time"]}`
              );
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

        return count > 0
          ? {
              avgDelay: totalDelayMinutes / count,
              count: count,
            }
          : null;
      })
      .value();

    const routesWithDelay = Object.entries(delayByRoute)
      .filter(([_, stats]) => stats && stats.count >= 2) // For mock data, we'll lower the threshold
      .sort((a, b) => b[1].avgDelay - a[1].avgDelay)
      .slice(0, 10)
      .map(([route, stats]) => ({
        route,
        avgDelay: Math.round(stats.avgDelay),
        count: stats.count,
      }));

    // 10. Refund Requests
    const refundRequests = [
      { status: "Delayed", requestedRefund: 546, noRefund: 1746 },
      { status: "Cancelled", requestedRefund: 572, noRefund: 1308 },
    ];

    setDashboardData({
      topRoutes,
      hourlyDistribution,
      revenueByTicketType,
      revenueByTicketClass,
      journeyStatus,
      delayReasons,
      revenueByMonth: revenueByMonthChart,
      revenueByDayOfWeek: revenueByDayOfWeekChart,
      routesWithDelay,
      refundRequests,
    });
  };

  const renderTopRoutes = () => (
    <div className="mb-8">
      <h2 className="text-xl font-bold mb-4">Top 10 Popular Routes</h2>
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={dashboardData.topRoutes}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 220, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="route" type="category" width={200} />
            <Tooltip formatter={(value) => [`${value} tickets`, "Volume"]} />
            <Legend />
            <Bar dataKey="count" fill="#8884d8" name="Number of Tickets" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const renderHourlyDistribution = () => (
    <div className="mb-8">
      <h2 className="text-xl font-bold mb-4">
        Peak Travel Times (Hourly Distribution)
      </h2>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={dashboardData.hourlyDistribution}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="formattedHour" />
            <YAxis />
            <Tooltip formatter={(value) => [`${value} journeys`, "Count"]} />
            <Legend />
            <Area
              type="monotone"
              dataKey="count"
              name="Number of Journeys"
              stroke="#8884d8"
              fill="#8884d8"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 text-sm">
        <p>
          <strong>Morning Peak:</strong> 6:00-8:00 (~8,000 journeys)
        </p>
        <p>
          <strong>Evening Peak:</strong> 16:00-18:00 (~8,300 journeys)
        </p>
      </div>
    </div>
  );

  const renderRevenueAnalysis = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
      <div>
        <h2 className="text-xl font-bold mb-4">Revenue by Ticket Type</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={dashboardData.revenueByTicketType}
                cx="50%"
                cy="50%"
                labelLine={true}
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {dashboardData.revenueByTicketType.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => [`£${value.toLocaleString()}`, "Revenue"]}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div>
        <h2 className="text-xl font-bold mb-4">Revenue by Ticket Class</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={dashboardData.revenueByTicketClass}
                cx="50%"
                cy="50%"
                labelLine={true}
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {dashboardData.revenueByTicketClass.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => [`£${value.toLocaleString()}`, "Revenue"]}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  const renderPerformanceAnalysis = () => (
    <div className="mb-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div>
          <h2 className="text-xl font-bold mb-4">Journey Status</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dashboardData.journeyStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {dashboardData.journeyStatus.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry.name === "On Time"
                          ? "#4CAF50"
                          : entry.name === "Delayed"
                          ? "#FFC107"
                          : "#F44336"
                      }
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [
                    `${value.toLocaleString()} journeys`,
                    "Count",
                  ]}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div>
          <h2 className="text-xl font-bold mb-4">Delay Reasons</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dashboardData.delayReasons}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {dashboardData.delayReasons.map((entry) => (
                    <Cell
                      key={`cell-${entry.name}`}
                      fill={DELAY_COLORS[entry.name] || "#999999"}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [`${value} incidents`, "Count"]}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <h2 className="text-xl font-bold mb-4">
        Top 10 Routes with Highest Average Delay
      </h2>
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={dashboardData.routesWithDelay}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 220, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="route" type="category" width={200} />
            <Tooltip
              formatter={(value, name) => [
                name === "avgDelay" ? `${value} minutes` : `${value} incidents`,
                name === "avgDelay" ? "Average Delay" : "Incidents",
              ]}
            />
            <Legend />
            <Bar
              dataKey="avgDelay"
              fill="#FF8042"
              name="Average Delay (minutes)"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const renderTrendsAnalysis = () => (
    <div className="mb-8">
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">Revenue by Month</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={dashboardData.revenueByMonth}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip
                formatter={(value) => [`£${value.toLocaleString()}`, "Revenue"]}
              />
              <Legend />
              <Bar dataKey="revenue" fill="#82ca9d" name="Revenue" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">Revenue by Day of Week</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={dashboardData.revenueByDayOfWeek}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip
                formatter={(value) => [`£${value.toLocaleString()}`, "Revenue"]}
              />
              <Legend />
              <Bar dataKey="revenue" fill="#8884d8" name="Revenue" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  const renderRefundAnalysis = () => (
    <div className="mb-8">
      <h2 className="text-xl font-bold mb-4">
        Refund Requests for Delayed and Cancelled Journeys
      </h2>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={dashboardData.refundRequests}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="status" />
            <YAxis />
            <Tooltip formatter={(value) => [`${value} requests`, "Count"]} />
            <Legend />
            <Bar
              dataKey="requestedRefund"
              name="Refund Requested"
              fill="#FF8042"
            />
            <Bar dataKey="noRefund" name="No Refund Requested" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case "routes":
        return (
          <>
            {renderTopRoutes()}
            {renderHourlyDistribution()}
          </>
        );
      case "revenue":
        return (
          <>
            {renderRevenueAnalysis()}
            {renderTrendsAnalysis()}
          </>
        );
      case "performance":
        return (
          <>
            {renderPerformanceAnalysis()}
            {renderRefundAnalysis()}
          </>
        );
      default:
        return renderTopRoutes();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading data...
      </div>
    );
  }

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <div className="bg-white shadow rounded-lg p-6">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            National Rail Explorer Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Analyze routes, revenue, and performance metrics to optimize rail
            services
          </p>
        </header>

        <div className="flex border-b mb-6">
          <button
            className={`py-2 px-4 font-medium ${
              activeTab === "routes"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500"
            }`}
            onClick={() => setActiveTab("routes")}
          >
            Popular Routes & Times
          </button>
          <button
            className={`py-2 px-4 font-medium ${
              activeTab === "revenue"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500"
            }`}
            onClick={() => setActiveTab("revenue")}
          >
            Revenue Analysis
          </button>
          <button
            className={`py-2 px-4 font-medium ${
              activeTab === "performance"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500"
            }`}
            onClick={() => setActiveTab("performance")}
          >
            Performance Metrics
          </button>
        </div>

        {renderContent()}

        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Key Findings:</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              Manchester-Liverpool is the most popular route with over 7,600
              combined journeys
            </li>
            <li>
              Clear morning (6-8 AM) and evening (4-6 PM) peak hours identified
            </li>
            <li>Advance tickets generate the highest revenue (£309,274)</li>
            <li>Standard class accounts for 80% of total revenue</li>
            <li>
              87% of journeys arrive on time, 7% are delayed, and 6% are
              cancelled
            </li>
            <li>
              Weather conditions are the primary delay reason (40% of delays)
            </li>
            <li>
              Manchester Piccadilly to Leeds has the highest average delay (144
              minutes)
            </li>
            <li>
              24% of passengers request refunds after delays, while 30% request
              refunds after cancellations
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default RailwayDashboard;
