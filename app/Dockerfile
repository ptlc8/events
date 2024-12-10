# Android app builder image
FROM alpine

# Install required packages
RUN apk add --no-cache \
  curl \
  openjdk17 \
  unzip \
  wget \
  npm \
  libc6-compat \
  make \
  g++

ENV JAVA_HOME=/usr/lib/jvm/java-17-openjdk

# Install Android sdk
RUN mkdir -p /opt/android-sdk-linux/cmdline-tools \
  && wget 'https://dl.google.com/android/repository/commandlinetools-linux-9477386_latest.zip' -P /tmp \
  && unzip -d /opt/android-sdk-linux/cmdline-tools /tmp/commandlinetools-linux-9477386_latest.zip \
  && rm -rf /opt/android-sdk-linux/.android/cache

# Android variables
ENV ANDROID_SDK_HOME=/opt/android-sdk-linux
ENV ANDROID_SDK_ROOT=/opt/android-sdk-linux
ENV ANDROID_HOME=/opt/android-sdk-linux
ENV ANDROID_SDK=/opt/android-sdk-linux
ENV ANDROID_EMULATOR_HOME=$ANDROID_HOME
RUN export JAVA_HOME ANDROID_SDK_HOME ANDROID_SDK_ROOT ANDROID_HOME ANDROID_SDK

# Install Android extensions
WORKDIR $ANDROID_HOME/cmdline-tools/cmdline-tools/bin
RUN ./sdkmanager --sdk_root=$ANDROID_HOME "platform-tools" "build-tools;33.0.3" "platforms;android-33" "emulator"
RUN yes | ./sdkmanager --licenses > /dev/null

# Copy app code and install dependencies
WORKDIR /app
COPY package*.json ./
RUN npm i
COPY . .
RUN npm run sync
RUN chmod +x scripts/*.sh

# Create the entrypoint script
RUN echo -e "#!/bin/sh \n\
for s in \$@; do \n\
  if [ -f scripts/\$s.sh ]; then \n\
    ./scripts/\$s.sh \n\
  else \n\
    echo \"No script found for \$s\" \n\
  fi \n\
done \n\
" > entrypoint.sh \
  && chmod +x entrypoint.sh

ENTRYPOINT ["./entrypoint.sh"]