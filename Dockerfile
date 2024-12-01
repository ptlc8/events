ARG HTTPD_VERSION=2.4
ARG NODE_VERSION=lts


# Front-end build image
FROM node:${NODE_VERSION}-slim AS build

WORKDIR /app

# Install dependencies
COPY front/package*.json ./
RUN npm ci --omit=dev

# Copy the source files
COPY front/*.js front/*.html ./
COPY front/public/ ./public/
COPY front/src/ ./src/

# Build the front-end
ARG VITE_MAPBOX_ACCESS_TOKEN
ARG VITE_BASE_URL
RUN npm run build:front


# Runtime image
FROM httpd:${HTTPD_VERSION}-alpine AS runtime

# Copy custom configuration files
RUN echo "IncludeOptional conf/custom/*.conf" >> /usr/local/apache2/conf/httpd.conf
COPY ./httpd-docker.conf /usr/local/apache2/conf/custom/

# Copy the built front-end files
RUN rm /usr/local/apache2/htdocs/index.html
COPY --from=build /app/dist/ /usr/local/apache2/htdocs/