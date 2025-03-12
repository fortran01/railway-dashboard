// This file is used to track the version of the application
// Change this version number whenever you want to invalidate the cache
export const APP_VERSION = "1.1.0";

// Generate a build timestamp
export const BUILD_TIMESTAMP = new Date().toISOString();

// Function to append version query parameters to URLs
export const appendVersionToUrl = (url) => {
  if (!url) return url;

  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}v=${APP_VERSION}&t=${encodeURIComponent(
    BUILD_TIMESTAMP
  )}`;
};

// Function to check if the app has been updated
export const checkForUpdates = () => {
  // Get the current version from the HTML data attribute
  const currentVersion = document.documentElement.dataset.version;

  // Fetch the index.html file to check for a new version
  fetch(`/index.html?_=${new Date().getTime()}`)
    .then((response) => response.text())
    .then((html) => {
      // Extract the version from the fetched HTML
      const match = html.match(/data-version="([^"]+)"/);
      const fetchedVersion = match ? match[1] : null;

      if (fetchedVersion && fetchedVersion !== currentVersion) {
        console.log("New version detected:", fetchedVersion);

        // Show update notification
        if (
          window.confirm(
            "A new version of the application is available. Reload now?"
          )
        ) {
          window.location.reload(true);
        }
      }
    })
    .catch((error) => {
      console.error("Error checking for updates:", error);
    });
};

// Set up periodic update checks
export const setupUpdateChecker = (intervalMinutes = 15) => {
  // Check for updates every X minutes
  setInterval(checkForUpdates, intervalMinutes * 60 * 1000);

  // Also check when the user returns to the tab
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      checkForUpdates();
    }
  });
};
