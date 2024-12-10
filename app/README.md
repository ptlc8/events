# Application mobile


## Compilation du front-end pour l'app 📱

> Il vous faudra NodeJS

```bash
npm i
npm run build:front
```


## Android 🤖

### Soit lancer l'application sur un appareil 🔌

> Il vous faudra le SDK Android

 - configurer le SDK Android avec la variable d'environnement `ANDROID_HOME` (accepter les licences si nécessaire)
 - brancher l'appareil via USB, activer le mode débogage sur celui-ci et autoriser l'installation d'applications via USB
 - exécuter la commande `npm run run:android`


### Soit construire l'application installable avec Docker 📦

> Il vous faudra Docker

 - exécuter le script `./build-via-docker.sh`
