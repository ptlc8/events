cd android &&

./gradlew --no-build-cache --no-configuration-cache --stacktrace --continue assembleDebug &&

cp app/build/outputs/apk/debug/app-debug.apk ../outputs/app-debug.apk
