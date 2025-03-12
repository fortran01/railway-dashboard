const fs = require("fs");
const path = require("path");

// Path to the build directory
const buildDir = path.join(__dirname, "../build");

// Function to recursively process files in a directory
function processDirectory(directory) {
  const files = fs.readdirSync(directory);

  files.forEach((file) => {
    const filePath = path.join(directory, file);
    const stats = fs.statSync(filePath);

    if (stats.isDirectory()) {
      // Recursively process subdirectories
      processDirectory(filePath);
    } else {
      // Process files based on their extension
      const ext = path.extname(file).toLowerCase();

      if (ext === ".html") {
        // Add meta tags for cache control to HTML files
        addCacheControlToHtml(filePath);
      }
    }
  });
}

// Function to add cache control meta tags to HTML files
function addCacheControlToHtml(filePath) {
  let content = fs.readFileSync(filePath, "utf8");

  // Check if cache control meta tag already exists
  if (!content.includes('http-equiv="Cache-Control"')) {
    // Add cache control meta tags right after the <head> tag
    content = content.replace(
      "<head>",
      `<head>
    <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
    <meta http-equiv="Pragma" content="no-cache">
    <meta http-equiv="Expires" content="0">`
    );

    // Write the modified content back to the file
    fs.writeFileSync(filePath, content, "utf8");
    console.log(`Added cache control headers to ${filePath}`);
  }
}

// Start processing the build directory
console.log("Adding cache control headers to build files...");
processDirectory(buildDir);
console.log("Cache control headers added successfully!");

// Log a reminder about server-side cache control headers
console.log(
  "\nReminder: For production deployments, also configure server-side cache control headers:"
);
console.log("- Set short/no cache for HTML files");
console.log("- Set long cache (1 year) for hashed assets (JS, CSS, images)");
console.log(
  "- Configure proper Cache-Control headers in your web server or CDN"
);
