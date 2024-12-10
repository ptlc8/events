cd android &&

./gradlew --no-build-cache --no-configuration-cache assembleRelease &&

cp app/build/outputs/apk/release/app-release*.apk ../outputs/app-release.apk
