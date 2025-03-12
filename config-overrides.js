const { override, addWebpackPlugin } = require("customize-cra");
const { WebpackManifestPlugin } = require("webpack-manifest-plugin");
const path = require("path");

module.exports = override(
  // Add WebpackManifestPlugin to generate a manifest file with content hashes
  addWebpackPlugin(
    new WebpackManifestPlugin({
      fileName: "asset-manifest.json",
      publicPath: "/",
      generate: (seed, files, entrypoints) => {
        const manifestFiles = files.reduce((manifest, file) => {
          manifest[file.name] = file.path;
          return manifest;
        }, seed);

        const entrypointFiles = entrypoints.main.filter(
          (fileName) => !fileName.endsWith(".map")
        );

        return {
          files: manifestFiles,
          entrypoints: entrypointFiles,
        };
      },
    })
  ),

  // Customize the output filenames to include content hashes
  (config) => {
    // Ensure JS files have content hashes
    config.output.filename = "static/js/[name].[contenthash:8].js";
    config.output.chunkFilename = "static/js/[name].[contenthash:8].chunk.js";

    // Ensure CSS files have content hashes
    const miniCssExtractPlugin = config.plugins.find(
      (plugin) => plugin.constructor.name === "MiniCssExtractPlugin"
    );

    if (miniCssExtractPlugin) {
      miniCssExtractPlugin.options.filename =
        "static/css/[name].[contenthash:8].css";
      miniCssExtractPlugin.options.chunkFilename =
        "static/css/[name].[contenthash:8].chunk.css";
    }

    // Ensure media files have content hashes
    const oneOfRules = config.module.rules.find((rule) => rule.oneOf);
    if (oneOfRules) {
      const fileLoaderRule = oneOfRules.oneOf.find(
        (rule) => rule.loader && rule.loader.includes("file-loader")
      );

      if (fileLoaderRule) {
        fileLoaderRule.options.name =
          "static/media/[name].[contenthash:8].[ext]";
      }
    }

    return config;
  }
);
