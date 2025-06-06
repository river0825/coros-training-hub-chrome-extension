#!/bin/zsh

# Name of the output zip file
ZIP_NAME="chrome-extension-deploy.zip"

# Remove any existing zip file
rm -f $ZIP_NAME

# Create the zip, excluding unnecessary files/folders
zip -r $ZIP_NAME . \
    -x "*.git*" \
    -x "*coverage/*" \
    -x "*.DS_Store" \
    -x "*.github/*" \
    -x "$ZIP_NAME" \
    -x "build-zip.sh"

echo "Created $ZIP_NAME for Chrome Web Store deployment."