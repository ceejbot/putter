#!/bin/bash

set -e

. ./.env

DB_USER=$DB_USER DB_NAME=$DB_NAME DB_PASSWORD=$DB_PASSWORD DB_PORT=$DB_PORT DB_HOST=$DB_HOST \
db-migrate --config=lib/db-config.js "$@"
