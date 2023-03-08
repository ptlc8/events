CREATE TABLE `EVENTS` (
  `id` int(11) NOT NULL COMMENT 'id de l''évent',
  `title` text COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'nom de l''évent',
  `author` int(11) NOT NULL COMMENT 'id de l''organisateur',
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT ('') COMMENT 'description',
  `datetime` datetime NOT NULL COMMENT 'date et horaire',
  `coor1` float NOT NULL COMMENT 'longitude',
  `coor2` float NOT NULL COMMENT 'latidude',
  `placename` tinytext COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'nom du lieu',
  `categories` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT ('[]') COMMENT 'catégories',
  `public` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `EVENTS`
  ADD PRIMARY KEY (`id`),
  ADD KEY `author` (`author`);

ALTER TABLE `EVENTS`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'id de l''évent';

ALTER TABLE `EVENTS`
  ADD CONSTRAINT `events_link_user` FOREIGN KEY (`author`) REFERENCES `USERS` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

COMMIT;