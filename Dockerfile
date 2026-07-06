FROM node:20-alpine

WORKDIR /app

# Install only production dependencies first for better layer caching.
COPY package*.json ./
RUN npm install --omit=dev

# sharp needs these on alpine for image processing.
RUN apk add --no-cache vips-dev || true

COPY . .

ENV NODE_ENV=production
EXPOSE 8000

# Run directly with node (nodemon is for local dev only).
CMD ["node", "server.js"]
