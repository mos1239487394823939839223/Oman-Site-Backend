FROM node:20-alpine

WORKDIR /app

# Install exactly the production dependencies in package-lock.json.
COPY package*.json ./
RUN npm ci --omit=dev

# sharp needs these on alpine for image processing; su-exec lets the entrypoint
# drop from root to the node user.
RUN apk add --no-cache su-exec && (apk add --no-cache vips-dev || true)

COPY . .
RUN chmod +x docker-entrypoint.sh

ENV NODE_ENV=production
EXPOSE 8000

# Starts as root only to fix ownership of the uploads volume, then runs the
# API as the unprivileged `node` user (see docker-entrypoint.sh).
ENTRYPOINT ["./docker-entrypoint.sh"]
# Run directly with node (nodemon is for local dev only).
CMD ["node", "server.js"]
