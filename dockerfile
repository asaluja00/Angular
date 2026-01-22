# ---------- BUILD STAGE ----------  
FROM node:20-alpine AS builder

WORKDIR /app

# Install deps (use CI to generate deterministic installs)
COPY package*.json ./
# Use install with legacy-peer-deps to avoid ERESOLVE failures during Docker builds
# (some projects have peer dependency conflicts that `npm ci` enforces).
RUN npm install --legacy-peer-deps --silent

# Copy sources and build the prod bundle
COPY . .
# Allow selecting the Angular build configuration at docker build time.
# Default is 'production' but CI or local testing can pass BUILD_CONFIG=development
ARG BUILD_CONFIG=production
RUN npm run build -- --configuration ${BUILD_CONFIG}

# ---------- RUNTIME STAGE ----------
FROM nginx:alpine

# Copy Angular build output (angular.json outputPath is 'dist/app-template')
COPY --from=builder /app/dist/app-template /usr/share/nginx/html

# Replace nginx config if provided in repo
COPY nginx.conf /etc/nginx/nginx.conf

# Expose the port configured in nginx.conf (8080)
EXPOSE 808

CMD ["nginx", "-g", "daemon off;"]