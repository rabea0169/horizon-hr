FROM node:20-alpine AS builder

WORKDIR /app

# Copy package configuration
COPY package*.json ./

# Install all dependencies (including devDependencies for building)
RUN npm ci

# Copy the rest of the application source code
COPY . .

# Build the client frontend and bundle the Hono server
RUN npm run build

# Stage 2: Production image
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy built assets and production dependency configurations from builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/db ./db
COPY --from=builder /app/contracts ./contracts
COPY --from=builder /app/tsconfig.server.json ./
COPY --from=builder /app/tsconfig.json ./

# Install only production dependencies
RUN npm ci --only=production && npm install cross-env

EXPOSE 3000

CMD ["npm", "run", "start"]
