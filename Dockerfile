# JPEG Encoder Web UI - Docker Deployment
FROM node:20-alpine AS base

# Build frontend
FROM base AS frontend-build
WORKDIR /app/frontend
COPY ui/frontend/package*.json ./
RUN npm ci
COPY ui/frontend/ ./
RUN npm run build

# Build backend
FROM base AS backend-build
WORKDIR /app/backend
COPY ui/backend/package*.json ./
RUN npm ci
COPY ui/backend/ ./
RUN npm run build

# Production image
FROM node:20-alpine AS production

# Install build tools for C++ encoder
RUN apk add --no-cache g++ cmake make

WORKDIR /app

# Copy and build C++ encoder
COPY CMakeLists.txt ./
COPY cmake/ ./cmake/
COPY include/ ./include/
COPY src/ ./src/
COPY external/ ./external/

RUN mkdir build && cd build && \
    cmake .. -DCMAKE_BUILD_TYPE=Release && \
    cmake --build . --target jpegdsp_cli_encode

# Copy backend
COPY --from=backend-build /app/backend/dist ./backend/dist
COPY --from=backend-build /app/backend/node_modules ./backend/node_modules
COPY --from=backend-build /app/backend/package.json ./backend/

# Copy frontend build to serve statically
COPY --from=frontend-build /app/frontend/dist ./backend/public

# Copy test images
COPY data/standard_test_images/ ./data/standard_test_images/

ENV NODE_ENV=production
ENV PORT=3000
ENV CLI_PATH=/app/build/jpegdsp_cli_encode

WORKDIR /app/backend
EXPOSE 3000

CMD ["node", "dist/server.js"]
