# Events

Ceci est un site web permettant aux utilisateurs de rechercher des événements autour d'eux ou d'en ajouter.

Une version est actuellement à cette URL : [ambi.dev/events](https://ambi.dev/events). (BDD 10.5.12-MariaDB-cll-lve, PHP 7.2.34) La branche master y est auto-déployer à chaque push.

## Lancer en local

Il est possible de lancer le projet en local.
Pour cela il faut faudra PHP et mysql.
 - cloner le projet
 - créer un fichier credentials.php dans le dossier api contenant identifiants de la base de données, sous cette forme :
```php
<?php
define('EVENTS_DB_HOSTNAME', 'localhost');
define('EVENTS_DB_USER', 'user');
define('EVENTS_DB_PASSWORD', 'password123');
define('EVENTS_DB_NAME', 'events');
?>
```
 - exécuter dans la base de données le script SQL [init.sql](init.sql)
 - lancer le serveur php