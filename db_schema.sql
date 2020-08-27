-- MySQL dump 10.13  Distrib 5.7.22, for Linux (x86_64)
--
-- Host: localhost    Database: appuntiweb
-- ------------------------------------------------------
-- Server version	5.7.22

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `notes`
--

DROP TABLE IF EXISTS `notes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `notes` (
  `id` varchar(128) NOT NULL,
  `title` varchar(1024) DEFAULT NULL,
  `uploaded_at` datetime DEFAULT NULL,
  `storage_url` varchar(256) NOT NULL,
  `subject_id` int(11) DEFAULT NULL,
  `author_id` varchar(64) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `storage_url` (`storage_url`),
  KEY `subject_id` (`subject_id`),
  KEY `author_id` (`author_id`),
  CONSTRAINT `notes_ibfk_1` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`),
  CONSTRAINT `notes_ibfk_2` FOREIGN KEY (`author_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notes`
--

LOCK TABLES `notes` WRITE;
/*!40000 ALTER TABLE `notes` DISABLE KEYS */;
INSERT INTO `notes` VALUES ('607435812554b2a7d78aa583fc12c15e2eb040074357c7eefc5988d3eae9ed4598a88b2e67adb6d2c76bb673fc3a94cd0d34ac5ff0a6443368349de974db0a6a','testerinooo','2020-08-25 19:13:16','/public/notes/607435812554b2a7d78aa583fc12c15e2eb040074357c7eefc5988d3eae9ed4598a88b2e67adb6d2c76bb673fc3a94cd0d34ac5ff0a6443368349de974db0a6a',2,'a55746552a3404ad989cd4249e6accd7d357b3309952fdf97620092cda32cb81');
/*!40000 ALTER TABLE `notes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sessions`
--

DROP TABLE IF EXISTS `sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sessions` (
  `refresh_token` varchar(256) NOT NULL,
  `user_id` varchar(64) NOT NULL,
  `expiry` bigint(20) DEFAULT NULL,
  PRIMARY KEY (`refresh_token`,`user_id`),
  UNIQUE KEY `refresh_token` (`refresh_token`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `sessions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sessions`
--

LOCK TABLES `sessions` WRITE;
/*!40000 ALTER TABLE `sessions` DISABLE KEYS */;
INSERT INTO `sessions` VALUES ('04a99a64ae7b631e6ec5d604846c8abebfe2e1a16b25ff4b1a4b8dc41e2ef5e033dcda71d09cc2d45c628ac175a49dbff5e55095e327a8f8ff32c24d20ab322dbdad11473e168f1e03260cb040357fbe51bc26313fe3144a97ecaf2961c0f3ac1ffb02946f4dd1771db6ea09bcad27c1ed0870a02f79da486fb1917ebf75b35e','fea65ae14073587310345624a462926d4c128698d00ca90af9a6f787437c8df4',1600957407),('1488eb23add3032058d08ac625f8cf2fa5668cc5ecc335423de5184aed313f913921d9e3f21387269ddc937fff2a7985d4b391797f327a06c8b8c40621d1c0245fb77b3088bfaec9db95d8cf07e7f242f9ceecf280e1ec9e9170d6cc596a0c3983133eb2c6a5a2d51ae180048949cfa2dcce5bbb109e73fd5f918c9c14ea52f2','fea65ae14073587310345624a462926d4c128698d00ca90af9a6f787437c8df4',1601131043),('4baece892572af7728ca64ffedea99b5c9497c404e09fd9a1c1613cf106c5662428f2c70265c8db9558ce64bf5c2424be8433262103386539f748cd307fd62a7064f8b5c666d1d1b078a328c8958a94354681d5e9911745f9535a91bcc9cbf8a6d30f3c7da1ff6cf394d316be243d50f7ac1b4dcf3835c6f259a69abbaa07e8f','a55746552a3404ad989cd4249e6accd7d357b3309952fdf97620092cda32cb81',1600961173),('6dc582a6bc21748712cbad223c21c94d719e5c6304d3a43f9437eb44889fc51122310e2a30a2f9119cfb97710f2237584a5f959c0ce858d0557d5140740e1305a13ebbbbba976bac9ba6987e35591b9389ae998e64eb3a6b23520a8c59944dc06fcd8c0c6f48ba962f30aa5e9af8720cb5ab3671339f24483d66ff892e00bae7','a55746552a3404ad989cd4249e6accd7d357b3309952fdf97620092cda32cb81',1600961085),('9306c3c98721aa4478ba0f5986a2ed73f351af26cff37c887a907b0fe86c770183e54d21f918375d486c9d3ec3e3d4c723da4e6982058675c8867b55fe14d513120caeb2f2e5951e81d93f2f338a7a0b435651371ee2d49eddd43aec379059dca46e0458eda7957bc04543f8647030e4455589a78aa1ee3bd869f05b480e5a66','fea65ae14073587310345624a462926d4c128698d00ca90af9a6f787437c8df4',1601131467),('a8b78b82014a8f3313026286efa84cbb8ffd0ed25a4cd0e46a66697d190af0a9cdf42bb5164b27fb33bb37d765149495717775ccc9644d090305a22e908d23104a15b2dcc0262586fdda05bf8b9ffb2ea05f1c274f1d707ead51d0e4f8a9c1168ff0c2cf4aea7e135aae37d3f2e3c565ab2f66e034f7b8fd69eaddea94d0b338','a55746552a3404ad989cd4249e6accd7d357b3309952fdf97620092cda32cb81',1600961011),('db8005d4488c7961236fb3bd4d6bd6d6aa01fe9636d78c58cb537c3c540f29d1355903d7ca9a528ef383d2fdd016285218c3ddc2bb60da5ae341017e498b6059f1be2e9c8ef0e81ec8bf033b23e22d6eecd7216812c210d4eaa3b384a6e0b691a484e01f2387ecbdea2b5ca6824a672e5fecd3f6b4c0b405ebae0cc24c3d5a61','fea65ae14073587310345624a462926d4c128698d00ca90af9a6f787437c8df4',1601131120),('ed1348903413ddea340b924e36a95530029d03ac978c099e2e1ea7f5d07fbdca5dc8560a09cbd5a7df878e339ffb0f50ec6c32f21353322967bf037f90d497426f637128aa473ebe76e8c3f636ea5edceb23a0ceef5982dfd55762afca577431e29b9e33912b359af12f2a994e349d4e63dbab9cc3be10bdbce5374698ffacba','7b0e17bd33df21b194ea5675c91fa84aee982cc6dc2a103592250dc8a7ce3f2d',1601131100);
/*!40000 ALTER TABLE `sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `subjects`
--

DROP TABLE IF EXISTS `subjects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `subjects` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(1024) NOT NULL,
  `professor_name` varchar(1024) DEFAULT NULL,
  `professor_surname` varchar(1024) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `subjects`
--

LOCK TABLES `subjects` WRITE;
/*!40000 ALTER TABLE `subjects` DISABLE KEYS */;
INSERT INTO `subjects` VALUES (1,'Geometria','Maria Rita','Casali'),(2,'Analisi I','Maria','Manfredini'),(3,'Fondamenti di Informatica I','Costantino','Grana'),(4,'Fisica Generale','Raffaella','Capelli'),(5,'Economia ed Organizzazione aziendale','Giulia','Tagliazucchi'),(6,'Fondamenti di Informatica II','Maurizio','Vincini'),(7,'Matematica Statistica e Applicata','Marco','Maioli');
/*!40000 ALTER TABLE `subjects` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` varchar(64) NOT NULL,
  `name` varchar(256) NOT NULL,
  `surname` varchar(256) NOT NULL,
  `email` varchar(256) NOT NULL,
  `password` varchar(256) NOT NULL,
  `admin` tinyint(4) DEFAULT '0',
  `unimore_id` varchar(256) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES ('7b0e17bd33df21b194ea5675c91fa84aee982cc6dc2a103592250dc8a7ce3f2d','™c±z¾ÓdÄóÞwá¼;','2öî`œ­CB}.[\0ÝH…n','/HŽ!ÜÒk¹ÆÍO¾ï˜Ìßüº@€Ò,¬vA)½','$2a$08$.lvdSAYBv/3CpJqmP0mJRemXGlReyAcvSqYiT1EkIuxNecpH1Oryi',1,'ÑŽy“aä^o+Ìº\'‹¹'),('a55746552a3404ad989cd4249e6accd7d357b3309952fdf97620092cda32cb81','#\Z5]MœôÓïæ~X›Ëo','3·Ý\'?„D1á\0·³+²','g´·sˆgî×@\nÖ†V¤¥\'7ŒkjŸàšž','$2a$08$bv4mQEJXxA5Vn9z8W3M95u39jz.7ALhsvCFguYR3rxeRd33FeoGve',0,'@†Ù/ÑÓÆnŒŸ€P£Ÿ’¹'),('fea65ae14073587310345624a462926d4c128698d00ca90af9a6f787437c8df4','Âit¥ØŽŠ¦ð)ú±Ý®','Q²&œˆŒÍßÃ¾Ù\"Ë1ð','K<F\'µi¾Nª]¾X:9Ï«™yºÜEÜ:Í‹¡”§','$2a$08$HWMJNlvCzrqAKsP0tUMgQ.eJ4kSBL6qMBqyd3R5KLDi7QQPCjGhai',1,'ÃSSý«ÒñL¢šN¸U»');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2020-08-27 17:19:13
