#!/bin/bash

# Usage: sendwebhook <content>
function sendwebhook() {
    if [ -z "$AGGREGATION_WEBHOOK_URL" ]; then
        echo "No webhook URL provided, skipping notification"
        return
    fi
    local jsoncontent=$(echo -e "$1" | jq --raw-input -s '.')
    curl -X POST \
         -H 'Content-Type: application/json' \
         -d '{
               "content": '"$jsoncontent"'
             }' \
         ${AGGREGATION_WEBHOOK_URL}
}

cd "$(dirname -- "$0")"

echo "Aggregating data from $1"
logs=$(/usr/local/bin/node . "$1" 2>&1)
exitcode=$?

echo "$logs"

if [ $exitcode -eq 0 ]; then
    emojis=(🍏 🥬 💚 📗 🍀 🌱)
    emoji=${emojis[$RANDOM % ${#emojis[@]}]}
    result=$(echo $(echo "$logs" | tr '\n' ' ') | grep -oP '\{[^\{]*\}$')
    newevents=$(echo "$result" | jq '."db.inserted"')
    echo "$emoji $1 aggregation success"
    sendwebhook "$emoji $1 aggregation success\n$newevents new events"
else
    emojis=(🍎 ❤ 📕 🍅 🍒 🌶)
    emoji=${emojis[$RANDOM % ${#emojis[@]}]}
    echo "$emoji $1 aggregation failure ($exitcode)"
    sendwebhook "$emoji $1 aggregation failure ($exitcode)\n```\n$logs```"
fi
