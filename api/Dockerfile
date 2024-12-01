ARG PHP_VERSION=8
FROM php:${PHP_VERSION}-fpm-alpine

# Use the default production configuration
ARG PHP_ENV=production # can be "development"
RUN mv "$PHP_INI_DIR/php.ini-"${PHP_ENV} "$PHP_INI_DIR/php.ini"

# Install the mysqli extension
RUN docker-php-ext-install mysqli

# Copy the source files
COPY src /var/www/html
WORKDIR /var/www/html

# Set global parameters to environment variable values
RUN echo "<?php \
    define('DB_HOST', getenv('DB_HOST')); \
    define('DB_USER', getenv('DB_USER')); \
    define('DB_PASS', getenv('DB_PASS')); \
    define('DB_NAME', getenv('DB_NAME')); \
    define('PORTAL_CONNECT_URL', getenv('PORTAL_CONNECT_URL')); \
    define('PORTAL_USER_URL', getenv('PORTAL_USER_URL')); \
    define('PORTAL_OVERRIDE_HOST', getenv('PORTAL_OVERRIDE_HOST')); \
    define('SEATGEEK_CLIENT_ID', getenv('SEATGEEK_CLIENT_ID')); \
    define('SEATGEEK_CLIENT_SECRET', getenv('SEATGEEK_CLIENT_SECRET')); \
    define('TICKETMASTER_API_KEY', getenv('TICKETMASTER_API_KEY')); \
?>" > /var/www/html/credentials.php

# Start the server
CMD ["php-fpm"]
