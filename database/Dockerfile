ARG MARIADB_VERSION=10.11
FROM mariadb:$MARIADB_VERSION

# Copy the custom configuration file
COPY ./mariadb.cnf /etc/mysql/conf.d/mariadb.cnf

# Copy the database schema
COPY ./init.sql /docker-entrypoint-initdb.d/init.sql