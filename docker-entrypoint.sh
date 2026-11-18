#!/bin/sh
set -e

# The uploads volume can hold files written by older containers that ran as
# root. Fix ownership once per start, then drop to the unprivileged node user
# so the API itself never runs as root.
if [ "$(id -u)" = "0" ]; then
    mkdir -p /app/uploads/banners /app/uploads/brands /app/uploads/categories \
        /app/uploads/subcategories /app/uploads/gifts /app/uploads/products /app/uploads/users
    chown -R node:node /app/uploads
    exec su-exec node "$@"
fi

exec "$@"
