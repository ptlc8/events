#!/bin/bash

# Usage: escapejson <texte>
function escapejson() {
    echo "$1" | sed 's/\\/\\\\/g;s/"/\\\"/g' | sed ':a;N;$!ba;s/\n/\\n/g'
}

# Usage: sendwebhook <title> <description> <color>
function sendwebhook() {
    if [ -z "$AGGREGATION_WEBHOOK_URL" ]; then
        echo "No webhook URL provided, skipping notification"
        return
    fi
    local title=$(escapejson "$1")
    local description=$(escapejson "$2")
    if ! [ -z "$description" ]; then
        local description='```\n'"$description"'```'
    fi
    curl -X POST \
         -H 'Content-Type: application/json' \
         -d '{
               "embeds": [{
                   "title": "'"$title"'",
                   "description": "'"$description"'",
                   "color": '"$3"'
               }]
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
    echo "$emoji $1 aggregation success"
    sendwebhook "$emoji $1 aggregation success" "$logs" 56320
else
    emojis=(🍎 ❤ 📕 🍅 🍒 🌶)
    emoji=${emojis[$RANDOM % ${#emojis[@]}]}
    echo "$emoji $1 aggregation failure ($exitcode)"
    sendwebhook "$emoji $1 aggregation failure ($exitcode)" "$logs" 16711680
fi
