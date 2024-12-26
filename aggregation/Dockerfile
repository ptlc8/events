ARG NODE_VERSION=lts
FROM node:${NODE_VERSION}-slim

RUN apt update && apt install -y cron curl jq

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source code
COPY *.js *.sh ./
COPY providers/ ./providers/

# Setup cronjobs
RUN ./setup-cron.sh

CMD ["bash", "-c", "printenv >> /etc/environment && cron -f -l 7"]