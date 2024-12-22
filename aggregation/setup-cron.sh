#!/bin/bash

cron_file="/etc/cron.d/aggregation"
aggregation_dir=$(pwd)

rm -f "$cron_file"
touch "$cron_file"
chmod 0644 "$cron_file"

cd providers
hour=3
for script in *.js; do
    provider=$(basename $script .js)
    echo "10 $hour * * * root \"$aggregation_dir\"/aggregate.sh \"$provider\" 2>&1 > /proc/1/fd/1" >> $cron_file
    hour=$((hour + 1))
done
