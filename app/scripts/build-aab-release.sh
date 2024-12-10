cd android &&

./gradlew --no-build-cache --no-configuration-cache bundleRelease &&

cp app/build/outputs/bundle/release/app-release.aab ../outputs/app-release.aab
