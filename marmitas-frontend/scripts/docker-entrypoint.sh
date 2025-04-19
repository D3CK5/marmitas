#!/bin/sh
set -e

# Create runtime environment variables configuration
if [ -f /app/env-config.js ]; then
    rm /app/env-config.js
fi

# Generate runtime environment variables
echo "window.ENV = {" > /usr/share/nginx/html/env-config.js
for var in $(env | grep REACT_APP_ || env | grep VITE_); do
    echo "  ${var%=*}: \"${var#*=}\"," >> /usr/share/nginx/html/env-config.js
done
echo "};" >> /usr/share/nginx/html/env-config.js

# Execute CMD
exec "$@" 