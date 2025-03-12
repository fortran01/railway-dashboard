import React, { useEffect } from "react";
import RailwayDashboard from "./components/RailwayDashboard";
import { APP_VERSION, setupUpdateChecker } from "./version";

function App() {
  useEffect(() => {
    // Set up the update checker when the app loads
    setupUpdateChecker(15); // Check every 15 minutes

    // Log the current version
    console.log(`Railway Dashboard v${APP_VERSION}`);

    // Add version to document title
    document.title = `Railway Dashboard v${APP_VERSION}`;
  }, []);

  return (
    <div className="App">
      <RailwayDashboard />
    </div>
  );
}

export default App;
