# Application mobile


## Compilation du front-end pour l'app 📱 

> Il vous faudra NodeJS

```bash
npm i
npm run build:front
```


## Android 🤖

> Il vous faudra le SDK Android

 - configurer le SDK Android avec la variable d'environnement `ANDROID_HOME` (accepter les licences si nécessaire)


### Soit lancer l'application sur un appareil 🔌

 - brancher l'appareil via USB, activer le mode débogage sur celui-ci et autoriser l'installation d'applications via USB
 - exécuter la commande `npm run run:android`


### Soit construire l'application installable 📦

 - exécuter la commande `npm run build:android`
