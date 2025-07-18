#!/bin/zsh

# Name of the output zip file
ZIP_FILE="dist.zip"

# List of files and directories to include
INCLUDE_ITEMS=(
  "manifest.json"
  "background.js"
  "content.js"
  "storage.js"
  "api.js"
  "calendar.js"
  "statistics.js"
  "popup.html"
  "popup.js"
  "styles.css"
  "jquery.min.js"
  "LICENSE"
  "images/"
)

# Remove old zip file if exists
rm -f "$ZIP_FILE"

# Create the zip archive including only the specified files and directories
zip -r "$ZIP_FILE" "${INCLUDE_ITEMS[@]}"

echo "Created $ZIP_FILE with the specified files and directories."