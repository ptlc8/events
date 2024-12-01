ARG NODE_VERSION=lts
FROM node:${NODE_VERSION}-slim

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source code
COPY *.js ./

ENTRYPOINT ["npm", "run"]