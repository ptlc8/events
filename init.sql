CREATE TABLE `events` (
  `id` varchar(34) NOT NULL COMMENT 'id',
  `title` text COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'nom',
  `author` text NOT NULL COMMENT 'organisateur',
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT ('') COMMENT 'description',
  `start` datetime NOT NULL COMMENT 'date et horaire de début',
  `end` datetime NOT NULL COMMENT 'date et horaire de fin',
  `lng` float NOT NULL COMMENT 'longitude',
  `lat` float NOT NULL COMMENT 'latidude',
  `placename` tinytext COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'nom du lieu',
  `categories` text COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT ('') COMMENT 'catégories',
  `images` text COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT ('') COMMENT 'images',
  `imagesCredits` text COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT ('') COMMENT 'crédits des images',
  `status` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'état',
  `contact` text COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT ('') COMMENT 'moyens de contact',
  `registration` text COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT ('') COMMENT 'moyens d''inscription',
  `public` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` datetime NULL 'date de création',
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'date de mise à jour',
  `source` text COLLATE utf8mb4_unicode_ci NULL COMMENT 'source',
  `sourceUrl` text COLLATE utf8mb4_unicode_ci NULL COMMENT 'lien de la source'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `events`
  ADD PRIMARY KEY (`id`)/*,
  ADD KEY `author` (`author`)*/;

/*ALTER TABLE `events`
  ADD CONSTRAINT `events_author` FOREIGN KEY (`author`) REFERENCES `users` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;*/

CREATE TABLE `favorites` (
  `user` INT NOT NULL ,
  `event` VARCHAR(34) NOT NULL
) ENGINE = InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `favorites`
  ADD CONSTRAINT `favorites_event` FOREIGN KEY (`event`) REFERENCES `events` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  /*ADD CONSTRAINT `favorites_user` FOREIGN KEY (`user`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,*/
  ADD UNIQUE `favorites_unique` (`user`, `event`);

COMMIT;