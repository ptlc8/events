# Build front
cd ../front
npm run build:app
cd ../app

# Build builder container
docker build -t events-app-android-builder .

# Run builder container
docker run --rm -v ./outputs:/app/outputs events-app-android-builder build-apk-debug build-apk-release build-aab-release
