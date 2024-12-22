#!/bin/bash

case $1 in
    dev)
        cd front
        npm run dev -- ${@:2}
        ;;
    docker)
        docker-compose up --remove-orphans --build ${@:2} web-server
        ;;
    aggregate)
        docker-compose build aggregator
        docker-compose run --rm -- aggregator ./aggregate.sh ${@:2}
        ;;
    android)
        cd app
        npm run build:front
        npm run run:android -- ${@:2}
        ;;
    *)
        echo "Usage: $0 {dev|docker|android}"
        exit 1
        ;;
esac