
#!/bin/sh

# Replace environment variables in the app
JSFILE=$(find /usr/share/nginx/html/assets -name "index-*.js" | head -n 1)

# Only run if we found the JS file
if [ -n "$JSFILE" ]; then
  echo "Processing: $JSFILE"
  
  # Replace all occurrences of VITE_API_URL placeholder with the actual value
  if [ -n "$VITE_API_URL" ]; then
    sed -i "s|VITE_API_URL_PLACEHOLDER|$VITE_API_URL|g" $JSFILE
  fi
  
  # Add more env vars here if needed
fi

exit 0
