#!/bin/bash

case $1 in
    dev)
        cd front
        npm run dev
        ;;
    docker)
        docker-compose up --remove-orphans --build ${@:2} web-server
        ;;
    aggregate)
        docker-compose build aggregator
        docker-compose run --rm -- aggregator ${@:2}
        ;;
    android)
        cd app
        npm run build:front
        npm run run:android
        ;;
    *)
        echo "Usage: $0 {dev|docker|android}"
        exit 1
        ;;
esac