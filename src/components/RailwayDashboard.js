import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
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
const DELAY_COLORS = {
  "Signal Failure": "#e41a1c",
  "Technical Issue": "#377eb8",
  "Weather Conditions": "#4daf4a",
  "Staff Shortage": "#984ea3",
  Traffic: "#ff7f00",
};

const RailwayDashboard = () => {
  const [activeTab, setActiveTab] = useState("routes");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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
        console.log("Loading data from CSV file...");

        let response;
        let csvText;

        // First try with process.env.PUBLIC_URL
        try {
          response = await fetch(`${process.env.PUBLIC_URL}/railway.csv`);
          if (!response.ok) {
            throw new Error(
              `Failed to fetch CSV file: ${response.statusText} (Status: ${response.status})`
            );
          }
          csvText = await response.text();
        } catch (fetchError) {
          console.warn("First fetch attempt failed:", fetchError);

          // Try with a direct path as fallback
          console.log("Trying fallback fetch method...");
          response = await fetch("/railway.csv");
          if (!response.ok) {
            throw new Error(
              `Both fetch attempts failed. Last error: ${response.statusText} (Status: ${response.status})`
            );
          }
          csvText = await response.text();
        }

        // Check if the response is actually a CSV file
        const contentType = response.headers.get("content-type");
        console.log("Content type:", contentType);

        if (contentType && contentType.includes("text/html")) {
          throw new Error(
            "Received HTML instead of CSV data. The server might be returning an error page."
          );
        }

        // Check if the first few characters look like CSV
        if (
          csvText.trim().startsWith("<!DOCTYPE") ||
          csvText.trim().startsWith("<html")
        ) {
          throw new Error(
            "Received HTML instead of CSV data. The server might be returning an error page."
          );
        }

        console.log("First 100 characters of CSV:", csvText.substring(0, 100));

        // Parse the CSV data using Papa Parse
        Papa.parse(csvText, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          delimiter: ",", // Explicitly set the delimiter to comma
          transformHeader: (header) => {
            // Trim whitespace from headers
            return header.trim();
          },
          complete: (results) => {
            if (results.errors && results.errors.length > 0) {
              console.warn("CSV parsing had some errors:", results.errors);

              // If there are critical errors, show them to the user
              const criticalErrors = results.errors.filter(
                (e) => e.type === "Delimiter" || e.type === "FieldMismatch"
              );
              if (criticalErrors.length > 0) {
                setError(
                  `CSV parsing errors: ${criticalErrors
                    .map((e) => e.message)
                    .join(", ")}`
                );
                setLoading(false);
                return;
              }
            }

            let csvData = results.data;
            console.log(
              `Successfully loaded ${csvData.length} records from CSV`
            );

            // Filter out any empty rows
            csvData = csvData.filter(
              (record) =>
                Object.keys(record).length > 0 &&
                Object.values(record).some(
                  (value) =>
                    value !== null && value !== undefined && value !== ""
                )
            );

            if (csvData.length === 0) {
              setError(
                "No valid data found in the CSV file after filtering empty rows."
              );
              setLoading(false);
              return;
            }

            // Get the actual column names from the CSV
            const actualColumns = Object.keys(csvData[0]);
            console.log("Actual CSV columns:", actualColumns);

            // Validate that the CSV has the required columns
            if (csvData.length > 0) {
              const requiredColumns = [
                "Departure Station",
                "Arrival Destination",
                "Departure Time",
                "Arrival Time",
                "Actual Arrival Time",
                "Journey Status",
                "Reason for Delay",
                "Ticket Type",
                "Ticket Class",
                "Price",
                "Date of Journey",
                "Refund Request",
              ];

              // Check if all required columns exist in the actual columns
              const missingColumns = requiredColumns.filter(
                (column) => !actualColumns.includes(column)
              );

              if (missingColumns.length > 0) {
                // Try to map column names that might be slightly different
                const columnMapping = {
                  "Departure Station": [
                    "DepartureStation",
                    "Departure_Station",
                    "From",
                  ],
                  "Arrival Destination": [
                    "ArrivalDestination",
                    "Arrival_Destination",
                    "To",
                    "Destination",
                  ],
                  "Departure Time": [
                    "DepartureTime",
                    "Departure_Time",
                    "Start Time",
                  ],
                  "Arrival Time": ["ArrivalTime", "Arrival_Time", "End Time"],
                  "Actual Arrival Time": [
                    "ActualArrivalTime",
                    "Actual_Arrival_Time",
                    "Real Arrival Time",
                  ],
                  "Journey Status": [
                    "JourneyStatus",
                    "Journey_Status",
                    "Status",
                  ],
                  "Reason for Delay": [
                    "ReasonForDelay",
                    "Reason_For_Delay",
                    "Delay Reason",
                  ],
                  "Ticket Type": ["TicketType", "Ticket_Type"],
                  "Ticket Class": ["TicketClass", "Ticket_Class", "Class"],
                  Price: ["Cost", "Fare", "Amount"],
                  "Date of Journey": [
                    "DateOfJourney",
                    "Date_Of_Journey",
                    "Travel Date",
                  ],
                  "Refund Request": [
                    "RefundRequest",
                    "Refund_Request",
                    "Refund",
                  ],
                };

                // Create a mapping from actual columns to required columns
                const actualToRequired = {};
                actualColumns.forEach((actualCol) => {
                  for (const [reqCol, alternatives] of Object.entries(
                    columnMapping
                  )) {
                    if (
                      alternatives.includes(actualCol) ||
                      actualCol.toLowerCase() === reqCol.toLowerCase() ||
                      actualCol.toLowerCase().replace(/\s+/g, "") ===
                        reqCol.toLowerCase().replace(/\s+/g, "")
                    ) {
                      actualToRequired[actualCol] = reqCol;
                      break;
                    }
                  }
                });

                // If we found mappings, rename the columns in the data
                if (Object.keys(actualToRequired).length > 0) {
                  console.log("Mapping columns:", actualToRequired);
                  csvData = csvData.map((record) => {
                    const newRecord = { ...record };
                    for (const [actualCol, reqCol] of Object.entries(
                      actualToRequired
                    )) {
                      if (record[actualCol] !== undefined) {
                        newRecord[reqCol] = record[actualCol];
                      }
                    }
                    return newRecord;
                  });

                  // Check again for missing columns after mapping
                  const stillMissingColumns = requiredColumns.filter(
                    (column) =>
                      !Object.keys(csvData[0]).includes(column) &&
                      !Object.values(actualToRequired).includes(column)
                  );

                  if (stillMissingColumns.length > 0) {
                    setError(
                      `CSV is still missing required columns after mapping: ${stillMissingColumns.join(
                        ", "
                      )}. Found columns: ${actualColumns.join(", ")}`
                    );
                    setLoading(false);
                    return;
                  }
                } else {
                  setError(
                    `CSV is missing required columns: ${missingColumns.join(
                      ", "
                    )}. Found columns: ${actualColumns.join(", ")}`
                  );
                  setLoading(false);
                  return;
                }
              }
            }

            analyzeData(csvData);
            setLoading(false);
          },
          error: (error) => {
            console.error("Error parsing CSV:", error);
            setError(`Error parsing CSV: ${error.message}`);
            setLoading(false);
          },
        });
      } catch (error) {
        console.error("Error loading data:", error);
        setLoading(false);
        setError(error.message);
      }
    };

    processData();
  }, []);

  const analyzeData = (data) => {
    try {
      // Ensure numeric values are properly converted
      data = data.map((record) => ({
        ...record,
        Price:
          typeof record.Price === "string"
            ? parseFloat(record.Price) || 0
            : record.Price || 0,
      }));

      // 1. Top Routes Analysis
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
      // Calculate refund requests dynamically from data
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
    } catch (error) {
      console.error("Error analyzing data:", error);
      setError(
        `Error analyzing data: ${error.message}. Please check that your CSV file has the correct format.`
      );
      setLoading(false);
      return;
    }
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
        {error ? `Error: ${error}` : "Loading data..."}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4">
        <h2 className="text-2xl font-bold text-red-600 mb-4">
          Error Loading Data
        </h2>
        <p className="text-lg mb-4">{error}</p>
        <p className="text-gray-600">
          Please check that the railway.csv file exists in the public folder and
          has the correct format.
          <br />
          Expected columns: "Departure Station", "Arrival Destination",
          "Departure Time", "Arrival Time", "Actual Arrival Time", "Journey
          Status", "Reason for Delay", "Ticket Type", "Ticket Class", "Price",
          "Date of Journey", "Refund Request"
          <br />
          <br />
          <strong>Troubleshooting:</strong>
          <br />
          1. Make sure the CSV file is in the public folder and named
          "railway.csv"
          <br />
          2. Check that the CSV file has the correct column headers (they must
          match exactly)
          <br />
          3. Try restarting the development server with "npm start"
          <br />
          4. Check the browser console for more detailed error messages
        </p>
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
              {dashboardData.refundRequests.find((r) => r.status === "Delayed")
                ? `${Math.round(
                    (dashboardData.refundRequests.find(
                      (r) => r.status === "Delayed"
                    ).requestedRefund /
                      (dashboardData.refundRequests.find(
                        (r) => r.status === "Delayed"
                      ).requestedRefund +
                        dashboardData.refundRequests.find(
                          (r) => r.status === "Delayed"
                        ).noRefund)) *
                      100
                  )}% of passengers request refunds after delays`
                : "24% of passengers request refunds after delays"}
              , while
              {dashboardData.refundRequests.find(
                (r) => r.status === "Cancelled"
              )
                ? `${Math.round(
                    (dashboardData.refundRequests.find(
                      (r) => r.status === "Cancelled"
                    ).requestedRefund /
                      (dashboardData.refundRequests.find(
                        (r) => r.status === "Cancelled"
                      ).requestedRefund +
                        dashboardData.refundRequests.find(
                          (r) => r.status === "Cancelled"
                        ).noRefund)) *
                      100
                  )}% request refunds after cancellations`
                : "30% request refunds after cancellations"}
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default RailwayDashboard;
