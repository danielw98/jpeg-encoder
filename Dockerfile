# Build stage for frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app
COPY ui/frontend/package*.json ./
RUN npm ci --legacy-peer-deps
COPY ui/frontend/ ./
RUN npm run build

# Build stage for backend
FROM node:20-alpine AS backend-build
WORKDIR /app
COPY ui/backend/package*.json ./
RUN npm ci
COPY ui/backend/ ./
RUN npm run build

# Production image with C++ compiler
FROM node:20-alpine AS production

# Install C++ build tools and git (needed for FetchContent)
RUN apk add --no-cache g++ cmake make git

WORKDIR /app

# Build C++ encoder
COPY CMakeLists.txt ./
COPY cmake/ ./cmake/
COPY include/ ./include/
COPY src/ ./src/
COPY external/ ./external/

RUN mkdir -p build && cd build && \
    cmake .. -DCMAKE_BUILD_TYPE=Release -DBUILD_TESTS=OFF -DBUILD_EXAMPLES=OFF && \
    cmake --build . --target jpegdsp_cli_encode -j4

# Copy backend
WORKDIR /app/backend
COPY --from=backend-build /app/dist ./dist
COPY --from=backend-build /app/node_modules ./node_modules
COPY --from=backend-build /app/package.json ./

# Copy frontend to serve as static
COPY --from=frontend-build /app/dist ./public

# Copy test images
COPY data/standard_test_images/ /app/data/standard_test_images/

# Environment
ENV NODE_ENV=production
ENV PORT=3001
ENV CLI_PATH=/app/build/jpegdsp_cli_encode
ENV IMAGES_DIR=/app/data/standard_test_images
ENV PUBLIC_DIR=/app/backend/public

EXPOSE 3001

CMD ["node", "dist/server.js"]
