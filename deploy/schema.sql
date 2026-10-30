-- MySQL dump 10.13  Distrib 8.0.40, for Win64 (x86_64)
--
-- Host: localhost    Database: turnkey_db
-- ------------------------------------------------------
-- Server version	8.0.40

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `ap_discrepancies`
--

DROP TABLE IF EXISTS `ap_discrepancies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ap_discrepancies` (
  `id` int NOT NULL AUTO_INCREMENT,
  `vendor_invoice_id` int NOT NULL,
  `vendor_id` int NOT NULL,
  `discrepancy_type` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `claimed_amount` decimal(14,2) NOT NULL,
  `verified_amount` decimal(14,2) NOT NULL,
  `difference_amount` decimal(14,2) NOT NULL,
  `status` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'open',
  `resolution_notes` text COLLATE utf8mb4_unicode_ci,
  `raised_by_id` int NOT NULL,
  `resolved_by_id` int DEFAULT NULL,
  `resolved_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `updated_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ap_discrepancies`
--


--
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `activity` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `resource_type` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `resource_id` int DEFAULT NULL,
  `ip_address` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'success',
  `metadata` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=94 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_logs`
--

INSERT INTO `audit_logs` VALUES (1,1,'User signed in','session',NULL,'10.20.4.18','success',NULL,'2026-08-05 06:44:24'),(2,2,'Created lead LD-20260805-0001','lead',1,'10.20.4.42','success',NULL,'2026-08-05 06:44:24'),(3,2,'Submitted BOQ v1 for Lumina Hospitality Group','boq',1,'10.20.4.42','success',NULL,'2026-08-05 06:44:24'),(4,5,'Selected quotation from Ridgeline Interiors','quotation',NULL,'10.20.4.55','success',NULL,'2026-08-05 06:44:24'),(5,4,'Recorded BG performance INR 31,00,000','financial_instrument',NULL,'10.20.4.71','success',NULL,'2026-08-05 06:44:24'),(6,6,'Attempted to delete project (denied)','project',1,'10.20.4.99','denied',NULL,'2026-08-05 06:44:24'),(7,17,'User signed in','session',NULL,'10.20.4.18','success',NULL,'2026-08-11 08:10:44'),(8,18,'Created lead LD-20260811-0001','lead',1,'10.20.4.42','success',NULL,'2026-08-11 08:10:44'),(9,18,'Submitted BOQ v1 for Lumina Hospitality Group','boq',1,'10.20.4.42','success',NULL,'2026-08-11 08:10:44'),(10,21,'Selected quotation from Ridgeline Interiors','quotation',NULL,'10.20.4.55','success',NULL,'2026-08-11 08:10:44'),(11,20,'Recorded BG performance INR 31,00,000','financial_instrument',NULL,'10.20.4.71','success',NULL,'2026-08-11 08:10:44'),(12,22,'Attempted to delete project (denied)','project',1,'10.20.4.99','denied',NULL,'2026-08-11 08:10:44'),(13,17,'ROLE_SWITCH_REQUEST_APPROVED','role_switch_request',1,'::1','success','{\"requestUserId\":22,\"requestUserName\":\"Arjun Singh\",\"currentRole\":\"viewer\",\"requestedRole\":\"project_manager\",\"approvedBy\":\"Ananya Rao\",\"approvedById\":17,\"comments\":\"Test approval\",\"approvedAt\":\"2026-08-25T04:51:19.989Z\"}','2026-08-25 04:51:19'),(14,17,'ROLE_SWITCH_REQUEST_APPROVED','role_switch_request',2,'::1','success','{\"requestUserId\":22,\"requestUserName\":\"Arjun Singh\",\"currentRole\":\"viewer\",\"requestedRole\":\"engineer\",\"approvedBy\":\"Ananya Rao\",\"approvedById\":17,\"comments\":\"Test approval\",\"approvedAt\":\"2026-08-25T04:52:45.972Z\"}','2026-08-25 04:52:45'),(15,17,'Created Contract','contract',1,NULL,'success','{\"contractNumber\":\"CNT-20260923-0001\",\"title\":\"RCC Structural & Masonry Contract\",\"totalAmount\":2860000}','2026-09-23 07:23:34'),(16,17,'Created Work Completion','work_completion',1,NULL,'success','{\"workCompletionNumber\":\"WC-20260923-0001\",\"title\":\"Footings & Foundation Work Completion\"}','2026-09-23 07:23:34'),(17,17,'Submitted Work Completion for Verification','work_completion',1,NULL,'success',NULL,'2026-09-23 07:23:34'),(18,17,'Verified Work Completion','work_completion',1,NULL,'success',NULL,'2026-09-23 07:23:34'),(19,17,'Created RA Bill','ra_bill',9,NULL,'success','{\"billNumber\":\"RA-20260923-0006\",\"grossAmount\":1090000,\"netPayableAmount\":1209900}','2026-09-23 07:23:34'),(20,17,'Submitted RA Bill','ra_bill',9,NULL,'success',NULL,'2026-09-23 07:23:34'),(21,17,'Approved RA Bill','ra_bill',9,NULL,'success','{\"comments\":\"Certified for payment. Quality and cube strength verified.\"}','2026-09-23 07:23:35'),(22,17,'Generated Invoice from RA Bill','invoice',10,NULL,'success','{\"invoiceNumber\":\"INV-20260923-0007\",\"raBillId\":9,\"netAmount\":1209900}','2026-09-23 07:23:35'),(23,17,'Sent Invoice to Client/Vendor','invoice',10,NULL,'success','{\"recipientEmail\":\"accounts@turnkeyclient.com\",\"invoiceNumber\":\"INV-20260923-0007\"}','2026-09-23 07:23:35'),(24,17,'Sent Payment Reminder','payment_reminder',1,NULL,'success','{\"invoiceId\":10,\"invoiceNumber\":\"INV-20260923-0007\",\"reminderType\":\"email\"}','2026-09-23 07:23:35'),(25,17,'Recorded Payment against Invoice','invoice_payment',1,NULL,'success','{\"invoiceId\":10,\"paymentNumber\":\"PAY-20260923-0001\",\"amount\":1209900,\"newOutstanding\":0}','2026-09-23 07:23:35'),(26,17,'Reconciled Invoice with Accounting','invoice',10,NULL,'success','{\"reconciliationRemarks\":\"Bank statement verified. Matched with HDFC Current Account #... in Tally.\"}','2026-09-23 07:23:35'),(27,17,'Closed Invoice','invoice',10,NULL,'success',NULL,'2026-09-23 07:23:35'),(28,17,'Created RA Bill','ra_bill',10,NULL,'success','{\"billNumber\":\"RA-20260923-0007\",\"grossAmount\":1090000,\"netPayableAmount\":1209900}','2026-09-23 09:18:41'),(29,17,'Submitted RA Bill','ra_bill',10,NULL,'success',NULL,'2026-09-23 09:18:41'),(30,17,'Converted lead LD-20260924-TUR01 → project Apex Cleanroom Facility with auto-generated Client Contract CNT-CLI-2026-0013','project',13,NULL,'success','{\"leadId\":14,\"leadNumber\":\"LD-20260924-TUR01\",\"projectId\":13,\"contractId\":3,\"contractNumber\":\"CNT-CLI-2026-0013\"}','2026-09-24 12:45:44'),(31,17,'Converted lead LD-20260924-TUR01 → project Dr. Vikramaditya Oberoi — Commercial Cleanroom & MEP Turnkey with auto-generated Client Contract CNT-CLI-2026-0014','project',14,NULL,'success','{\"leadId\":14,\"leadNumber\":\"LD-20260924-TUR01\",\"projectId\":14,\"contractId\":4,\"contractNumber\":\"CNT-CLI-2026-0014\"}','2026-09-24 12:48:26'),(32,17,'Created Contract','contract',6,NULL,'success','{\"contractNumber\":\"CNT-20261005-0003\",\"title\":\"civil purpose\",\"totalAmount\":0}','2026-10-05 10:49:41'),(34,17,'Converted lead LD-20260811-0001 → project Mahesh Bhatia — Hotel Interior Fit-out with auto-generated Client Contract CNT-CLI-2026-0016','project',16,NULL,'success','{\"leadId\":8,\"leadNumber\":\"LD-20260811-0001\",\"projectId\":16,\"contractId\":8,\"contractNumber\":\"CNT-CLI-2026-0016\"}','2026-10-07 07:41:10'),(35,17,'Converted lead LD-20261007-0014 → project Ramesh Kumar —  Resort Expansion & Renovation with auto-generated Client Contract CNT-CLI-2026-0017','project',17,NULL,'success','{\"leadId\":17,\"leadNumber\":\"LD-20261007-0014\",\"projectId\":17,\"contractId\":9,\"contractNumber\":\"CNT-CLI-2026-0017\"}','2026-10-07 07:41:30'),(36,17,'Converted lead LD-20260806-0006 → project Test Customer — Residential with auto-generated Client Contract CNT-CLI-2026-0018','project',18,NULL,'success','{\"leadId\":6,\"leadNumber\":\"LD-20260806-0006\",\"projectId\":18,\"contractId\":10,\"contractNumber\":\"CNT-CLI-2026-0018\"}','2026-10-07 08:43:26'),(37,17,'Converted lead LD-20260805-0003 → project Ritesh Khanna — Residential Tower MEP with auto-generated Client Contract CNT-CLI-2026-0019','project',19,NULL,'success','{\"leadId\":3,\"leadNumber\":\"LD-20260805-0003\",\"projectId\":19,\"contractId\":11,\"contractNumber\":\"CNT-CLI-2026-0019\"}','2026-10-07 08:48:01'),(38,17,'Created Work Completion','work_completion',4,NULL,'success','{\"workCompletionNumber\":\"WC-20261014-0003\",\"title\":\"Work Completion - civil purpose\"}','2026-10-14 07:06:40'),(39,17,'Submitted Work Completion for Verification','work_completion',4,NULL,'success',NULL,'2026-10-14 07:06:40'),(40,17,'Verified Work Completion','work_completion',4,NULL,'success',NULL,'2026-10-14 07:09:25'),(41,17,'LOGIN_FAILED','auth',17,'::1','failure','{\"reason\":\"Incorrect password\",\"email\":\"ananya.rao@kanak.in\"}','2026-10-26 10:20:42'),(42,NULL,'LOGIN_FAILED','auth',NULL,'::1','failure','{\"reason\":\"User not found or unconfigured\",\"email\":\"nonexistent@kanak.in\"}','2026-10-26 10:20:50'),(43,17,'LOGIN_SUCCESS','auth',17,'::1','success','{\"email\":\"ananya.rao@kanak.in\",\"activeRole\":\"admin\"}','2026-10-26 10:21:00'),(44,17,'LOGIN_SUCCESS','auth',17,'::1','success','{\"email\":\"ananya.rao@kanak.in\",\"activeRole\":\"admin\"}','2026-10-26 10:21:29'),(45,18,'LOGIN_SUCCESS','auth',18,'::1','success','{\"email\":\"rohan.mehta@kanak.in\",\"activeRole\":\"project_manager\"}','2026-10-26 10:22:40'),(46,18,'LOGOUT','auth',18,'::1','success','{\"userId\":18}','2026-10-26 10:22:41'),(47,17,'LOGIN_FAILED','auth',17,'::1','failure','{\"reason\":\"Incorrect password\",\"email\":\"ananya.rao@kanak.in\"}','2026-10-26 10:24:49'),(48,17,'LOGIN_SUCCESS','auth',17,'::1','success','{\"email\":\"ananya.rao@kanak.in\",\"activeRole\":\"admin\"}','2026-10-26 10:24:49'),(49,17,'LOGIN_SUCCESS','auth',17,'::1','success','{\"email\":\"ananya.rao@kanak.in\",\"activeRole\":\"admin\"}','2026-10-26 10:25:03'),(50,19,'LOGIN_SUCCESS_MOBILE_OTP','auth',19,'::1','success','{\"phone\":\"9876543213\",\"channel\":\"mobile_pwa\",\"activeRole\":\"engineer\"}','2026-10-26 10:56:21'),(51,17,'LOGIN_SUCCESS','auth',17,'::1','success','{\"email\":\"ananya.rao@kanak.in\",\"phone\":\"9876543210\",\"activeRole\":\"admin\"}','2026-10-26 10:56:21'),(52,19,'LOGIN_SUCCESS_MOBILE_OTP','auth',19,'::1','success','{\"phone\":\"9876543213\",\"channel\":\"mobile_pwa\",\"activeRole\":\"engineer\"}','2026-10-26 11:00:39'),(53,23,'LOGIN_SUCCESS_MOBILE_QUICK','auth',23,'::1','success','{\"phone\":\"9876543211\",\"channel\":\"mobile_pwa_quick\",\"activeRole\":\"project_manager\"}','2026-10-26 11:00:40'),(54,17,'LOGIN_SUCCESS','auth',17,'::1','success','{\"email\":\"ananya.rao@kanak.in\",\"phone\":\"9876543210\",\"activeRole\":\"admin\"}','2026-10-26 11:00:40'),(55,19,'LOGIN_SUCCESS_MOBILE_OTP','auth',19,'::1','success','{\"phone\":\"9876543213\",\"channel\":\"mobile_pwa\",\"activeRole\":\"engineer\"}','2026-10-26 11:01:07'),(56,19,'LOGIN_SUCCESS_MOBILE_OTP','auth',19,'::1','success','{\"phone\":\"9876543213\",\"channel\":\"mobile_pwa\",\"activeRole\":\"engineer\"}','2026-10-26 11:01:16'),(57,23,'LOGIN_SUCCESS_MOBILE_QUICK','auth',23,'::1','success','{\"phone\":\"9876543211\",\"channel\":\"mobile_pwa_quick\",\"activeRole\":\"project_manager\"}','2026-10-26 11:01:27'),(58,19,'LOGIN_SUCCESS_MOBILE_OTP','auth',19,'::1','success','{\"phone\":\"9876543213\",\"channel\":\"mobile_pwa\",\"activeRole\":\"engineer\"}','2026-10-26 11:35:02'),(59,17,'LOGIN_SUCCESS','auth',17,'::1','success','{\"email\":\"ananya.rao@kanak.in\",\"phone\":\"9876543210\",\"activeRole\":\"admin\"}','2026-10-26 11:37:58'),(60,19,'LOGIN_SUCCESS_MOBILE_QUICK','auth',19,'::1','success','{\"phone\":\"9876543213\",\"channel\":\"mobile_pwa_quick\",\"activeRole\":\"engineer\"}','2026-10-27 09:47:28'),(61,19,'LOGOUT','auth',19,'::1','success','{\"userId\":19}','2026-10-27 09:47:44'),(62,18,'LOGIN_SUCCESS_MOBILE_QUICK','auth',18,'::1','success','{\"phone\":\"9876543212\",\"channel\":\"mobile_pwa_quick\",\"activeRole\":\"project_manager\"}','2026-10-27 09:47:49'),(63,18,'LOGOUT','auth',18,'::1','success','{\"userId\":18}','2026-10-27 09:48:09'),(64,17,'LOGIN_SUCCESS_MOBILE_QUICK','auth',17,'::1','success','{\"phone\":\"9876543210\",\"channel\":\"mobile_pwa_quick\",\"activeRole\":\"admin\"}','2026-10-27 09:48:16'),(65,19,'LOGIN_SUCCESS_MOBILE_QUICK','auth',19,'::1','success','{\"phone\":\"9876543213\",\"channel\":\"mobile_pwa_quick\",\"activeRole\":\"engineer\"}','2026-10-28 09:51:05'),(66,19,'LOGOUT','auth',19,'::1','success','{\"userId\":19}','2026-10-28 09:52:36'),(67,17,'LOGIN_SUCCESS_MOBILE_QUICK','auth',17,'::1','success','{\"phone\":\"9876543210\",\"channel\":\"mobile_pwa_quick\",\"activeRole\":\"admin\"}','2026-10-28 09:52:40'),(68,17,'LOGOUT','auth',17,'::1','success','{\"userId\":17}','2026-10-29 08:51:48'),(69,17,'LOGIN_SUCCESS_MOBILE_QUICK','auth',17,'::1','success','{\"phone\":\"9876543210\",\"channel\":\"mobile_pwa_quick\",\"activeRole\":\"admin\"}','2026-10-29 08:51:55'),(70,23,'LOGIN_SUCCESS','auth',23,'::1','success','{\"email\":\"Hari.mailapalli12@gmail.com\",\"phone\":\"9876543211\",\"activeRole\":\"project_manager\"}','2026-10-29 09:11:14'),(71,23,'LOGIN_SUCCESS_MOBILE_QUICK','auth',23,'::1','success','{\"phone\":\"9876543211\",\"channel\":\"mobile_pwa_quick\",\"activeRole\":\"project_manager\"}','2026-10-29 09:11:20'),(72,17,'LOGIN_SUCCESS','auth',17,'::1','success','{\"email\":\"ananya.rao@kanak.in\",\"phone\":\"9876543210\",\"activeRole\":\"admin\"}','2026-10-29 09:11:35'),(73,23,'LOGIN_SUCCESS','auth',23,'::1','success','{\"email\":\"Hari.mailapalli12@gmail.com\",\"phone\":\"9876543211\",\"activeRole\":\"project_manager\"}','2026-10-29 09:11:35'),(74,18,'LOGIN_SUCCESS','auth',18,'::1','success','{\"email\":\"rohan.mehta@kanak.in\",\"phone\":\"9876543212\",\"activeRole\":\"project_manager\"}','2026-10-29 09:11:35'),(75,19,'LOGIN_SUCCESS','auth',19,'::1','success','{\"email\":\"priya.iyer@kanak.in\",\"phone\":\"9876543213\",\"activeRole\":\"engineer\"}','2026-10-29 09:11:35'),(76,20,'LOGIN_SUCCESS','auth',20,'::1','success','{\"email\":\"vikram.shah@kanak.in\",\"phone\":\"9876543214\",\"activeRole\":\"accountant\"}','2026-10-29 09:11:36'),(77,21,'LOGIN_SUCCESS','auth',21,'::1','success','{\"email\":\"neha.kapoor@kanak.in\",\"phone\":\"9876543215\",\"activeRole\":\"procurement_officer\"}','2026-10-29 09:11:36'),(78,22,'LOGIN_SUCCESS','auth',22,'::1','success','{\"email\":\"arjun.singh@kanak.in\",\"phone\":\"9876543216\",\"activeRole\":\"viewer\"}','2026-10-29 09:11:36'),(79,24,'LOGIN_SUCCESS','auth',24,'::1','success','{\"email\":\"venkibaipalli@gmail.com\",\"phone\":\"9876543217\",\"activeRole\":\"admin\"}','2026-10-29 09:11:36'),(80,23,'LOGIN_SUCCESS','auth',23,'::1','success','{\"email\":\"Hari.mailapalli12@gmail.com\",\"phone\":\"9876543211\",\"activeRole\":\"project_manager\"}','2026-10-29 09:43:15'),(81,23,'LOGIN_FAILED','auth',23,'::1','failure','{\"reason\":\"Incorrect password\",\"identifier\":\"Hari.mailapalli12@gmail.com\"}','2026-10-29 09:43:27'),(82,17,'LOGOUT','auth',17,'::1','success','{\"userId\":17}','2026-10-29 09:46:39'),(83,23,'LOGIN_SUCCESS','auth',23,'::1','success','{\"email\":\"Hari.mailapalli12@gmail.com\",\"phone\":\"9876543211\",\"activeRole\":\"project_manager\"}','2026-10-29 09:49:40'),(84,23,'LOGOUT','auth',23,'::1','success','{\"userId\":23}','2026-10-29 09:50:58'),(85,23,'LOGIN_SUCCESS','auth',23,'::1','success','{\"email\":\"Hari.mailapalli12@gmail.com\",\"phone\":\"9876543211\",\"activeRole\":\"project_manager\"}','2026-10-29 10:27:22'),(86,23,'LOGIN_FAILED','auth',23,'::1','failure','{\"reason\":\"Incorrect password\",\"identifier\":\"Hari.mailapalli12@gmail.com\"}','2026-10-29 10:27:32'),(87,23,'LOGIN_FAILED','auth',23,'::1','failure','{\"reason\":\"Incorrect password\",\"identifier\":\"Hari.mailapalli12@gmail.com\"}','2026-10-29 10:27:46'),(88,24,'LOGIN_SUCCESS','auth',24,'::1','success','{\"email\":\"venkibaipalli@gmail.com\",\"phone\":\"9876543217\",\"activeRole\":\"admin\"}','2026-10-29 10:39:40'),(89,23,'LOGIN_SUCCESS','auth',23,'::1','success','{\"email\":\"Hari.mailapalli12@gmail.com\",\"phone\":\"9876543211\",\"activeRole\":\"project_manager\"}','2026-10-29 10:39:40'),(90,17,'LOGIN_SUCCESS','auth',17,'::1','success','{\"email\":\"ananya.rao@kanak.in\",\"phone\":\"9876543210\",\"activeRole\":\"admin\"}','2026-10-29 10:39:40'),(91,NULL,'LOGIN_FAILED','auth',NULL,'::1','failure','{\"reason\":\"User not found or unconfigured\",\"identifier\":\"nonexistent@user.com\"}','2026-10-29 10:39:40'),(92,23,'LOGIN_SUCCESS_MOBILE_OTP','auth',23,'::1','success','{\"phone\":\"9876543211\",\"channel\":\"mobile_pwa\",\"activeRole\":\"project_manager\"}','2026-10-29 10:39:41'),(93,25,'LOGIN_SUCCESS','auth',25,'::1','success','{\"email\":\"ganesh@gmail.com\",\"phone\":\"9876543220\",\"activeRole\":\"admin\"}','2026-10-29 11:34:03');

--
-- Table structure for table `billing_milestones`
--

DROP TABLE IF EXISTS `billing_milestones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `billing_milestones` (
  `id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `contract_id` int DEFAULT NULL,
  `milestone_number` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `stage` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'general',
  `billing_percent` decimal(5,2) NOT NULL DEFAULT '0.00',
  `expected_amount` decimal(14,2) NOT NULL DEFAULT '0.00',
  `target_date` date DEFAULT NULL,
  `completion_date` date DEFAULT NULL,
  `status` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `ra_bill_id` int DEFAULT NULL,
  `billed_amount` decimal(14,2) NOT NULL DEFAULT '0.00',
  `sort_order` int NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `updated_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=79 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `billing_milestones`
--

INSERT INTO `billing_milestones` VALUES (13,14,4,'M1','Mobilization Advance & Site Possession Handover','Contract signing, site possession, mobilization of site office, plant & machinery','mobilization',10.00,5500000.00,'2026-10-09',NULL,'ready_to_bill',NULL,0.00,1,'2026-09-24 12:48:26','2026-09-24 12:48:26'),(14,14,4,'M2','Plinth & Substructure Completion','Excavation, foundation footings, plinth beams, and anti-termite treatment','substructure',15.00,8250000.00,'2026-11-23',NULL,'pending',NULL,0.00,2,'2026-09-24 12:48:26','2026-09-24 12:48:26'),(15,14,4,'M3','Superstructure & Core RCC Works','Casting of columns, floor slabs, beams, and structural staircase core','superstructure',25.00,13750000.00,'2027-01-22',NULL,'pending',NULL,0.00,3,'2026-09-24 12:48:26','2026-09-24 12:48:26'),(16,14,4,'M4','MEP Rough-ins & Internal Blockwork Partitions','Internal masonry, conduit rough-ins, plumbing concealed piping, and HVAC duct hanging','mep',20.00,11000000.00,'2027-03-23',NULL,'pending',NULL,0.00,4,'2026-09-24 12:48:26','2026-09-24 12:48:26'),(17,14,4,'M5','Flooring, Wall Finishes, Joinery & Painting','Tiles/marble laying, false ceiling, internal doors, first coat paint, and sanitary fittings','finishes',20.00,11000000.00,'2027-05-22',NULL,'pending',NULL,0.00,5,'2026-09-24 12:48:26','2026-09-24 12:48:26'),(18,14,4,'M6','Testing, Commissioning, Virtual Completion & Handover','Final MEP testing & commissioning, snag rectification, deep cleaning, and client sign-off','handover',10.00,5500000.00,'2027-07-11',NULL,'pending',NULL,0.00,6,'2026-09-24 12:48:26','2026-09-24 12:48:26'),(19,6,NULL,'M1','Mobilization Advance & Site Possession Handover','Contract execution, site possession, mobilization of site office, plant & machinery','mobilization',10.00,7400000.00,'2026-08-21',NULL,'ready_to_bill',NULL,0.00,1,'2026-10-01 06:42:52','2026-10-01 06:42:52'),(20,6,NULL,'M2','Plinth & Substructure Completion','Excavation, foundation footings, plinth beams, and anti-termite treatment','substructure',15.00,11100000.00,'2026-10-05',NULL,'pending',NULL,0.00,2,'2026-10-01 06:42:52','2026-10-01 06:42:52'),(21,6,NULL,'M3','Superstructure & Core RCC Works','Casting of columns, floor slabs, structural staircase, and lift core','superstructure',25.00,18500000.00,'2026-12-04',NULL,'pending',NULL,0.00,3,'2026-10-01 06:42:52','2026-10-01 06:42:52'),(22,6,NULL,'M4','MEP First-Fix & Internal Blockwork Partitions','Internal masonry, conduit rough-ins, plumbing concealed piping, and HVAC duct hanging','mep',20.00,14800000.00,'2027-02-02',NULL,'pending',NULL,0.00,4,'2026-10-01 06:42:52','2026-10-01 06:42:52'),(23,6,NULL,'M5','Flooring, Wall Finishes, Joinery & Painting','Tiles/marble laying, false ceiling, internal doors, first coat paint, and sanitary fittings','finishes',20.00,14800000.00,'2027-04-03',NULL,'pending',NULL,0.00,5,'2026-10-01 06:42:52','2026-10-01 06:42:52'),(24,6,NULL,'M6','Testing, Commissioning, Virtual Completion & Handover','Final MEP testing & commissioning, snag rectification, deep cleaning, and client sign-off','handover',10.00,7400000.00,'2027-05-23',NULL,'pending',NULL,0.00,6,'2026-10-01 06:42:52','2026-10-01 06:42:52'),(25,1,NULL,'M1','Mobilization Advance & Site Possession Handover','Contract execution, site possession, mobilization of site office, plant & machinery','mobilization',10.00,6200000.00,'2026-01-30',NULL,'ready_to_bill',NULL,0.00,1,'2026-10-01 06:53:15','2026-10-01 06:53:15'),(26,1,NULL,'M2','Plinth & Substructure Completion','Excavation, foundation footings, plinth beams, and anti-termite treatment','substructure',15.00,9300000.00,'2026-03-16',NULL,'pending',NULL,0.00,2,'2026-10-01 06:53:15','2026-10-01 06:53:15'),(27,1,NULL,'M3','Superstructure & Core RCC Works','Casting of columns, floor slabs, structural staircase, and lift core','superstructure',25.00,15500000.00,'2026-05-15',NULL,'pending',NULL,0.00,3,'2026-10-01 06:53:15','2026-10-01 06:53:15'),(28,1,NULL,'M4','MEP First-Fix & Internal Blockwork Partitions','Internal masonry, conduit rough-ins, plumbing concealed piping, and HVAC duct hanging','mep',20.00,12400000.00,'2026-07-14',NULL,'pending',NULL,0.00,4,'2026-10-01 06:53:15','2026-10-01 06:53:15'),(29,1,NULL,'M5','Flooring, Wall Finishes, Joinery & Painting','Tiles/marble laying, false ceiling, internal doors, first coat paint, and sanitary fittings','finishes',20.00,12400000.00,'2026-09-12',NULL,'pending',NULL,0.00,5,'2026-10-01 06:53:15','2026-10-01 06:53:15'),(30,1,NULL,'M6','Testing, Commissioning, Virtual Completion & Handover','Final MEP testing & commissioning, snag rectification, deep cleaning, and client sign-off','handover',10.00,6200000.00,'2026-11-01',NULL,'pending',NULL,0.00,6,'2026-10-01 06:53:15','2026-10-01 06:53:15'),(31,3,NULL,'M1','Mobilization Advance & Site Possession Handover','Contract execution, site possession, mobilization of site office, plant & machinery','mobilization',10.00,5600000.00,'2026-05-16',NULL,'ready_to_bill',NULL,0.00,1,'2026-10-05 04:59:22','2026-10-05 04:59:22'),(32,3,NULL,'M2','Plinth & Substructure Completion','Excavation, foundation footings, plinth beams, and anti-termite treatment','substructure',15.00,8400000.00,'2026-06-30',NULL,'pending',NULL,0.00,2,'2026-10-05 04:59:22','2026-10-05 04:59:22'),(33,3,NULL,'M3','Superstructure & Core RCC Works','Casting of columns, floor slabs, structural staircase, and lift core','superstructure',25.00,14000000.00,'2026-08-29',NULL,'pending',NULL,0.00,3,'2026-10-05 04:59:22','2026-10-05 04:59:22'),(34,3,NULL,'M4','MEP First-Fix & Internal Blockwork Partitions','Internal masonry, conduit rough-ins, plumbing concealed piping, and HVAC duct hanging','mep',20.00,11200000.00,'2026-10-28',NULL,'pending',NULL,0.00,4,'2026-10-05 04:59:22','2026-10-05 04:59:22'),(35,3,NULL,'M5','Flooring, Wall Finishes, Joinery & Painting','Tiles/marble laying, false ceiling, internal doors, first coat paint, and sanitary fittings','finishes',20.00,11200000.00,'2026-12-27',NULL,'pending',NULL,0.00,5,'2026-10-05 04:59:22','2026-10-05 04:59:22'),(36,3,NULL,'M6','Testing, Commissioning, Virtual Completion & Handover','Final MEP testing & commissioning, snag rectification, deep cleaning, and client sign-off','handover',10.00,5600000.00,'2027-02-15',NULL,'pending',NULL,0.00,6,'2026-10-05 04:59:22','2026-10-05 04:59:22'),(37,4,NULL,'M1','Mobilization Advance & Site Possession Handover','Contract execution, site possession, mobilization of site office, plant & machinery','mobilization',10.00,3800000.00,'2025-04-25',NULL,'ready_to_bill',NULL,0.00,1,'2026-10-05 05:26:44','2026-10-05 05:26:44'),(38,4,NULL,'M2','Plinth & Substructure Completion','Excavation, foundation footings, plinth beams, and anti-termite treatment','substructure',15.00,5700000.00,'2025-06-09',NULL,'pending',NULL,0.00,2,'2026-10-05 05:26:44','2026-10-05 05:26:44'),(39,4,NULL,'M3','Superstructure & Core RCC Works','Casting of columns, floor slabs, structural staircase, and lift core','superstructure',25.00,9500000.00,'2025-08-08',NULL,'pending',NULL,0.00,3,'2026-10-05 05:26:44','2026-10-05 05:26:44'),(40,4,NULL,'M4','MEP First-Fix & Internal Blockwork Partitions','Internal masonry, conduit rough-ins, plumbing concealed piping, and HVAC duct hanging','mep',20.00,7600000.00,'2025-10-07',NULL,'pending',NULL,0.00,4,'2026-10-05 05:26:44','2026-10-05 05:26:44'),(41,4,NULL,'M5','Flooring, Wall Finishes, Joinery & Painting','Tiles/marble laying, false ceiling, internal doors, first coat paint, and sanitary fittings','finishes',20.00,7600000.00,'2025-12-06',NULL,'pending',NULL,0.00,5,'2026-10-05 05:26:44','2026-10-05 05:26:44'),(42,4,NULL,'M6','Testing, Commissioning, Virtual Completion & Handover','Final MEP testing & commissioning, snag rectification, deep cleaning, and client sign-off','handover',10.00,3800000.00,'2026-01-25',NULL,'pending',NULL,0.00,6,'2026-10-05 05:26:44','2026-10-05 05:26:44'),(43,5,NULL,'M1','Mobilization Advance & Site Possession Handover','Contract execution, site possession, mobilization of site office, plant & machinery','mobilization',10.00,850000.00,'2026-03-16',NULL,'ready_to_bill',NULL,0.00,1,'2026-10-05 05:40:16','2026-10-05 05:40:16'),(44,5,NULL,'M2','Plinth & Substructure Completion','Excavation, foundation footings, plinth beams, and anti-termite treatment','substructure',15.00,1275000.00,'2026-04-30',NULL,'pending',NULL,0.00,2,'2026-10-05 05:40:16','2026-10-05 05:40:16'),(45,5,NULL,'M3','Superstructure & Core RCC Works','Casting of columns, floor slabs, structural staircase, and lift core','superstructure',25.00,2125000.00,'2026-06-29',NULL,'pending',NULL,0.00,3,'2026-10-05 05:40:16','2026-10-05 05:40:16'),(46,5,NULL,'M4','MEP First-Fix & Internal Blockwork Partitions','Internal masonry, conduit rough-ins, plumbing concealed piping, and HVAC duct hanging','mep',20.00,1700000.00,'2026-08-28',NULL,'pending',NULL,0.00,4,'2026-10-05 05:40:16','2026-10-05 05:40:16'),(47,5,NULL,'M5','Flooring, Wall Finishes, Joinery & Painting','Tiles/marble laying, false ceiling, internal doors, first coat paint, and sanitary fittings','finishes',20.00,1700000.00,'2026-10-27',NULL,'pending',NULL,0.00,5,'2026-10-05 05:40:16','2026-10-05 05:40:16'),(48,5,NULL,'M6','Testing, Commissioning, Virtual Completion & Handover','Final MEP testing & commissioning, snag rectification, deep cleaning, and client sign-off','handover',10.00,850000.00,'2026-12-16',NULL,'pending',NULL,0.00,6,'2026-10-05 05:40:16','2026-10-05 05:40:16'),(55,16,8,'M1','Mobilization Advance & Site Possession Handover','Contract signing, site possession, mobilization of site office, plant & machinery','mobilization',10.00,0.00,'2026-10-22',NULL,'ready_to_bill',NULL,0.00,1,'2026-10-07 07:41:10','2026-10-07 07:41:10'),(56,16,8,'M2','Plinth & Substructure Completion','Excavation, foundation footings, plinth beams, and anti-termite treatment','substructure',15.00,0.00,'2026-12-06',NULL,'pending',NULL,0.00,2,'2026-10-07 07:41:10','2026-10-07 07:41:10'),(57,16,8,'M3','Superstructure & Core RCC Works','Casting of columns, floor slabs, beams, and structural staircase core','superstructure',25.00,0.00,'2027-02-04',NULL,'pending',NULL,0.00,3,'2026-10-07 07:41:10','2026-10-07 07:41:10'),(58,16,8,'M4','MEP Rough-ins & Internal Blockwork Partitions','Internal masonry, conduit rough-ins, plumbing concealed piping, and HVAC duct hanging','mep',20.00,0.00,'2027-04-05',NULL,'pending',NULL,0.00,4,'2026-10-07 07:41:10','2026-10-07 07:41:10'),(59,16,8,'M5','Flooring, Wall Finishes, Joinery & Painting','Tiles/marble laying, false ceiling, internal doors, first coat paint, and sanitary fittings','finishes',20.00,0.00,'2027-06-04',NULL,'pending',NULL,0.00,5,'2026-10-07 07:41:10','2026-10-07 07:41:10'),(60,16,8,'M6','Testing, Commissioning, Virtual Completion & Handover','Final MEP testing & commissioning, snag rectification, deep cleaning, and client sign-off','handover',10.00,0.00,'2027-07-24',NULL,'pending',NULL,0.00,6,'2026-10-07 07:41:10','2026-10-07 07:41:10'),(61,17,9,'M1','Mobilization Advance & Site Possession Handover','Contract signing, site possession, mobilization of site office, plant & machinery','mobilization',10.00,4500000.00,'2026-10-22',NULL,'ready_to_bill',NULL,0.00,1,'2026-10-07 07:41:30','2026-10-07 07:41:30'),(62,17,9,'M2','Plinth & Substructure Completion','Excavation, foundation footings, plinth beams, and anti-termite treatment','substructure',15.00,6750000.00,'2026-12-06',NULL,'pending',NULL,0.00,2,'2026-10-07 07:41:30','2026-10-07 07:41:30'),(63,17,9,'M3','Superstructure & Core RCC Works','Casting of columns, floor slabs, beams, and structural staircase core','superstructure',25.00,11250000.00,'2027-02-04',NULL,'pending',NULL,0.00,3,'2026-10-07 07:41:30','2026-10-07 07:41:30'),(64,17,9,'M4','MEP Rough-ins & Internal Blockwork Partitions','Internal masonry, conduit rough-ins, plumbing concealed piping, and HVAC duct hanging','mep',20.00,9000000.00,'2027-04-05',NULL,'pending',NULL,0.00,4,'2026-10-07 07:41:30','2026-10-07 07:41:30'),(65,17,9,'M5','Flooring, Wall Finishes, Joinery & Painting','Tiles/marble laying, false ceiling, internal doors, first coat paint, and sanitary fittings','finishes',20.00,9000000.00,'2027-06-04',NULL,'pending',NULL,0.00,5,'2026-10-07 07:41:30','2026-10-07 07:41:30'),(66,17,9,'M6','Testing, Commissioning, Virtual Completion & Handover','Final MEP testing & commissioning, snag rectification, deep cleaning, and client sign-off','handover',10.00,4500000.00,'2027-07-24',NULL,'pending',NULL,0.00,6,'2026-10-07 07:41:30','2026-10-07 07:41:30'),(67,18,10,'M1','Mobilization Advance & Site Possession Handover','Contract signing, site possession, mobilization of site office, plant & machinery','mobilization',10.00,100000.00,'2026-10-22',NULL,'ready_to_bill',NULL,0.00,1,'2026-10-07 08:43:26','2026-10-07 08:43:26'),(68,18,10,'M2','Plinth & Substructure Completion','Excavation, foundation footings, plinth beams, and anti-termite treatment','substructure',15.00,150000.00,'2026-12-06',NULL,'pending',NULL,0.00,2,'2026-10-07 08:43:26','2026-10-07 08:43:26'),(69,18,10,'M3','Superstructure & Core RCC Works','Casting of columns, floor slabs, beams, and structural staircase core','superstructure',25.00,250000.00,'2027-02-04',NULL,'pending',NULL,0.00,3,'2026-10-07 08:43:26','2026-10-07 08:43:26'),(70,18,10,'M4','MEP Rough-ins & Internal Blockwork Partitions','Internal masonry, conduit rough-ins, plumbing concealed piping, and HVAC duct hanging','mep',20.00,200000.00,'2027-04-05',NULL,'pending',NULL,0.00,4,'2026-10-07 08:43:26','2026-10-07 08:43:26'),(71,18,10,'M5','Flooring, Wall Finishes, Joinery & Painting','Tiles/marble laying, false ceiling, internal doors, first coat paint, and sanitary fittings','finishes',20.00,200000.00,'2027-06-04',NULL,'pending',NULL,0.00,5,'2026-10-07 08:43:26','2026-10-07 08:43:26'),(72,18,10,'M6','Testing, Commissioning, Virtual Completion & Handover','Final MEP testing & commissioning, snag rectification, deep cleaning, and client sign-off','handover',10.00,100000.00,'2027-07-24',NULL,'pending',NULL,0.00,6,'2026-10-07 08:43:26','2026-10-07 08:43:26'),(73,19,11,'M1','Mobilization Advance & Site Possession Handover','Contract signing, site possession, mobilization of site office, plant & machinery','mobilization',10.00,8400000.00,'2026-10-22','2026-10-22','billed',13,8400000.00,1,'2026-10-07 08:48:01','2026-10-22 00:47:43'),(74,19,11,'M2','Plinth & Substructure Completion','Excavation, foundation footings, plinth beams, and anti-termite treatment','substructure',15.00,12600000.00,'2026-12-06',NULL,'pending',NULL,0.00,2,'2026-10-07 08:48:01','2026-10-07 08:48:01'),(75,19,11,'M3','Superstructure & Core RCC Works','Casting of columns, floor slabs, beams, and structural staircase core','superstructure',25.00,21000000.00,'2027-02-04',NULL,'pending',NULL,0.00,3,'2026-10-07 08:48:01','2026-10-07 08:48:01'),(76,19,11,'M4','MEP Rough-ins & Internal Blockwork Partitions','Internal masonry, conduit rough-ins, plumbing concealed piping, and HVAC duct hanging','mep',20.00,16800000.00,'2027-04-05',NULL,'pending',NULL,0.00,4,'2026-10-07 08:48:01','2026-10-07 08:48:01'),(77,19,11,'M5','Flooring, Wall Finishes, Joinery & Painting','Tiles/marble laying, false ceiling, internal doors, first coat paint, and sanitary fittings','finishes',20.00,16800000.00,'2027-06-04',NULL,'pending',NULL,0.00,5,'2026-10-07 08:48:01','2026-10-07 08:48:01'),(78,19,11,'M6','Testing, Commissioning, Virtual Completion & Handover','Final MEP testing & commissioning, snag rectification, deep cleaning, and client sign-off','handover',10.00,8400000.00,'2027-07-24',NULL,'pending',NULL,0.00,6,'2026-10-07 08:48:01','2026-10-07 08:48:01');

--
-- Table structure for table `boq_items`
--

DROP TABLE IF EXISTS `boq_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `boq_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `boq_id` int NOT NULL,
  `item_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `quantity` decimal(14,2) NOT NULL,
  `unit` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `unit_price` decimal(14,2) NOT NULL,
  `tax_percent` decimal(6,2) NOT NULL DEFAULT '0.00',
  `margin_percent` decimal(6,2) NOT NULL DEFAULT '0.00',
  `total_price` decimal(14,2) NOT NULL DEFAULT '0.00',
  `sort_order` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `boq_items`
--

INSERT INTO `boq_items` VALUES (1,1,'Guest room fit-out package','Interior',42.00,'room',185000.00,18.00,12.00,10101000.00,0),(2,1,'Lobby millwork & finishes','Interior',1.00,'lot',2400000.00,18.00,15.00,3192000.00,1),(3,1,'Vinyl flooring premium grade','Materials',18400.00,'sqft',65.00,18.00,10.00,1530880.00,2),(4,1,'MEP electrical rework','MEP',1.00,'lot',1850000.00,18.00,14.00,2442000.00,3),(5,1,'Guest room fit-out package','Interior',42.00,'room',185000.00,18.00,12.00,10101000.00,0),(6,1,'Lobby millwork & finishes','Interior',1.00,'lot',2400000.00,18.00,15.00,3192000.00,1),(7,1,'Vinyl flooring premium grade','Materials',18400.00,'sqft',65.00,18.00,10.00,1530880.00,2),(8,1,'MEP electrical rework','MEP',1.00,'lot',1850000.00,18.00,14.00,2442000.00,3),(9,7,'Modular Cleanroom Wall Panels & Coving (ISO Class 7)','Civil & Finishes',3200.00,'sq.m',3500.00,18.00,12.00,11200000.00,1),(10,7,'Heavy-Duty Anti-Static Epoxy & Seamless Polyurethane Flooring','Civil & Finishes',3800.00,'sq.m',1450.00,18.00,10.00,5510000.00,2),(11,7,'120 TR Modular Chilled Water Plant with Cleanroom AHUs & HEPA Filters','HVAC',1.00,'lot',14500000.00,18.00,14.00,14500000.00,3),(12,7,'11kV/415V 500kVA Transformer, HT VCB, LT Distribution & Busducts','Electrical',1.00,'lot',7500000.00,18.00,12.00,7500000.00,4),(13,7,'Cleanroom Process Piping, Pre-Action Fire Sprinklers & High Purity Loop','Plumbing & Fire',1.00,'lot',4500000.00,18.00,12.00,4500000.00,5),(14,7,'Site Mobilization, Testing & Commissioning, Scaffolding & Compliance','Overheads',1.00,'lot',3400169.49,18.00,8.00,3400169.49,6);

--
-- Table structure for table `boqs`
--

DROP TABLE IF EXISTS `boqs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `boqs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `lead_id` int NOT NULL,
  `version` int NOT NULL DEFAULT '1',
  `status` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `subtotal` decimal(14,2) NOT NULL DEFAULT '0.00',
  `tax_total` decimal(14,2) NOT NULL DEFAULT '0.00',
  `margin_total` decimal(14,2) NOT NULL DEFAULT '0.00',
  `grand_total` decimal(14,2) NOT NULL DEFAULT '0.00',
  `created_by_id` int DEFAULT NULL,
  `approved_by_id` int DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `updated_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `boqs`
--

INSERT INTO `boqs` VALUES (1,1,1,'submitted',13216000.00,2378880.00,1671000.00,17265880.00,2,NULL,'2026-08-05 06:44:24','2026-08-11 02:40:44'),(2,7,1,'draft',0.00,0.00,0.00,0.00,1,NULL,'2026-08-06 10:20:48','2026-08-06 10:20:48'),(3,1,1,'submitted',0.00,0.00,0.00,0.00,18,NULL,'2026-08-11 08:10:43','2026-08-11 08:10:43'),(4,8,1,'draft',0.00,0.00,0.00,0.00,17,NULL,'2026-09-19 09:13:24','2026-09-19 09:13:24'),(5,8,2,'draft',0.00,0.00,0.00,0.00,17,NULL,'2026-09-19 09:13:29','2026-09-19 09:13:29'),(7,14,1,'approved',46610169.49,8389830.51,6500000.00,55000000.00,18,17,'2026-09-24 12:39:08','2026-09-24 12:39:08');

--
-- Table structure for table `budget_items`
--

DROP TABLE IF EXISTS `budget_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `budget_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `cost_code` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `budgeted` decimal(14,2) NOT NULL DEFAULT '0.00',
  `actual` decimal(14,2) NOT NULL DEFAULT '0.00',
  `committed` decimal(14,2) NOT NULL DEFAULT '0.00',
  `category` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=74 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `budget_items`
--

INSERT INTO `budget_items` VALUES (1,1,'MAT-100','Materials — flooring & finishes',12500000.00,5800000.00,3200000.00,'Finishes & Materials'),(2,1,'LAB-200','Labor — civil & MEP',18000000.00,9400000.00,0.00,'Labor & Manpower'),(3,1,'EQP-300','Equipment rental',4200000.00,1850000.00,600000.00,'Plant & Machinery'),(4,1,'SUB-400','Subcontractor — HVAC',9800000.00,4200000.00,2100000.00,'Trade Subcontracts'),(5,2,'MAT-100','Materials — MEP',28000000.00,21000000.00,3500000.00,'Finishes & Materials'),(6,2,'LAB-200','Labor — install',32000000.00,23000000.00,0.00,'Labor & Manpower'),(7,6,'ELECT-01',' Electrical wiring and fixtures',10000.00,5000.00,7000.00,'Electrical & MEP'),(14,2,'P001','For Citygate project',2500000.00,3500000.00,2800000.00,'General & Preliminaries'),(16,2,'P001','citygate',250000.00,3500000.00,2800000.00,'General & Preliminaries'),(28,14,'CIVIL-001','Substructure & RCC Superstructure Works',19250000.00,0.00,0.00,'Civil'),(29,14,'FINISH-001','Architectural Finishes, Flooring & Joinery',13750000.00,0.00,0.00,'Finishes'),(30,14,'MEP-001','Electrical Distribution, HT/LT & Low Voltage',9900000.00,0.00,0.00,'MEP'),(31,14,'HVAC-001','Central HVAC, Ventilation & Ducting',5500000.00,0.00,0.00,'HVAC'),(32,14,'PLUMB-001','Plumbing, Sanitary & Firefighting Network',3850000.00,0.00,0.00,'Plumbing'),(33,14,'OVHD-001','Site Preliminaries, Project Management & Overheads',2750000.00,0.00,0.00,'Overheads'),(34,14,'CIVIL-002','Substructure & RCC Civil Works',35000000.00,1209900.00,4009320.00,'Civil & Structural'),(35,14,'ELEC-01','Electrical HT/LT Substation & Cabling',15000000.00,0.00,0.00,'Electrical & MEP'),(36,14,'MAT-01','Flooring, Italian Marble & Wall Cladding',12000000.00,0.00,0.00,'Finishes & Materials'),(37,14,'HVAC-01','Central VRV/HVAC Air Conditioning Plant',13000000.00,0.00,0.00,'HVAC & Mechanical'),(38,14,'PLUMB-01','Plumbing, Firefighting & Water Treatment',10000000.00,0.00,0.00,'Plumbing & Firefighting'),(39,1,'CIVIL-002','Substructure & RCC Civil Works',35000000.00,1209900.00,4009320.00,'Civil & Structural'),(40,1,'ELEC-01','Electrical HT/LT Substation & Cabling',15000000.00,0.00,0.00,'Electrical & MEP'),(41,1,'MAT-01','Flooring, Italian Marble & Wall Cladding',12000000.00,0.00,0.00,'Finishes & Materials'),(42,1,'HVAC-01','Central VRV/HVAC Air Conditioning Plant',13000000.00,0.00,0.00,'HVAC & Mechanical'),(43,1,'PLUMB-01','Plumbing, Firefighting & Water Treatment',10000000.00,0.00,0.00,'Plumbing & Firefighting'),(50,16,'CIVIL-001','Substructure & RCC Superstructure Works',3076500.00,0.00,0.00,'Civil'),(51,16,'FINISH-001','Architectural Finishes, Flooring & Joinery',2197500.00,0.00,0.00,'Finishes'),(52,16,'MEP-001','Electrical Distribution, HT/LT & Low Voltage',1582200.00,0.00,0.00,'MEP'),(53,16,'HVAC-001','Central HVAC, Ventilation & Ducting',879000.00,0.00,0.00,'HVAC'),(54,16,'PLUMB-001','Plumbing, Sanitary & Firefighting Network',615300.00,0.00,0.00,'Plumbing'),(55,16,'OVHD-001','Site Preliminaries, Project Management & Overheads',439500.00,0.00,0.00,'Overheads'),(56,17,'CIVIL-001','Substructure & RCC Superstructure Works',15750000.00,0.00,0.00,'Civil'),(57,17,'FINISH-001','Architectural Finishes, Flooring & Joinery',11250000.00,0.00,0.00,'Finishes'),(58,17,'MEP-001','Electrical Distribution, HT/LT & Low Voltage',8100000.00,0.00,0.00,'MEP'),(59,17,'HVAC-001','Central HVAC, Ventilation & Ducting',4500000.00,0.00,0.00,'HVAC'),(60,17,'PLUMB-001','Plumbing, Sanitary & Firefighting Network',3150000.00,0.00,0.00,'Plumbing'),(61,17,'OVHD-001','Site Preliminaries, Project Management & Overheads',2250000.00,0.00,0.00,'Overheads'),(62,18,'CIVIL-001','Substructure & RCC Superstructure Works',350000.00,0.00,0.00,'Civil'),(63,18,'FINISH-001','Architectural Finishes, Flooring & Joinery',250000.00,0.00,0.00,'Finishes'),(64,18,'MEP-001','Electrical Distribution, HT/LT & Low Voltage',180000.00,0.00,0.00,'MEP'),(65,18,'HVAC-001','Central HVAC, Ventilation & Ducting',100000.00,0.00,0.00,'HVAC'),(66,18,'PLUMB-001','Plumbing, Sanitary & Firefighting Network',70000.00,0.00,0.00,'Plumbing'),(67,18,'OVHD-001','Site Preliminaries, Project Management & Overheads',50000.00,0.00,0.00,'Overheads'),(68,19,'CIVIL-001','Substructure & RCC Superstructure Works',29400000.00,0.00,0.00,'Civil'),(69,19,'FINISH-001','Architectural Finishes, Flooring & Joinery',21000000.00,0.00,0.00,'Finishes'),(70,19,'MEP-001','Electrical Distribution, HT/LT & Low Voltage',15120000.00,0.00,0.00,'MEP'),(71,19,'HVAC-001','Central HVAC, Ventilation & Ducting',8400000.00,0.00,0.00,'HVAC'),(72,19,'PLUMB-001','Plumbing, Sanitary & Firefighting Network',5880000.00,0.00,0.00,'Plumbing'),(73,19,'OVHD-001','Site Preliminaries, Project Management & Overheads',4200000.00,0.00,0.00,'Overheads');

--
-- Table structure for table `communications`
--

DROP TABLE IF EXISTS `communications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `communications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `project_id` int DEFAULT NULL,
  `stakeholder_id` int DEFAULT NULL,
  `communication_type` varchar(16) COLLATE utf8mb4_unicode_ci NOT NULL,
  `subject` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` text COLLATE utf8mb4_unicode_ci,
  `communication_date` timestamp NOT NULL,
  `participants` text COLLATE utf8mb4_unicode_ci,
  `created_by_id` int DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `updated_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `communications`
--

INSERT INTO `communications` VALUES (1,1,NULL,'email','Re: Floor 5 finishes — sample approval','Approved samples 2A and 4B. Please proceed with PO.','2026-04-18 05:00:00','Mahesh, Rohan, Studio Vellichor',2,'2026-08-05 06:44:24','2026-08-05 06:44:24'),(2,2,NULL,'phone','Crane availability discussion','Confirmed crane available from April 22 for 10 days.','2026-04-19 08:30:00','Rohan, Imran (Sahyadri)',2,'2026-08-05 06:44:24','2026-08-05 06:44:24'),(3,NULL,NULL,'phone','Material delivery update — Cement batch','Phone call with supplier regarding delivery of cement batch for superstructure works. Confirmed dispatch schedule, discussed minor delay due to transport issues, and agreed on revised delivery time. Action item: site team to prepare unloading arrangements accordingly.','2026-08-06 06:45:00',' Rajesh Kumar, Supplier Representative',1,'2026-08-06 11:17:20','2026-08-06 11:17:20'),(6,1,NULL,'email','[RFQ] Request for Quotation: RFQ-2026-0001 - RFQ - Structural Concrete & Rebar Package (Sentinel Tech Park — Phase 2)','Dear Aarav Joshi,\n\nYou are invited by Kanak TurnKey Projects Pvt. Ltd. to submit your competitive commercial and technical quotation for:\n• RFQ Number: RFQ-2026-0001\n• Project: Sentinel Tech Park — Phase 2\n• Scope Title: RFQ - Structural Concrete & Rebar Package\n• Total Line Items: 2\n• Quotation Due Date: Sat Apr 18 2026 05:30:00 GMT+0530 (India Standard Time) (17:00 IST)\n\nPlease find attached the official RFQ PDF Tender Document containing complete bill of quantities, specifications, and commercial submission terms.\n\nOfficial Tender PDF Document: /api/procurement/rfqs/1/export-pdf?vendorId=1&autoPrint=true\n\nKindly submit your signed and stamped quotation along with HSN breakdown before the due date.\n\nRegards,\nNeha Kapoor\nKanak TurnKey Projects Pvt. Ltd.','2026-10-23 00:37:03','Aarav Steel & Cement <aarav@aaravsc.in>',17,'2026-10-23 06:07:03','2026-10-23 06:07:03'),(7,1,NULL,'email','[RFQ] Request for Quotation: RFQ-2026-0001 - RFQ - Structural Concrete & Rebar Package (Sentinel Tech Park — Phase 2)','Dear Sneha Pillai,\n\nYou are invited by Kanak TurnKey Projects Pvt. Ltd. to submit your competitive commercial and technical quotation for:\n• RFQ Number: RFQ-2026-0001\n• Project: Sentinel Tech Park — Phase 2\n• Scope Title: RFQ - Structural Concrete & Rebar Package\n• Total Line Items: 2\n• Quotation Due Date: Sat Apr 18 2026 05:30:00 GMT+0530 (India Standard Time) (17:00 IST)\n\nPlease find attached the official RFQ PDF Tender Document containing complete bill of quantities, specifications, and commercial submission terms.\n\nOfficial Tender PDF Document: /api/procurement/rfqs/1/export-pdf?vendorId=2&autoPrint=true\n\nKindly submit your signed and stamped quotation along with HSN breakdown before the due date.\n\nRegards,\nNeha Kapoor\nKanak TurnKey Projects Pvt. Ltd.','2026-10-23 00:37:03','Polaris Electricals <sneha@polariselec.in>',17,'2026-10-23 06:07:04','2026-10-23 06:07:04'),(8,1,NULL,'email','[RFQ] Request for Quotation: RFQ-2026-0001 - RFQ - Structural Concrete & Rebar Package (Sentinel Tech Park — Phase 2)','Dear Suresh Patel,\n\nYou are invited by Kanak TurnKey Projects Pvt. Ltd. to submit your competitive commercial and technical quotation for:\n• RFQ Number: RFQ-2026-0001\n• Project: Sentinel Tech Park — Phase 2\n• Scope Title: RFQ - Structural Concrete & Rebar Package\n• Total Line Items: 2\n• Quotation Due Date: Sat Apr 18 2026 05:30:00 GMT+0530 (India Standard Time) (17:00 IST)\n\nPlease find attached the official RFQ PDF Tender Document containing complete bill of quantities, specifications, and commercial submission terms.\n\nOfficial Tender PDF Document: /api/procurement/rfqs/1/export-pdf?vendorId=13&autoPrint=true\n\nKindly submit your signed and stamped quotation along with HSN breakdown before the due date.\n\nRegards,\nNeha Kapoor\nKanak TurnKey Projects Pvt. Ltd.','2026-10-23 00:37:03','Test Precision Metalworks <tender@vendor.com>',17,'2026-10-23 06:07:04','2026-10-23 06:07:04');

--
-- Table structure for table `company_settings`
--

DROP TABLE IF EXISTS `company_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `company_settings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `company_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `address` text COLLATE utf8mb4_unicode_ci,
  `city` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `state` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `country` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT 'India',
  `pincode` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `currency` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'INR',
  `gst_number` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `website` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT (now()),
  `logo_url` text COLLATE utf8mb4_unicode_ci,
  `pan_number` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bank_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `account_number` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ifsc_code` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `branch_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `authorized_signatory` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `signatory_title` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `invoice_terms` text COLLATE utf8mb4_unicode_ci,
  `invoice_footer` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `company_settings`
--

INSERT INTO `company_settings` VALUES (1,'Kanak Turnkey Solutions Pvt. Ltd.','Tower 4, Level 8, Cyber City, BKC','Mumbai','Maharashtra','India','400051','INR','27AABCK1234F1Z5','+91 22 4590 1200','finance@kanak.in','https://kanakturnkey.com','2026-08-06 06:25:11',NULL,'AABCK1234F','HDFC Bank Ltd','50200088921820','HDFC0000060','BKC Main Branch, Mumbai','Vikram Shah','Head of Finance & Accounts','1. Payment due within 15 days of invoice date.\n2. Overdue payments subject to 1.5% interest per month.\n3. Please quote invoice number on all remittances.','Thank you for partnering with Kanak Turnkey Solutions. Certified ISO 9001:2015 Turnkey Contractor.');

--
-- Table structure for table `contract_boq_items`
--

DROP TABLE IF EXISTS `contract_boq_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contract_boq_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `contract_id` int NOT NULL,
  `item_number` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `unit` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'nos',
  `quantity` decimal(14,3) NOT NULL,
  `rate` decimal(14,2) NOT NULL,
  `total_amount` decimal(14,2) NOT NULL,
  `cumulative_completed_qty` decimal(14,3) NOT NULL DEFAULT '0.000',
  `cumulative_billed_qty` decimal(14,3) NOT NULL DEFAULT '0.000',
  `sort_order` int NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `updated_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=76 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contract_boq_items`
--

INSERT INTO `contract_boq_items` VALUES (43,5,'1.1','M25 Grade Ready Mix Concrete in Footings & Raft','cum',200.000,5500.00,1100000.00,0.000,0.000,0,'2026-10-05 06:12:56','2026-10-05 06:12:56'),(44,5,'1.2','High Yield Strength Deformed (HYSD) Steel Reinforcement Fe500','kg',15000.000,72.00,1080000.00,0.000,0.000,0,'2026-10-05 06:12:56','2026-10-05 06:12:56'),(45,5,'1.3','200mm Solid Concrete Block Masonry in Substructure Walls','sqm',800.000,850.00,680000.00,0.000,0.000,0,'2026-10-05 06:12:56','2026-10-05 06:12:56'),(49,4,'1.1','M25 Grade Ready Mix Concrete in Footings & Raft','cum',200.000,5500.00,1100000.00,10.000,0.000,0,'2026-10-06 05:18:55','2026-10-23 02:08:45'),(50,4,'1.2','High Yield Strength Deformed (HYSD) Steel Reinforcement Fe500','kg',15000.000,72.00,1080000.00,14.200,0.000,0,'2026-10-06 05:18:55','2026-10-23 02:08:45'),(51,4,'1.3','200mm Solid Concrete Block Masonry in Substructure Walls','sqm',800.000,850.00,680000.00,10.000,0.000,0,'2026-10-06 05:18:55','2026-10-23 02:08:45'),(52,6,'1.1','Italian Botticino Marble Flooring with Mirror Polish & Brass Inlay','sqm',350.000,4800.00,1680000.00,10.000,0.000,1,'2026-10-14 06:59:06','2026-10-14 01:39:26'),(53,6,'1.2','Acoustic Perforated Gypsum False Ceiling with LED Cove Lighting','sqm',420.000,1350.00,567000.00,20.000,0.000,2,'2026-10-14 06:59:06','2026-10-14 01:39:26'),(54,6,'1.3','Natural Teak Wood Veneer Wall Panelling & Reception Desk Millwork','lot',1.000,1850000.00,1850000.00,2.000,0.000,3,'2026-10-14 06:59:06','2026-10-14 01:39:26'),(55,6,'1.4','Toughened 12mm Frameless Glass Automatic Sliding Entrance Doors','set',2.000,320000.00,640000.00,5.000,0.000,4,'2026-10-14 06:59:06','2026-10-14 01:39:26'),(56,6,'1.5','HVAC Ducting, Linear Diffusers & Air Distribution Network','nos',24.000,8500.00,204000.00,7.000,0.000,5,'2026-10-14 06:59:06','2026-10-14 01:39:26'),(57,8,'1.1','Premium Hotel Suite Modular Joinery, Wardrobes & Headboards','room',25.000,180000.00,4500000.00,0.000,0.000,1,'2026-10-14 06:59:06','2026-10-14 06:59:06'),(58,8,'1.2','Large Format Vitrified Porcelain Wall & Floor Tiles (1200x600mm)','sqm',1200.000,1450.00,1740000.00,0.000,0.000,2,'2026-10-14 06:59:06','2026-10-14 06:59:06'),(59,8,'1.3','Concealed CPVC/UPVC Sanitary Piping, CP Fittings & Kohler Sanitaryware','set',25.000,68000.00,1700000.00,0.000,0.000,3,'2026-10-14 06:59:06','2026-10-14 06:59:06'),(60,8,'1.4','Architectural Mood Lighting, Automation Switches & DALI Dimming System','lot',1.000,850000.00,850000.00,0.000,0.000,4,'2026-10-14 06:59:06','2026-10-14 06:59:06'),(61,9,'1.1','M25 Reinforced Ready Mix Concrete in Footings, Plinth & Core Columns','cum',220.000,5600.00,1232000.00,0.000,0.000,1,'2026-10-14 06:59:06','2026-10-14 06:59:06'),(62,9,'1.2','High Yield Strength Deformed Fe500D Reinforcement Steel Rebar','kg',18000.000,72.00,1296000.00,0.000,0.000,2,'2026-10-14 06:59:06','2026-10-14 06:59:06'),(63,9,'1.3','200mm Autoclaved Aerated Concrete (AAC) Block Masonry Walls','sqm',850.000,890.00,756500.00,0.000,0.000,3,'2026-10-14 06:59:06','2026-10-14 06:59:06'),(64,9,'1.4','Exterior Silicon Weatherproof Texture Coating & Elastomeric Primer','sqm',1600.000,380.00,608000.00,0.000,0.000,4,'2026-10-14 06:59:06','2026-10-14 06:59:06'),(65,9,'1.5','Natural Timber Decking & Anti-Slip Stone Surrounds at Pool Area','sqm',340.000,2600.00,884000.00,0.000,0.000,5,'2026-10-14 06:59:06','2026-10-14 06:59:06'),(66,10,'1.1','Earthwork Excavation & M20 Grade Raft Foundation Concrete','cum',45.000,5400.00,243000.00,0.000,0.000,1,'2026-10-14 06:59:06','2026-10-14 06:59:06'),(67,10,'1.2','TMT Fe500 Reinforcement Steel Cut, Bent & Tied in Position','kg',3500.000,71.00,248500.00,0.000,0.000,2,'2026-10-14 06:59:06','2026-10-14 06:59:06'),(68,10,'1.3','9-inch First Class Red Burnt Clay Brickwork in Superstructure','sqm',220.000,820.00,180400.00,0.000,0.000,3,'2026-10-14 06:59:06','2026-10-14 06:59:06'),(69,10,'1.4','Internal Sand-Faced Cement Plastering & Acrylic Putty Finish','sqm',480.000,240.00,115200.00,0.000,0.000,4,'2026-10-14 06:59:06','2026-10-14 06:59:06'),(70,10,'1.5','Vitrified Glossy Floor Tiles (800x800mm) with Epoxy Grouting','sqm',180.000,1180.00,212400.00,0.000,0.000,5,'2026-10-14 06:59:06','2026-10-14 06:59:06'),(71,11,'1.1','Main LT Switchgear Panel, Busbar Trunking & Auto Transfer Switch','set',4.000,650000.00,2600000.00,0.000,0.000,1,'2026-10-14 06:59:06','2026-10-14 06:59:06'),(72,11,'1.2','FRLS Heavy-Duty Multi-Core Armoured Copper Power Cables (3.5Cx120)','mtr',2400.000,950.00,2280000.00,0.000,0.000,2,'2026-10-14 06:59:06','2026-10-14 06:59:06'),(73,11,'1.3','Concealed PVC Conduiting, Wire Pulling & Modular Switch Plates','point',1200.000,1450.00,1740000.00,0.000,0.000,3,'2026-10-14 06:59:06','2026-10-14 06:59:06'),(74,11,'1.4','Hydro-pneumatic Variable Speed Water Pumping System & Rising Mains','set',2.000,890000.00,1780000.00,0.000,0.000,4,'2026-10-14 06:59:06','2026-10-14 06:59:06'),(75,11,'1.5','Fire Sprinkler Network, Wet Riser Landing Valves & Hose Reels','nos',380.000,3400.00,1292000.00,0.000,0.000,5,'2026-10-14 06:59:06','2026-10-14 06:59:06');

--
-- Table structure for table `contracts`
--

DROP TABLE IF EXISTS `contracts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contracts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `contract_number` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `project_id` int NOT NULL,
  `vendor_id` int DEFAULT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `total_amount` decimal(14,2) NOT NULL DEFAULT '0.00',
  `retention_percent` decimal(5,2) NOT NULL DEFAULT '5.00',
  `advance_percent` decimal(5,2) NOT NULL DEFAULT '0.00',
  `tds_percent` decimal(5,2) NOT NULL DEFAULT '2.00',
  `gst_percent` decimal(5,2) NOT NULL DEFAULT '18.00',
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `status` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_by_id` int DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `updated_at` timestamp NOT NULL DEFAULT (now()),
  `contract_type` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'vendor',
  `client_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `abg_required` tinyint(1) DEFAULT '0',
  `abg_percent` decimal(5,2) DEFAULT '0.00',
  `abg_amount` decimal(14,2) DEFAULT '0.00',
  `payment_terms_days` int DEFAULT '30',
  `dlp_months` int DEFAULT '12',
  `commercial_terms_notes` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  UNIQUE KEY `contracts_contract_number_unique` (`contract_number`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contracts`
--

INSERT INTO `contracts` VALUES (4,'CNT-CLI-2026-0014',14,NULL,'EPC Turnkey Construction Contract — Dr. Vikramaditya Oberoi','Formal Client Agreement for Turnkey Project \"Dr. Vikramaditya Oberoi — Commercial Cleanroom & MEP Turnkey\". Mobilization Advance: 10%, Retention: 5%, DLP: 12 Months, Credit Period: 30 Days. Advance Bank Guarantee (ABG) required for 10% (₹55,00,000).',55000000.00,5.00,10.00,2.00,18.00,'2026-09-24','2027-07-21','active',17,'2026-09-24 12:48:26','2026-09-24 12:48:26','client','Apex Global Biotech & Healthcare Park',1,10.00,5500000.00,30,12,'Client agreed on 10% Mobilization Advance against a 10% Advance Bank Guarantee (ABG) from a Scheduled Commercial Bank. 5% Retention withheld from monthly RA bills, payable 50% on Handover & As-Built acceptance, and 50% post 12-month DLP. Billing schedule tied to 6 turnkey milestone gates.'),(5,'CNT-20260923-0001',1,1,'RCC Structural & Masonry Contract','Complete concrete and brickwork scope for Phase 1 Foundation & Podium.',2860000.00,5.00,0.00,2.00,18.00,'2026-09-01','2026-12-31','active',17,'2026-10-05 06:12:56','2026-10-05 06:12:56','vendor',NULL,0,0.00,0.00,30,12,NULL),(6,'CNT-20261005-0003',5,12,'civil purpose',NULL,4941000.00,9.00,0.00,0.00,18.00,'2026-10-01','2026-10-16','active',17,'2026-10-05 10:49:41','2026-10-05 10:49:41','vendor',NULL,0,0.00,0.00,30,12,NULL),(8,'CNT-CLI-2026-0016',16,NULL,'EPC Turnkey Construction Contract — Mahesh Bhatia','Formal Client Agreement for Turnkey Project \"Mahesh Bhatia — Hotel Interior Fit-out\". Mobilization Advance: 10%, Retention: 5%, DLP: 12 Months, Credit Period: 30 Days.',8790000.00,5.00,10.00,2.00,18.00,'2026-10-07','2027-08-03','active',17,'2026-10-07 07:41:10','2026-10-07 07:41:10','client','Lumina Hospitality Group',0,0.00,0.00,30,12,NULL),(9,'CNT-CLI-2026-0017',17,NULL,'EPC Turnkey Construction Contract —  Ramesh Kumar','Formal Client Agreement for Turnkey Project \"Ramesh Kumar —  Resort Expansion & Renovation\". Mobilization Advance: 10%, Retention: 5%, DLP: 12 Months, Credit Period: 30 Days.',45000000.00,5.00,10.00,2.00,18.00,'2026-10-07','2027-08-03','active',17,'2026-10-07 07:41:30','2026-10-07 07:41:30','client','Horizon Resorts Pvt. Ltd',0,0.00,0.00,30,12,NULL),(10,'CNT-CLI-2026-0018',18,NULL,'EPC Turnkey Construction Contract — Test Customer','Formal Client Agreement for Turnkey Project \"Test Customer — Residential\". Mobilization Advance: 10%, Retention: 5%, DLP: 12 Months, Credit Period: 30 Days.',1000000.00,5.00,10.00,2.00,18.00,'2026-10-07','2027-08-03','active',17,'2026-10-07 08:43:26','2026-10-07 08:43:26','client','Test Customer',0,0.00,0.00,30,12,NULL),(11,'CNT-CLI-2026-0019',19,NULL,'EPC Turnkey Construction Contract — Ritesh Khanna','Formal Client Agreement for Turnkey Project \"Ritesh Khanna — Residential Tower MEP\". Mobilization Advance: 10%, Retention: 5%, DLP: 12 Months, Credit Period: 30 Days.',84000000.00,5.00,10.00,2.00,18.00,'2026-10-07','2027-08-03','active',17,'2026-10-07 08:48:01','2026-10-07 08:48:01','client','Northshore Residences',0,0.00,0.00,30,12,NULL);

--
-- Table structure for table `daily_progress_reports`
--

DROP TABLE IF EXISTS `daily_progress_reports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `daily_progress_reports` (
  `id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `report_date` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `weather` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT 'Sunny / Clear',
  `shift` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT 'Day Shift',
  `work_summary` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `manpower_count` int DEFAULT '0',
  `manpower_breakdown` json DEFAULT NULL,
  `equipment` json DEFAULT NULL,
  `site_issues` text COLLATE utf8mb4_unicode_ci,
  `status` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT 'Submitted to PM',
  `created_by_id` int DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `updated_at` timestamp NOT NULL DEFAULT (now()),
  `photos` json DEFAULT NULL,
  `work_location` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `materials_consumed` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  KEY `idx_dpr_project_date` (`project_id`,`report_date`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `daily_progress_reports`
--

INSERT INTO `daily_progress_reports` VALUES (1,14,'2026-10-14','Sunny / Clear (32??C)','Day Shift','Completed raft footing C-4 and column starter casting (85 cum M35 concrete). Reinforcement tying for podium columns Grid D4-D8 in progress.',45,'{\"masons\": 8, \"helpers\": 35, \"engineers\": 2, \"barBenders\": 12, \"carpenters\": 15, \"supervisors\": 3}','[\"Tower Crane #1\", \"Concrete Boom Placer\", \"Transit Mixers x 3\", \"Vibrators x 4\"]','None. Steel delivery inspected and offloaded at South Yard.','Verified by PM',17,'2026-10-14 07:24:19','2026-10-14 07:24:19',NULL,NULL,NULL),(3,5,'2026-10-14','Sunny / 30�C','Day Shift','Lobby false ceiling framing completed. Italian marble floor laying commenced.',38,NULL,'[\"Tile Cutter, Laser Level\"]','None','Submitted to PM',17,'2026-10-14 07:37:01','2026-10-14 10:40:57',NULL,NULL,NULL),(4,19,'2026-10-14','Sunny / Clear (30�C)','Day Shift','Conducted megger testing on main LT switchgear risers. 4th floor conduit installation underway.',42,NULL,'[\"Fluke Megger Insulation Tester, Cable Pulling Winch\"]','None. High voltage inspector scheduled for tomorrow.','Submitted to PM',17,'2026-10-14 07:40:28','2026-10-14 10:40:57',NULL,NULL,NULL),(5,6,'2026-10-14','Sunny / Clear','Night Shift','Surface finishing and curing initiated for previously cast columns',35,NULL,'[\"Tower crane\"]','No safety incidents reported during the shift','Submitted to PM',17,'2026-10-14 09:10:37','2026-10-14 10:40:57',NULL,NULL,NULL),(6,1,'2026-10-14','Rainy / 24�C','Day Shift','Completed blockwork on 2nd floor and waterproof testing',27,NULL,'[\"Concrete Mixer\", \"3 Vibrators\"]','Minor rain delay of 45 mins; no safety incidents','Verified by PM',17,'2026-10-14 10:46:07','2026-10-14 10:46:07',NULL,NULL,NULL),(7,2,'2026-10-15','Sunny / Clear','Day Shift','Shuttering and rebar work completed for designated slab sections\n\nConcrete pouring executed at foundation bays',37,'{\"masons\": 15, \"helpers\": 3, \"engineers\": 3, \"barBenders\": 10, \"carpenters\": 4, \"supervisors\": 2}','[\"Tower Crane\", \"Transit Mixer\"]','[Enter any delays, equipment breakdowns, or safety observations — e.g., minor delay due to material delivery, no safety incidents reported]','Submitted to PM',17,'2026-10-15 06:22:15','2026-10-15 06:22:15',NULL,NULL,NULL),(8,19,'2026-10-16','Sunny / Clear (32°C)','Day Shift','Completed 115 cum M35 concrete pour for Podium Slab Bay 4 using boom pump. Concurrently carried out Floor 5 column starter layout and rebar binding.',38,'{\"masons\": 8, \"helpers\": 5, \"engineers\": 2, \"barBenders\": 12, \"carpenters\": 8, \"supervisors\": 3}','[\"Schwing Stetter Boom Pump 36m\", \"Potain Tower Crane (50m Jib)\", \"4x High-frequency Needle Vibrators\"]','None. Pour completed smoothly before 16:30 hrs. Cube samples taken for 7, 14 & 28-day testing.','Verified by PM',1,'2026-10-16 11:53:16','2026-10-16 11:53:16','[{\"url\": \"https://images.unsplash.com/photo-1541888946425-d0fbb186c5f8?auto=format&fit=crop&w=1200&q=80\", \"stage\": \"RCC Casting\", \"title\": \"Podium Slab Bay 4 Concrete Pour with Boom Pump\", \"category\": \"progress\", \"location\": \"Podium Slab Bay 4\", \"capturedDate\": \"2026-10-16\"}, {\"url\": \"https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=80\", \"stage\": \"Quality Inspection\", \"title\": \"Rebar Inspection & Cover Block Verification before Pour\", \"category\": \"quality\", \"location\": \"Podium Bay 4 Beams\", \"capturedDate\": \"2026-10-16\"}]','Podium Slab Bay 4 & Tower A Floor 5','115 cum RMC M35, 14.2 MT TMT Fe550D Rebar, 220 Bags OPC 53 Cement'),(9,19,'2026-10-15','Partly Cloudy (29°C)','Day Shift','AAC block masonry walls erected on 3rd floor west wing. Electrical conduits and switch boxes chiselled and laid on 4th floor.',34,'{\"masons\": 10, \"helpers\": 14, \"engineers\": 2, \"supervisors\": 2, \"electricians\": 6}','[\"Passenger & Material Hoist 1.5T\", \"Concrete Mixer & Batcher\"]','Minor seepage noted in duct shaft near Column 12; plumbing contractor alerted for joint packing.','Approved',1,'2026-10-16 11:53:16','2026-10-16 11:53:16','[{\"url\": \"https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80\", \"stage\": \"Masonry\", \"title\": \"Floor 3 AAC Blockwork Alignment & Joint Filling\", \"category\": \"progress\", \"location\": \"Floor 3 West Wing\", \"capturedDate\": \"2026-10-15\"}]','Tower A Floors 3 & 4','850 Nos AAC Blocks (600x200x150mm), 45 Bags Block Joint Mortar, 350m PVC Conduit Pipes'),(10,19,'2026-10-16','Sunny / Clear','Day Shift','Automated test: Completed electrical conduit layout and box fixing on 4th floor.',18,'{\"helpers\": 9, \"engineers\": 1, \"supervisors\": 2, \"electricians\": 6}','[\"1x Core Cutting Machine\", \"2x Electric Hammer Drills\"]','None. Work progressing as per master schedule.','Verified by PM',17,'2026-10-16 12:02:18','2026-10-16 06:32:19','[{\"id\": \"test-photo-1\", \"url\": \"/uploads/electrical_conduit_test.jpg\", \"stage\": \"In Progress\", \"caption\": \"Conduit laying at Corridor B4\", \"category\": \"Electrical & Plumbing\", \"location\": \"Tower B Level 4 Corridor\", \"timestamp\": \"2026-10-16T12:02:18.620Z\"}]','Sector 62 - Tower B, Level 4','PVC Conduits: 140 rmt, Junction Boxes: 28 nos, Binding wire: 5 kg'),(13,1,'2026-10-26','Sunny / Clear (33°C)','Day Shift','Mobile PWA verification: reinforcement binding and conduit laying completed.',18,'{\"masons\": 5, \"helpers\": 4, \"engineers\": 2, \"barBenders\": 6, \"supervisors\": 1}','[\"Tower Crane operational 6 hrs; Concrete Mixer on standby\"]','None. Work proceeded as planned.','Submitted to PM',19,'2026-10-26 11:35:02','2026-10-26 11:35:02','[]','Tower A - 3rd Floor Slab Reinforcement','Cement: 40 bags, Rebar 12mm: 1.5 MT');

--
-- Table structure for table `documents`
--

DROP TABLE IF EXISTS `documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `documents` (
  `id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `file_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_type` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `file_size` int DEFAULT NULL,
  `file_url` text COLLATE utf8mb4_unicode_ci,
  `category` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'general',
  `version` int NOT NULL DEFAULT '1',
  `status` varchar(16) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `uploaded_by_id` int DEFAULT NULL,
  `uploaded_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `documents`
--

INSERT INTO `documents` VALUES (1,1,'Sentinel_MSA_v3_signed.pdf','application/pdf',2840000,NULL,'contract',3,'active',1,'2026-08-05 06:44:24'),(2,1,'Floor4_AsBuilt_Apr2026.dwg','application/dwg',1520000,NULL,'drawing',1,'active',3,'2026-08-05 06:44:24'),(3,2,'Citygate_HSE_Audit_Mar2026.pdf','application/pdf',3210000,NULL,'report',1,'active',2,'2026-08-05 06:44:24'),(4,6,' Electrical Layout Plan.dwg','DWG',NULL,NULL,'drawing',1,'active',1,'2026-08-06 11:12:04'),(5,6,'EM3_Paperwise_Answer_Key-01.pdf','pdf',NULL,'/uploads/EM3_Paperwise_Answer_Key-01-1786021260730-479524075.pdf','contract',1,'active',1,'2026-08-06 13:01:00'),(10,2,'EM3_AC_Motors_Drives_QA_Compiled.pdf','application/pdf',36243,'/uploads/EM3_AC_Motors_Drives_QA_Compiled-1789743530867-278276843.pdf','general',1,'active',17,'2026-09-18 14:58:50');

--
-- Table structure for table `drawings`
--

DROP TABLE IF EXISTS `drawings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `drawings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `lead_id` int NOT NULL,
  `file_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_type` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `file_size` int DEFAULT NULL,
  `file_url` text COLLATE utf8mb4_unicode_ci,
  `version` int NOT NULL DEFAULT '1',
  `status` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `reviewer_comments` text COLLATE utf8mb4_unicode_ci,
  `uploaded_by_id` int DEFAULT NULL,
  `reviewed_by_id` int DEFAULT NULL,
  `uploaded_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `drawings`
--

INSERT INTO `drawings` VALUES (1,1,'Lumina_Lobby_Concept_v3.pdf','application/pdf',2840000,NULL,3,'approved','Approved by client for BOQ stage.',3,2,'2026-08-05 06:44:24'),(2,1,'Lumina_Room_Type_A_Rev2.dwg','application/dwg',1520000,NULL,2,'submitted',NULL,3,NULL,'2026-08-05 06:44:24'),(3,4,'Asha_Wing_HVAC_Plan_v1.pdf','application/pdf',3210000,NULL,1,'draft',NULL,3,NULL,'2026-08-05 06:44:24'),(4,6,'EM3_AC_Motors_Drives_QA_Compiled.pdf','pdf',NULL,'/uploads/EM3_AC_Motors_Drives_QA_Compiled-1786021167864-621842917.pdf',1,'approved',NULL,1,NULL,'2026-08-06 12:59:28'),(5,1,'Lumina_Lobby_Concept_v3.pdf','application/pdf',2840000,NULL,3,'approved','Approved by client for BOQ stage.',19,18,'2026-08-11 08:10:43'),(6,1,'Lumina_Room_Type_A_Rev2.dwg','application/dwg',1520000,NULL,2,'submitted',NULL,19,NULL,'2026-08-11 08:10:43'),(7,4,'Asha_Wing_HVAC_Plan_v1.pdf','application/pdf',3210000,NULL,1,'draft',NULL,19,NULL,'2026-08-11 08:10:43'),(11,14,'ARCH-CLEANROOM-GA-001-REV-C.pdf','application/pdf',14582900,'/drawings/arch-cleanroom-ga-001-rev-c.pdf',3,'approved','Architectural layout and ISO Class 7 cleanroom boundaries approved for construction.',19,18,'2026-09-24 12:39:08'),(12,14,'MEP-HVAC-ISO-PRESS-002.pdf','application/pdf',9845200,'/drawings/mep-hvac-iso-press-002.pdf',2,'approved','HVAC airflow, differential pressure cascade, and HEPA filter ceiling grid approved.',19,18,'2026-09-24 12:39:08'),(13,14,'ELEC-11KV-SUBSTATION-SLD-003.pdf','application/pdf',7621000,'/drawings/elec-11kv-substation-sld-003.pdf',1,'approved','11kV HT Substation, 500kVA transformer, and DG sync panel single line diagram approved.',19,18,'2026-09-24 12:39:08');

--
-- Table structure for table `email_logs`
--

DROP TABLE IF EXISTS `email_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `email_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `recipient_email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `recipient_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_id` int DEFAULT NULL,
  `event_type` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `subject` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'delivered',
  `body_preview` text COLLATE utf8mb4_unicode_ci,
  `body_html` mediumtext COLLATE utf8mb4_unicode_ci,
  `metadata` json DEFAULT NULL,
  `error_message` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `email_logs`
--

INSERT INTO `email_logs` VALUES (1,'admin@kanakturnkey.com','Ananya Rao',17,'ra_bill_submitted','[Action Required] RA Bill #RA-2026-004 Submitted for Client Certification','delivered','RA Bill #RA-2026-004 Submitted: Running Account Bill #RA-2026-004 for project \'Commercial Tower B\' has been submitted for certification. Please review the enclosed itemized measurement breakdown and certified quantities.','\n<!DOCTYPE html>\n<html>\n<head>\n  <meta charset=\"utf-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n  <title>RA Bill #RA-2026-004 Submitted</title>\n</head>\n<body style=\"margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;\">\n  <table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" style=\"background-color: #f1f5f9; padding: 32px 16px;\">\n    <tr>\n      <td align=\"center\">\n        <!-- Main Container -->\n        <table role=\"presentation\" width=\"100%\" style=\"max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); border: 1px solid #e2e8f0;\">\n          \n          <!-- Header -->\n          <tr>\n            <td style=\"background-color: #0f172a; padding: 24px 32px; border-bottom: 3px solid #3b82f6;\">\n              <table width=\"100%\" cellspacing=\"0\" cellpadding=\"0\">\n                <tr>\n                  <td>\n                    <h1 style=\"margin: 0; color: #ffffff; font-size: 20px; font-weight: 700; letter-spacing: -0.5px;\">\n                      KANAK <span style=\"color: #60a5fa; font-weight: 400;\">TURNKEY</span>\n                    </h1>\n                    <p style=\"margin: 4px 0 0 0; color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;\">\n                      Enterprise Construction Management\n                    </p>\n                  </td>\n                  <td align=\"right\">\n                    <span style=\"display: inline-block; background-color: #d97706; color: #ffffff; font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.5px;\">\n                      Review Needed\n                    </span>\n                  </td>\n                </tr>\n              </table>\n            </td>\n          </tr>\n\n          <!-- Body Content -->\n          <tr>\n            <td style=\"padding: 32px;\">\n              <p style=\"margin: 0 0 16px 0; font-size: 14px; color: #475569;\">Hello <strong>Ananya Rao</strong>,</p>\n              \n              <h2 style=\"margin: 0 0 12px 0; font-size: 18px; font-weight: 600; color: #0f172a; line-height: 1.4;\">\n                RA Bill #RA-2026-004 Submitted\n              </h2>\n\n              <p style=\"margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #334155;\">\n                Running Account Bill #RA-2026-004 for project \'Commercial Tower B\' has been submitted for certification. Please review the enclosed itemized measurement breakdown and certified quantities.\n              </p>\n\n              \n      <div style=\"margin: 20px 0; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 14px 16px;\">\n        <table style=\"width: 100%; border-collapse: collapse; font-size: 13px;\">\n          \n              <tr style=\"border-bottom: 1px solid #edf2f7;\">\n                <td style=\"padding: 6px 0; color: #64748b; font-weight: 500; width: 38%;\">Project</td>\n                <td style=\"padding: 6px 0; color: #0f172a; font-weight: 600;\">Commercial Tower B</td>\n              </tr>\n            \n              <tr style=\"border-bottom: 1px solid #edf2f7;\">\n                <td style=\"padding: 6px 0; color: #64748b; font-weight: 500; width: 38%;\">Bill Number</td>\n                <td style=\"padding: 6px 0; color: #0f172a; font-weight: 600;\">RA-2026-004</td>\n              </tr>\n            \n              <tr style=\"border-bottom: 1px solid #edf2f7;\">\n                <td style=\"padding: 6px 0; color: #64748b; font-weight: 500; width: 38%;\">Gross Amount</td>\n                <td style=\"padding: 6px 0; color: #0f172a; font-weight: 600;\">₹ 14,85,000</td>\n              </tr>\n            \n              <tr style=\"border-bottom: 1px solid #edf2f7;\">\n                <td style=\"padding: 6px 0; color: #64748b; font-weight: 500; width: 38%;\">Net Payable</td>\n                <td style=\"padding: 6px 0; color: #0f172a; font-weight: 600;\">₹ 13,36,500</td>\n              </tr>\n            \n              <tr style=\"border-bottom: 1px solid #edf2f7;\">\n                <td style=\"padding: 6px 0; color: #64748b; font-weight: 500; width: 38%;\">Submission Date</td>\n                <td style=\"padding: 6px 0; color: #0f172a; font-weight: 600;\">2026-10-23</td>\n              </tr>\n            \n              <tr style=\"border-bottom: 1px solid #edf2f7;\">\n                <td style=\"padding: 6px 0; color: #64748b; font-weight: 500; width: 38%;\">Submitted By</td>\n                <td style=\"padding: 6px 0; color: #0f172a; font-weight: 600;\">Rajesh Kumar (Project Manager)</td>\n              </tr>\n            \n        </table>\n      </div>\n    \n\n              <!-- Call to Action Button -->\n              <div style=\"margin: 28px 0 16px 0; text-align: left;\">\n                <a href=\"http://localhost:5173/ra-bills\" style=\"display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 24px; border-radius: 6px; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);\">\n                  Review RA Bill &rarr;\n                </a>\n              </div>\n\n              <p style=\"margin: 20px 0 0 0; font-size: 12px; color: #64748b; line-height: 1.5;\">\n                Or paste this link into your browser: <br/>\n                <a href=\"http://localhost:5173/ra-bills\" style=\"color: #2563eb; word-break: break-all;\">http://localhost:5173/ra-bills</a>\n              </p>\n            </td>\n          </tr>\n\n          <!-- Footer -->\n          <tr>\n            <td style=\"background-color: #f8fafc; padding: 20px 32px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;\">\n              <table width=\"100%\" cellspacing=\"0\" cellpadding=\"0\">\n                <tr>\n                  <td>\n                    <p style=\"margin: 0 0 4px 0; font-weight: 500; color: #475569;\">Kanak Turnkey Solutions ERP</p>\n                    <p style=\"margin: 0; color: #94a3b8;\">Automated Workflow Event Notification</p>\n                  </td>\n                  <td align=\"right\" style=\"vertical-align: top;\">\n                    <a href=\"http://localhost:5173/notifications\" style=\"color: #2563eb; text-decoration: none;\">Notification Settings</a>\n                  </td>\n                </tr>\n              </table>\n            </td>\n          </tr>\n\n        </table>\n      </td>\n    </tr>\n  </table>\n</body>\n</html>\n  ','{\"project\": \"Commercial Tower B\", \"billNumber\": \"RA-2026-004\", \"netPayable\": \"₹ 13,36,500\", \"grossAmount\": \"₹ 14,85,000\", \"submittedBy\": \"Rajesh Kumar (Project Manager)\", \"submissionDate\": \"2026-10-23\"}',NULL,'2026-10-23 04:39:09'),(2,'director@kanakturnkey.com','Ananya Rao',17,'ra_bill_certified','[Certified] RA Bill #RA-2026-003 Certified for Payment','delivered','RA Bill #RA-2026-003 Certified: The client engineer has approved and certified RA Bill #RA-2026-003. Finance team may now issue the tax invoice and record the receivable.','\n<!DOCTYPE html>\n<html>\n<head>\n  <meta charset=\"utf-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n  <title>RA Bill #RA-2026-003 Certified</title>\n</head>\n<body style=\"margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;\">\n  <table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" style=\"background-color: #f1f5f9; padding: 32px 16px;\">\n    <tr>\n      <td align=\"center\">\n        <!-- Main Container -->\n        <table role=\"presentation\" width=\"100%\" style=\"max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); border: 1px solid #e2e8f0;\">\n          \n          <!-- Header -->\n          <tr>\n            <td style=\"background-color: #0f172a; padding: 24px 32px; border-bottom: 3px solid #3b82f6;\">\n              <table width=\"100%\" cellspacing=\"0\" cellpadding=\"0\">\n                <tr>\n                  <td>\n                    <h1 style=\"margin: 0; color: #ffffff; font-size: 20px; font-weight: 700; letter-spacing: -0.5px;\">\n                      KANAK <span style=\"color: #60a5fa; font-weight: 400;\">TURNKEY</span>\n                    </h1>\n                    <p style=\"margin: 4px 0 0 0; color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;\">\n                      Enterprise Construction Management\n                    </p>\n                  </td>\n                  <td align=\"right\">\n                    <span style=\"display: inline-block; background-color: #16a34a; color: #ffffff; font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.5px;\">\n                      Workflow Milestone\n                    </span>\n                  </td>\n                </tr>\n              </table>\n            </td>\n          </tr>\n\n          <!-- Body Content -->\n          <tr>\n            <td style=\"padding: 32px;\">\n              <p style=\"margin: 0 0 16px 0; font-size: 14px; color: #475569;\">Hello <strong>Ananya Rao</strong>,</p>\n              \n              <h2 style=\"margin: 0 0 12px 0; font-size: 18px; font-weight: 600; color: #0f172a; line-height: 1.4;\">\n                RA Bill #RA-2026-003 Certified\n              </h2>\n\n              <p style=\"margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #334155;\">\n                The client engineer has approved and certified RA Bill #RA-2026-003. Finance team may now issue the tax invoice and record the receivable.\n              </p>\n\n              \n      <div style=\"margin: 20px 0; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 14px 16px;\">\n        <table style=\"width: 100%; border-collapse: collapse; font-size: 13px;\">\n          \n              <tr style=\"border-bottom: 1px solid #edf2f7;\">\n                <td style=\"padding: 6px 0; color: #64748b; font-weight: 500; width: 38%;\">Project</td>\n                <td style=\"padding: 6px 0; color: #0f172a; font-weight: 600;\">Luxury Villa Residences</td>\n              </tr>\n            \n              <tr style=\"border-bottom: 1px solid #edf2f7;\">\n                <td style=\"padding: 6px 0; color: #64748b; font-weight: 500; width: 38%;\">Bill Number</td>\n                <td style=\"padding: 6px 0; color: #0f172a; font-weight: 600;\">RA-2026-003</td>\n              </tr>\n            \n              <tr style=\"border-bottom: 1px solid #edf2f7;\">\n                <td style=\"padding: 6px 0; color: #64748b; font-weight: 500; width: 38%;\">Certified Amount</td>\n                <td style=\"padding: 6px 0; color: #0f172a; font-weight: 600;\">₹ 28,40,000</td>\n              </tr>\n            \n              <tr style=\"border-bottom: 1px solid #edf2f7;\">\n                <td style=\"padding: 6px 0; color: #64748b; font-weight: 500; width: 38%;\">Deductions</td>\n                <td style=\"padding: 6px 0; color: #0f172a; font-weight: 600;\">₹ 2,84,000</td>\n              </tr>\n            \n              <tr style=\"border-bottom: 1px solid #edf2f7;\">\n                <td style=\"padding: 6px 0; color: #64748b; font-weight: 500; width: 38%;\">Certification Date</td>\n                <td style=\"padding: 6px 0; color: #0f172a; font-weight: 600;\">2026-10-23</td>\n              </tr>\n            \n        </table>\n      </div>\n    \n\n              <!-- Call to Action Button -->\n              <div style=\"margin: 28px 0 16px 0; text-align: left;\">\n                <a href=\"http://localhost:5173/ra-bills\" style=\"display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 24px; border-radius: 6px; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);\">\n                  View Certified RA Bill &rarr;\n                </a>\n              </div>\n\n              <p style=\"margin: 20px 0 0 0; font-size: 12px; color: #64748b; line-height: 1.5;\">\n                Or paste this link into your browser: <br/>\n                <a href=\"http://localhost:5173/ra-bills\" style=\"color: #2563eb; word-break: break-all;\">http://localhost:5173/ra-bills</a>\n              </p>\n            </td>\n          </tr>\n\n          <!-- Footer -->\n          <tr>\n            <td style=\"background-color: #f8fafc; padding: 20px 32px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;\">\n              <table width=\"100%\" cellspacing=\"0\" cellpadding=\"0\">\n                <tr>\n                  <td>\n                    <p style=\"margin: 0 0 4px 0; font-weight: 500; color: #475569;\">Kanak Turnkey Solutions ERP</p>\n                    <p style=\"margin: 0; color: #94a3b8;\">Automated Workflow Event Notification</p>\n                  </td>\n                  <td align=\"right\" style=\"vertical-align: top;\">\n                    <a href=\"http://localhost:5173/notifications\" style=\"color: #2563eb; text-decoration: none;\">Notification Settings</a>\n                  </td>\n                </tr>\n              </table>\n            </td>\n          </tr>\n\n        </table>\n      </td>\n    </tr>\n  </table>\n</body>\n</html>\n  ','{\"project\": \"Luxury Villa Residences\", \"billNumber\": \"RA-2026-003\", \"deductions\": \"₹ 2,84,000\", \"certifiedAmount\": \"₹ 28,40,000\", \"certificationDate\": \"2026-10-23\"}',NULL,'2026-10-23 04:42:17'),(3,'director@kanakturnkey.com','Ananya Rao',17,'purchase_order_approved','[Approved] Purchase Order #PO-2026-018 Approved','delivered','Purchase Order #PO-2026-018 Approved: Purchase Order #PO-2026-018 for \'TMT Steel Fe 550D\' has been formally approved and is ready to be issued to Tata Steel Ltd.','\n<!DOCTYPE html>\n<html>\n<head>\n  <meta charset=\"utf-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n  <title>Purchase Order #PO-2026-018 Approved</title>\n</head>\n<body style=\"margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;\">\n  <table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" style=\"background-color: #f1f5f9; padding: 32px 16px;\">\n    <tr>\n      <td align=\"center\">\n        <!-- Main Container -->\n        <table role=\"presentation\" width=\"100%\" style=\"max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); border: 1px solid #e2e8f0;\">\n          \n          <!-- Header -->\n          <tr>\n            <td style=\"background-color: #0f172a; padding: 24px 32px; border-bottom: 3px solid #3b82f6;\">\n              <table width=\"100%\" cellspacing=\"0\" cellpadding=\"0\">\n                <tr>\n                  <td>\n                    <h1 style=\"margin: 0; color: #ffffff; font-size: 20px; font-weight: 700; letter-spacing: -0.5px;\">\n                      KANAK <span style=\"color: #60a5fa; font-weight: 400;\">TURNKEY</span>\n                    </h1>\n                    <p style=\"margin: 4px 0 0 0; color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;\">\n                      Enterprise Construction Management\n                    </p>\n                  </td>\n                  <td align=\"right\">\n                    <span style=\"display: inline-block; background-color: #16a34a; color: #ffffff; font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.5px;\">\n                      Workflow Milestone\n                    </span>\n                  </td>\n                </tr>\n              </table>\n            </td>\n          </tr>\n\n          <!-- Body Content -->\n          <tr>\n            <td style=\"padding: 32px;\">\n              <p style=\"margin: 0 0 16px 0; font-size: 14px; color: #475569;\">Hello <strong>Ananya Rao</strong>,</p>\n              \n              <h2 style=\"margin: 0 0 12px 0; font-size: 18px; font-weight: 600; color: #0f172a; line-height: 1.4;\">\n                Purchase Order #PO-2026-018 Approved\n              </h2>\n\n              <p style=\"margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #334155;\">\n                Purchase Order #PO-2026-018 for \'TMT Steel Fe 550D\' has been formally approved and is ready to be issued to Tata Steel Ltd.\n              </p>\n\n              \n      <div style=\"margin: 20px 0; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 14px 16px;\">\n        <table style=\"width: 100%; border-collapse: collapse; font-size: 13px;\">\n          \n              <tr style=\"border-bottom: 1px solid #edf2f7;\">\n                <td style=\"padding: 6px 0; color: #64748b; font-weight: 500; width: 38%;\">Po Number</td>\n                <td style=\"padding: 6px 0; color: #0f172a; font-weight: 600;\">PO-2026-018</td>\n              </tr>\n            \n              <tr style=\"border-bottom: 1px solid #edf2f7;\">\n                <td style=\"padding: 6px 0; color: #64748b; font-weight: 500; width: 38%;\">Vendor</td>\n                <td style=\"padding: 6px 0; color: #0f172a; font-weight: 600;\">Tata Steel Ltd</td>\n              </tr>\n            \n              <tr style=\"border-bottom: 1px solid #edf2f7;\">\n                <td style=\"padding: 6px 0; color: #64748b; font-weight: 500; width: 38%;\">Total Value</td>\n                <td style=\"padding: 6px 0; color: #0f172a; font-weight: 600;\">₹ 8,92,000</td>\n              </tr>\n            \n              <tr style=\"border-bottom: 1px solid #edf2f7;\">\n                <td style=\"padding: 6px 0; color: #64748b; font-weight: 500; width: 38%;\">Delivery Location</td>\n                <td style=\"padding: 6px 0; color: #0f172a; font-weight: 600;\">Site B - Phase 2 Yard</td>\n              </tr>\n            \n              <tr style=\"border-bottom: 1px solid #edf2f7;\">\n                <td style=\"padding: 6px 0; color: #64748b; font-weight: 500; width: 38%;\">Approved By</td>\n                <td style=\"padding: 6px 0; color: #0f172a; font-weight: 600;\">Karthik Subramanian (Director)</td>\n              </tr>\n            \n        </table>\n      </div>\n    \n\n              <!-- Call to Action Button -->\n              <div style=\"margin: 28px 0 16px 0; text-align: left;\">\n                <a href=\"http://localhost:5173/procurement/purchase-orders\" style=\"display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 24px; border-radius: 6px; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);\">\n                  View Purchase Order &rarr;\n                </a>\n              </div>\n\n              <p style=\"margin: 20px 0 0 0; font-size: 12px; color: #64748b; line-height: 1.5;\">\n                Or paste this link into your browser: <br/>\n                <a href=\"http://localhost:5173/procurement/purchase-orders\" style=\"color: #2563eb; word-break: break-all;\">http://localhost:5173/procurement/purchase-orders</a>\n              </p>\n            </td>\n          </tr>\n\n          <!-- Footer -->\n          <tr>\n            <td style=\"background-color: #f8fafc; padding: 20px 32px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;\">\n              <table width=\"100%\" cellspacing=\"0\" cellpadding=\"0\">\n                <tr>\n                  <td>\n                    <p style=\"margin: 0 0 4px 0; font-weight: 500; color: #475569;\">Kanak Turnkey Solutions ERP</p>\n                    <p style=\"margin: 0; color: #94a3b8;\">Automated Workflow Event Notification</p>\n                  </td>\n                  <td align=\"right\" style=\"vertical-align: top;\">\n                    <a href=\"http://localhost:5173/notifications\" style=\"color: #2563eb; text-decoration: none;\">Notification Settings</a>\n                  </td>\n                </tr>\n              </table>\n            </td>\n          </tr>\n\n        </table>\n      </td>\n    </tr>\n  </table>\n</body>\n</html>\n  ','{\"vendor\": \"Tata Steel Ltd\", \"poNumber\": \"PO-2026-018\", \"approvedBy\": \"Karthik Subramanian (Director)\", \"totalValue\": \"₹ 8,92,000\", \"deliveryLocation\": \"Site B - Phase 2 Yard\"}',NULL,'2026-10-23 04:42:17'),(4,'director@kanakturnkey.com','Ananya Rao',17,'vendor_invoice_discrepancy','[Discrepancy Alert] 3-Way Match Mismatch on Invoice #INV-8831','delivered','3-Way Match Price & Quantity Discrepancy: Vendor invoice #INV-8831 from UltraTech Cement contains a 6.2% price variance compared to PO-2026-009. Payment hold has been applied pending resolution.','\n<!DOCTYPE html>\n<html>\n<head>\n  <meta charset=\"utf-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n  <title>3-Way Match Price & Quantity Discrepancy</title>\n</head>\n<body style=\"margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;\">\n  <table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" style=\"background-color: #f1f5f9; padding: 32px 16px;\">\n    <tr>\n      <td align=\"center\">\n        <!-- Main Container -->\n        <table role=\"presentation\" width=\"100%\" style=\"max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); border: 1px solid #e2e8f0;\">\n          \n          <!-- Header -->\n          <tr>\n            <td style=\"background-color: #0f172a; padding: 24px 32px; border-bottom: 3px solid #3b82f6;\">\n              <table width=\"100%\" cellspacing=\"0\" cellpadding=\"0\">\n                <tr>\n                  <td>\n                    <h1 style=\"margin: 0; color: #ffffff; font-size: 20px; font-weight: 700; letter-spacing: -0.5px;\">\n                      KANAK <span style=\"color: #60a5fa; font-weight: 400;\">TURNKEY</span>\n                    </h1>\n                    <p style=\"margin: 4px 0 0 0; color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;\">\n                      Enterprise Construction Management\n                    </p>\n                  </td>\n                  <td align=\"right\">\n                    <span style=\"display: inline-block; background-color: #dc2626; color: #ffffff; font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.5px;\">\n                      Action Required / Alert\n                    </span>\n                  </td>\n                </tr>\n              </table>\n            </td>\n          </tr>\n\n          <!-- Body Content -->\n          <tr>\n            <td style=\"padding: 32px;\">\n              <p style=\"margin: 0 0 16px 0; font-size: 14px; color: #475569;\">Hello <strong>Ananya Rao</strong>,</p>\n              \n              <h2 style=\"margin: 0 0 12px 0; font-size: 18px; font-weight: 600; color: #0f172a; line-height: 1.4;\">\n                3-Way Match Price & Quantity Discrepancy\n              </h2>\n\n              <p style=\"margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #334155;\">\n                Vendor invoice #INV-8831 from UltraTech Cement contains a 6.2% price variance compared to PO-2026-009. Payment hold has been applied pending resolution.\n              </p>\n\n              \n      <div style=\"margin: 20px 0; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 14px 16px;\">\n        <table style=\"width: 100%; border-collapse: collapse; font-size: 13px;\">\n          \n              <tr style=\"border-bottom: 1px solid #edf2f7;\">\n                <td style=\"padding: 6px 0; color: #64748b; font-weight: 500; width: 38%;\">Invoice Number</td>\n                <td style=\"padding: 6px 0; color: #0f172a; font-weight: 600;\">INV-8831</td>\n              </tr>\n            \n              <tr style=\"border-bottom: 1px solid #edf2f7;\">\n                <td style=\"padding: 6px 0; color: #64748b; font-weight: 500; width: 38%;\">Vendor</td>\n                <td style=\"padding: 6px 0; color: #0f172a; font-weight: 600;\">UltraTech Cement Ltd</td>\n              </tr>\n            \n              <tr style=\"border-bottom: 1px solid #edf2f7;\">\n                <td style=\"padding: 6px 0; color: #64748b; font-weight: 500; width: 38%;\">Po Number</td>\n                <td style=\"padding: 6px 0; color: #0f172a; font-weight: 600;\">PO-2026-009</td>\n              </tr>\n            \n              <tr style=\"border-bottom: 1px solid #edf2f7;\">\n                <td style=\"padding: 6px 0; color: #64748b; font-weight: 500; width: 38%;\">Billed Amount</td>\n                <td style=\"padding: 6px 0; color: #0f172a; font-weight: 600;\">₹ 4,45,000</td>\n              </tr>\n            \n              <tr style=\"border-bottom: 1px solid #edf2f7;\">\n                <td style=\"padding: 6px 0; color: #64748b; font-weight: 500; width: 38%;\">Expected Amount</td>\n                <td style=\"padding: 6px 0; color: #0f172a; font-weight: 600;\">₹ 4,19,000</td>\n              </tr>\n            \n              <tr style=\"border-bottom: 1px solid #edf2f7;\">\n                <td style=\"padding: 6px 0; color: #64748b; font-weight: 500; width: 38%;\">Variance</td>\n                <td style=\"padding: 6px 0; color: #0f172a; font-weight: 600;\">+ ₹ 26,000 (+6.2%)</td>\n              </tr>\n            \n        </table>\n      </div>\n    \n\n              <!-- Call to Action Button -->\n              <div style=\"margin: 28px 0 16px 0; text-align: left;\">\n                <a href=\"http://localhost:5173/finance\" style=\"display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 24px; border-radius: 6px; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);\">\n                  Resolve Discrepancy &rarr;\n                </a>\n              </div>\n\n              <p style=\"margin: 20px 0 0 0; font-size: 12px; color: #64748b; line-height: 1.5;\">\n                Or paste this link into your browser: <br/>\n                <a href=\"http://localhost:5173/finance\" style=\"color: #2563eb; word-break: break-all;\">http://localhost:5173/finance</a>\n              </p>\n            </td>\n          </tr>\n\n          <!-- Footer -->\n          <tr>\n            <td style=\"background-color: #f8fafc; padding: 20px 32px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;\">\n              <table width=\"100%\" cellspacing=\"0\" cellpadding=\"0\">\n                <tr>\n                  <td>\n                    <p style=\"margin: 0 0 4px 0; font-weight: 500; color: #475569;\">Kanak Turnkey Solutions ERP</p>\n                    <p style=\"margin: 0; color: #94a3b8;\">Automated Workflow Event Notification</p>\n                  </td>\n                  <td align=\"right\" style=\"vertical-align: top;\">\n                    <a href=\"http://localhost:5173/notifications\" style=\"color: #2563eb; text-decoration: none;\">Notification Settings</a>\n                  </td>\n                </tr>\n              </table>\n            </td>\n          </tr>\n\n        </table>\n      </td>\n    </tr>\n  </table>\n</body>\n</html>\n  ','{\"vendor\": \"UltraTech Cement Ltd\", \"poNumber\": \"PO-2026-009\", \"variance\": \"+ ₹ 26,000 (+6.2%)\", \"billedAmount\": \"₹ 4,45,000\", \"invoiceNumber\": \"INV-8831\", \"expectedAmount\": \"₹ 4,19,000\"}',NULL,'2026-10-23 04:42:17'),(5,'director@kanakturnkey.com','Ananya Rao',17,'instrument_expiring','[Critical Alert] Bank Guarantee BG-2024-991 Expires in 18 Days','delivered','Performance Bank Guarantee Expiring Soon: Performance Bank Guarantee BG-2024-991 of ₹ 25,00,000 with HDFC Bank expires on 10-Nov-2026. Please initiate extension or client release request immediately.','\n<!DOCTYPE html>\n<html>\n<head>\n  <meta charset=\"utf-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n  <title>Performance Bank Guarantee Expiring Soon</title>\n</head>\n<body style=\"margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;\">\n  <table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" style=\"background-color: #f1f5f9; padding: 32px 16px;\">\n    <tr>\n      <td align=\"center\">\n        <!-- Main Container -->\n        <table role=\"presentation\" width=\"100%\" style=\"max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); border: 1px solid #e2e8f0;\">\n          \n          <!-- Header -->\n          <tr>\n            <td style=\"background-color: #0f172a; padding: 24px 32px; border-bottom: 3px solid #3b82f6;\">\n              <table width=\"100%\" cellspacing=\"0\" cellpadding=\"0\">\n                <tr>\n                  <td>\n                    <h1 style=\"margin: 0; color: #ffffff; font-size: 20px; font-weight: 700; letter-spacing: -0.5px;\">\n                      KANAK <span style=\"color: #60a5fa; font-weight: 400;\">TURNKEY</span>\n                    </h1>\n                    <p style=\"margin: 4px 0 0 0; color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;\">\n                      Enterprise Construction Management\n                    </p>\n                  </td>\n                  <td align=\"right\">\n                    <span style=\"display: inline-block; background-color: #dc2626; color: #ffffff; font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.5px;\">\n                      Action Required / Alert\n                    </span>\n                  </td>\n                </tr>\n              </table>\n            </td>\n          </tr>\n\n          <!-- Body Content -->\n          <tr>\n            <td style=\"padding: 32px;\">\n              <p style=\"margin: 0 0 16px 0; font-size: 14px; color: #475569;\">Hello <strong>Ananya Rao</strong>,</p>\n              \n              <h2 style=\"margin: 0 0 12px 0; font-size: 18px; font-weight: 600; color: #0f172a; line-height: 1.4;\">\n                Performance Bank Guarantee Expiring Soon\n              </h2>\n\n              <p style=\"margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #334155;\">\n                Performance Bank Guarantee BG-2024-991 of ₹ 25,00,000 with HDFC Bank expires on 10-Nov-2026. Please initiate extension or client release request immediately.\n              </p>\n\n              \n      <div style=\"margin: 20px 0; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 14px 16px;\">\n        <table style=\"width: 100%; border-collapse: collapse; font-size: 13px;\">\n          \n              <tr style=\"border-bottom: 1px solid #edf2f7;\">\n                <td style=\"padding: 6px 0; color: #64748b; font-weight: 500; width: 38%;\">Instrument Type</td>\n                <td style=\"padding: 6px 0; color: #0f172a; font-weight: 600;\">Performance Bank Guarantee</td>\n              </tr>\n            \n              <tr style=\"border-bottom: 1px solid #edf2f7;\">\n                <td style=\"padding: 6px 0; color: #64748b; font-weight: 500; width: 38%;\">Bank Name</td>\n                <td style=\"padding: 6px 0; color: #0f172a; font-weight: 600;\">HDFC Bank Ltd</td>\n              </tr>\n            \n              <tr style=\"border-bottom: 1px solid #edf2f7;\">\n                <td style=\"padding: 6px 0; color: #64748b; font-weight: 500; width: 38%;\">Instrument Number</td>\n                <td style=\"padding: 6px 0; color: #0f172a; font-weight: 600;\">BG-2024-991</td>\n              </tr>\n            \n              <tr style=\"border-bottom: 1px solid #edf2f7;\">\n                <td style=\"padding: 6px 0; color: #64748b; font-weight: 500; width: 38%;\">Amount</td>\n                <td style=\"padding: 6px 0; color: #0f172a; font-weight: 600;\">₹ 25,00,000</td>\n              </tr>\n            \n              <tr style=\"border-bottom: 1px solid #edf2f7;\">\n                <td style=\"padding: 6px 0; color: #64748b; font-weight: 500; width: 38%;\">Days Remaining</td>\n                <td style=\"padding: 6px 0; color: #0f172a; font-weight: 600;\">18 Days</td>\n              </tr>\n            \n              <tr style=\"border-bottom: 1px solid #edf2f7;\">\n                <td style=\"padding: 6px 0; color: #64748b; font-weight: 500; width: 38%;\">Expiry Date</td>\n                <td style=\"padding: 6px 0; color: #0f172a; font-weight: 600;\">10-Nov-2026</td>\n              </tr>\n            \n        </table>\n      </div>\n    \n\n              <!-- Call to Action Button -->\n              <div style=\"margin: 28px 0 16px 0; text-align: left;\">\n                <a href=\"http://localhost:5173/finance\" style=\"display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 24px; border-radius: 6px; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);\">\n                  Manage Financial Instruments &rarr;\n                </a>\n              </div>\n\n              <p style=\"margin: 20px 0 0 0; font-size: 12px; color: #64748b; line-height: 1.5;\">\n                Or paste this link into your browser: <br/>\n                <a href=\"http://localhost:5173/finance\" style=\"color: #2563eb; word-break: break-all;\">http://localhost:5173/finance</a>\n              </p>\n            </td>\n          </tr>\n\n          <!-- Footer -->\n          <tr>\n            <td style=\"background-color: #f8fafc; padding: 20px 32px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;\">\n              <table width=\"100%\" cellspacing=\"0\" cellpadding=\"0\">\n                <tr>\n                  <td>\n                    <p style=\"margin: 0 0 4px 0; font-weight: 500; color: #475569;\">Kanak Turnkey Solutions ERP</p>\n                    <p style=\"margin: 0; color: #94a3b8;\">Automated Workflow Event Notification</p>\n                  </td>\n                  <td align=\"right\" style=\"vertical-align: top;\">\n                    <a href=\"http://localhost:5173/notifications\" style=\"color: #2563eb; text-decoration: none;\">Notification Settings</a>\n                  </td>\n                </tr>\n              </table>\n            </td>\n          </tr>\n\n        </table>\n      </td>\n    </tr>\n  </table>\n</body>\n</html>\n  ','{\"amount\": \"₹ 25,00,000\", \"bankName\": \"HDFC Bank Ltd\", \"expiryDate\": \"10-Nov-2026\", \"daysRemaining\": \"18 Days\", \"instrumentType\": \"Performance Bank Guarantee\", \"instrumentNumber\": \"BG-2024-991\"}',NULL,'2026-10-23 04:42:18'),(6,'mailapallihari3@gmail.com','Ananya Rao',17,'ra_bill_submitted','[Action Required] RA Bill #RA-2026-004 Submitted for Client Certification','delivered','RA Bill #RA-2026-004 Submitted: Running Account Bill #RA-2026-004 for project \'Commercial Tower B\' has been submitted for certification. Please review the enclosed itemized measurement breakdown and certified quantities.','\n<!DOCTYPE html>\n<html>\n<head>\n  <meta charset=\"utf-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n  <title>RA Bill #RA-2026-004 Submitted</title>\n</head>\n<body style=\"margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;\">\n  <table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" style=\"background-color: #f1f5f9; padding: 32px 16px;\">\n    <tr>\n      <td align=\"center\">\n        <!-- Main Container -->\n        <table role=\"presentation\" width=\"100%\" style=\"max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); border: 1px solid #e2e8f0;\">\n          \n          <!-- Header -->\n          <tr>\n            <td style=\"background-color: #0f172a; padding: 24px 32px; border-bottom: 3px solid #3b82f6;\">\n              <table width=\"100%\" cellspacing=\"0\" cellpadding=\"0\">\n                <tr>\n                  <td>\n                    <h1 style=\"margin: 0; color: #ffffff; font-size: 20px; font-weight: 700; letter-spacing: -0.5px;\">\n                      KANAK <span style=\"color: #60a5fa; font-weight: 400;\">TURNKEY</span>\n                    </h1>\n                    <p style=\"margin: 4px 0 0 0; color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;\">\n                      Enterprise Construction Management\n                    </p>\n                  </td>\n                  <td align=\"right\">\n                    <span style=\"display: inline-block; background-color: #d97706; color: #ffffff; font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.5px;\">\n                      Review Needed\n                    </span>\n                  </td>\n                </tr>\n              </table>\n            </td>\n          </tr>\n\n          <!-- Body Content -->\n          <tr>\n            <td style=\"padding: 32px;\">\n              <p style=\"margin: 0 0 16px 0; font-size: 14px; color: #475569;\">Hello <strong>Ananya Rao</strong>,</p>\n              \n              <h2 style=\"margin: 0 0 12px 0; font-size: 18px; font-weight: 600; color: #0f172a; line-height: 1.4;\">\n                RA Bill #RA-2026-004 Submitted\n              </h2>\n\n              <p style=\"margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #334155;\">\n                Running Account Bill #RA-2026-004 for project \'Commercial Tower B\' has been submitted for certification. Please review the enclosed itemized measurement breakdown and certified quantities.\n              </p>\n\n              \n      <div style=\"margin: 20px 0; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 14px 16px;\">\n        <table style=\"width: 100%; border-collapse: collapse; font-size: 13px;\">\n          \n              <tr style=\"border-bottom: 1px solid #edf2f7;\">\n                <td style=\"padding: 6px 0; color: #64748b; font-weight: 500; width: 38%;\">Project</td>\n                <td style=\"padding: 6px 0; color: #0f172a; font-weight: 600;\">Commercial Tower B</td>\n              </tr>\n            \n              <tr style=\"border-bottom: 1px solid #edf2f7;\">\n                <td style=\"padding: 6px 0; color: #64748b; font-weight: 500; width: 38%;\">Bill Number</td>\n                <td style=\"padding: 6px 0; color: #0f172a; font-weight: 600;\">RA-2026-004</td>\n              </tr>\n            \n              <tr style=\"border-bottom: 1px solid #edf2f7;\">\n                <td style=\"padding: 6px 0; color: #64748b; font-weight: 500; width: 38%;\">Gross Amount</td>\n                <td style=\"padding: 6px 0; color: #0f172a; font-weight: 600;\">₹ 14,85,000</td>\n              </tr>\n            \n              <tr style=\"border-bottom: 1px solid #edf2f7;\">\n                <td style=\"padding: 6px 0; color: #64748b; font-weight: 500; width: 38%;\">Net Payable</td>\n                <td style=\"padding: 6px 0; color: #0f172a; font-weight: 600;\">₹ 13,36,500</td>\n              </tr>\n            \n              <tr style=\"border-bottom: 1px solid #edf2f7;\">\n                <td style=\"padding: 6px 0; color: #64748b; font-weight: 500; width: 38%;\">Submission Date</td>\n                <td style=\"padding: 6px 0; color: #0f172a; font-weight: 600;\">2026-10-23</td>\n              </tr>\n            \n              <tr style=\"border-bottom: 1px solid #edf2f7;\">\n                <td style=\"padding: 6px 0; color: #64748b; font-weight: 500; width: 38%;\">Submitted By</td>\n                <td style=\"padding: 6px 0; color: #0f172a; font-weight: 600;\">Rajesh Kumar (Project Manager)</td>\n              </tr>\n            \n        </table>\n      </div>\n    \n\n              <!-- Call to Action Button -->\n              <div style=\"margin: 28px 0 16px 0; text-align: left;\">\n                <a href=\"http://localhost:5173/ra-bills\" style=\"display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 24px; border-radius: 6px; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);\">\n                  Review RA Bill &rarr;\n                </a>\n              </div>\n\n              <p style=\"margin: 20px 0 0 0; font-size: 12px; color: #64748b; line-height: 1.5;\">\n                Or paste this link into your browser: <br/>\n                <a href=\"http://localhost:5173/ra-bills\" style=\"color: #2563eb; word-break: break-all;\">http://localhost:5173/ra-bills</a>\n              </p>\n            </td>\n          </tr>\n\n          <!-- Footer -->\n          <tr>\n            <td style=\"background-color: #f8fafc; padding: 20px 32px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;\">\n              <table width=\"100%\" cellspacing=\"0\" cellpadding=\"0\">\n                <tr>\n                  <td>\n                    <p style=\"margin: 0 0 4px 0; font-weight: 500; color: #475569;\">Kanak Turnkey Solutions ERP</p>\n                    <p style=\"margin: 0; color: #94a3b8;\">Automated Workflow Event Notification</p>\n                  </td>\n                  <td align=\"right\" style=\"vertical-align: top;\">\n                    <a href=\"http://localhost:5173/notifications\" style=\"color: #2563eb; text-decoration: none;\">Notification Settings</a>\n                  </td>\n                </tr>\n              </table>\n            </td>\n          </tr>\n\n        </table>\n      </td>\n    </tr>\n  </table>\n</body>\n</html>\n  ','{\"project\": \"Commercial Tower B\", \"billNumber\": \"RA-2026-004\", \"netPayable\": \"₹ 13,36,500\", \"grossAmount\": \"₹ 14,85,000\", \"submittedBy\": \"Rajesh Kumar (Project Manager)\", \"submissionDate\": \"2026-10-23\"}',NULL,'2026-10-26 02:45:10');

--
-- Table structure for table `expenses`
--

DROP TABLE IF EXISTS `expenses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `expenses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(14,2) NOT NULL,
  `category` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expense_date` date NOT NULL,
  `receipt_url` text COLLATE utf8mb4_unicode_ci,
  `status` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `submitted_by_id` int DEFAULT NULL,
  `approved_by_id` int DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `updated_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `expenses`
--

INSERT INTO `expenses` VALUES (1,1,'Site office cabin rental — April',85000.00,'equipment','2026-04-01',NULL,'approved',3,2,'2026-08-05 06:44:24','2026-08-05 06:44:24'),(2,1,'Steel rebar advance',1240000.00,'materials','2026-04-08',NULL,'approved',5,2,'2026-08-05 06:44:24','2026-08-05 06:44:24'),(3,2,'Crane operator — week 14',320000.00,'labor','2026-04-12',NULL,'submitted',3,NULL,'2026-08-05 06:44:24','2026-08-05 06:44:24'),(4,2,'HVAC subcontractor advance',2800000.00,'subcontractor','2026-04-15',NULL,'draft',5,NULL,'2026-08-05 06:44:24','2026-08-05 06:44:24'),(5,6,'Steel reinforcement mesh delivery — Basement level',98000.00,'materials','2026-07-04',NULL,'approved',1,NULL,'2026-08-06 06:56:01','2026-08-06 06:56:01'),(10,1,'PO-2026-0002: Structural Steel (I-Beams & H-Beams) from Apex Steel & Cement Co.',1298000.00,'materials','2026-09-17',NULL,'approved',NULL,NULL,'2026-09-17 09:02:20','2026-09-17 09:02:20'),(13,6,'On-site worker meal arrangements during cement and TMT bar delivery — Floor 4',2000.00,'food','2026-09-22','/uploads/EM3_Paperwise_Answer_Key-1790058921735-244840473.pdf','draft',17,NULL,'2026-09-22 06:35:31','2026-09-22 06:35:31'),(14,1,'food purpose',1000.00,'food','2026-09-22',NULL,'approved',17,NULL,'2026-09-22 07:15:31','2026-09-22 07:15:31'),(15,1,'food pupose',3000.00,'food','2026-09-20','/uploads/hotel bill--001-1790062102314-901965434.pdf','draft',17,NULL,'2026-09-22 07:28:27','2026-09-22 07:28:27'),(19,14,'DG Generator & Boom Pump Diesel for 18-hr Continuous Foundation Pour',45000.00,'fuel','2026-09-20','https://documents.kanakturnkey.com/receipts/Diesel-Batch44-0014.pdf','approved',17,17,'2026-09-30 07:43:30','2026-10-05 23:48:56'),(20,14,'NABL Third-Party Lab Testing: Concrete Cube Compression (28-day) & Rebar Ductility Test',18500.00,'equipment','2026-09-21','https://documents.kanakturnkey.com/reports/CubeTest-IS456-Batch44-0014.pdf','approved',17,17,'2026-09-30 07:43:30','2026-10-05 23:48:56'),(21,1,'DG Generator & Boom Pump Diesel for 18-hr Continuous Foundation Pour',45000.00,'fuel','2026-09-20','https://documents.kanakturnkey.com/receipts/Diesel-Batch44-0001.pdf','approved',17,17,'2026-10-05 06:12:57','2026-10-05 06:12:57'),(22,1,'NABL Third-Party Lab Testing: Concrete Cube Compression (28-day) & Rebar Ductility Test',18500.00,'equipment','2026-09-21','https://documents.kanakturnkey.com/reports/CubeTest-IS456-Batch44-0001.pdf','approved',17,17,'2026-10-05 06:12:57','2026-10-05 06:12:57');

--
-- Table structure for table `financial_audit_logs`
--

DROP TABLE IF EXISTS `financial_audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `financial_audit_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `workflow_type` varchar(16) COLLATE utf8mb4_unicode_ci NOT NULL,
  `entity_type` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `entity_id` int NOT NULL,
  `action` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `previous_status` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `new_status` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` int NOT NULL,
  `user_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `comments` text COLLATE utf8mb4_unicode_ci,
  `metadata` json DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=41 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `financial_audit_logs`
--

INSERT INTO `financial_audit_logs` VALUES (1,'AP','vendor_invoice',1,'three_way_match','matched','invoice_matched',17,'Ananya Rao','3-way match passed — PO, Measurement, and Invoice verified','\"{\\\"poMatch\\\":true,\\\"measurementMatch\\\":false,\\\"quantityRateValid\\\":false,\\\"discrepancyCount\\\":0}\"','2026-09-24 08:22:48'),(2,'AR','client_ra_bill',9,'PM_APPROVED','submitted','pm_approved',17,'Ananya Rao','Site measurements and NABL cube test strengths verified against IS 456.','\"{\\\"projectId\\\":12,\\\"billNumber\\\":\\\"RA-20260923-0006\\\",\\\"grossAmount\\\":1090000,\\\"netAmount\\\":1209900}\"','2026-09-22 04:30:00'),(3,'AR','client_ra_bill',9,'PAYMENT_CERTIFIED','pm_approved','payment_certified',17,'Rajesh Sharma (Client Architect)','Payment Certificate #PC-20260923-0006 issued. Certified for 100% footing completion.','\"{\\\"projectId\\\":12,\\\"certificateNumber\\\":\\\"PC-20260923-0006\\\",\\\"certifiedAmount\\\":1209900}\"','2026-09-22 09:00:00'),(4,'AR','client_invoice',10,'INVOICE_GENERATED',NULL,'sent',17,'Ananya Rao','Tax Invoice #INV-20260923-0007 dispatched with statutory GST & TDS notes.','\"{\\\"projectId\\\":12,\\\"invoiceNumber\\\":\\\"INV-20260923-0007\\\",\\\"netAmount\\\":1209900,\\\"gstAmount\\\":196200}\"','2026-09-23 03:30:00'),(5,'AR','client_payment',10,'PAYMENT_RECORDED','payment_pending','paid',17,'Ananya Rao','Client RTGS remittance credited via HDFC Bank. UTR: RTGS-HDFC-20260924-884102.','\"{\\\"projectId\\\":12,\\\"invoiceNumber\\\":\\\"INV-20260923-0007\\\",\\\"amount\\\":1209900,\\\"utr\\\":\\\"RTGS-HDFC-20260924-884102\\\"}\"','2026-09-24 05:30:00'),(6,'AP','vendor_invoice',5,'PM_APPROVED','invoice_matched','pm_approved',17,'Ananya Rao','Field verification complete. Structural steel and cement accepted without damage.','\"{\\\"projectId\\\":12,\\\"invoiceNumber\\\":\\\"VINV-20260923-0012\\\"}\"','2026-09-22 09:30:00'),(7,'AP','vendor_invoice',5,'FINANCE_VERIFIED','pm_approved','finance_verified',17,'Ananya Rao','Tax audit complete: 18% GST verified on portal, 2% TDS u/s 194C deducted.','\"{\\\"projectId\\\":12,\\\"invoiceNumber\\\":\\\"VINV-20260923-0012\\\",\\\"tdsAmount\\\":19480}\"','2026-09-22 11:30:00'),(8,'AP','vendor_payment',1,'PAYMENT_RELEASED','scheduled','paid',17,'Ananya Rao','NEFT/RTGS batch disbursement released. UTR: UTR-SBI-20260923-994102.','\"{\\\"projectId\\\":12,\\\"paymentNumber\\\":\\\"VPAY-20260923-0012\\\",\\\"paymentAmount\\\":1149320,\\\"utr\\\":\\\"UTR-SBI-20260923-994102\\\"}\"','2026-09-23 04:30:00'),(9,'AP','site_expense',16,'EXPENSE_APPROVED','submitted','approved',17,'Ananya Rao','Boom pump diesel logs cross-verified against pour cubic meter records.','\"{\\\"projectId\\\":12,\\\"amount\\\":45000,\\\"category\\\":\\\"fuel\\\"}\"','2026-09-20 12:30:00'),(10,'AP','site_expense',18,'EXPENSE_CREATED',NULL,'submitted',17,'Ananya Rao','Site direct expense logged: Site Welding Electrodes and Oxygen Gas Cylinders','\"{\\\"projectId\\\":12,\\\"amount\\\":8400,\\\"category\\\":\\\"materials\\\",\\\"description\\\":\\\"Site Welding Electrodes and Oxygen Gas Cylinders\\\",\\\"expenseDate\\\":\\\"2026-09-24T00:00:00.000Z\\\"}\"','2026-09-24 11:35:18'),(11,'AP','site_expense',18,'EXPENSE_APPROVED','submitted','approved',17,'Ananya Rao','Site expense status updated from submitted to approved','\"{\\\"projectId\\\":12,\\\"amount\\\":8400,\\\"category\\\":\\\"materials\\\",\\\"description\\\":\\\"Site Welding Electrodes and Oxygen Gas Cylinders\\\",\\\"expenseDate\\\":\\\"2026-09-24T00:00:00.000Z\\\"}\"','2026-09-24 11:35:19'),(12,'AR','client_ra_bill',11,'RA_BILL_CREATED_FROM_MILESTONE','milestone_ready','draft',17,'Ananya Rao','Raised Client RA Bill RAB-CLI-012-01 directly from Milestone M1 (Mobilization Advance & Site Possession Handover) for ₹85,00,000. Net Payable: ₹94,35,000.','{\"gstAmount\": 1530000, \"tdsAmount\": 170000, \"grossAmount\": 8500000, \"milestoneId\": 1, \"billingPercent\": \"10.00\", \"milestoneNumber\": \"M1\", \"retentionAmount\": 425000, \"netPayableAmount\": 9435000}','2026-09-24 12:22:09'),(13,'AR','client_contract',3,'LEAD_CONVERTED_HANDOVER','lead_won','contract_active',17,'Ananya Rao','Handover automation completed. Auto-generated Client Contract CNT-CLI-2026-0013 (₹5,50,00,000), 6 baseline budget packages, and 6-stage milestone billing schedule.','{\"budget\": 55000000, \"abgAmount\": 5500000, \"dlpMonths\": 12, \"projectId\": 13, \"contractId\": 3, \"abgRequired\": true, \"advancePercent\": 10, \"contractNumber\": \"CNT-CLI-2026-0013\", \"paymentTermsDays\": 30, \"retentionPercent\": 5}','2026-09-24 12:45:44'),(14,'AR','client_contract',4,'LEAD_CONVERTED_HANDOVER','lead_won','contract_active',17,'Ananya Rao','Handover automation completed. Auto-generated Client Contract CNT-CLI-2026-0014 (₹5,50,00,000), 6 baseline budget packages, and 6-stage milestone billing schedule.','{\"budget\": 55000000, \"abgAmount\": 5500000, \"dlpMonths\": 12, \"projectId\": 14, \"contractId\": 4, \"abgRequired\": true, \"advancePercent\": 10, \"contractNumber\": \"CNT-CLI-2026-0014\", \"paymentTermsDays\": 30, \"retentionPercent\": 5}','2026-09-24 12:48:26'),(15,'AR','client_ra_bill',12,'PM_APPROVED','submitted','pm_approved',17,'Ananya Rao','Site measurements and NABL cube test strengths verified against IS 456.','\"{\\\"projectId\\\":14,\\\"billNumber\\\":\\\"RA-20260923-0014\\\",\\\"grossAmount\\\":1090000,\\\"netAmount\\\":1209900}\"','2026-09-22 04:30:00'),(16,'AR','client_ra_bill',12,'PAYMENT_CERTIFIED','pm_approved','payment_certified',17,'Rajesh Sharma (Client Architect)','Payment Certificate #PC-20260923-0014 issued. Certified for 100% footing completion.','\"{\\\"projectId\\\":14,\\\"certificateNumber\\\":\\\"PC-20260923-0014\\\",\\\"certifiedAmount\\\":1209900}\"','2026-09-22 09:00:00'),(17,'AR','client_invoice',13,'INVOICE_GENERATED',NULL,'sent',17,'Ananya Rao','Tax Invoice #INV-20260923-0014 dispatched with statutory GST & TDS notes.','\"{\\\"projectId\\\":14,\\\"invoiceNumber\\\":\\\"INV-20260923-0014\\\",\\\"netAmount\\\":1209900,\\\"gstAmount\\\":196200}\"','2026-09-23 03:30:00'),(18,'AR','client_payment',13,'PAYMENT_RECORDED','payment_pending','paid',17,'Ananya Rao','Client RTGS remittance credited via HDFC Bank. UTR: RTGS-HDFC-20260924-0014.','\"{\\\"projectId\\\":14,\\\"invoiceNumber\\\":\\\"INV-20260923-0014\\\",\\\"amount\\\":1209900,\\\"utr\\\":\\\"RTGS-HDFC-20260924-0014\\\"}\"','2026-09-24 05:30:00'),(19,'AP','vendor_invoice',6,'THREE_WAY_MATCH','received','invoice_matched',17,'Ananya Rao','3-Way Match Passed: PO-20260923-0014 + Site GRN-20260923-0014 + Vendor Bill VINV-20260923-0014.','\"{\\\"projectId\\\":14,\\\"poMatched\\\":true,\\\"measurementMatched\\\":true,\\\"quantityRateValid\\\":true,\\\"discrepancyCount\\\":0}\"','2026-09-22 08:30:00'),(20,'AP','vendor_invoice',6,'PM_APPROVED','invoice_matched','pm_approved',17,'Ananya Rao','Field verification complete. Structural steel and cement accepted without damage.','\"{\\\"projectId\\\":14,\\\"invoiceNumber\\\":\\\"VINV-20260923-0014\\\"}\"','2026-09-22 09:30:00'),(21,'AP','vendor_invoice',6,'FINANCE_VERIFIED','pm_approved','finance_verified',17,'Ananya Rao','Tax audit complete: 18% GST verified on portal, 2% TDS u/s 194C deducted.','\"{\\\"projectId\\\":14,\\\"invoiceNumber\\\":\\\"VINV-20260923-0014\\\",\\\"tdsAmount\\\":19480}\"','2026-09-22 11:30:00'),(22,'AP','vendor_payment',2,'PAYMENT_RELEASED','scheduled','paid',17,'Ananya Rao','NEFT/RTGS batch disbursement released. UTR: UTR-SBI-20260923-0014.','\"{\\\"projectId\\\":14,\\\"paymentNumber\\\":\\\"VPAY-20260923-0014\\\",\\\"paymentAmount\\\":1149320,\\\"utr\\\":\\\"UTR-SBI-20260923-0014\\\"}\"','2026-09-23 04:30:00'),(23,'AP','site_expense',19,'EXPENSE_APPROVED','submitted','approved',17,'Ananya Rao','Boom pump diesel logs cross-verified against pour cubic meter records.','\"{\\\"projectId\\\":14,\\\"amount\\\":45000,\\\"category\\\":\\\"fuel\\\"}\"','2026-09-20 12:30:00'),(24,'AP','site_expense',20,'EXPENSE_APPROVED','submitted','approved',17,'Ananya Rao','NABL 28-day cube compression strength report passed (M35 achieved). Testing fee approved.','\"{\\\"projectId\\\":14,\\\"amount\\\":18500,\\\"category\\\":\\\"equipment\\\"}\"','2026-09-21 10:30:00'),(25,'AR','client_ra_bill',1,'PM_APPROVED','submitted','pm_approved',17,'Ananya Rao','Site measurements and NABL cube test strengths verified against IS 456.','\"{\\\"projectId\\\":1,\\\"billNumber\\\":\\\"RA-SEN-001\\\",\\\"grossAmount\\\":1090000,\\\"netAmount\\\":1209900}\"','2026-09-22 04:30:00'),(26,'AR','client_ra_bill',1,'PAYMENT_CERTIFIED','pm_approved','payment_certified',17,'Rajesh Sharma (Client Architect)','Payment Certificate #PC-20260923-0001 issued. Certified for 100% footing completion.','\"{\\\"projectId\\\":1,\\\"certificateNumber\\\":\\\"PC-20260923-0001\\\",\\\"certifiedAmount\\\":1209900}\"','2026-09-22 09:00:00'),(27,'AR','client_invoice',1,'INVOICE_GENERATED',NULL,'sent',17,'Ananya Rao','Tax Invoice #INV-2026-0042 dispatched with statutory GST & TDS notes.','\"{\\\"projectId\\\":1,\\\"invoiceNumber\\\":\\\"INV-2026-0042\\\",\\\"netAmount\\\":1209900,\\\"gstAmount\\\":196200}\"','2026-09-23 03:30:00'),(28,'AR','client_payment',1,'PAYMENT_RECORDED','payment_pending','paid',17,'Ananya Rao','Client RTGS remittance credited via HDFC Bank. UTR: RTGS-HDFC-20260924-0001.','\"{\\\"projectId\\\":1,\\\"invoiceNumber\\\":\\\"INV-2026-0042\\\",\\\"amount\\\":1209900,\\\"utr\\\":\\\"RTGS-HDFC-20260924-0001\\\"}\"','2026-09-24 05:30:00'),(29,'AP','vendor_invoice',2,'THREE_WAY_MATCH','received','invoice_matched',17,'Ananya Rao','3-Way Match Passed: PO-2026-0001 + Site GRN-2026-0001 + Vendor Bill POL-INV-2026-204.','\"{\\\"projectId\\\":1,\\\"poMatched\\\":true,\\\"measurementMatched\\\":true,\\\"quantityRateValid\\\":true,\\\"discrepancyCount\\\":0}\"','2026-09-22 08:30:00'),(30,'AP','vendor_invoice',2,'PM_APPROVED','invoice_matched','pm_approved',17,'Ananya Rao','Field verification complete. Structural steel and cement accepted without damage.','\"{\\\"projectId\\\":1,\\\"invoiceNumber\\\":\\\"POL-INV-2026-204\\\"}\"','2026-09-22 09:30:00'),(31,'AP','vendor_invoice',2,'FINANCE_VERIFIED','pm_approved','finance_verified',17,'Ananya Rao','Tax audit complete: 18% GST verified on portal, 2% TDS u/s 194C deducted.','\"{\\\"projectId\\\":1,\\\"invoiceNumber\\\":\\\"POL-INV-2026-204\\\",\\\"tdsAmount\\\":19480}\"','2026-09-22 11:30:00'),(32,'AP','vendor_payment',3,'PAYMENT_RELEASED','scheduled','paid',17,'Ananya Rao','NEFT/RTGS batch disbursement released. UTR: UTR-SBI-20260923-0001.','\"{\\\"projectId\\\":1,\\\"paymentNumber\\\":\\\"VPAY-20260923-0001\\\",\\\"paymentAmount\\\":1149320,\\\"utr\\\":\\\"UTR-SBI-20260923-0001\\\"}\"','2026-09-23 04:30:00'),(33,'AP','site_expense',1,'EXPENSE_APPROVED','submitted','approved',17,'Ananya Rao','Boom pump diesel logs cross-verified against pour cubic meter records.','\"{\\\"projectId\\\":1,\\\"amount\\\":45000,\\\"category\\\":\\\"fuel\\\"}\"','2026-09-20 12:30:00'),(34,'AP','site_expense',2,'EXPENSE_APPROVED','submitted','approved',17,'Ananya Rao','NABL 28-day cube compression strength report passed (M35 achieved). Testing fee approved.','\"{\\\"projectId\\\":1,\\\"amount\\\":18500,\\\"category\\\":\\\"equipment\\\"}\"','2026-09-21 10:30:00'),(35,'AR','client_contract',7,'LEAD_CONVERTED_HANDOVER','lead_won','contract_active',17,'Ananya Rao','Handover automation completed. Auto-generated Client Contract CNT-CLI-2026-0015 (₹4,50,00,000), 6 baseline budget packages, and 6-stage milestone billing schedule.','{\"budget\": 45000000, \"abgAmount\": 0, \"dlpMonths\": 12, \"projectId\": 15, \"contractId\": 7, \"abgRequired\": false, \"advancePercent\": 10, \"contractNumber\": \"CNT-CLI-2026-0015\", \"paymentTermsDays\": 30, \"retentionPercent\": 5}','2026-10-07 07:40:20'),(36,'AR','client_contract',8,'LEAD_CONVERTED_HANDOVER','lead_won','contract_active',17,'Ananya Rao','Handover automation completed. Auto-generated Client Contract CNT-CLI-2026-0016 (₹0), 6 baseline budget packages, and 6-stage milestone billing schedule.','{\"budget\": 0, \"abgAmount\": 0, \"dlpMonths\": 12, \"projectId\": 16, \"contractId\": 8, \"abgRequired\": false, \"advancePercent\": 10, \"contractNumber\": \"CNT-CLI-2026-0016\", \"paymentTermsDays\": 30, \"retentionPercent\": 5}','2026-10-07 07:41:10'),(37,'AR','client_contract',9,'LEAD_CONVERTED_HANDOVER','lead_won','contract_active',17,'Ananya Rao','Handover automation completed. Auto-generated Client Contract CNT-CLI-2026-0017 (₹4,50,00,000), 6 baseline budget packages, and 6-stage milestone billing schedule.','{\"budget\": 45000000, \"abgAmount\": 0, \"dlpMonths\": 12, \"projectId\": 17, \"contractId\": 9, \"abgRequired\": false, \"advancePercent\": 10, \"contractNumber\": \"CNT-CLI-2026-0017\", \"paymentTermsDays\": 30, \"retentionPercent\": 5}','2026-10-07 07:41:30'),(38,'AR','client_contract',10,'LEAD_CONVERTED_HANDOVER','lead_won','contract_active',17,'Ananya Rao','Handover automation completed. Auto-generated Client Contract CNT-CLI-2026-0018 (₹10,00,000), 6 baseline budget packages, and 6-stage milestone billing schedule.','{\"budget\": 1000000, \"abgAmount\": 0, \"dlpMonths\": 12, \"projectId\": 18, \"contractId\": 10, \"abgRequired\": false, \"advancePercent\": 10, \"contractNumber\": \"CNT-CLI-2026-0018\", \"paymentTermsDays\": 30, \"retentionPercent\": 5}','2026-10-07 08:43:27'),(39,'AR','client_contract',11,'LEAD_CONVERTED_HANDOVER','lead_won','contract_active',17,'Ananya Rao','Handover automation completed. Auto-generated Client Contract CNT-CLI-2026-0019 (₹8,40,00,000), 6 baseline budget packages, and 6-stage milestone billing schedule.','{\"budget\": 84000000, \"abgAmount\": 0, \"dlpMonths\": 12, \"projectId\": 19, \"contractId\": 11, \"abgRequired\": false, \"advancePercent\": 10, \"contractNumber\": \"CNT-CLI-2026-0019\", \"paymentTermsDays\": 30, \"retentionPercent\": 5}','2026-10-07 08:48:01'),(40,'AR','client_ra_bill',13,'RA_BILL_CREATED_FROM_MILESTONE','milestone_ready','draft',17,'Ananya Rao','Raised Client RA Bill RAB-CLI-019-01 directly from Milestone M1 (Mobilization Advance & Site Possession Handover) for ₹84,00,000. Net Payable: ₹93,24,000.','{\"gstAmount\": 1512000, \"tdsAmount\": 168000, \"grossAmount\": 8400000, \"milestoneId\": 73, \"billingPercent\": \"10.00\", \"milestoneNumber\": \"M1\", \"retentionAmount\": 420000, \"netPayableAmount\": 9324000}','2026-10-22 06:17:43');

--
-- Table structure for table `financial_instruments`
--

DROP TABLE IF EXISTS `financial_instruments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `financial_instruments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `project_id` int DEFAULT NULL,
  `instrument_type` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `bg_sub_type` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `amount` decimal(14,2) NOT NULL,
  `issue_date` date DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  `release_date` date DEFAULT NULL,
  `bank_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reference_number` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `retention_percent` decimal(6,2) DEFAULT NULL,
  `status` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_by_id` int DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `updated_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `financial_instruments`
--

INSERT INTO `financial_instruments` VALUES (1,2,'emd',NULL,940000.00,'2025-08-15','2026-05-15','2026-09-15','HDFC Bank','EMD-CTY-2025-009',NULL,'released','Auto-release on project closure.',4,'2026-08-05 06:44:24','2026-08-05 06:44:24'),(2,1,'bank_guarantee','performance',3100000.00,'2026-01-10','2027-04-10',NULL,'ICICI Bank','BG-SEN-2026-PG-002',NULL,'active','5% performance BG, valid through DLP.',4,'2026-08-05 06:44:24','2026-08-05 06:44:24'),(3,14,'bank_guarantee','performance',4500000.00,'2026-01-20','2026-11-04',NULL,'ICICI Bank','PBG-SGH-2026-004',NULL,'active','Against 10% mobilization advance.',4,'2026-08-05 06:44:24','2026-08-05 06:44:24'),(4,4,'retention_dlp',NULL,1900000.00,'2026-03-15','2027-03-15',NULL,NULL,NULL,5.00,'active','Retention held for 12-month DLP.',4,'2026-08-05 06:44:24','2026-08-05 06:44:24'),(5,4,'bank_guarantee','performance',1900000.00,'2025-04-01','2026-04-30',NULL,'Axis Bank','BG-NBK-2025-PG-001',NULL,'expired','Released after final acceptance.',4,'2026-08-05 06:44:24','2026-08-05 06:44:24'),(11,1,'bank_guarantee','advance_payment',2800000.00,'2026-05-16','2026-11-20',NULL,'HDFC Bank','ABG-STP-2026-008',10.00,'active','Mobilization advance BG expiring within 30 days. Renewal request initiated.\n[Renewal 2026-10-23]: Extended to 2026-11-20. Endorsement Ref: Bank Confirmation. Renewal verified',NULL,'2026-10-23 09:26:25','2026-10-23 04:08:38'),(12,1,'bank_guarantee','performance',1200000.00,'2026-01-01','2026-11-05','2026-10-23','SBI','PBG-SBI-TEST-RELEASE',NULL,'released','Test instrument for release verification\n[Released 2026-10-23]: Discharged with client certificate',17,'2026-10-23 09:38:52','2026-10-23 04:08:53');

--
-- Table structure for table `invoice_payments`
--

DROP TABLE IF EXISTS `invoice_payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `invoice_payments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `invoice_id` int NOT NULL,
  `ra_bill_id` int DEFAULT NULL,
  `payment_number` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `payment_date` date NOT NULL,
  `payment_amount` decimal(14,2) NOT NULL,
  `payment_mode` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `bank_reference` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `transaction_id` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `remarks` text COLLATE utf8mb4_unicode_ci,
  `document_url` text COLLATE utf8mb4_unicode_ci,
  `recorded_by_id` int NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `updated_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `invoice_payments`
--

INSERT INTO `invoice_payments` VALUES (11,1,1,'PAY-20260923-0001-2131','2026-09-23',1209900.00,'neft_rtgs','HDFC Bank Current A/c #928374','UTR-HDFC-20260923-0001','Full settlement received against Milestone 1 RA Bill.',NULL,17,'2026-10-05 06:12:57','2026-10-05 06:12:57'),(13,13,12,'PAY-20260923-0014','2026-09-23',1209900.00,'neft_rtgs','HDFC Bank Current A/c #928374','UTR-HDFC-20260923-0014','Full settlement received against Milestone 1 RA Bill.',NULL,17,'2026-10-06 05:18:55','2026-10-06 05:18:55');

--
-- Table structure for table `invoices`
--

DROP TABLE IF EXISTS `invoices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `invoices` (
  `id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `invoice_number` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `client_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(14,2) NOT NULL,
  `invoice_date` date NOT NULL,
  `due_date` date NOT NULL,
  `payment_date` date DEFAULT NULL,
  `reconciled` tinyint(1) NOT NULL DEFAULT '0',
  `status` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `updated_at` timestamp NOT NULL DEFAULT (now()),
  `document_url` text COLLATE utf8mb4_unicode_ci,
  `ra_bill_id` int DEFAULT NULL,
  `vendor_id` int DEFAULT NULL,
  `contract_id` int DEFAULT NULL,
  `gross_amount` decimal(14,2) DEFAULT NULL,
  `deductions` decimal(14,2) DEFAULT '0.00',
  `tax_amount` decimal(14,2) DEFAULT '0.00',
  `net_amount` decimal(14,2) DEFAULT NULL,
  `payment_terms` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sent_at` timestamp NULL DEFAULT NULL,
  `sent_by_id` int DEFAULT NULL,
  `recipient_email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `recipient_notes` text COLLATE utf8mb4_unicode_ci,
  `total_paid_amount` decimal(14,2) NOT NULL DEFAULT '0.00',
  `outstanding_amount` decimal(14,2) NOT NULL DEFAULT '0.00',
  `reconciliation_status` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `reconciled_by_id` int DEFAULT NULL,
  `reconciled_at` timestamp NULL DEFAULT NULL,
  `reconciliation_remarks` text COLLATE utf8mb4_unicode_ci,
  `billing_period` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bank_details` text COLLATE utf8mb4_unicode_ci,
  `delivery_status` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  PRIMARY KEY (`id`),
  KEY `idx_invoices_due` (`due_date`,`status`),
  KEY `idx_invoices_project` (`project_id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `invoices`
--

INSERT INTO `invoices` VALUES (1,1,'INV-2026-0042','Sentinel Realty',1209900.00,'2026-09-22','2026-10-22','2026-09-23',1,'closed','2026-08-05 06:44:24','2026-10-05 00:42:57',NULL,1,1,5,1090000.00,76300.00,196200.00,1209900.00,'Net 30 Days','2026-09-22 08:30:00',17,'accounts@bluewavehospitality.com','Please release payment against 1st certified RA bill for Foundation milestone.',1209900.00,0.00,'reconciled',17,'2026-09-23 06:00:00','Bank statement verified. Matched with HDFC Current Account #... in Tally ERP.',NULL,NULL,'pending'),(2,2,'INV-2026-0048','Citygate Developers',18000000.00,'2026-03-28','2026-04-27',NULL,0,'sent','2026-08-05 06:44:24','2026-08-05 06:44:24',NULL,NULL,NULL,NULL,NULL,0.00,0.00,NULL,NULL,NULL,NULL,NULL,NULL,0.00,0.00,'pending',NULL,NULL,NULL,NULL,NULL,'pending'),(3,2,'INV-2026-0031','Citygate Developers',9400000.00,'2026-02-10','2026-03-12',NULL,0,'overdue','2026-08-05 06:44:24','2026-08-05 06:44:24',NULL,NULL,NULL,NULL,NULL,0.00,0.00,NULL,NULL,NULL,NULL,NULL,NULL,0.00,0.00,'pending',NULL,NULL,NULL,NULL,NULL,'pending'),(8,1,'INV-20260921-0005','Sentinel Tech Park — Phase 2 Client',12000000.00,'2026-09-21','2026-10-21',NULL,0,'sent','2026-09-21 12:13:44','2026-09-21 12:13:44',NULL,NULL,NULL,NULL,NULL,0.00,0.00,NULL,NULL,NULL,NULL,NULL,NULL,0.00,0.00,'pending',NULL,NULL,NULL,NULL,NULL,'pending'),(9,2,'INV-20260922-0006','Citygate Residences Client',25000.00,'2026-09-22','2026-10-22',NULL,0,'sent','2026-09-22 08:06:21','2026-09-22 08:06:21',NULL,NULL,NULL,NULL,NULL,0.00,0.00,NULL,NULL,NULL,NULL,NULL,NULL,0.00,0.00,'pending',NULL,NULL,NULL,NULL,NULL,'pending'),(11,6,'INV-20260923-0008','Orion Business Hub — Tower B Client',10000.00,'2026-09-23','2026-10-23',NULL,0,'sent','2026-09-23 09:09:36','2026-09-23 09:09:36',NULL,NULL,NULL,NULL,NULL,0.00,0.00,NULL,NULL,NULL,NULL,NULL,NULL,0.00,0.00,'pending',NULL,NULL,NULL,NULL,NULL,'pending'),(13,14,'INV-20260923-0014','BlueWave Hospitality Pvt. Ltd',1209900.00,'2026-09-22','2026-10-22','2026-09-23',1,'closed','2026-09-30 07:43:30','2026-10-05 23:48:55',NULL,12,1,4,1090000.00,76300.00,196200.00,1209900.00,'Net 30 Days','2026-09-22 08:30:00',17,'accounts@bluewavehospitality.com','Please release payment against 1st certified RA bill for Foundation milestone.',1209900.00,0.00,'reconciled',17,'2026-09-23 06:00:00','Bank statement verified. Matched with HDFC Current Account #... in Tally ERP.',NULL,NULL,'pending'),(14,14,'INV-20260815-0010','BlueWave Hospitality Pvt. Ltd',3550000.00,'2026-08-10','2026-09-10',NULL,0,'payment_pending','2026-10-23 09:07:41','2026-10-23 09:07:41',NULL,NULL,NULL,NULL,3200000.00,0.00,350000.00,3550000.00,'Net 30 Days',NULL,NULL,NULL,NULL,0.00,3550000.00,'pending',NULL,NULL,NULL,NULL,NULL,'sent'),(15,17,'INV-20260720-0012','Horizon Resorts Pvt. Ltd',5200000.00,'2026-07-10','2026-08-10',NULL,0,'payment_pending','2026-10-23 09:07:41','2026-10-23 09:07:41',NULL,NULL,NULL,NULL,4700000.00,0.00,500000.00,5200000.00,'Net 30 Days',NULL,NULL,NULL,NULL,0.00,5200000.00,'pending',NULL,NULL,NULL,NULL,NULL,'sent');

--
-- Table structure for table `lead_activities`
--

DROP TABLE IF EXISTS `lead_activities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lead_activities` (
  `id` int NOT NULL AUTO_INCREMENT,
  `lead_id` int NOT NULL,
  `activity_type` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `created_by_id` int DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `updated_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lead_activities`
--

INSERT INTO `lead_activities` VALUES (1,1,'call','Discovery call with Mahesh','Walked through scope, timeline, and budget expectations. Decision-maker is the GM.',2,'2026-08-05 06:44:24','2026-08-05 06:44:24'),(2,1,'email','Sent capability deck','Shared past hospitality projects portfolio.',2,'2026-08-05 06:44:24','2026-08-05 06:44:24'),(3,2,'meeting','Walkthrough at Verde HQ','Toured both floors, took preliminary measurements.',3,'2026-08-05 06:44:24','2026-08-05 06:44:24'),(4,4,'note','Negotiation round 2 completed','Counter-offer at 5.5% discount sent.',2,'2026-08-05 06:44:24','2026-08-05 06:44:24'),(5,1,'call','Discovery call with Mahesh','Walked through scope, timeline, and budget expectations. Decision-maker is the GM.',18,'2026-08-11 08:10:43','2026-08-11 08:10:43'),(6,1,'email','Sent capability deck','Shared past hospitality projects portfolio.',18,'2026-08-11 08:10:43','2026-08-11 08:10:43'),(7,2,'meeting','Walkthrough at Verde HQ','Toured both floors, took preliminary measurements.',19,'2026-08-11 08:10:43','2026-08-11 08:10:43'),(8,4,'note','Negotiation round 2 completed','Counter-offer at 5.5% discount sent.',18,'2026-08-11 08:10:43','2026-08-11 08:10:43'),(12,14,'call','Initial Technical & Commercial Discovery Call','Detailed 60-minute briefing with Dr. Oberoi and Chief Infrastructure Officer. Covered cleanroom ISO Class 7 requirements, 120 TR HVAC plant, and 11kV substation specs.',18,'2026-09-24 12:39:08','2026-09-24 12:39:08'),(13,14,'meeting','Commercial Terms & Risk Alignment Meeting','Aligned on 10% Mobilization Advance, 10% ABG requirement, 5% Retention withheld till DLP, and 30-day payment SLA. Drafted commercial payment terms matrix.',17,'2026-09-24 12:39:08','2026-09-24 12:39:08'),(14,14,'note','Design Review & Preliminary Engineering Sign-off','Engineering team approved architectural cleanroom plan, single-line diagram for 11kV HT yard, and HVAC duct routing layout.',19,'2026-09-24 12:39:08','2026-09-24 12:39:08');

--
-- Table structure for table `leads`
--

DROP TABLE IF EXISTS `leads`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `leads` (
  `id` int NOT NULL AUTO_INCREMENT,
  `lead_number` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `company` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contact_email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contact_phone` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `project_type` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `location` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `budget_estimate` decimal(14,2) DEFAULT NULL,
  `lead_source` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'new',
  `stage` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'lead_creation',
  `priority` varchar(16) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'medium',
  `owner_id` int DEFAULT NULL,
  `expected_closure_date` date DEFAULT NULL,
  `won_project_id` int DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `updated_at` timestamp NOT NULL DEFAULT (now()),
  `advance_percent` decimal(5,2) DEFAULT '10.00',
  `retention_percent` decimal(5,2) DEFAULT '5.00',
  `abg_required` tinyint(1) DEFAULT '0',
  `abg_percent` decimal(5,2) DEFAULT '0.00',
  `abg_amount` decimal(14,2) DEFAULT '0.00',
  `payment_terms_days` int DEFAULT '30',
  `dlp_months` int DEFAULT '12',
  `commercial_terms_notes` text COLLATE utf8mb4_unicode_ci,
  `organization_id` int DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `leads_lead_number_unique` (`lead_number`),
  KEY `idx_leads_org` (`organization_id`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `leads`
--

INSERT INTO `leads` VALUES (1,'LD-20260805-0001','Mahesh Bhatia','Lumina Hospitality Group','mahesh@luminahg.in','+91 98765 43210','Hotel Interior Fit-out','Bandra West, Mumbai',32500000.00,'Referral','qualified','boq','high',2,'2026-06-15',NULL,'Boutique hotel renovation, 42 rooms.','2026-08-05 06:44:24','2026-08-05 06:44:24',10.00,5.00,0,0.00,0.00,30,12,NULL,1),(2,'LD-20260805-0002','Sara D\'Souza','Verde Workspaces','sara@verdews.com','+91 99887 65432','Office Build-out','Whitefield, Bengaluru',18000000.00,'Inbound web','contacted','site_visit','medium',2,'2026-07-30',NULL,'Two-floor co-working buildout.','2026-08-05 06:44:24','2026-08-05 06:44:24',10.00,5.00,0,0.00,0.00,30,12,NULL,1),(3,'LD-20260805-0003','Ritesh Khanna','Northshore Residences','ritesh@northshore.in','+91 90000 11122','Residential Tower MEP','Powai, Mumbai',84000000.00,'Tender','won','won','urgent',1,'2026-09-20',19,'EMD already deposited.','2026-08-05 06:44:24','2026-10-07 03:18:01',10.00,5.00,0,0.00,0.00,30,12,NULL,1),(4,'LD-20260805-0004','Kavita Menon','Asha Healthcare','kavita@ashahc.org','+91 91234 55667','Hospital Wing Expansion','Koramangala, Bengaluru',56000000.00,'Referral','qualified','negotiation','high',2,'2026-08-10',NULL,'Two rounds of negotiation completed.','2026-08-05 06:44:24','2026-08-05 06:44:24',10.00,5.00,0,0.00,0.00,30,12,NULL,1),(5,'LD-20260805-0005','Devansh Patel','Patel Logistics','devansh@patellog.in','+91 93456 11223','Warehouse Build','Bhiwandi, Maharashtra',22000000.00,'Cold outreach','lost','negotiation','low',1,'2026-04-01',NULL,'Lost to local contractor on price.','2026-08-05 06:44:24','2026-08-05 06:44:24',10.00,5.00,0,0.00,0.00,30,12,NULL,1),(6,'LD-20260806-0006','Test Customer',NULL,NULL,NULL,'Residential','Test Location',1000000.00,NULL,'won','won','medium',1,NULL,18,NULL,'2026-08-06 06:02:25','2026-10-07 03:13:27',10.00,5.00,0,0.00,0.00,30,12,NULL,1),(7,'LD-20260806-0007','Rohan Mehta','Crestline Developers Pvt. Ltd','rohan.mehta@crestline.com',' +91 91234 56789','Luxury Residential Tower – Electrical & Civil Works','Worli, Mumbai',45000000.00,' Tender','new','lead_creation','medium',1,NULL,NULL,NULL,'2026-08-06 06:28:36','2026-08-06 06:28:36',10.00,5.00,0,0.00,0.00,30,12,NULL,1),(8,'LD-20260811-0001','Mahesh Bhatia','Lumina Hospitality Group','mahesh@luminahg.in','+91 98765 43210','Hotel Interior Fit-out','Bandra West, Mumbai',32500000.00,'Referral','won','won','high',18,'2026-06-15',16,'Boutique hotel renovation, 42 rooms.','2026-08-11 08:10:43','2026-10-07 02:11:11',10.00,5.00,0,0.00,0.00,30,12,NULL,1),(9,'LD-20260811-0002','Sara D\'Souza','Verde Workspaces','sara@verdews.com','+91 99887 65432','Office Build-out','Whitefield, Bengaluru',18000000.00,'Inbound web','contacted','site_visit','medium',18,'2026-07-30',NULL,'Two-floor co-working buildout.','2026-08-11 08:10:43','2026-10-26 08:36:52',10.00,5.00,0,0.00,0.00,30,12,NULL,1),(10,'LD-20260811-0003','Ritesh Khanna','Northshore Residences','ritesh@northshore.in','+91 90000 11122','Residential Tower MEP','Powai, Mumbai',84000000.00,'Tender','new','lead_creation','urgent',17,'2026-09-20',NULL,'EMD already deposited.','2026-08-11 08:10:43','2026-08-11 08:10:43',10.00,5.00,0,0.00,0.00,30,12,NULL,1),(11,'LD-20260811-0004','Kavita Menon','Asha Healthcare','kavita@ashahc.org','+91 91234 55667','Hospital Wing Expansion','Koramangala, Bengaluru',56000000.00,'Referral','qualified','negotiation','high',18,'2026-08-10',NULL,'Two rounds of negotiation completed.','2026-08-11 08:10:43','2026-08-11 08:10:43',10.00,5.00,0,0.00,0.00,30,12,NULL,1),(12,'LD-20260811-0005','Devansh Patel','Patel Logistics','devansh@patellog.in','+91 93456 11223','Warehouse Build','Bhiwandi, Maharashtra',22000000.00,'Cold outreach','lost','negotiation','low',17,'2026-04-01',NULL,'Lost to local contractor on price.','2026-08-11 08:10:43','2026-08-11 08:10:43',10.00,5.00,0,0.00,0.00,30,12,NULL,1),(14,'LD-20260924-TUR01','Dr. Vikramaditya Oberoi','Apex Global Biotech & Healthcare Park','v.oberoi@apexbiotech.com','+91 98201 54321','Commercial Cleanroom & MEP Turnkey','Plot 14-B, Sector 62, Electronic City Phase 2, Bangalore',55000000.00,'Enterprise Referral','won','won','urgent',18,'2026-10-15',14,'High priority turnkey client. Fast-track 6-month completion timeline. Site is cleared and ready for possession.','2026-09-24 12:39:08','2026-09-24 08:08:12',10.00,5.00,1,10.00,5500000.00,30,12,'Client agreed on 10% Mobilization Advance against a 10% Advance Bank Guarantee (ABG) from a Scheduled Commercial Bank. 5% Retention withheld from monthly RA bills, payable 50% on Handover & As-Built acceptance, and 50% post 12-month DLP. Billing schedule tied to 6 turnkey milestone gates.',1),(17,'LD-20261007-0014',' Ramesh Kumar','Horizon Resorts Pvt. Ltd','ramesh.kumar@gamil.com','92949567897',' Resort Expansion & Renovation','Colva Beach, Goa',45000000.00,'Tender Submission','won','won','high',17,NULL,17,'Timeline: Expected to begin early 2027; completion within 12 months','2026-10-07 07:19:39','2026-10-22 08:42:04',10.00,5.00,0,0.00,0.00,30,12,NULL,1);

--
-- Table structure for table `material_request_approval_history`
--

DROP TABLE IF EXISTS `material_request_approval_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `material_request_approval_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `material_request_id` int NOT NULL,
  `manager_id` int NOT NULL,
  `action` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `comments` text COLLATE utf8mb4_unicode_ci,
  `action_date` timestamp NOT NULL DEFAULT (now()),
  `created_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `material_request_approval_history`
--

INSERT INTO `material_request_approval_history` VALUES (1,9,17,'APPROVED','Approved! Budget confirmed.','2026-08-24 02:34:14','2026-08-24 08:04:13'),(2,10,17,'REJECTED','Budget exceeded for this quarter. Please resubmit with lower cost alternatives.','2026-08-24 02:34:49','2026-08-24 08:04:49'),(3,12,17,'APPROVED','Approved. Budget verified and allocated.','2026-08-24 02:36:59','2026-08-24 08:06:58'),(4,13,17,'REJECTED','Budget constraints. Please revise with cost-effective alternatives.','2026-08-24 02:36:59','2026-08-24 08:06:59'),(5,16,17,'APPROVED',NULL,'2026-08-24 08:20:50','2026-08-24 13:50:50'),(6,14,17,'APPROVED',NULL,'2026-08-24 22:41:40','2026-08-25 04:11:39'),(7,15,17,'APPROVED','Approved for foundation work. Please proceed with procurement.','2026-08-24 22:54:37','2026-08-25 04:24:37'),(8,17,17,'APPROVED',NULL,'2026-08-24 23:04:43','2026-08-25 04:34:42'),(9,18,17,'APPROVED',NULL,'2026-08-24 23:48:07','2026-08-25 05:18:06'),(10,19,17,'APPROVED',NULL,'2026-08-25 00:11:14','2026-08-25 05:41:14'),(11,20,17,'APPROVED',NULL,'2026-08-25 03:35:40','2026-08-25 09:05:39'),(12,23,17,'APPROVED',NULL,'2026-08-25 05:15:51','2026-08-25 10:45:50'),(13,24,18,'APPROVED',NULL,'2026-08-25 05:22:41','2026-08-25 10:52:41'),(14,21,18,'APPROVED',NULL,'2026-08-25 05:23:22','2026-08-25 10:53:22'),(15,26,17,'APPROVED',NULL,'2026-08-26 01:30:09','2026-08-26 07:00:08'),(16,25,18,'APPROVED',NULL,'2026-09-15 23:31:08','2026-09-16 05:01:08'),(17,29,17,'APPROVED',NULL,'2026-09-16 06:51:35','2026-09-16 12:21:34'),(18,28,18,'APPROVED',NULL,'2026-09-16 07:03:34','2026-09-16 12:33:34'),(19,33,18,'APPROVED',NULL,'2026-09-17 04:46:19','2026-09-17 10:16:18'),(20,27,18,'APPROVED',NULL,'2026-09-17 04:48:11','2026-09-17 10:18:10'),(21,34,18,'APPROVED',NULL,'2026-09-18 02:37:05','2026-09-18 08:07:05'),(22,40,18,'APPROVED',NULL,'2026-10-05 05:03:53','2026-10-05 10:33:53'),(23,51,18,'APPROVED',NULL,'2026-10-05 05:05:19','2026-10-05 10:35:19'),(24,49,17,'APPROVED','Approved by project manager','2026-10-07 06:13:04','2026-10-07 11:43:04'),(26,48,17,'APPROVED','Approved','2026-10-07 06:14:33','2026-10-07 11:44:32');

--
-- Table structure for table `material_requests`
--

DROP TABLE IF EXISTS `material_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `material_requests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `quantity` decimal(14,2) NOT NULL,
  `unit` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `created_by_id` int DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `updated_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `material_requests`
--

INSERT INTO `material_requests` VALUES (1,1,'Vinyl flooring — Floor 5','Premium grade, 12,000 sqft.',12000.00,'sqft','rfq_sent',3,'2026-08-05 06:44:24','2026-08-05 06:44:24'),(2,1,'Suspended ceiling tiles — Floors 4-6',NULL,8500.00,'sqft','approved',3,'2026-08-05 06:44:24','2026-08-05 06:44:24'),(3,2,'Copper wiring 4mm — riser shaft',NULL,4500.00,'m','pending',3,'2026-08-05 06:44:24','2026-08-05 06:44:24'),(4,6,'TMT Bars (Fe 500 Grade)',NULL,250.00,'nos','pending',1,'2026-08-06 06:59:13','2026-08-06 06:59:13'),(5,6,'cement bags','A grade cement preferably ACC',1000.00,'bags','pending',1,'2026-08-06 13:22:00','2026-08-06 13:22:00'),(6,1,'Vinyl flooring — Floor 5','Premium grade, 12,000 sqft.',12000.00,'sqft','rfq_sent',19,'2026-08-11 08:10:43','2026-08-11 08:10:43'),(7,1,'Suspended ceiling tiles — Floors 4-6',NULL,8500.00,'sqft','approved',19,'2026-08-11 08:10:43','2026-08-11 08:10:43'),(8,2,'Copper wiring 4mm — riser shaft',NULL,4500.00,'m','pending',19,'2026-08-11 08:10:43','2026-08-11 08:10:43');

--
-- Table structure for table `materials`
--

DROP TABLE IF EXISTS `materials`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `materials` (
  `id` int NOT NULL AUTO_INCREMENT,
  `project_id` int DEFAULT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `unit` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity_on_hand` decimal(14,2) NOT NULL DEFAULT '0.00',
  `quantity_committed` decimal(14,2) NOT NULL DEFAULT '0.00',
  `quantity_consumed` decimal(14,2) NOT NULL DEFAULT '0.00',
  `minimum_stock` decimal(14,2) NOT NULL DEFAULT '0.00',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `materials`
--

INSERT INTO `materials` VALUES (1,1,'Cement — OPC 53 grade',NULL,'bag',320.00,180.00,1240.00,200.00),(2,1,'TMT steel bars 12mm',NULL,'kg',1850.00,900.00,8200.00,2000.00),(3,2,'PVC conduit 25mm',NULL,'m',640.00,0.00,5400.00,500.00),(4,2,'Copper wire 4mm',NULL,'m',120.00,4500.00,12800.00,300.00),(5,6,'portland cement',NULL,'bags',300.00,200.00,1200.00,500.00);

--
-- Table structure for table `meetings`
--

DROP TABLE IF EXISTS `meetings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `meetings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `meeting_date` timestamp NOT NULL,
  `duration` int NOT NULL DEFAULT '60',
  `location` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `agenda` text COLLATE utf8mb4_unicode_ci,
  `minutes` text COLLATE utf8mb4_unicode_ci,
  `participants` text COLLATE utf8mb4_unicode_ci,
  `created_by_id` int DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `updated_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `meetings`
--

INSERT INTO `meetings` VALUES (1,1,'Weekly site review — Sentinel','2026-04-25 23:30:00',60,'Sentinel site office, Hinjewadi','1. Floor 4 ceiling progress\n2. Floor 5 procurement status\n3. Snag review schedule',NULL,'Rohan, Priya, Sentinel PMO',2,'2026-08-05 06:44:24','2026-08-05 06:44:24'),(2,2,'Citygate monthly steering','2026-04-30 06:00:00',90,'Citygate corporate office','Monthly progress, RA bill 6 approval, change orders.',NULL,'Ananya, Rohan, Citygate leadership',1,'2026-08-05 06:44:24','2026-08-05 06:44:24'),(3,6,'Weekly project review','2026-08-08 07:00:00',60,'Site Office',NULL,NULL,'Anil Sharma, Priya Reddy, Rajesh Kumar, Meena Gupta, Arvind Rao',1,'2026-08-07 10:25:23','2026-08-07 10:25:23');

--
-- Table structure for table `negotiations`
--

DROP TABLE IF EXISTS `negotiations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `negotiations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `lead_id` int NOT NULL,
  `round_number` int NOT NULL DEFAULT '1',
  `revised_amount` decimal(14,2) DEFAULT NULL,
  `discount_percent` decimal(6,2) DEFAULT NULL,
  `status` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `requires_approval` tinyint(1) NOT NULL DEFAULT '0',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_by_id` int DEFAULT NULL,
  `approved_by_id` int DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `updated_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `negotiations`
--

INSERT INTO `negotiations` VALUES (1,4,1,53000000.00,5.36,'approved',0,'First counter accepted.',2,1,'2026-08-05 06:44:24','2026-08-05 06:44:24'),(2,4,2,51500000.00,8.04,'pending',1,'Awaiting admin approval — discount exceeds 5%.',2,NULL,'2026-08-05 06:44:24','2026-08-05 06:44:24'),(3,4,1,53000000.00,5.36,'approved',0,'First counter accepted.',18,17,'2026-08-11 08:10:43','2026-08-11 08:10:43'),(4,4,2,51500000.00,8.04,'pending',1,'Awaiting admin approval — discount exceeds 5%.',18,NULL,'2026-08-11 08:10:43','2026-08-11 08:10:43'),(5,14,1,58500000.00,0.00,'rejected',0,'Original quotation submitted based on detailed initial preliminary BOQ items.',18,17,'2026-09-24 12:39:08','2026-09-24 12:39:08'),(6,14,2,55000000.00,5.98,'approved',0,'Agreed final pricing at ₹5.50 Cr incorporating value engineering on cleanroom AHU air handling loops and stainless steel manifolds. Approved by MD & Client Board.',18,17,'2026-09-24 12:39:08','2026-09-24 12:39:08');

--
-- Table structure for table `notification_preferences`
--

DROP TABLE IF EXISTS `notification_preferences`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notification_preferences` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `preferences` json NOT NULL DEFAULT (_utf8mb4'{}'),
  `updated_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`),
  UNIQUE KEY `notification_preferences_user_id_unique` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notification_preferences`
--

INSERT INTO `notification_preferences` VALUES (1,1,'{}','2026-08-06 06:25:09'),(2,17,'{\"low_stock\": {\"email\": true, \"inApp\": true}, \"invoice_overdue\": {\"email\": true, \"inApp\": true}, \"project_created\": {\"email\": true, \"inApp\": true}, \"payment_received\": {\"email\": true, \"inApp\": true}, \"approval_required\": {\"email\": true, \"inApp\": true}, \"ra_bill_certified\": {\"email\": true, \"inApp\": true}, \"ra_bill_submitted\": {\"email\": true, \"inApp\": true}, \"instrument_expiring\": {\"email\": true, \"inApp\": true}, \"punch_item_assigned\": {\"email\": true, \"inApp\": true}, \"purchase_order_issued\": {\"email\": true, \"inApp\": true}, \"vendor_invoice_matched\": {\"email\": true, \"inApp\": true}, \"purchase_order_approved\": {\"email\": true, \"inApp\": true}, \"vendor_invoice_discrepancy\": {\"email\": true, \"inApp\": true}, \"quality_inspection_rejected\": {\"email\": true, \"inApp\": true}}','2026-10-26 04:27:21');

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `notification_type` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci,
  `is_read` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` VALUES (1,1,'approval_required','Negotiation round 2 needs approval','Asha Healthcare lead — discount of 8.04% exceeds 5% threshold.',0,'2026-08-05 06:44:24'),(2,1,'instrument_expiring','EMD expiring in 22 days','Citygate Residences EMD (HDFC) expires on 2026-05-15.',0,'2026-08-05 06:44:24'),(3,1,'low_stock','Copper wire 4mm below minimum','Citygate site shows 120m on hand vs 300m minimum.',0,'2026-08-05 06:44:24'),(4,1,'invoice_overdue','Invoice INV-2026-0031 is overdue','Citygate Developers, INR 94,00,000.',1,'2026-08-05 06:44:24'),(5,1,'vendor_invoice_discrepancy','Vendor invoice discrepancy flagged','Polaris Electricals invoice exceeds PO by INR 30,000.',0,'2026-08-05 06:44:24'),(6,17,'approval_required','Negotiation round 2 needs approval','Asha Healthcare lead — discount of 8.04% exceeds 5% threshold.',0,'2026-08-11 08:10:44'),(7,17,'instrument_expiring','EMD expiring in 22 days','Citygate Residences EMD (HDFC) expires on 2026-05-15.',0,'2026-08-11 08:10:44'),(8,17,'low_stock','Copper wire 4mm below minimum','Citygate site shows 120m on hand vs 300m minimum.',0,'2026-08-11 08:10:44'),(9,17,'invoice_overdue','Invoice INV-2026-0031 is overdue','Citygate Developers, INR 94,00,000.',1,'2026-08-11 08:10:44'),(10,17,'vendor_invoice_discrepancy','Vendor invoice discrepancy flagged','Polaris Electricals invoice exceeds PO by INR 30,000.',0,'2026-08-11 08:10:44'),(11,17,'client_ra_bill_created','Client RA Bill RAB-CLI-012-01 Raised','Milestone \"Mobilization Advance & Site Possession Handover\" has been billed. Draft RA Bill RAB-CLI-012-01 generated for ₹85,00,000.',0,'2026-09-24 12:22:09'),(12,18,'project_created','Project Handover & Contract Generated','Dr. Vikramaditya Oberoi (LD-20260924-TUR01) successfully converted to project \"Apex Cleanroom Facility\". Auto-generated Client Contract CNT-CLI-2026-0013, baseline budget, and 6 milestone billing schedules.',0,'2026-09-24 12:45:44'),(13,18,'project_created','Project Handover & Contract Generated','Dr. Vikramaditya Oberoi (LD-20260924-TUR01) successfully converted to project \"Dr. Vikramaditya Oberoi — Commercial Cleanroom & MEP Turnkey\". Auto-generated Client Contract CNT-CLI-2026-0014, baseline budget, and 6 milestone billing schedules.',0,'2026-09-24 12:48:26'),(14,1,'budget_variance_alert','Budget Variance Alert:  Orion Business Hub — Tower B','🚨 1 package(s) OVER BUDGET.  Overall consumption: 120.0%.',0,'2026-10-01 06:42:52'),(15,1,'budget_variance_alert','Budget Variance Alert:  Orion Business Hub — Tower B','🚨 1 package(s) OVER BUDGET.  Overall consumption: 120.0%.',0,'2026-10-05 05:55:24'),(16,17,'project_created','Project Handover & Contract Generated','Test Turnkey Client (LD-20261007-0015) successfully converted to project \"Test Turnkey Client - EPC Luxury Hotel\". Auto-generated Client Contract CNT-CLI-2026-0015, baseline budget, and 6 milestone billing schedules.',0,'2026-10-07 07:40:20'),(17,18,'project_created','Project Handover & Contract Generated','Mahesh Bhatia (LD-20260811-0001) successfully converted to project \"Mahesh Bhatia — Hotel Interior Fit-out\". Auto-generated Client Contract CNT-CLI-2026-0016, baseline budget, and 6 milestone billing schedules.',0,'2026-10-07 07:41:10'),(18,17,'project_created','Project Handover & Contract Generated',' Ramesh Kumar (LD-20261007-0014) successfully converted to project \"Ramesh Kumar —  Resort Expansion & Renovation\". Auto-generated Client Contract CNT-CLI-2026-0017, baseline budget, and 6 milestone billing schedules.',0,'2026-10-07 07:41:30'),(19,1,'project_created','Project Handover & Contract Generated','Test Customer (LD-20260806-0006) successfully converted to project \"Test Customer — Residential\". Auto-generated Client Contract CNT-CLI-2026-0018, baseline budget, and 6 milestone billing schedules.',0,'2026-10-07 08:43:27'),(20,1,'project_created','Project Handover & Contract Generated','Ritesh Khanna (LD-20260805-0003) successfully converted to project \"Ritesh Khanna — Residential Tower MEP\". Auto-generated Client Contract CNT-CLI-2026-0019, baseline budget, and 6 milestone billing schedules.',0,'2026-10-07 08:48:01'),(21,17,'client_ra_bill_created','Client RA Bill RAB-CLI-019-01 Raised','Milestone \"Mobilization Advance & Site Possession Handover\" has been billed. Draft RA Bill RAB-CLI-019-01 generated for ₹84,00,000.',0,'2026-10-22 06:17:43'),(22,NULL,'instrument_expiry_alert','Financial Instrument Expiring in 12 Days: PBG-SGH-2026-004','BANK_GUARANTEE for Sapphire Grand Hotel & Convention Center (₹45,00,000) expires on Wed Nov 04 2026 05:30:00 GMT+0530 (India Standard Time). Please take renewal, claim, or release action.',0,'2026-10-23 09:29:02'),(23,NULL,'instrument_expiry_alert','Financial Instrument Expiring in 24 Days: ABG-STP-2026-008','BANK_GUARANTEE for Sentinel Tech Park — Phase 2 (₹28,00,000) expires on Mon Nov 16 2026 05:30:00 GMT+0530 (India Standard Time). Please take renewal, claim, or release action.',0,'2026-10-23 09:29:02');

--
-- Table structure for table `organizations`
--

DROP TABLE IF EXISTS `organizations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `organizations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `updated_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`),
  UNIQUE KEY `organizations_code_unique` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `organizations`
--

INSERT INTO `organizations` VALUES (1,'Kanak Turnkey Solutions','KANAK_MAIN','active','2026-09-25 11:17:11','2026-09-25 11:17:11');

--
-- Table structure for table `payment_reminders`
--

DROP TABLE IF EXISTS `payment_reminders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payment_reminders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `invoice_id` int NOT NULL,
  `reminder_date` timestamp NOT NULL DEFAULT (now()),
  `reminder_type` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `subject` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `recipient` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `follow_up_remarks` text COLLATE utf8mb4_unicode_ci,
  `sent_by_id` int NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `updated_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payment_reminders`
--

INSERT INTO `payment_reminders` VALUES (6,10,'2026-09-24 11:25:50','email','Payment Reminder: Milestone 1 RA Bill Invoice INV-20260923-0007','Dear Client, Please note Invoice INV-20260923-0007 for ₹12,09,900 is due. Attached is the certified RA bill abstract.','accounts@bluewavehospitality.com','Client confirmed NEFT processing scheduled for same day.',17,'2026-09-24 11:25:50','2026-09-24 11:25:50'),(11,1,'2026-10-05 06:12:57','email','Payment Reminder: Milestone 1 RA Bill Invoice INV-2026-0042','Dear Client, Please note Invoice INV-2026-0042 for ₹12,09,900 is due. Attached is the certified RA bill abstract.','accounts@bluewavehospitality.com','Client confirmed NEFT processing scheduled for same day.',17,'2026-10-05 06:12:57','2026-10-05 06:12:57'),(13,13,'2026-10-06 05:18:55','email','Payment Reminder: Milestone 1 RA Bill Invoice INV-20260923-0014','Dear Client, Please note Invoice INV-20260923-0014 for ₹12,09,900 is due. Attached is the certified RA bill abstract.','accounts@bluewavehospitality.com','Client confirmed NEFT processing scheduled for same day.',17,'2026-10-06 05:18:55','2026-10-06 05:18:55');

--
-- Table structure for table `procurement_inventory_items`
--

DROP TABLE IF EXISTS `procurement_inventory_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `procurement_inventory_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `item_code` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `project_id` int DEFAULT NULL,
  `item_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `category` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `unit` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_quantity` decimal(14,2) NOT NULL DEFAULT '0.00',
  `available_quantity` decimal(14,2) NOT NULL DEFAULT '0.00',
  `allocated_quantity` decimal(14,2) NOT NULL DEFAULT '0.00',
  `consumed_quantity` decimal(14,2) NOT NULL DEFAULT '0.00',
  `minimum_stock` decimal(14,2) NOT NULL DEFAULT '0.00',
  `reorder_level` decimal(14,2) NOT NULL DEFAULT '0.00',
  `average_cost` decimal(14,2) NOT NULL DEFAULT '0.00',
  `last_purchase_price` decimal(14,2) DEFAULT NULL,
  `last_purchase_date` date DEFAULT NULL,
  `warehouse_location` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `updated_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`),
  UNIQUE KEY `procurement_inventory_items_item_code_unique` (`item_code`)
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `procurement_inventory_items`
--

INSERT INTO `procurement_inventory_items` VALUES (1,'INV-VIN-001',1,'Premium vinyl flooring tiles - Tarkett','German brand, 12mm thickness, fire rated','Interior Materials','sqft',11850.00,11850.00,0.00,0.00,1000.00,2000.00,64.00,64.00,'2026-05-07','Sentinel Site - Material Store A, Rack 12','active','2026-08-11 08:10:44','2026-08-11 08:10:44'),(2,'INV-ADH-001',1,'Vinyl flooring adhesive - Bostik','Acrylic-based adhesive for vinyl flooring','Consumables','gallon',50.00,50.00,0.00,0.00,10.00,15.00,600.00,600.00,'2026-05-07','Sentinel Site - Material Store A, Shelf 5','active','2026-08-11 08:10:44','2026-08-11 08:10:44'),(3,'INV-CEM-001',1,'Cement - OPC 53 grade','Ordinary Portland Cement Grade 53','Civil Materials','bag',320.00,140.00,0.00,1240.00,200.00,300.00,385.00,390.00,'2026-04-05','Sentinel Site - Open Storage Yard B','low_stock','2026-08-11 08:10:44','2026-08-11 08:10:44'),(4,'INV-STEEL-001',1,'TMT steel bars 12mm','Thermo-mechanically treated steel reinforcement bars','Civil Materials','kg',1850.00,950.00,0.00,8200.00,2000.00,3000.00,62.00,64.00,'2026-03-28','Sentinel Site - Open Storage Yard A','low_stock','2026-08-11 08:10:44','2026-08-11 08:10:44'),(5,'INV-DUCT-001',2,'PVC conduit 25mm','PVC electrical conduit pipes','Electrical','m',640.00,640.00,0.00,5400.00,500.00,800.00,42.00,44.00,'2026-03-15','Citygate Site - Store Room 2','active','2026-08-11 08:10:44','2026-08-11 08:10:44'),(6,'INV-STEEL-002',1,'I-Beam Steel (8inch)',NULL,'Civil/Structural','pieces',50.00,50.00,0.00,0.00,0.00,0.00,11500.00,11500.00,'2026-09-17',NULL,'active','2026-09-17 08:59:34','2026-09-17 08:59:34'),(7,'INV-STEEL-003',1,'H-Beam Steel (10inch)',NULL,'Civil/Structural','pieces',30.00,30.00,0.00,0.00,0.00,0.00,17500.00,17500.00,'2026-09-17',NULL,'active','2026-09-17 08:59:34','2026-09-17 08:59:34'),(10,'INV-20260918-0008',3,'Portland Cement OPC 53 Grade',NULL,'general','bags',1000.00,1000.00,0.00,0.00,0.00,0.00,490.00,490.00,'2026-09-18',NULL,'active','2026-09-18 11:15:22','2026-09-18 05:45:56'),(13,'INV-CEM-0014-01',14,'OPC 53 Grade Ultratech Cement',NULL,'civil','bags',400.00,400.00,0.00,0.00,50.00,100.00,410.00,410.00,NULL,'Central Cement Godown A-1','active','2026-09-30 07:43:30','2026-10-05 23:48:55'),(14,'INV-STL-0014-01',14,'TMT Fe500D Reinforcement Steel 16mm',NULL,'steel','MT',12.00,12.00,0.00,0.00,2.00,5.00,67500.00,67500.00,NULL,'Yard Rebar Fabrication Bay','active','2026-09-30 07:43:30','2026-10-05 23:48:55'),(15,'INV-CEM-0001-01',1,'OPC 53 Grade Ultratech Cement',NULL,'civil','bags',400.00,400.00,0.00,0.00,50.00,100.00,410.00,410.00,NULL,'Central Cement Godown A-1','active','2026-10-05 06:12:56','2026-10-05 06:12:56'),(16,'INV-STL-0001-01',1,'TMT Fe500D Reinforcement Steel 16mm',NULL,'steel','MT',12.00,12.00,0.00,0.00,2.00,5.00,67500.00,67500.00,NULL,'Yard Rebar Fabrication Bay','active','2026-10-05 06:12:56','2026-10-05 06:12:56'),(17,'INV-20261005-0013',5,'M s 100 mm Elbow',NULL,'general','nos',490.00,490.00,0.00,0.00,0.00,0.00,2450.00,5.00,'2026-10-05',NULL,'active','2026-10-05 11:13:31','2026-10-05 06:07:57'),(18,'INV-20261005-0014',5,'M S Flange Size 80-mm',NULL,'general','nos',380.00,380.00,0.00,0.00,0.00,0.00,1900.00,10.00,'2026-10-05',NULL,'active','2026-10-05 11:13:31','2026-10-05 06:07:57'),(19,'INV-20261005-0015',5,'M S 150 MM ELBOW',NULL,'general','nos',1260.00,1260.00,0.00,0.00,0.00,0.00,12600.00,15.00,'2026-10-05',NULL,'active','2026-10-05 11:13:31','2026-10-05 06:07:57'),(20,'INV-20261005-0016',5,'GI U BOLT 80 MM',NULL,'general','nos',40.00,40.00,0.00,0.00,0.00,0.00,560.00,10.00,'2026-10-05',NULL,'active','2026-10-05 11:13:31','2026-10-05 06:07:57'),(21,'INV-20261005-0017',5,'GI U BOLT 100 MM',NULL,'general','nos',60.00,60.00,0.00,0.00,0.00,0.00,930.00,20.00,'2026-10-05',NULL,'active','2026-10-05 11:13:31','2026-10-05 06:07:58'),(22,'INV-20261005-0018',5,'GI U BOLT 150 MM',NULL,'general','nos',400.00,400.00,0.00,0.00,0.00,0.00,7400.00,150.00,'2026-10-05',NULL,'active','2026-10-05 11:13:31','2026-10-05 06:07:58');

--
-- Table structure for table `procurement_inventory_transactions`
--

DROP TABLE IF EXISTS `procurement_inventory_transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `procurement_inventory_transactions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `transaction_number` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `inventory_item_id` int NOT NULL,
  `project_id` int DEFAULT NULL,
  `transaction_type` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `transaction_date` timestamp NOT NULL DEFAULT (now()),
  `quantity` decimal(14,2) NOT NULL,
  `unit_price` decimal(14,2) DEFAULT NULL,
  `total_value` decimal(14,2) DEFAULT NULL,
  `balance_quantity` decimal(14,2) NOT NULL,
  `po_id` int DEFAULT NULL,
  `inspection_id` int DEFAULT NULL,
  `task_id` int DEFAULT NULL,
  `remarks` text COLLATE utf8mb4_unicode_ci,
  `created_by_id` int NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `updated_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`),
  UNIQUE KEY `procurement_inventory_transactions_transaction_number_unique` (`transaction_number`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `procurement_inventory_transactions`
--

INSERT INTO `procurement_inventory_transactions` VALUES (1,'TXN-2026-0001',1,1,'goods_receipt','2026-05-07 11:00:00',11850.00,64.00,758400.00,11850.00,1,1,NULL,'Goods received and quality inspected. 150 sqft rejected.',21,'2026-08-11 08:10:44','2026-08-11 08:10:44'),(2,'TXN-2026-0002',2,1,'goods_receipt','2026-05-07 11:00:00',50.00,600.00,30000.00,50.00,1,1,NULL,'Goods received and quality approved',21,'2026-08-11 08:10:44','2026-08-11 08:10:44'),(3,'TXN-2026-0003',3,1,'issue_to_project','2026-04-15 02:30:00',180.00,385.00,69300.00,140.00,NULL,NULL,1,'Issued to Floor 4 ceiling work',19,'2026-08-11 08:10:44','2026-08-11 08:10:44'),(6,'TXN-20260918-0004',10,3,'goods_receipt','2026-09-18 05:45:22',500.00,490.00,245000.00,500.00,3,4,NULL,'Quality inspection approved - QI-20260918-0004',17,'2026-09-18 11:15:22','2026-09-18 11:15:22'),(7,'TXN-20260918-0005',10,3,'goods_receipt','2026-09-18 05:45:56',500.00,490.00,245000.00,1000.00,3,5,NULL,'Quality inspection approved - QI-20260918-0005',18,'2026-09-18 11:15:55','2026-09-18 11:15:55'),(8,'TXN-20261005-0006',17,5,'goods_receipt','2026-10-05 05:43:32',245.00,2450.00,600250.00,245.00,8,8,NULL,'Quality inspection approved - QI-20261005-0007',17,'2026-10-05 11:13:31','2026-10-05 11:13:31'),(9,'TXN-20261005-0007',18,5,'goods_receipt','2026-10-05 05:43:32',190.00,1900.00,361000.00,190.00,8,8,NULL,'Quality inspection approved - QI-20261005-0007',17,'2026-10-05 11:13:31','2026-10-05 11:13:31'),(10,'TXN-20261005-0008',19,5,'goods_receipt','2026-10-05 05:43:32',630.00,12600.00,7938000.00,630.00,8,8,NULL,'Quality inspection approved - QI-20261005-0007',17,'2026-10-05 11:13:31','2026-10-05 11:13:31'),(11,'TXN-20261005-0009',20,5,'goods_receipt','2026-10-05 05:43:32',20.00,560.00,11200.00,20.00,8,8,NULL,'Quality inspection approved - QI-20261005-0007',17,'2026-10-05 11:13:31','2026-10-05 11:13:31'),(12,'TXN-20261005-0010',21,5,'goods_receipt','2026-10-05 05:43:32',30.00,930.00,27900.00,30.00,8,8,NULL,'Quality inspection approved - QI-20261005-0007',17,'2026-10-05 11:13:31','2026-10-05 11:13:31'),(13,'TXN-20261005-0011',22,5,'goods_receipt','2026-10-05 05:43:32',200.00,7400.00,1480000.00,200.00,8,8,NULL,'Quality inspection approved - QI-20261005-0007',17,'2026-10-05 11:13:31','2026-10-05 11:13:31'),(14,'TXN-20261005-0012',17,5,'goods_receipt','2026-10-05 06:07:57',245.00,5.00,1225.00,490.00,9,9,NULL,'Quality inspection approved - QI-20261005-0008',17,'2026-10-05 11:37:57','2026-10-05 11:37:57'),(15,'TXN-20261005-0013',18,5,'goods_receipt','2026-10-05 06:07:57',190.00,10.00,1900.00,380.00,9,9,NULL,'Quality inspection approved - QI-20261005-0008',17,'2026-10-05 11:37:57','2026-10-05 11:37:57'),(16,'TXN-20261005-0014',19,5,'goods_receipt','2026-10-05 06:07:57',630.00,15.00,9450.00,1260.00,9,9,NULL,'Quality inspection approved - QI-20261005-0008',17,'2026-10-05 11:37:57','2026-10-05 11:37:57'),(17,'TXN-20261005-0015',20,5,'goods_receipt','2026-10-05 06:07:57',20.00,10.00,200.00,40.00,9,9,NULL,'Quality inspection approved - QI-20261005-0008',17,'2026-10-05 11:37:57','2026-10-05 11:37:57'),(18,'TXN-20261005-0016',21,5,'goods_receipt','2026-10-05 06:07:58',30.00,20.00,600.00,60.00,9,9,NULL,'Quality inspection approved - QI-20261005-0008',17,'2026-10-05 11:37:57','2026-10-05 11:37:57'),(19,'TXN-20261005-0017',22,5,'goods_receipt','2026-10-05 06:07:58',200.00,150.00,30000.00,400.00,9,9,NULL,'Quality inspection approved - QI-20261005-0008',17,'2026-10-05 11:37:57','2026-10-05 11:37:57');

--
-- Table structure for table `procurement_material_receipt_items`
--

DROP TABLE IF EXISTS `procurement_material_receipt_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `procurement_material_receipt_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `receipt_id` int NOT NULL,
  `po_item_id` int NOT NULL,
  `received_quantity` decimal(14,2) NOT NULL,
  `remarks` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=53 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `procurement_material_receipt_items`
--

INSERT INTO `procurement_material_receipt_items` VALUES (3,2,3,50.00,'Good condition'),(4,2,4,30.00,'Good condition'),(5,3,6,500.00,NULL),(6,4,6,500.00,NULL),(35,1,41,400.00,'Checked bag seals intact'),(36,1,42,12.00,'Weighbridge certified'),(37,8,43,245.00,NULL),(38,8,44,190.00,NULL),(39,8,45,630.00,NULL),(40,8,46,20.00,NULL),(41,8,47,30.00,NULL),(42,8,48,200.00,NULL),(43,9,49,245.00,NULL),(44,9,50,190.00,NULL),(45,9,51,630.00,NULL),(46,9,52,20.00,NULL),(47,9,53,30.00,NULL),(48,9,54,200.00,NULL),(51,7,57,400.00,'Checked bag seals intact'),(52,7,58,12.00,'Weighbridge certified');

--
-- Table structure for table `procurement_material_receipts`
--

DROP TABLE IF EXISTS `procurement_material_receipts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `procurement_material_receipts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `receipt_number` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `po_id` int NOT NULL,
  `project_id` int NOT NULL,
  `vendor_id` int NOT NULL,
  `received_date` timestamp NOT NULL DEFAULT (now()),
  `received_by_id` int NOT NULL,
  `delivery_note_number` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `vehicle_number` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `driver_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `driver_contact` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `remarks` text COLLATE utf8mb4_unicode_ci,
  `attachment_urls` json NOT NULL DEFAULT (_utf8mb4'[]'),
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `updated_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`),
  UNIQUE KEY `procurement_material_receipts_receipt_number_unique` (`receipt_number`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `procurement_material_receipts`
--

INSERT INTO `procurement_material_receipts` VALUES (1,'GRN-2026-0001',1,1,4,'2026-05-07 04:45:00',19,'RID-DN-2026-0428','MH-12-AB-1234','Ramesh Kumar','+91 98765 12345','Material delivered in good condition. Some cartons had minor damage.','[\"uploads/grn-2026-0001-photo1.jpg\", \"uploads/grn-2026-0001-photo2.jpg\"]','2026-08-11 08:10:44','2026-08-11 08:10:44'),(2,'GRN-2026-0002',2,1,6,'2026-09-17 08:57:54',1,'DN-APEX-9982','MH-12-PQ-4521','Ramesh Kumar','+91 98765 43210','Received 50 I-Beams and 30 H-Beams at Hinjewadi site','[]','2026-09-17 08:57:54','2026-09-17 08:57:54'),(3,'GRN-20260918-0003',3,3,1,'2026-09-18 05:44:32',17,'DN-123456',NULL,NULL,NULL,'Test delivery receipt','[]','2026-09-18 11:14:32','2026-09-18 11:14:32'),(4,'GRN-20260918-0004',3,3,1,'2026-09-18 05:45:56',18,'DN-155719',NULL,NULL,NULL,'Delivery received on site.','[]','2026-09-18 11:15:55','2026-09-18 11:15:55'),(7,'GRN-20260923-0014',6,14,1,'2026-09-22 03:30:00',17,'DC-0014-9921','MH-12-QE-4481','Ramesh Pawar','+91 98231 44521','Full consignment arrived intact at Project 14 site gate.','[]','2026-09-30 07:41:35','2026-09-30 07:41:35'),(8,'GRN-20261005-0006',8,5,12,'2026-10-05 05:43:31',17,'DN-811388',NULL,NULL,NULL,'Delivery received on site.','[]','2026-10-05 11:13:31','2026-10-05 11:13:31'),(9,'GRN-20261005-0007',9,5,2,'2026-10-05 06:07:57',17,'DN-276872',NULL,NULL,NULL,'Delivery received on site.','[]','2026-10-05 11:37:56','2026-10-05 11:37:56');

--
-- Table structure for table `procurement_material_request_items`
--

DROP TABLE IF EXISTS `procurement_material_request_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `procurement_material_request_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `material_request_id` int NOT NULL,
  `item_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `specification` text COLLATE utf8mb4_unicode_ci,
  `quantity` decimal(14,2) NOT NULL,
  `unit` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `estimated_unit_price` decimal(14,2) DEFAULT NULL,
  `estimated_total` decimal(14,2) DEFAULT NULL,
  `sort_order` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=135 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `procurement_material_request_items`
--

INSERT INTO `procurement_material_request_items` VALUES (3,2,'Acoustic ceiling tiles 600x600','Fire-rated mineral fiber tiles','NRC 0.70, CAC 35, fire rating A',8500.00,'sqft',45.00,382500.00,0),(4,2,'T-grid suspension system','Galvanized steel grid','24mm width, load capacity 3kg/sqft',8500.00,'sqft',22.00,187000.00,1),(5,3,'Copper wiring 4mm single core','High-conductivity copper','IS 694:2010, 99.9% pure copper, PVC insulated',4500.00,'m',148.00,666000.00,0),(6,4,'Galvanized steel ducting 600x400mm','Rectangular duct sections','24 gauge, GI coated, flanged connections',250.00,'m',2400.00,600000.00,0),(7,4,'Flexible ducting insulation','Fiberglass insulation wrap','50mm thickness, R-value 3.5',280.00,'m',420.00,117600.00,1),(8,4,'Duct fittings and dampers','Elbows, reducers, volume dampers','Complete fitting set for 250m run',1.00,'lot',185000.00,185000.00,2),(9,6,'TMT Steel Bars 16mm','High-strength thermo-mechanically treated (TMT) steel bars for foundation reinforcement in Phase 2 construction.','Diameter: 16mm\n\nGrade: Fe-500D\n\nStandard: IS 1786:2008\n\nCorrosion-resistant, ribbed surface for better bonding with concrete',5000.00,'kg',65.00,325000.00,0),(10,6,'Portland Pozzolana Cement (PPC)','Cement required for concrete mix in foundation and slab casting for Phase 2 construction.','Grade: 43\n\nStandard: IS 1489 (Part 1):1991\n\nPackaging: 50 kg bags\n\nLow heat of hydration, suitable for mass concreting',200.00,'kg',350.00,70000.00,1),(11,7,'Ready-Mix Concrete (RMC)','Concrete mix for slab casting in Phase 2 construction','Grade: M25\n\nStandard: IS 456:2000\n\nSlump: 100–120 mm\n\nDelivered via transit mixer',50.00,'cubic meters (cum)',5000.00,250000.00,0),(12,7,'Binding Wire','Binding wire for tying reinforcement bars during slab and beam work','Diameter: 1.2 mm\n\nStandard: IS 280:2006\n\nAnnealed, soft, corrosion-resistant',100.00,'80',7999.91,799991.00,1),(13,8,'Cement',NULL,NULL,100.00,'bags',400.00,40000.00,0),(14,9,'Cement',NULL,NULL,100.00,'bags',400.00,40000.00,0),(15,10,'Expensive Equipment',NULL,NULL,5.00,'units',50000.00,250000.00,0),(16,12,'I-Beam Steel (8inch)',NULL,NULL,50.00,'pieces',4000.00,200000.00,0),(17,12,'H-Beam Steel (10inch)',NULL,NULL,30.00,'pieces',5500.00,165000.00,1),(18,13,'Luxury Fixtures',NULL,NULL,20.00,'sets',15000.00,300000.00,0),(19,14,' TMT Steel Bars 16mm','Thermo-mechanically treated steel bars for reinforcement','Diameter: 16mm\n\nGrade: Fe-500D\n\nStandard: IS 1786:2008\n\nRibbed surface for better bonding with concrete',3000.00,'kg',25.00,75000.00,0),(20,15,'TMT Steel Bars 16mm','Thermo-mechanically treated steel bars for reinforcement.','Diameter: 16mm\n\nGrade: Fe-500D\n\nStandard: IS 1786:2008\n\nRibbed surface for better bonding with concrete',300.00,'kg',45.00,13500.00,0),(21,16,' TMT Steel Bars 16mm',' Thermo-mechanically treated steel bars for reinforcement.','Diameter: 16mm\n\nGrade: Fe-500D\n\nStandard: IS 1786:2008\n\nRibbed surface for better bonding with concrete',5000.00,'kg',65.00,325000.00,0),(22,17,'Granite Floor Tiles','Polished granite tiles for flooring','600x600mm, 15mm thick, IS 14223 standard',2000.00,'sqft',120.00,240000.00,0),(23,17,'Decorative Lighting','LED chandeliers & sconces','40W LED, stainless steel + glass, BIS-certified',25.00,'pcs',8000.00,200000.00,1),(24,18,'TMT Steel Bars 16mm','Reinforcement bars for foundation work','IS 1786 Fe500D grade, corrosion-resistant',5000.00,'kg',65.00,325000.00,0),(25,19,'Ready-Mix Concrete (M25)','Concrete mix for structural casting','IS 456 standard, slump 75–100mm',50.00,'m³	',5500.00,275000.00,0),(26,19,'Structural Steel Sections','ISMB beams for support structures','IS 2062 E250 grade, 200mm depth',20.00,'pcs',9000.00,180000.00,1),(27,20,'Copper Wires (FRLS)','Flame-retardant low-smoke copper wires','IS 694 standard, 4 sq.mm, 90m rolls',500.00,'rolls',65.00,32500.00,0),(28,20,'PVC Conduits','Electrical conduits for wiring protection	','IS 9537 standard, 25mm diameter, heavy duty',500.00,'m',44.90,22450.00,1),(29,20,'LED Panel Lights		','Ceiling-mounted LED panels','2x2 ft, 40W, BIS-certified, warm white',100.00,'pcs',1200.00,120000.00,2),(30,21,'Copper Wires (FRLS)	IS 694 standard ','	Flame-retardant low-smoke copper wires','IS 694 standard, 2.5 sq.mm, 90m rolls',80.00,'rolls',799.85,63988.00,0),(31,21,'PVC Conduits		','Electrical conduits for wiring protection	','IS 9537 standard, 25mm diameter, heavy duty',600.00,'m',40.00,24000.00,1),(32,21,'Medical-Grade Switchboards	','	Modular switchboards for hospital wards','IS 3854 standard, 12-way, insulated	',15.00,'pcs',7500.00,112500.00,2),(33,22,'Marble Floor Tiles			','Premium marble tiles for lobby flooring','600x600mm, 18mm thick, polished finish',1499.87,'sqft',250.00,374967.50,0),(34,23,'TMT Steel Bars 20mm		','Reinforcement bars for heavy foundation','IS 1786 Fe500D grade, corrosion-resistant	',8000.00,'kg',68.00,544000.00,0),(35,23,'Cement (OPC 53 Grade)		','High-strength cement for structural work','	IS 12269 standard, 50kg bags',300.00,'bags',400.00,120000.00,1),(36,23,'Coarse Aggregate			','Crushed stone for concrete','20mm nominal size, IS 383 standard',25.00,'ton',1100.00,27500.00,2),(37,23,'Solid Concrete 		','Blocks	Masonry blocks for wall construction','IS 2185 standard, 400x200x200mm',5000.00,'pcs',60.00,300000.00,3),(38,24,'Solid Concrete		',' Blocks	Masonry blocks for wall construction','IS 2185 standard, 400x200x200mm',3000.00,'pcs',55.00,165000.00,0),(39,25,'TMT Steel Bars 16mm		','Reinforcement bars for structural work','IS 1786 Fe500D grade, corrosion-resistant	',6000.00,'kg',66.00,396000.00,0),(40,26,'Copper Wires (FRLS)	','	Flame-retardant low-smoke copper wires	','IS 694 standard, 2.5 sq.mm, 90m rolls',60.00,'rolls',190.00,11400.00,0),(41,27,' Copper wiring 4mm, LED panel lights 2x2',' Short note about usage',' Technical details (voltage, grade, IS standard, etc.)',500.00,'m',119.91,59955.00,0),(42,27,'LED Panel Lights 2x2',' Energy-efficient lighting for office floors and common areas','40W, 6500K cool white, IS certified, recessed mounting',150.00,'pcs',1200.00,180000.00,1),(43,28,' Decorative LED Wall Sconces','Stylish lighting fixtures for lobby ambiance','15W, warm white (3000K), brushed nickel finish, IS certified',40.00,'pcs',2500.00,100000.00,0),(44,29,' TMT Steel Bars 16mm',' Reinforcement bars for foundation and columns',' Fe500 grade, IS 1786 standard',50000.00,'kg',75.00,3750000.00,0),(45,29,'Ready-Mix Concrete (M25)',' Concrete mix for slab and beam casting','IS 456 standard, slump 100mm',50.00,' m³',50000.00,2500000.00,1),(46,30,'TMT Steel Bars 12mm','Reinforcement steel for columns	','IS 1786 Fe500D	',1500.00,'kg',240000.00,360000000.00,0),(47,30,'Cover Blocks			','Maintain concrete cover','M20 grade, 25mm & 40mm sizes',2000.00,'pcs',35.00,70000.00,1),(48,31,'Cement Bags (50kg)',NULL,'Grade 53',100.00,'bags',450.00,45000.00,0),(49,31,'Steel Rods (12mm)',NULL,'TMT Grade',50.00,'pieces',650.00,32500.00,1),(50,32,'Cement Bags (50kg)',NULL,'Grade 53',100.00,'bags',450.00,45000.00,0),(51,32,'Steel Rods (12mm)',NULL,'TMT Grade',50.00,'pieces',650.00,32500.00,1),(52,33,'Cement Bags (50kg)',NULL,'Grade 53',100.00,'bags',450.00,45000.00,0),(53,33,'Steel Rods (12mm)',NULL,'TMT Grade',50.00,'pieces',650.00,32500.00,1),(54,34,'Portland Cement OPC 53 Grade','High-strength cement suitable for structural works',' OPC 53 Grade, ISI certified, 50 kg bags',500.00,'bags',350.00,175000.00,0),(55,35,'Portland Cement OPC 53 Grade - Test','Testing fix',NULL,250.00,'bags',NULL,NULL,0),(56,36,'TMT 12mm Rebars',NULL,NULL,500.00,'kg',65.00,32500.00,0),(57,37,'cement opc',NULL,NULL,54.00,'nos',NULL,NULL,0),(84,39,'Cement Bags (50kg)',NULL,'Grade 53',100.00,'bags',450.00,45000.00,0),(85,39,'Steel Rods (12mm)',NULL,'TMT Grade',50.00,'pieces',650.00,32500.00,1),(86,40,'Cement Bags (50kg)',NULL,'Grade 53',100.00,'bags',450.00,45000.00,0),(87,40,'Steel Rods (12mm)',NULL,'TMT Grade',50.00,'pieces',650.00,32500.00,1),(88,41,'Cement Bags (50kg)',NULL,'Grade 53',100.00,'bags',450.00,45000.00,0),(89,41,'Steel Rods (12mm)',NULL,'TMT Grade',50.00,'pieces',650.00,32500.00,1),(90,42,'Cement Bags (50kg)',NULL,'Grade 53',100.00,'bags',450.00,45000.00,0),(91,42,'Steel Rods (12mm)',NULL,'TMT Grade',50.00,'pieces',650.00,32500.00,1),(92,43,'Cement Bags (50kg)',NULL,'Grade 53',100.00,'bags',450.00,45000.00,0),(93,43,'Steel Rods (12mm)',NULL,'TMT Grade',50.00,'pieces',650.00,32500.00,1),(94,44,'Cement Bags (50kg)',NULL,'Grade 53',100.00,'bags',450.00,45000.00,0),(95,44,'Steel Rods (12mm)',NULL,'TMT Grade',50.00,'pieces',650.00,32500.00,1),(96,45,'Cement Bags (50kg)',NULL,'Grade 53',100.00,'bags',450.00,45000.00,0),(97,45,'Steel Rods (12mm)',NULL,'TMT Grade',50.00,'pieces',650.00,32500.00,1),(98,46,'Cement Bags (50kg)',NULL,'Grade 53',100.00,'bags',450.00,45000.00,0),(99,46,'Steel Rods (12mm)',NULL,'TMT Grade',50.00,'pieces',650.00,32500.00,1),(100,47,'Cement Bags (50kg)',NULL,'Grade 53',100.00,'bags',450.00,45000.00,0),(101,47,'Steel Rods (12mm)',NULL,'TMT Grade',50.00,'pieces',650.00,32500.00,1),(102,48,'Cement Bags (50kg)',NULL,'Grade 53',100.00,'bags',450.00,45000.00,0),(103,48,'Steel Rods (12mm)',NULL,'TMT Grade',50.00,'pieces',650.00,32500.00,1),(104,49,'Cement Bags (50kg)',NULL,'Grade 53',100.00,'bags',450.00,45000.00,0),(105,49,'Steel Rods (12mm)',NULL,'TMT Grade',50.00,'pieces',650.00,32500.00,1),(122,1,'OPC 53 Grade Ultratech Cement','50kg HDPE bags, fresh batch compliant with IS 12269','IS 12269 certified, 28-day strength >= 53 MPa',400.00,'bags',420.00,168000.00,0),(123,1,'TMT Fe500D Reinforcement Steel 16mm','High yield strength corrosion resistant thermo-mechanically treated rebar','IS 1786 certified, Fe500D ductile grade',12.00,'MT',68000.00,816000.00,1),(124,51,'M s 100 mm Elbow',' Mild steel elbow fitting, 100 mm size, used for piping connections','IS standard grade, corrosion‑resistant, suitable for plumbing installations',245.00,'nos',10.00,2450.00,0),(125,51,'M S Flange Size 80-mm','','',190.00,'nos',10.00,1900.00,1),(126,51,'M S 150 MM ELBOW','','',630.00,'nos',20.00,12600.00,2),(127,51,'GI U BOLT 80 MM','','',20.00,'nos',28.00,560.00,3),(128,51,'GI U BOLT 100 MM','','',30.00,'nos',31.00,930.00,4),(129,51,'GI U BOLT 150 MM','','',200.00,'nos',37.00,7400.00,5),(132,50,'OPC 53 Grade Ultratech Cement','50kg HDPE bags, fresh batch compliant with IS 12269','IS 12269 certified, 28-day strength >= 53 MPa',400.00,'bags',420.00,168000.00,0),(133,50,'TMT Fe500D Reinforcement Steel 16mm','High yield strength corrosion resistant thermo-mechanically treated rebar','IS 1786 certified, Fe500D ductile grade',12.00,'MT',68000.00,816000.00,1);

--
-- Table structure for table `procurement_material_requests`
--

DROP TABLE IF EXISTS `procurement_material_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `procurement_material_requests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `request_number` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `project_id` int NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `category` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `priority` varchar(16) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'medium',
  `required_date` date NOT NULL,
  `submitted_at` timestamp NULL DEFAULT NULL,
  `status` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `requested_by_id` int NOT NULL,
  `assigned_manager_id` int DEFAULT NULL,
  `approved_by_id` int DEFAULT NULL,
  `rejected_by_id` int DEFAULT NULL,
  `approval_date` timestamp NULL DEFAULT NULL,
  `approval_comments` text COLLATE utf8mb4_unicode_ci,
  `rejection_date` timestamp NULL DEFAULT NULL,
  `rejection_reason` text COLLATE utf8mb4_unicode_ci,
  `estimated_cost` decimal(14,2) DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `updated_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`),
  UNIQUE KEY `procurement_material_requests_request_number_unique` (`request_number`)
) ENGINE=InnoDB AUTO_INCREMENT=53 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `procurement_material_requests`
--

INSERT INTO `procurement_material_requests` VALUES (1,'MR-2026-0001',1,'Structural Grade Cement (OPC 53) & TMT Steel Fe500','High-grade vinyl flooring with 10-year warranty for executive floors','Interior Materials','high','2026-05-15',NULL,'approved',19,NULL,18,NULL,'2026-04-10 03:30:00',NULL,NULL,NULL,850000.00,'Client prefers German brand if available','2026-08-11 08:10:44','2026-10-05 00:42:57'),(2,'MR-2026-0002',1,'Suspended ceiling tiles for Floors 4-6','Acoustic ceiling tiles with fire rating','Civil Materials','medium','2026-05-20',NULL,'approved',19,NULL,17,NULL,'2026-08-17 03:57:35',NULL,NULL,NULL,420000.00,'Requires manager approval','2026-08-11 08:10:44','2026-08-17 03:57:35'),(3,'MR-2026-0003',2,'Copper wiring 4mm for riser shaft','High-conductivity copper wiring for electrical risers','Electrical','urgent','2026-04-28',NULL,'rejected',19,NULL,NULL,18,NULL,NULL,'2026-04-18 09:00:00','Budget constraints - Please revise specification to standard grade',680000.00,NULL,'2026-08-11 08:10:44','2026-08-11 08:10:44'),(4,'MR-2026-0004',2,'HVAC ducting materials','Galvanized steel ducting for floors 15-18','MEP','high','2026-05-10',NULL,'rfq_generated',19,NULL,18,NULL,'2026-04-15 05:30:00',NULL,NULL,NULL,1250000.00,NULL,'2026-08-11 08:10:44','2026-08-11 08:10:44'),(5,'MR-2026-0005',1,'LED lighting fixtures - conference rooms','Energy-efficient LED panels with smart controls','Electrical','medium','2026-05-25',NULL,'draft',19,NULL,NULL,NULL,NULL,NULL,NULL,NULL,320000.00,NULL,'2026-08-11 08:10:44','2026-08-11 08:10:44'),(6,'MR-20260811-0006',7,'Steel bars for foundation work','Requesting procurement of steel bars required for Phase 2 foundation work. Materials must meet IS standards for civil construction and be delivered to site before the required date.','civil','medium','2026-08-12',NULL,'approved',17,NULL,17,NULL,'2026-08-11 05:25:16',NULL,NULL,NULL,395000.00,NULL,'2026-08-11 10:54:10','2026-08-11 05:25:16'),(7,'MR-20260821-0007',7,'Concrete Mix for Slab Casting','Requesting procurement of ready-mix concrete for slab casting in Phase 2. Materials must comply with IS standards and be delivered in transit mixers directly to site.','civil','medium','2026-08-24',NULL,'approved',17,NULL,17,NULL,'2026-08-21 07:52:25',NULL,NULL,NULL,1049991.00,'Delivery schedule must align with casting plan','2026-08-21 06:52:07','2026-08-21 07:52:25'),(8,'MR-20260824-0008',1,'Test Materials - 13:32:53',NULL,'civil','high','2026-09-15','2026-08-24 02:32:54','approved',17,18,17,NULL,'2026-08-24 02:32:54','Test approval from API',NULL,NULL,NULL,NULL,'2026-08-24 08:02:53','2026-08-24 02:32:54'),(9,'MR-20260824-0009',1,'Test Materials - 13:34:13',NULL,'civil','high','2026-09-15','2026-08-24 02:34:13','rfq_generated',17,18,17,NULL,'2026-08-24 02:34:14','Approved! Budget confirmed.',NULL,NULL,NULL,NULL,'2026-08-24 08:04:13','2026-08-24 02:35:23'),(10,'MR-20260824-0010',1,'Over-Budget Materials Request',NULL,'mechanical','low','2026-10-01','2026-08-24 02:34:49','rejected',17,18,NULL,17,NULL,NULL,'2026-08-24 02:34:49','Budget exceeded for this quarter. Please resubmit with lower cost alternatives.',NULL,NULL,'2026-08-24 08:04:48','2026-08-24 02:34:49'),(11,'MR-20260824-0011',1,'Empty Request',NULL,'civil','low','2026-09-15',NULL,'draft',17,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-08-24 08:05:22','2026-08-24 08:05:22'),(12,'MR-20260824-0012',1,'Steel Beams for Main Structure','High-grade steel beams required for structural support','civil','high','2026-09-20','2026-08-24 02:36:58','rfq_generated',17,18,17,NULL,'2026-08-24 02:36:59','Approved. Budget verified and allocated.',NULL,NULL,250000.00,NULL,'2026-08-24 08:06:57','2026-08-24 02:36:59'),(13,'MR-20260824-0013',1,'Premium Finishing Materials',NULL,'mechanical','low','2026-10-15','2026-08-24 02:36:59','rejected',17,18,NULL,17,NULL,NULL,'2026-08-24 02:36:59','Budget constraints. Please revise with cost-effective alternatives.',NULL,NULL,'2026-08-24 08:06:59','2026-08-24 02:36:59'),(14,'MR-20260824-0014',8,'Steel bars for foundation work (example — update as needed)','Requesting procurement of civil materials required for foundation and structural works. Ensure compliance with IS standards and timely delivery.','civil','medium','2026-08-24','2026-08-24 22:41:24','approved',17,18,17,NULL,'2026-08-24 22:41:40',NULL,NULL,NULL,75000.00,'Vendor must provide quality certificates and batch numbers','2026-08-24 08:31:53','2026-08-24 22:41:40'),(15,'MR-20260824-0015',10,'Steel bars for foundation work','Requesting procurement of civil materials required for foundation and structural works. Ensure compliance with IS standards and timely delivery.','civil','medium','2026-08-28','2026-08-24 08:13:19','approved',17,18,17,NULL,'2026-08-24 22:54:37','Approved for foundation work. Please proceed with procurement.',NULL,NULL,13500.00,NULL,'2026-08-24 13:40:19','2026-08-24 22:54:37'),(16,'MR-20260824-0016',7,'Steel bars for foundation work','Requesting procurement of civil materials required for Phase 2 construction. Ensure compliance with IS standards and timely delivery.','civil','medium','2026-08-29','2026-08-24 08:19:45','approved',17,18,17,NULL,'2026-08-24 08:20:50',NULL,NULL,NULL,325000.00,NULL,'2026-08-24 13:48:30','2026-08-24 08:20:50'),(17,'MR-20260825-0017',11,'Granite Tiles & Fixtures for Lobby Upgrade','Requesting civil materials for flooring, lighting, and wall finishing as part of the lobby refresh project.','civil','medium','2026-08-30','2026-08-24 23:04:38','approved',17,18,17,NULL,'2026-08-24 23:04:43',NULL,NULL,NULL,440000.00,NULL,'2026-08-25 04:34:07','2026-08-24 23:04:43'),(18,'MR-20260825-0018',7,'Steel Bars & Civil Materials for Foundation Work',' Requesting civil construction materials for foundation reinforcement and finishing.','civil','medium','2026-08-31','2026-08-24 23:45:56','approved',17,18,17,NULL,'2026-08-24 23:48:07',NULL,NULL,NULL,325000.00,NULL,'2026-08-25 05:15:14','2026-08-24 23:48:07'),(19,'MR-20260825-0019',7,'Concrete Mix & Masonry Materials for Structural Work','Requesting essential civil materials for concrete casting, blockwork, and finishing in Phase 2 construction.','civil','medium','2026-09-03','2026-08-25 00:09:09','approved',17,18,17,NULL,'2026-08-25 00:11:14',NULL,NULL,NULL,455000.00,NULL,'2026-08-25 05:28:27','2026-08-25 00:11:14'),(20,'MR-20260825-0020',6,'Electrical Wiring & Fixtures for Tower B',' Requesting electrical materials for wiring, lighting, and distribution systems in Tower B.','electrical','medium','2026-09-05','2026-08-25 00:28:31','approved',17,18,17,NULL,'2026-08-25 03:35:40',NULL,NULL,NULL,174950.00,NULL,'2026-08-25 05:57:34','2026-08-25 03:35:40'),(21,'MR-20260825-0021',3,'Electrical Wiring & Hospital Fixtures','Requesting electrical materials for patient wards, diagnostic rooms, and common areas in the East Wing.','electrical','high','2026-08-30','2026-08-25 04:35:23','approved',21,18,18,NULL,'2026-08-25 05:23:22',NULL,NULL,NULL,200488.00,NULL,'2026-08-25 09:59:02','2026-08-25 05:23:22'),(22,'MR-20260825-0022',11,'Lobby Flooring & Finishing Materials','Requesting civil materials for flooring, wall finishing, and decorative elements in the lobby area.','civil','urgent','2026-08-27',NULL,'draft',17,NULL,NULL,NULL,NULL,NULL,NULL,NULL,374967.50,NULL,'2026-08-25 10:17:20','2026-08-25 10:17:20'),(23,'MR-20260825-0023',10,' Structural & Civil Materials for Phase 1',' Requesting civil materials for foundation, flooring, and wall construction in the logistics hub.','civil','low','2026-08-26','2026-08-25 05:15:25','approved',17,18,17,NULL,'2026-08-25 05:15:51',NULL,NULL,NULL,991500.00,NULL,'2026-08-25 10:40:05','2026-08-25 05:15:51'),(24,'MR-20260825-0024',8,'steel bars and foundation','Requesting civil materials for foundation, flooring, and wall construction ','civil','low','2026-08-28','2026-08-25 05:21:25','approved',19,18,18,NULL,'2026-08-25 05:22:41',NULL,NULL,NULL,165000.00,NULL,'2026-08-25 10:49:58','2026-08-25 05:22:41'),(25,'MR-20260825-0025',3,'Structural & Finishing Materials for Hospital Wing',' Requesting civil materials for foundation reinforcement, wall construction, and finishing works in the East Wing.','civil','high','2026-08-29','2026-08-25 05:48:19','approved',19,18,18,NULL,'2026-09-15 23:31:08',NULL,NULL,NULL,396000.00,NULL,'2026-08-25 11:18:00','2026-09-15 23:31:08'),(26,'MR-20260825-0026',5,'Electrical Fixtures & Wiring for Lobby','Requesting electrical materials for lighting, wiring, and distribution systems in the lobby area.','electrical','medium','2026-09-01','2026-08-25 06:29:14','approved',19,18,17,NULL,'2026-08-26 01:30:09',NULL,NULL,NULL,11400.00,NULL,'2026-08-25 11:36:57','2026-08-26 01:30:09'),(27,'MR-20260826-0027',6,' A clear subject like “Electrical wiring for Tower B” or “LED fixtures for lobby','Add context, e.g., “Supply and installation of electrical wiring and fixtures for Tower B common areas','electrical','medium','2026-09-15','2026-08-26 01:13:41','approved',19,18,18,NULL,'2026-09-17 04:48:11',NULL,NULL,NULL,239955.00,NULL,'2026-08-26 06:43:24','2026-09-17 04:48:11'),(28,'MR-20260826-0028',5,'Lobby Lighting Fixtures and Wiring','Supply and installation of decorative lighting, wiring, and electrical panels for lobby enhancement.','electrical','medium','2026-09-14','2026-08-26 01:40:42','approved',21,18,18,NULL,'2026-09-16 07:03:34',NULL,NULL,NULL,100000.00,NULL,'2026-08-26 07:08:53','2026-09-16 07:03:34'),(29,'MR-20260826-0029',2,'Reinforcement Steel for Foundation Work',NULL,'civil','','2026-08-28','2026-08-26 01:55:38','approved',19,18,17,NULL,'2026-09-16 06:51:35',NULL,NULL,NULL,6250000.00,'Supply and installation of civil construction materials for foundation and structural works.','2026-08-26 07:25:01','2026-09-16 06:51:35'),(30,'MR-20260917-0030',2,' Steel bars for foundation work',' Requesting reinforcement steel bars for foundation slab and columns.','civil','medium','2026-09-29',NULL,'draft',17,NULL,NULL,NULL,NULL,NULL,NULL,NULL,360070000.00,NULL,'2026-09-17 09:27:55','2026-09-17 04:07:01'),(31,'MR-20260917-0031',1,'Demo Material Request - 3:29:59 pm','Testing end-to-end procurement workflow','civil','high','2026-10-17',NULL,'draft',17,NULL,NULL,NULL,NULL,NULL,NULL,NULL,50000.00,NULL,'2026-09-17 09:59:59','2026-09-17 09:59:59'),(32,'MR-20260917-0032',1,'Demo Material Request - 3:30:02 pm','Testing end-to-end procurement workflow','civil','high','2026-10-17',NULL,'draft',17,NULL,NULL,NULL,NULL,NULL,NULL,NULL,50000.00,NULL,'2026-09-17 10:00:02','2026-09-17 10:00:02'),(33,'MR-20260917-0033',1,'Demo Material Request - 3:37:26 pm','Testing end-to-end procurement workflow','civil','high','2026-10-17','2026-09-17 04:42:37','approved',17,18,18,NULL,'2026-09-17 04:46:19',NULL,NULL,NULL,50000.00,NULL,'2026-09-17 10:07:26','2026-09-17 04:46:19'),(34,'MR-20260918-0034',3,'Portland Cement for slab casting','Cement required for slab concreting and column reinforcement in the East Wing.','civil','high','2026-09-29','2026-09-18 02:36:15','fulfilled',19,18,18,NULL,'2026-09-18 02:37:05',NULL,NULL,NULL,175000.00,NULL,'2026-09-18 05:38:57','2026-09-18 05:45:56'),(35,'MR-20260919-0035',8,'Portland Cement OPC 53 Grade - Test','Testing fix','civil','medium','2026-09-19',NULL,'draft',21,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-09-19 09:35:56','2026-09-19 09:35:56'),(36,'MR-20260919-0036',8,'Steel Reinforcement Bars','Grade Fe500D','civil','high','2026-09-25',NULL,'draft',21,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-09-19 09:36:10','2026-09-19 09:36:10'),(37,'MR-20260919-0037',9,'cement opc',NULL,'civil','medium','2026-09-19',NULL,'draft',17,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-09-19 09:39:37','2026-09-19 09:39:37'),(39,'MR-20260925-0039',1,'Demo Material Request - 11:37:35 am','Testing end-to-end procurement workflow','civil','high','2026-10-25',NULL,'draft',17,NULL,NULL,NULL,NULL,NULL,NULL,NULL,50000.00,NULL,'2026-09-25 06:07:35','2026-09-25 06:07:35'),(40,'MR-20260925-0040',1,'Demo Material Request - 11:37:37 am','Testing end-to-end procurement workflow','civil','high','2026-10-25','2026-10-05 05:02:52','approved',17,18,18,NULL,'2026-10-05 05:03:53',NULL,NULL,NULL,50000.00,NULL,'2026-09-25 06:07:37','2026-10-05 05:03:53'),(41,'MR-20260925-0041',1,'Demo Material Request - 11:37:40 am','Testing end-to-end procurement workflow','civil','high','2026-10-25',NULL,'draft',17,NULL,NULL,NULL,NULL,NULL,NULL,NULL,50000.00,NULL,'2026-09-25 06:07:40','2026-09-25 06:07:40'),(42,'MR-20260925-0042',1,'Demo Material Request - 11:37:41 am','Testing end-to-end procurement workflow','civil','high','2026-10-25',NULL,'draft',17,NULL,NULL,NULL,NULL,NULL,NULL,NULL,50000.00,NULL,'2026-09-25 06:07:41','2026-09-25 06:07:41'),(43,'MR-20260925-0043',1,'Demo Material Request - 11:37:42 am','Testing end-to-end procurement workflow','civil','high','2026-10-25',NULL,'draft',17,NULL,NULL,NULL,NULL,NULL,NULL,NULL,50000.00,NULL,'2026-09-25 06:07:42','2026-09-25 06:07:42'),(44,'MR-20260925-0044',1,'Demo Material Request - 11:37:43 am','Testing end-to-end procurement workflow','civil','high','2026-10-25',NULL,'draft',17,NULL,NULL,NULL,NULL,NULL,NULL,NULL,50000.00,NULL,'2026-09-25 06:07:43','2026-09-25 06:07:43'),(45,'MR-20260925-0045',1,'Demo Material Request - 11:37:43 am','Testing end-to-end procurement workflow','civil','high','2026-10-25',NULL,'draft',17,NULL,NULL,NULL,NULL,NULL,NULL,NULL,50000.00,NULL,'2026-09-25 06:07:43','2026-09-25 06:07:43'),(46,'MR-20260925-0046',1,'Demo Material Request - 11:37:43 am','Testing end-to-end procurement workflow','civil','high','2026-10-25',NULL,'draft',17,NULL,NULL,NULL,NULL,NULL,NULL,NULL,50000.00,NULL,'2026-09-25 06:07:43','2026-09-25 06:07:43'),(47,'MR-20260925-0047',1,'Demo Material Request - 11:37:44 am','Testing end-to-end procurement workflow','civil','high','2026-10-25',NULL,'draft',17,NULL,NULL,NULL,NULL,NULL,NULL,NULL,50000.00,NULL,'2026-09-25 06:07:44','2026-09-25 06:07:44'),(48,'MR-20260925-0048',1,'Demo Material Request - 11:37:44 am','Testing end-to-end procurement workflow','civil','high','2026-10-25','2026-10-07 06:13:46','rfq_generated',17,17,17,NULL,'2026-10-07 06:14:33','Approved',NULL,NULL,50000.00,NULL,'2026-09-25 06:07:44','2026-10-07 06:27:30'),(49,'MR-20260925-0049',1,'Demo Material Request - 11:37:44 am','Testing end-to-end procurement workflow','civil','high','2026-10-25','2026-10-07 05:55:31','rfq_generated',17,17,17,NULL,'2026-10-07 06:13:04','Approved by project manager',NULL,NULL,50000.00,NULL,'2026-09-25 06:07:44','2026-10-08 04:53:20'),(50,'MR-20260923-0012',14,'Structural Grade Cement (OPC 53) & TMT Steel Fe500','Immediate procurement for Foundation & Footings Phase 1 concrete casting.','civil','high','2026-09-25',NULL,'approved',17,NULL,17,NULL,'2026-09-30 02:01:08','Approved for footing concrete casting schedule.',NULL,NULL,984000.00,NULL,'2026-09-30 07:31:08','2026-10-05 23:48:55'),(51,'MR-20261005-0050',5,'Lobby seating and decorative fixtures','Delivery and installation must be completed before the required date.','civil','medium','2026-10-16','2026-10-05 05:05:04','fulfilled',17,18,18,NULL,'2026-10-05 05:05:19',NULL,NULL,NULL,25840.00,NULL,'2026-10-05 10:30:30','2026-10-05 06:07:58');

--
-- Table structure for table `procurement_notifications`
--

DROP TABLE IF EXISTS `procurement_notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `procurement_notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `notification_type` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci,
  `resource_type` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `resource_id` int NOT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT '0',
  `read_at` timestamp NULL DEFAULT NULL,
  `priority` varchar(16) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'normal',
  `created_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=71 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `procurement_notifications`
--

INSERT INTO `procurement_notifications` VALUES (1,19,'material_request_approved','Material Request MR-2026-0001 Approved','Your material request for premium vinyl flooring has been approved by the manager.','material_request',1,1,'2026-04-10 04:30:00','normal','2026-08-11 08:10:44'),(2,19,'material_request_rejected','Material Request MR-2026-0003 Rejected','Your material request for copper wiring has been rejected. Reason: Budget constraints - Please revise specification to standard grade','material_request',3,1,'2026-04-18 09:30:00','high','2026-08-11 08:10:44'),(3,21,'rfq_created','New RFQ RFQ-2026-0001 Created','RFQ for premium vinyl flooring created from approved material request MR-2026-0001','rfq',1,1,'2026-04-11 05:00:00','normal','2026-08-11 08:10:44'),(4,21,'quote_received','Quote Received for RFQ-2026-0001','Ridgeline Interiors has submitted a quote: ₹9,41,640','vendor_quote',1,1,'2026-04-15 09:30:00','normal','2026-08-11 08:10:44'),(5,19,'po_issued','Purchase Order PO-2026-0001 Issued','PO issued to Ridgeline Interiors for vinyl flooring. Expected delivery: May 7, 2026','purchase_order',1,1,'2026-04-19 06:30:00','normal','2026-08-11 08:10:44'),(6,19,'material_delivered','Material Delivered - PO-2026-0001','Vinyl flooring materials have been delivered to Sentinel site. Please conduct quality inspection.','material_receipt',1,1,'2026-05-07 05:00:00','high','2026-08-11 08:10:44'),(7,21,'inspection_completed','Quality Inspection Completed - QI-2026-0001','Quality inspection completed for vinyl flooring. Result: Partial Approved (11,850 sqft accepted, 150 sqft rejected)','quality_inspection',1,1,'2026-05-07 11:00:00','normal','2026-08-11 08:10:44'),(8,21,'quality_rejected','Partial Rejection - PO-2026-0001','150 sqft tiles rejected due to transport damage. Follow-up required with vendor for replacement.','quality_inspection',1,0,NULL,'high','2026-08-11 08:10:44'),(9,18,'material_request_pending','Material Request Pending Approval','Material request MR-2026-0002 for suspended ceiling tiles is awaiting your approval.','material_request',2,0,NULL,'normal','2026-08-11 08:10:44'),(10,21,'low_stock_alert','Low Stock Alert - Cement OPC 53','Cement stock is below minimum level. Current: 140 bags, Minimum: 200 bags. Please initiate procurement.','inventory_item',3,0,NULL,'urgent','2026-08-11 08:10:44'),(11,21,'low_stock_alert','Low Stock Alert - TMT Steel Bars 12mm','TMT steel bars stock is below reorder level. Current: 950 kg, Reorder Level: 3000 kg.','inventory_item',4,0,NULL,'high','2026-08-11 08:10:44'),(12,17,'material_request_approved','Material Request Approved','Your material request \"Steel bars for foundation work\" has been approved.','material_request',6,0,NULL,'normal','2026-08-11 10:55:16'),(13,19,'material_request_approved','Material Request Approved','Your material request \"Suspended ceiling tiles for Floors 4-6\" has been approved.','material_request',2,0,NULL,'normal','2026-08-17 09:27:35'),(14,17,'material_request_approved','Material Request Approved','Your material request \"Concrete Mix for Slab Casting\" has been approved.','material_request',7,0,NULL,'normal','2026-08-21 13:22:25'),(15,18,'material_request_submitted','New Material Request Awaiting Approval','Material Request MR-20260824-0008 for \"Test Materials - 13:32:53\" requires your approval.','material_request',8,0,NULL,'high','2026-08-24 08:02:53'),(16,18,'material_request_submitted','New Material Request Awaiting Approval','Material Request MR-20260824-0009 for \"Test Materials - 13:34:13\" requires your approval.','material_request',9,0,NULL,'high','2026-08-24 08:04:13'),(17,17,'material_request_approved','Material Request Approved','Your material request \"Test Materials - 13:34:13\" (MR-20260824-0009) has been approved by Ananya Rao. Comments: Approved! Budget confirmed.','material_request',9,0,NULL,'normal','2026-08-24 08:04:13'),(18,18,'material_request_submitted','New Material Request Awaiting Approval','Material Request MR-20260824-0010 for \"Over-Budget Materials Request\" requires your approval.','material_request',10,0,NULL,'high','2026-08-24 08:04:48'),(19,17,'material_request_rejected','Material Request Rejected','Your material request \"Over-Budget Materials Request\" (MR-20260824-0010) has been rejected by Ananya Rao. Reason: Budget exceeded for this quarter. Please resubmit with lower cost alternatives.','material_request',10,0,NULL,'high','2026-08-24 08:04:49'),(20,18,'material_request_submitted','New Material Request Awaiting Approval','Material Request MR-20260824-0012 for \"Steel Beams for Main Structure\" requires your approval.','material_request',12,0,NULL,'high','2026-08-24 08:06:57'),(21,17,'material_request_approved','Material Request Approved','Your material request \"Steel Beams for Main Structure\" (MR-20260824-0012) has been approved by Ananya Rao. Comments: Approved. Budget verified and allocated.','material_request',12,0,NULL,'normal','2026-08-24 08:06:58'),(22,18,'material_request_submitted','New Material Request Awaiting Approval','Material Request MR-20260824-0013 for \"Premium Finishing Materials\" requires your approval.','material_request',13,0,NULL,'high','2026-08-24 08:06:59'),(23,17,'material_request_rejected','Material Request Rejected','Your material request \"Premium Finishing Materials\" (MR-20260824-0013) has been rejected by Ananya Rao. Reason: Budget constraints. Please revise with cost-effective alternatives.','material_request',13,0,NULL,'high','2026-08-24 08:06:59'),(24,18,'material_request_submitted','New Material Request Awaiting Approval','Material Request MR-20260824-0015 for \"Steel bars for foundation work\" requires your approval.','material_request',15,0,NULL,'high','2026-08-24 13:43:18'),(25,18,'material_request_submitted','New Material Request Awaiting Approval','Material Request MR-20260824-0016 for \"Steel bars for foundation work\" requires your approval.','material_request',16,0,NULL,'high','2026-08-24 13:49:44'),(26,17,'material_request_approved','Material Request Approved','Your material request \"Steel bars for foundation work\" (MR-20260824-0016) has been approved by Ananya Rao.','material_request',16,0,NULL,'normal','2026-08-24 13:50:50'),(27,18,'material_request_submitted','New Material Request Awaiting Approval','Material Request MR-20260824-0014 for \"Steel bars for foundation work (example — update as needed)\" requires your approval.','material_request',14,0,NULL,'high','2026-08-25 04:11:23'),(28,17,'material_request_approved','Material Request Approved','Your material request \"Steel bars for foundation work (example — update as needed)\" (MR-20260824-0014) has been approved by Ananya Rao.','material_request',14,0,NULL,'normal','2026-08-25 04:11:39'),(29,17,'material_request_approved','Material Request Approved','Your material request \"Steel bars for foundation work\" (MR-20260824-0015) has been approved by Ananya Rao. Comments: Approved for foundation work. Please proceed with procurement.','material_request',15,0,NULL,'normal','2026-08-25 04:24:37'),(30,18,'material_request_submitted','New Material Request Awaiting Approval','Material Request MR-20260825-0017 for \"Granite Tiles & Fixtures for Lobby Upgrade\" requires your approval.','material_request',17,0,NULL,'high','2026-08-25 04:34:37'),(31,17,'material_request_approved','Material Request Approved','Your material request \"Granite Tiles & Fixtures for Lobby Upgrade\" (MR-20260825-0017) has been approved by Ananya Rao.','material_request',17,0,NULL,'normal','2026-08-25 04:34:42'),(32,18,'material_request_submitted','New Material Request Awaiting Approval','Material Request MR-20260825-0018 for \"Steel Bars & Civil Materials for Foundation Work\" requires your approval.','material_request',18,0,NULL,'high','2026-08-25 05:15:56'),(33,17,'material_request_approved','Material Request Approved','Your material request \"Steel Bars & Civil Materials for Foundation Work\" (MR-20260825-0018) has been approved by Ananya Rao.','material_request',18,0,NULL,'normal','2026-08-25 05:18:06'),(34,18,'material_request_submitted','New Material Request Awaiting Approval','Material Request MR-20260825-0019 for \"Concrete Mix & Masonry Materials for Structural Work\" requires your approval.','material_request',19,0,NULL,'high','2026-08-25 05:39:09'),(35,17,'material_request_approved','Material Request Approved','Your material request \"Concrete Mix & Masonry Materials for Structural Work\" (MR-20260825-0019) has been approved by Ananya Rao.','material_request',19,0,NULL,'normal','2026-08-25 05:41:14'),(36,18,'material_request_submitted','New Material Request Awaiting Approval','Material Request MR-20260825-0020 for \"Electrical Wiring & Fixtures for Tower B\" requires your approval.','material_request',20,0,NULL,'high','2026-08-25 05:58:30'),(37,17,'material_request_approved','Material Request Approved','Your material request \"Electrical Wiring & Fixtures for Tower B\" (MR-20260825-0020) has been approved by Ananya Rao.','material_request',20,0,NULL,'normal','2026-08-25 09:05:39'),(38,18,'material_request_submitted','New Material Request Awaiting Approval','Material Request MR-20260825-0021 for \"Electrical Wiring & Hospital Fixtures\" requires your approval.','material_request',21,0,NULL,'high','2026-08-25 10:05:23'),(39,18,'material_request_submitted','New Material Request Awaiting Approval','Material Request MR-20260825-0023 for \" Structural & Civil Materials for Phase 1\" requires your approval.','material_request',23,0,NULL,'high','2026-08-25 10:45:25'),(40,17,'material_request_approved','Material Request Approved','Your material request \" Structural & Civil Materials for Phase 1\" (MR-20260825-0023) has been approved by Ananya Rao.','material_request',23,0,NULL,'normal','2026-08-25 10:45:50'),(41,18,'material_request_submitted','New Material Request Awaiting Approval','Material Request MR-20260825-0024 for \"steel bars and foundation\" requires your approval.','material_request',24,0,NULL,'high','2026-08-25 10:51:25'),(42,19,'material_request_approved','Material Request Approved','Your material request \"steel bars and foundation\" (MR-20260825-0024) has been approved by Rohan Mehta.','material_request',24,0,NULL,'normal','2026-08-25 10:52:41'),(43,21,'material_request_approved','Material Request Approved','Your material request \"Electrical Wiring & Hospital Fixtures\" (MR-20260825-0021) has been approved by Rohan Mehta.','material_request',21,0,NULL,'normal','2026-08-25 10:53:22'),(44,18,'material_request_submitted','New Material Request Awaiting Approval','Material Request MR-20260825-0025 for \"Structural & Finishing Materials for Hospital Wing\" requires your approval.','material_request',25,0,NULL,'high','2026-08-25 11:18:19'),(45,18,'material_request_submitted','New Material Request Awaiting Approval','Material Request MR-20260825-0026 for \"Electrical Fixtures & Wiring for Lobby\" requires your approval.','material_request',26,0,NULL,'high','2026-08-25 11:59:13'),(46,18,'material_request_submitted','New Material Request Awaiting Approval','Material Request MR-20260826-0027 for \" A clear subject like “Electrical wiring for Tower B” or “LED fixtures for lobby\" requires your approval.','material_request',27,0,NULL,'high','2026-08-26 06:43:41'),(47,19,'material_request_approved','Material Request Approved','Your material request \"Electrical Fixtures & Wiring for Lobby\" (MR-20260825-0026) has been approved by Ananya Rao.','material_request',26,0,NULL,'normal','2026-08-26 07:00:08'),(48,18,'material_request_submitted','New Material Request Awaiting Approval','Material Request MR-20260826-0028 for \"Lobby Lighting Fixtures and Wiring\" requires your approval.','material_request',28,0,NULL,'high','2026-08-26 07:10:41'),(49,18,'material_request_submitted','New Material Request Awaiting Approval','Material Request MR-20260826-0029 for \"Reinforcement Steel for Foundation Work\" requires your approval.','material_request',29,0,NULL,'high','2026-08-26 07:25:37'),(50,19,'material_request_approved','Material Request Approved','Your material request \"Structural & Finishing Materials for Hospital Wing\" (MR-20260825-0025) has been approved by Rohan Mehta.','material_request',25,0,NULL,'normal','2026-09-16 05:01:08'),(51,19,'material_request_approved','Material Request Approved','Your material request \"Reinforcement Steel for Foundation Work\" (MR-20260826-0029) has been approved by Ananya Rao.','material_request',29,0,NULL,'normal','2026-09-16 12:21:34'),(52,21,'material_request_approved','Material Request Approved','Your material request \"Lobby Lighting Fixtures and Wiring\" (MR-20260826-0028) has been approved by Rohan Mehta.','material_request',28,0,NULL,'normal','2026-09-16 12:33:34'),(53,18,'material_request_submitted','New Material Request Awaiting Approval','Material Request MR-20260917-0033 for \"Demo Material Request - 3:37:26 pm\" requires your approval.','material_request',33,0,NULL,'high','2026-09-17 10:12:36'),(54,17,'material_request_approved','Material Request Approved','Your material request \"Demo Material Request - 3:37:26 pm\" (MR-20260917-0033) has been approved by Rohan Mehta.','material_request',33,0,NULL,'normal','2026-09-17 10:16:18'),(55,19,'material_request_approved','Material Request Approved','Your material request \" A clear subject like “Electrical wiring for Tower B” or “LED fixtures for lobby\" (MR-20260826-0027) has been approved by Rohan Mehta.','material_request',27,0,NULL,'normal','2026-09-17 10:18:10'),(56,18,'material_request_submitted','New Material Request Awaiting Approval','Material Request MR-20260918-0034 for \"Portland Cement for slab casting\" requires your approval.','material_request',34,0,NULL,'high','2026-09-18 08:06:14'),(57,19,'material_request_approved','Material Request Approved','Your material request \"Portland Cement for slab casting\" (MR-20260918-0034) has been approved by Rohan Mehta.','material_request',34,0,NULL,'normal','2026-09-18 08:07:05'),(58,18,'material_request_submitted','New Material Request Awaiting Approval','Material Request MR-20260925-0040 for \"Demo Material Request - 11:37:37 am\" requires your approval.','material_request',40,0,NULL,'high','2026-10-05 10:32:51'),(59,17,'material_request_approved','Material Request Approved','Your material request \"Demo Material Request - 11:37:37 am\" (MR-20260925-0040) has been approved by Rohan Mehta.','material_request',40,0,NULL,'normal','2026-10-05 10:33:53'),(60,18,'material_request_submitted','New Material Request Awaiting Approval','Material Request MR-20261005-0050 for \"Lobby seating and decorative fixtures\" requires your approval.','material_request',51,0,NULL,'high','2026-10-05 10:35:04'),(61,17,'material_request_approved','Material Request Approved','Your material request \"Lobby seating and decorative fixtures\" (MR-20261005-0050) has been approved by Rohan Mehta.','material_request',51,0,NULL,'normal','2026-10-05 10:35:19'),(62,17,'material_request_submitted','New Material Request Awaiting Approval','Material Request MR-20260925-0049 for \"Demo Material Request - 11:37:44 am\" requires your approval.','material_request',49,0,NULL,'high','2026-10-07 11:25:31'),(63,17,'material_request_approved','Material Request Approved','Your material request \"Demo Material Request - 11:37:44 am\" (MR-20260925-0049) has been approved by Ananya Rao. Comments: Approved by project manager','material_request',49,0,NULL,'normal','2026-10-07 11:43:04'),(64,17,'material_request_submitted','New Material Request Awaiting Approval','Material Request MR-20261007-0051 for \"Test Material Request Approval Flow\" requires your approval.','material_request',52,0,NULL,'high','2026-10-07 11:43:21'),(65,17,'material_request_approved','Material Request Approved','Your material request \"Test Material Request Approval Flow\" (MR-20261007-0051) has been approved by Ananya Rao. Comments: Verified and approved','material_request',52,0,NULL,'normal','2026-10-07 11:43:21'),(66,17,'material_request_submitted','New Material Request Awaiting Approval','Material Request MR-20260925-0048 for \"Demo Material Request - 11:37:44 am\" requires your approval.','material_request',48,0,NULL,'high','2026-10-07 11:43:45'),(67,17,'material_request_approved','Material Request Approved','Your material request \"Demo Material Request - 11:37:44 am\" (MR-20260925-0048) has been approved by Ananya Rao. Comments: Approved','material_request',48,0,NULL,'normal','2026-10-07 11:44:32'),(68,17,'rfq_email_sent','RFQ PDF Emailed to Aarav Steel & Cement','Tender document for RFQ-2026-0001 dispatched to aarav@aaravsc.in. Due date: Sat Apr 18 2026 05:30:00 GMT+0530 (India Standard Time).','rfq',1,0,NULL,'normal','2026-10-23 06:07:03'),(69,17,'rfq_email_sent','RFQ PDF Emailed to Polaris Electricals','Tender document for RFQ-2026-0001 dispatched to sneha@polariselec.in. Due date: Sat Apr 18 2026 05:30:00 GMT+0530 (India Standard Time).','rfq',1,0,NULL,'normal','2026-10-23 06:07:04'),(70,17,'rfq_email_sent','RFQ PDF Emailed to Test Precision Metalworks','Tender document for RFQ-2026-0001 dispatched to tender@vendor.com. Due date: Sat Apr 18 2026 05:30:00 GMT+0530 (India Standard Time).','rfq',1,0,NULL,'normal','2026-10-23 06:07:04');

--
-- Table structure for table `procurement_purchase_order_items`
--

DROP TABLE IF EXISTS `procurement_purchase_order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `procurement_purchase_order_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `po_id` int NOT NULL,
  `item_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `specification` text COLLATE utf8mb4_unicode_ci,
  `quantity` decimal(14,2) NOT NULL,
  `unit` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `unit_price` decimal(14,2) NOT NULL,
  `total_price` decimal(14,2) NOT NULL,
  `received_quantity` decimal(14,2) NOT NULL DEFAULT '0.00',
  `accepted_quantity` decimal(14,2) NOT NULL DEFAULT '0.00',
  `rejected_quantity` decimal(14,2) NOT NULL DEFAULT '0.00',
  `sort_order` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=59 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `procurement_purchase_order_items`
--

INSERT INTO `procurement_purchase_order_items` VALUES (3,2,'I-Beam Steel (8inch)',NULL,NULL,50.00,'pieces',11500.00,575000.00,50.00,50.00,0.00,0),(4,2,'H-Beam Steel (10inch)',NULL,NULL,30.00,'pieces',17500.00,525000.00,30.00,30.00,0.00,1),(6,3,'Portland Cement OPC 53 Grade',NULL,NULL,500.00,'bags',490.00,245000.00,1000.00,1000.00,0.00,0),(41,1,'OPC 53 Grade Ultratech Cement','50kg HDPE bags',NULL,400.00,'bags',410.00,164000.00,400.00,400.00,0.00,0),(42,1,'TMT Fe500D Reinforcement Steel 16mm','16mm Rebar IS 1786',NULL,12.00,'MT',67500.00,810000.00,12.00,12.00,0.00,1),(43,8,'M s 100 mm Elbow',NULL,NULL,245.00,'nos',2450.00,600250.00,245.00,245.00,0.00,0),(44,8,'M S Flange Size 80-mm',NULL,NULL,190.00,'nos',1900.00,361000.00,190.00,190.00,0.00,1),(45,8,'M S 150 MM ELBOW',NULL,NULL,630.00,'nos',12600.00,7938000.00,630.00,630.00,0.00,2),(46,8,'GI U BOLT 80 MM',NULL,NULL,20.00,'nos',560.00,11200.00,20.00,20.00,0.00,3),(47,8,'GI U BOLT 100 MM',NULL,NULL,30.00,'nos',930.00,27900.00,30.00,30.00,0.00,4),(48,8,'GI U BOLT 150 MM',NULL,NULL,200.00,'nos',7400.00,1480000.00,200.00,200.00,0.00,5),(49,9,'M s 100 mm Elbow',NULL,NULL,245.00,'nos',5.00,1225.00,245.00,245.00,0.00,0),(50,9,'M S Flange Size 80-mm',NULL,NULL,190.00,'nos',10.00,1900.00,190.00,190.00,0.00,1),(51,9,'M S 150 MM ELBOW',NULL,NULL,630.00,'nos',15.00,9450.00,630.00,630.00,0.00,2),(52,9,'GI U BOLT 80 MM',NULL,NULL,20.00,'nos',10.00,200.00,20.00,20.00,0.00,3),(53,9,'GI U BOLT 100 MM',NULL,NULL,30.00,'nos',20.00,600.00,30.00,30.00,0.00,4),(54,9,'GI U BOLT 150 MM',NULL,NULL,200.00,'nos',150.00,30000.00,200.00,200.00,0.00,5),(57,6,'OPC 53 Grade Ultratech Cement','50kg HDPE bags',NULL,400.00,'bags',410.00,164000.00,400.00,400.00,0.00,0),(58,6,'TMT Fe500D Reinforcement Steel 16mm','16mm Rebar IS 1786',NULL,12.00,'MT',67500.00,810000.00,12.00,12.00,0.00,1);

--
-- Table structure for table `procurement_purchase_orders`
--

DROP TABLE IF EXISTS `procurement_purchase_orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `procurement_purchase_orders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `po_number` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `rfq_id` int DEFAULT NULL,
  `quote_id` int DEFAULT NULL,
  `material_request_id` int DEFAULT NULL,
  `project_id` int NOT NULL,
  `vendor_id` int NOT NULL,
  `po_date` date NOT NULL,
  `expected_delivery_date` date DEFAULT NULL,
  `actual_delivery_date` date DEFAULT NULL,
  `subtotal` decimal(14,2) NOT NULL,
  `tax_amount` decimal(14,2) NOT NULL DEFAULT '0.00',
  `shipping_cost` decimal(14,2) NOT NULL DEFAULT '0.00',
  `total_amount` decimal(14,2) NOT NULL,
  `delivery_terms` text COLLATE utf8mb4_unicode_ci,
  `payment_terms` text COLLATE utf8mb4_unicode_ci,
  `status` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `is_acknowledged` tinyint(1) NOT NULL DEFAULT '0',
  `acknowledgment_date` timestamp NULL DEFAULT NULL,
  `acknowledgment_notes` text COLLATE utf8mb4_unicode_ci,
  `delivery_status` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `tracking_number` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `follow_up_count` int NOT NULL DEFAULT '0',
  `last_follow_up_date` timestamp NULL DEFAULT NULL,
  `created_by_id` int NOT NULL,
  `approved_by_id` int DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `updated_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`),
  UNIQUE KEY `procurement_purchase_orders_po_number_unique` (`po_number`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `procurement_purchase_orders`
--

INSERT INTO `procurement_purchase_orders` VALUES (1,'PO-2026-0001',1,1,1,1,1,'2026-04-19','2026-05-07','2026-05-07',974000.00,175320.00,0.00,1149320.00,'FOB site, delivery included','30% advance, 70% on delivery','issued',1,'2026-04-20 04:00:00','PO received and accepted. Delivery confirmed for May 7.','delivered',NULL,0,NULL,21,18,'High priority - Floor 5 project','2026-08-11 08:10:44','2026-10-05 00:42:57'),(2,'PO-2026-0002',4,7,12,1,6,'2026-09-17','2026-09-24','2026-09-17',1100000.00,198000.00,0.00,1298000.00,'Ex-Factory','Net 15','inspected',0,NULL,NULL,'delivered',NULL,0,NULL,1,NULL,'Urgent structural steel delivery','2026-09-17 08:47:46','2026-09-17 08:47:46'),(3,'PO-20260918-0003',5,9,34,3,1,'2026-09-18','2026-09-25','2026-09-18',245000.00,0.00,0.00,245000.00,NULL,'Net 30 Days','completed',1,'2026-09-18 05:22:58','Vendor confirmed order and delivery timeline','delivered','TS07He1234',0,NULL,18,18,'Dispatched to site','2026-09-18 10:51:03','2026-09-18 05:45:56'),(6,'PO-20260923-0014',8,16,50,14,1,'2026-09-21','2026-09-24',NULL,974000.00,175320.00,0.00,1149320.00,'Immediate delivery to Sapphire Grand Hotel & Convention Center Central Godown.','Net 30 Days','issued',0,NULL,NULL,'delivered',NULL,0,NULL,17,NULL,'PO for Phase 1 Foundation Cement & Reinforcement Steel','2026-09-30 07:41:35','2026-10-05 23:48:55'),(7,'PO-20261005-0005',NULL,NULL,NULL,5,12,'2026-10-05','2026-10-16',NULL,30491.00,0.00,0.00,30491.00,NULL,NULL,'issued',0,NULL,NULL,'pending',NULL,0,NULL,17,NULL,NULL,'2026-10-05 11:02:04','2026-10-05 11:02:04'),(8,'PO-20261005-0006',9,18,51,5,12,'2026-10-05','2026-10-19','2026-10-05',10418350.00,0.00,0.00,10418350.00,NULL,'Net 30 Days','completed',1,'2026-10-05 05:34:32','Vendor confirmed order and delivery timeline','delivered','TS07He9999',0,NULL,17,17,'','2026-10-05 11:04:09','2026-10-05 05:43:32'),(9,'PO-20261005-0007',9,17,51,5,2,'2026-10-05','2026-10-12','2026-10-05',43375.00,0.00,0.00,43375.00,NULL,'Net 30 Days','completed',1,'2026-10-05 06:07:21','Vendor confirmed order and delivery timeline','delivered','TS07He9998',0,NULL,17,17,'','2026-10-05 11:37:12','2026-10-05 06:07:58');

--
-- Table structure for table `procurement_quality_inspection_items`
--

DROP TABLE IF EXISTS `procurement_quality_inspection_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `procurement_quality_inspection_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `inspection_id` int NOT NULL,
  `receipt_item_id` int NOT NULL,
  `po_item_id` int NOT NULL,
  `item_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `received_quantity` decimal(14,2) NOT NULL,
  `status` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `accepted_quantity` decimal(14,2) NOT NULL DEFAULT '0.00',
  `rejected_quantity` decimal(14,2) NOT NULL DEFAULT '0.00',
  `quality_grade` varchar(16) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `defect_description` text COLLATE utf8mb4_unicode_ci,
  `remarks` text COLLATE utf8mb4_unicode_ci,
  `sort_order` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=53 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `procurement_quality_inspection_items`
--

INSERT INTO `procurement_quality_inspection_items` VALUES (3,2,3,3,'I-Beam Steel (8inch)',50.00,'accepted',50.00,0.00,'Grade A',NULL,'Passed all load and dimension checks',0),(4,2,4,4,'H-Beam Steel (10inch)',30.00,'accepted',30.00,0.00,'Grade A',NULL,'Passed all load and dimension checks',1),(5,4,5,6,'Portland Cement OPC 53 Grade',500.00,'approved',500.00,0.00,'B',NULL,NULL,0),(6,5,6,6,'Portland Cement OPC 53 Grade',500.00,'approved',500.00,0.00,'B',NULL,NULL,0),(35,1,35,41,'OPC 53 Grade Ultratech Cement',400.00,'approved',400.00,0.00,NULL,NULL,NULL,0),(36,1,36,42,'TMT Fe500D Reinforcement Steel 16mm',12.00,'approved',12.00,0.00,NULL,NULL,NULL,0),(37,8,37,43,'M s 100 mm Elbow',245.00,'approved',245.00,0.00,'A',NULL,NULL,0),(38,8,38,44,'M S Flange Size 80-mm',190.00,'approved',190.00,0.00,'A',NULL,NULL,1),(39,8,39,45,'M S 150 MM ELBOW',630.00,'approved',630.00,0.00,'A',NULL,NULL,2),(40,8,40,46,'GI U BOLT 80 MM',20.00,'approved',20.00,0.00,'A',NULL,NULL,3),(41,8,41,47,'GI U BOLT 100 MM',30.00,'approved',30.00,0.00,'A',NULL,NULL,4),(42,8,42,48,'GI U BOLT 150 MM',200.00,'approved',200.00,0.00,'A',NULL,NULL,5),(43,9,43,49,'M s 100 mm Elbow',245.00,'approved',245.00,0.00,'A',NULL,NULL,0),(44,9,44,50,'M S Flange Size 80-mm',190.00,'approved',190.00,0.00,'A',NULL,NULL,1),(45,9,45,51,'M S 150 MM ELBOW',630.00,'approved',630.00,0.00,'A',NULL,NULL,2),(46,9,46,52,'GI U BOLT 80 MM',20.00,'approved',20.00,0.00,'A',NULL,NULL,3),(47,9,47,53,'GI U BOLT 100 MM',30.00,'approved',30.00,0.00,'A',NULL,NULL,4),(48,9,48,54,'GI U BOLT 150 MM',200.00,'approved',200.00,0.00,'A',NULL,NULL,5),(51,7,51,57,'OPC 53 Grade Ultratech Cement',400.00,'approved',400.00,0.00,NULL,NULL,NULL,0),(52,7,52,58,'TMT Fe500D Reinforcement Steel 16mm',12.00,'approved',12.00,0.00,NULL,NULL,NULL,0);

--
-- Table structure for table `procurement_quality_inspections`
--

DROP TABLE IF EXISTS `procurement_quality_inspections`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `procurement_quality_inspections` (
  `id` int NOT NULL AUTO_INCREMENT,
  `inspection_number` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `receipt_id` int NOT NULL,
  `po_id` int NOT NULL,
  `project_id` int NOT NULL,
  `inspection_date` timestamp NOT NULL DEFAULT (now()),
  `inspected_by_id` int NOT NULL,
  `inspector_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `result` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `findings` text COLLATE utf8mb4_unicode_ci,
  `defects_found` text COLLATE utf8mb4_unicode_ci,
  `recommendations` text COLLATE utf8mb4_unicode_ci,
  `photo_urls` json NOT NULL DEFAULT (_utf8mb4'[]'),
  `approved_by_id` int DEFAULT NULL,
  `approval_date` timestamp NULL DEFAULT NULL,
  `rejection_reason` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `updated_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`),
  UNIQUE KEY `procurement_quality_inspections_inspection_number_unique` (`inspection_number`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `procurement_quality_inspections`
--

INSERT INTO `procurement_quality_inspections` VALUES (1,'QI-2026-0001',1,1,1,'2026-05-07 08:30:00',19,'Priya Iyer','partial_approved','Overall material quality meets specifications. Minor defects found in 150 sqft tiles from damaged cartons.','Surface scratches and edge chipping on tiles from 3 damaged cartons. Approximately 150 sqft affected.','Accept 11,850 sqft. Reject 150 sqft. Request replacement from vendor.','[\"uploads/qi-2026-0001-defect1.jpg\", \"uploads/qi-2026-0001-defect2.jpg\"]',18,'2026-05-07 10:30:00',NULL,'2026-08-11 08:10:44','2026-08-11 08:10:44'),(2,'QI-2026-0002',2,2,1,'2026-09-17 08:58:01',1,'Ananya Rao','approved','All 50 I-Beams and 30 H-Beams passed dimensional and metallurgical testing.',NULL,NULL,'[]',1,'2026-09-17 08:58:01',NULL,'2026-09-17 08:58:01','2026-09-17 08:58:01'),(3,'QI-20260918-0003',3,3,3,'2026-09-18 05:44:38',17,'Quality Manager','pending','Materials verified against specifications and found in good condition.',NULL,NULL,'[]',NULL,NULL,NULL,'2026-09-18 11:14:37','2026-09-18 11:14:37'),(4,'QI-20260918-0004',3,3,3,'2026-09-18 05:45:15',17,'Quality Manager','approved','Materials verified against specifications and found in good condition.',NULL,NULL,'[]',17,'2026-09-18 05:45:22',NULL,'2026-09-18 11:15:15','2026-09-18 05:45:22'),(5,'QI-20260918-0005',4,3,3,'2026-09-18 05:45:56',18,'Quality Manager','approved','Materials verified against specifications and found in good condition.',NULL,NULL,'[]',18,'2026-09-18 05:45:56',NULL,'2026-09-18 11:15:55','2026-09-18 05:45:56'),(7,'QC-20260923-0014',7,6,14,'2026-09-22 08:30:00',17,'Vikram Malhotra (Quality Lead)','approved',NULL,NULL,NULL,'[]',17,'2026-09-22 10:30:00',NULL,'2026-09-30 07:41:35','2026-09-30 07:41:35'),(8,'QI-20261005-0007',8,8,5,'2026-10-05 05:43:32',17,'Quality Manager','approved','Materials verified against specifications and found in good condition.',NULL,NULL,'[]',17,'2026-10-05 05:43:32',NULL,'2026-10-05 11:13:31','2026-10-05 05:43:32'),(9,'QI-20261005-0008',9,9,5,'2026-10-05 06:07:57',17,'Quality Manager','approved','Materials verified against specifications and found in good condition.',NULL,NULL,'[]',17,'2026-10-05 06:07:57',NULL,'2026-10-05 11:37:57','2026-10-05 06:07:57');

--
-- Table structure for table `procurement_rfq_items`
--

DROP TABLE IF EXISTS `procurement_rfq_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `procurement_rfq_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `rfq_id` int NOT NULL,
  `item_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `specification` text COLLATE utf8mb4_unicode_ci,
  `quantity` decimal(14,2) NOT NULL,
  `unit` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sort_order` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=66 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `procurement_rfq_items`
--

INSERT INTO `procurement_rfq_items` VALUES (3,2,'Galvanized steel ducting 600x400mm','Rectangular duct sections','24 gauge, GI coated, flanged connections',250.00,'m',0),(4,2,'Flexible ducting insulation','Fiberglass insulation wrap','50mm thickness, R-value 3.5',280.00,'m',1),(5,2,'Duct fittings and dampers','Elbows, reducers, volume dampers','Complete fitting set for 250m run',1.00,'lot',2),(6,3,'Cement',NULL,NULL,100.00,'bags',0),(7,4,'I-Beam Steel (8inch)',NULL,NULL,50.00,'pieces',0),(8,4,'H-Beam Steel (10inch)',NULL,NULL,30.00,'pieces',1),(9,5,'Portland Cement OPC 53 Grade','High-strength cement suitable for structural works',' OPC 53 Grade, ISI certified, 50 kg bags',500.00,'bags',0),(50,1,'OPC 53 Grade Ultratech Cement',NULL,NULL,400.00,'bags',0),(51,1,'TMT Fe500D Reinforcement Steel 16mm',NULL,NULL,12.00,'MT',1),(52,9,'M s 100 mm Elbow',' Mild steel elbow fitting, 100 mm size, used for piping connections','IS standard grade, corrosion‑resistant, suitable for plumbing installations',245.00,'nos',0),(53,9,'M S Flange Size 80-mm','','',190.00,'nos',1),(54,9,'M S 150 MM ELBOW','','',630.00,'nos',2),(55,9,'GI U BOLT 80 MM','','',20.00,'nos',3),(56,9,'GI U BOLT 100 MM','','',30.00,'nos',4),(57,9,'GI U BOLT 150 MM','','',200.00,'nos',5),(60,8,'OPC 53 Grade Ultratech Cement',NULL,NULL,400.00,'bags',0),(61,8,'TMT Fe500D Reinforcement Steel 16mm',NULL,NULL,12.00,'MT',1),(62,10,'Cement Bags (50kg)',NULL,'Grade 53',100.00,'bags',0),(63,10,'Steel Rods (12mm)',NULL,'TMT Grade',50.00,'pieces',1),(64,11,'Cement Bags (50kg)',NULL,'Grade 53',100.00,'bags',0),(65,11,'Steel Rods (12mm)',NULL,'TMT Grade',50.00,'pieces',1);

--
-- Table structure for table `procurement_rfq_vendors`
--

DROP TABLE IF EXISTS `procurement_rfq_vendors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `procurement_rfq_vendors` (
  `id` int NOT NULL AUTO_INCREMENT,
  `rfq_id` int NOT NULL,
  `vendor_id` int NOT NULL,
  `sent_date` timestamp NULL DEFAULT NULL,
  `responded_date` timestamp NULL DEFAULT NULL,
  `status` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'sent',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=75 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `procurement_rfq_vendors`
--

INSERT INTO `procurement_rfq_vendors` VALUES (4,2,3,'2026-04-16 05:30:00','2026-04-19 04:30:00','responded'),(5,2,1,'2026-04-16 05:30:00','2026-04-20 09:30:00','responded'),(6,2,2,'2026-04-16 05:30:00',NULL,'sent'),(7,2,4,'2026-04-16 05:30:00',NULL,'declined'),(8,4,1,'2026-09-17 03:14:26','2026-09-17 03:14:53','responded'),(9,4,6,'2026-09-17 03:14:26','2026-09-17 03:14:53','responded'),(10,5,6,'2026-09-18 02:52:36','2026-09-18 03:03:20','responded'),(11,5,1,'2026-09-18 02:52:36','2026-09-18 02:58:19','responded'),(52,1,1,'2026-10-23 00:37:03','2026-10-08 00:35:31','sent'),(53,1,2,'2026-10-23 00:37:03','2026-10-05 00:42:57','sent'),(54,9,3,'2026-10-05 05:06:16','2026-10-07 05:06:26','responded'),(55,9,12,'2026-10-05 05:06:16','2026-10-05 05:29:45','responded'),(56,9,2,'2026-10-05 05:06:16','2026-10-05 05:28:19','responded'),(57,9,6,'2026-10-05 05:06:16',NULL,'sent'),(58,9,1,'2026-10-05 05:06:16',NULL,'sent'),(61,8,1,'2026-10-05 23:48:55','2026-10-05 23:48:55','responded'),(62,8,2,'2026-10-05 23:48:55','2026-10-05 23:48:55','responded'),(63,1,13,'2026-10-23 00:37:03',NULL,'sent'),(64,9,14,NULL,'2026-10-06 00:10:29','responded'),(65,10,1,NULL,'2026-10-09 05:32:29','responded'),(66,10,6,NULL,NULL,'pending'),(67,10,15,NULL,'2026-10-08 01:28:41','responded'),(68,10,16,NULL,'2026-10-08 03:22:12','responded'),(69,10,17,NULL,'2026-10-08 04:19:42','responded'),(70,11,1,NULL,'2026-10-09 06:16:00','responded'),(71,11,6,NULL,NULL,'pending'),(72,11,16,NULL,'2026-10-08 04:58:50','responded'),(73,10,18,NULL,'2026-10-09 01:14:56','responded'),(74,11,15,NULL,'2026-10-12 23:58:29','responded');

--
-- Table structure for table `procurement_rfqs`
--

DROP TABLE IF EXISTS `procurement_rfqs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `procurement_rfqs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `rfq_number` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `material_request_id` int DEFAULT NULL,
  `project_id` int NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `status` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `issue_date` date DEFAULT NULL,
  `due_date` date NOT NULL,
  `closed_date` date DEFAULT NULL,
  `sent_to_vendor_count` int NOT NULL DEFAULT '0',
  `quotes_received_count` int NOT NULL DEFAULT '0',
  `selected_quote_id` int DEFAULT NULL,
  `created_by_id` int NOT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `updated_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`),
  UNIQUE KEY `procurement_rfqs_rfq_number_unique` (`rfq_number`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `procurement_rfqs`
--

INSERT INTO `procurement_rfqs` VALUES (1,'RFQ-2026-0001',1,1,'RFQ - Structural Concrete & Rebar Package','Seeking quotations for high-grade vinyl flooring with 10-year warranty. Delivery to Hinjewadi site.','evaluated','2026-04-11','2026-04-18','2026-04-18',3,4,1,21,'Prefer German brands, must include installation','2026-08-11 08:10:44','2026-10-08 00:35:31'),(2,'RFQ-2026-0002',4,2,'HVAC ducting materials - 250m','Galvanized steel ducting with insulation for floors 15-18','receiving_quotes','2026-04-16','2026-04-23',NULL,4,2,NULL,21,'Material certification required','2026-08-11 08:10:44','2026-08-11 08:10:44'),(3,'RFQ-20260824-0003',9,1,'Test Materials - 13:34:13',NULL,'draft',NULL,'2026-09-30',NULL,0,0,NULL,17,'test','2026-08-24 08:05:22','2026-08-24 08:05:22'),(4,'RFQ-20260824-0004',12,1,'Steel Beams for Main Structure','High-grade steel beams required for structural support','completed','2026-09-17','2026-09-25',NULL,2,0,7,17,NULL,'2026-08-24 08:06:59','2026-09-17 03:14:53'),(5,'RFQ-20260918-0005',34,3,'RFQ for Portland Cement for slab casting','Cement required for slab concreting and column reinforcement in the East Wing.','evaluated','2026-09-18','2026-09-22',NULL,2,0,9,18,'{\"textNotes\":\"plz delivery by 2 days\",\"rfqDocument\":{\"fileName\":\"RFQ-20260918-0005_Technical_Specification_BOQ.pdf\",\"fileSize\":139,\"fileType\":\"application/pdf\",\"isImage\":false,\"docType\":\"Bill of Quantities (BOQ)\",\"extractedScope\":\"Complete technical scope for RFQ for Portland Cement for slab casting, covering supply, quality inspection certificates (IS 1239 / ASTM standard compliance), and delivery directly to Asha Hospital East Wing.\",\"detectedItemCount\":1,\"detectedCategories\":[\"Civil & Ready-Mix\"],\"complianceStandards\":\"IS 1239 Part-1 / ASTM A53 Grade B / MTC Required\",\"deliveryTimelineBenchmark\":\"7 to 10 Days post PO Issuance\",\"items\":[{\"id\":9,\"itemName\":\"Portland Cement OPC 53 Grade\",\"specification\":\" OPC 53 Grade, ISI certified, 50 kg bags\",\"quantity\":500,\"unit\":\"bags\",\"estimatedPrice\":395,\"totalAmount\":197500}],\"totalAmount\":197500,\"totalScopeAmount\":197500,\"uploadedAt\":\"2026-10-07T10:45:24.724Z\",\"confidence\":99.2,\"fileUrl\":\"/uploads/RFQ-20260918-0005_Technical_Specification_BOQ.pdf\"}}','2026-09-18 08:14:42','2026-10-07 05:15:25'),(8,'RFQ-20260923-0012',50,14,'RFQ - Structural Concrete & Rebar Package','Competitive tender for cement & rebar foundation supply.','evaluated',NULL,'2026-09-24',NULL,2,2,16,17,NULL,'2026-09-30 07:31:08','2026-10-05 23:48:55'),(9,'RFQ-20261005-0007',51,5,'RFQ for Lobby seating and decorative fixtures','Delivery and installation must be completed before the required date.','evaluated','2026-10-05','2026-10-16',NULL,5,0,17,17,'Technical specification and BOQ schedule finalized for Lobby industrial piping components.','2026-10-05 10:36:05','2026-10-07 05:12:59'),(10,'RFQ-20261007-0008',48,1,'RFQ for Demo Material Request - 11:37:44 am','Testing end-to-end procurement workflow','receiving_quotes',NULL,'2026-10-10',NULL,2,10,NULL,17,NULL,'2026-10-07 11:57:30','2026-10-09 05:32:29'),(11,'RFQ-20261008-0009',49,1,'RFQ for Demo Material Request - 11:37:44 am','Testing end-to-end procurement workflow','receiving_quotes',NULL,'2026-10-22',NULL,2,4,NULL,17,NULL,'2026-10-08 10:23:19','2026-10-12 23:58:29');

--
-- Table structure for table `procurement_vendor_follow_ups`
--

DROP TABLE IF EXISTS `procurement_vendor_follow_ups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `procurement_vendor_follow_ups` (
  `id` int NOT NULL AUTO_INCREMENT,
  `po_id` int NOT NULL,
  `vendor_id` int NOT NULL,
  `follow_up_date` timestamp NOT NULL DEFAULT (now()),
  `follow_up_type` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `follow_up_reason` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci,
  `response` text COLLATE utf8mb4_unicode_ci,
  `response_date` timestamp NULL DEFAULT NULL,
  `follow_up_by_id` int DEFAULT NULL,
  `status` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'sent',
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `updated_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `procurement_vendor_follow_ups`
--

INSERT INTO `procurement_vendor_follow_ups` VALUES (1,1,4,'2026-04-25 04:30:00','email','delivery_confirmation','Please confirm delivery schedule for PO-2026-0001. Expected date is May 7, 2026.','Delivery confirmed for May 7, 2026 between 10 AM - 12 PM.','2026-04-25 09:00:00',21,'responded','2026-08-11 08:10:44','2026-08-11 08:10:44'),(2,1,4,'2026-05-08 03:30:00','phone','quality_issue','150 sqft tiles rejected due to transport damage. Requesting replacement as per warranty terms.','Replacement approved. Will dispatch by May 15, 2026.','2026-05-08 05:30:00',21,'responded','2026-08-11 08:10:44','2026-08-11 08:10:44');

--
-- Table structure for table `procurement_vendor_quote_items`
--

DROP TABLE IF EXISTS `procurement_vendor_quote_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `procurement_vendor_quote_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `quote_id` int NOT NULL,
  `rfq_item_id` int DEFAULT NULL,
  `item_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` decimal(14,2) NOT NULL,
  `unit` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `unit_price` decimal(14,2) NOT NULL,
  `total_price` decimal(14,2) NOT NULL,
  `remarks` text COLLATE utf8mb4_unicode_ci,
  `sort_order` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=136 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `procurement_vendor_quote_items`
--

INSERT INTO `procurement_vendor_quote_items` VALUES (3,2,1,'Premium vinyl flooring tiles - Armstrong',12000.00,'sqft',68.00,816000.00,'Material only, installation extra',0),(4,2,2,'Vinyl flooring adhesive',50.00,'gallon',520.00,26000.00,NULL,1),(5,3,1,'Premium vinyl flooring tiles - Gerflor',12000.00,'sqft',72.00,864000.00,'Express delivery, installation included',0),(6,3,2,'Vinyl adhesive premium grade',50.00,'gallon',420.00,21000.00,NULL,1),(7,6,7,'I-Beam Steel (8inch)',50.00,'pieces',12000.00,600000.00,NULL,0),(8,6,8,'H-Beam Steel (10inch)',30.00,'pieces',18000.00,540000.00,NULL,1),(9,7,7,'I-Beam Steel (8inch)',50.00,'pieces',11500.00,575000.00,NULL,0),(10,7,8,'H-Beam Steel (10inch)',30.00,'pieces',17500.00,525000.00,NULL,1),(11,8,9,'Portland Cement OPC 53 Grade',500.00,'bags',500.00,250000.00,NULL,0),(12,9,9,'Portland Cement OPC 53 Grade',500.00,'bags',490.00,245000.00,NULL,0),(13,10,9,'Portland Cement OPC 53 Grade',500.00,'bags',1000.00,500000.00,NULL,0),(14,11,9,'Portland Cement OPC 53 Grade',500.00,'bags',490.00,245000.00,NULL,0),(27,1,1,'Italian Marble Flooring 800x800',250.00,'sqm',3896.00,974000.00,NULL,0),(28,18,52,'M s 100 mm Elbow',245.00,'nos',10.00,2450.00,NULL,0),(29,18,53,'M S Flange Size 80-mm',190.00,'nos',10.00,1900.00,NULL,1),(30,18,54,'M S 150 MM ELBOW',630.00,'nos',20.00,12600.00,NULL,2),(31,18,55,'GI U BOLT 80 MM',20.00,'nos',20.00,400.00,NULL,3),(32,18,56,'GI U BOLT 100 MM',30.00,'nos',30.00,900.00,NULL,4),(33,18,57,'GI U BOLT 150 MM',200.00,'nos',200.00,40000.00,NULL,5),(34,17,52,'M s 100 mm Elbow',245.00,'nos',5.00,1225.00,NULL,0),(35,17,53,'M S Flange Size 80-mm',190.00,'nos',10.00,1900.00,NULL,1),(36,17,54,'M S 150 MM ELBOW',630.00,'nos',15.00,9450.00,NULL,2),(37,17,55,'GI U BOLT 80 MM',20.00,'nos',10.00,200.00,NULL,3),(38,17,56,'GI U BOLT 100 MM',30.00,'nos',20.00,600.00,NULL,4),(39,17,57,'GI U BOLT 150 MM',200.00,'nos',150.00,30000.00,NULL,5),(41,19,52,'M s 100 mm Elbow',10.00,'nos',260.00,2600.00,'Auto-extracted from document',0),(42,20,52,'M s 100 mm Elbow',245.00,'nos',260.00,63700.00,NULL,0),(43,20,53,'M S Flange Size 80-mm',190.00,'nos',780.00,148200.00,NULL,1),(44,20,54,'M S 150 MM ELBOW',630.00,'nos',420.00,264600.00,NULL,2),(45,20,55,'GI U BOLT 80 MM',20.00,'nos',85.00,1700.00,NULL,3),(46,20,56,'GI U BOLT 100 MM',30.00,'nos',110.00,3300.00,NULL,4),(47,20,57,'GI U BOLT 150 MM',200.00,'nos',145.00,29000.00,NULL,5),(49,21,62,'Cement Bags (50kg)',100.00,'bags',395.00,39500.00,'Auto-extracted from document',0),(50,21,63,'Steel Rods (12mm)',50.00,'pieces',68.00,3400.00,'Auto-extracted from document',1),(53,23,1,'Project',1.00,'Job',5000.00,5000.00,NULL,0),(54,23,2,'Expenses',1.00,'Item',500.00,500.00,NULL,1),(55,24,1,'10MM X 3\" ANCHOR FASTENER',300.00,'Pcs',10.00,3000.00,NULL,0),(56,24,2,'U BOLTS 150MM',200.00,'Pcs',22.00,4400.00,NULL,1),(57,24,3,'U BOLTS 100MM',30.00,'Pcs',16.00,480.00,NULL,2),(58,24,4,'U BOLTS 80MM',20.00,'Pcs',14.00,280.00,NULL,3),(59,25,1,'Anchor Fastener Wedge Type - M10 x 80mm',300.00,'Nos',12.00,3600.00,NULL,0),(60,25,2,'MS B/W Elbow - 150mm',20.00,'Nos',550.00,11000.00,NULL,1),(61,25,3,'MS B/W Elbow - 100mm',10.00,'Nos',300.00,3000.00,NULL,2),(62,25,4,'MS B/W Elbow - 80mm',10.00,'Nos',245.00,2450.00,NULL,3),(63,25,5,'GI U Bolt - 150mm',200.00,'Nos',27.00,5400.00,NULL,4),(64,25,6,'GI U Bolt - 100mm',30.00,'Nos',24.00,720.00,NULL,5),(65,25,7,'GI U Bolt - 80mm',20.00,'Nos',20.00,400.00,NULL,6),(66,25,8,'Alkoplus Safety Helmet - Yellow',5.00,'Nos',250.00,1250.00,NULL,7),(67,25,9,'Alkoplus Safety Helmet - Blue',1.00,'Nos',250.00,250.00,NULL,8),(68,25,10,'KARAM Safety Helmet - White',2.00,'Nos',315.00,630.00,NULL,9),(69,25,11,'Welding Gloves',2.00,'Pair',145.00,290.00,NULL,10),(70,25,12,'Hand Gloves',2.00,'Packet',0.00,0.00,NULL,11),(71,26,1,'M s 100 mm Elbow',10.00,'NOS',245.00,2450.00,NULL,0),(72,26,2,'M S Flange Size 80-mm',10.00,'NOS',190.00,1900.00,NULL,1),(73,26,3,'M S 150 MM ELBOW',20.00,'NOS',630.00,12600.00,NULL,2),(74,26,4,'GI U BOLT 80 MM',20.00,'NOS',28.00,560.00,NULL,3),(75,26,5,'GI U BOLT 100 MM',30.00,'NOS',31.00,930.00,NULL,4),(76,26,6,'GI U BOLT 150 MM',200.00,'NOS',37.00,7400.00,NULL,5),(77,28,62,'Custom Heavy Flange 200mm',10.00,'Nos',5000.00,50000.00,'Custom machined flange',0),(78,29,1,'10MM X 3\" ANCHOR FASTENER',300.00,'Pcs',10.00,3000.00,NULL,0),(79,29,2,'U BOLTS 150MM',200.00,'Pcs',22.00,4400.00,NULL,1),(80,29,3,'U BOLTS 100MM',30.00,'Pcs',16.00,480.00,NULL,2),(81,29,4,'U BOLTS 80MM',20.00,'Pcs',14.00,280.00,NULL,3),(82,30,1,'M s 100 mm Elbow',10.00,'NOS',245.00,2450.00,NULL,0),(83,30,2,'M S Flange Size 80-mm',10.00,'NOS',190.00,1900.00,NULL,1),(84,30,3,'M S 150 MM ELBOW',20.00,'NOS',630.00,12600.00,NULL,2),(85,30,4,'GI U BOLT 80 MM',20.00,'NOS',28.00,560.00,NULL,3),(86,30,5,'GI U BOLT 100 MM',30.00,'NOS',31.00,930.00,NULL,4),(87,30,6,'GI U BOLT 150 MM',200.00,'NOS',37.00,7400.00,NULL,5),(88,31,1,'Service (Carpenter Labor)',1.00,'Hour',50.00,50.00,NULL,0),(89,31,2,'Item (Wood Materials / Fixture)',2.00,'Piece',60.00,120.00,NULL,1),(90,31,3,'Service (Additional Carpentry Work)',2.00,'Hour',50.00,100.00,NULL,2),(91,31,4,'Item (Hardware & Accessories)',3.00,'Piece',50.00,150.00,NULL,3),(96,32,62,'Anchor Bolts 10 mm',300.00,'PCS',0.00,0.00,'Auto-extracted from document',0),(97,32,63,'Short Elbows C class 150 mm',20.00,'PCS',500.00,10000.00,'Auto-extracted from document',1),(98,32,62,'Short Elbows C class 100 mm',10.00,'PCS',250.00,2500.00,'Auto-extracted from document',2),(99,32,62,'Short Elbows C class 80 mm',10.00,'PCS',120.00,1200.00,'Auto-extracted from document',3),(100,32,62,'U-Bolts 150 mm',200.00,'PCS',35.00,7000.00,'Auto-extracted from document',4),(101,32,62,'U-Bolts 100 mm',30.00,'PCS',25.00,750.00,'Auto-extracted from document',5),(102,32,62,'U-Bolts 80 mm',20.00,'PCS',22.00,440.00,'Auto-extracted from document',6),(103,32,62,'Safety Helmets - Yellow',5.00,'PCS',250.00,1250.00,'Auto-extracted from document',7),(104,32,62,'Safety Helmets - Blue',1.00,'PCS',250.00,250.00,'Auto-extracted from document',8),(105,32,62,'Safety Helmets White (Karam)',2.00,'PCS',0.00,0.00,'Auto-extracted from document',9),(106,32,62,'Welding Gloves',2.00,'Pairs',145.00,290.00,'Auto-extracted from document',10),(107,32,62,'Hand Gloves',2.00,'Packets',60.00,120.00,'Auto-extracted from document',11),(113,33,62,'[ITEM NAME #1]',10.00,'Pcs',1000.00,11550.00,'Auto-extracted from document',0),(114,33,63,'[ITEM NAME #2]',10.00,'Pcs',1000.00,11050.00,'Auto-extracted from document',1),(115,33,62,'[ITEM NAME #3]',10.00,'Pcs',1000.00,11750.00,'Auto-extracted from document',2),(121,34,62,'[ITEM NAME #1]',10.00,'Pcs',1000.00,11550.00,'Auto-extracted from document',0),(122,34,63,'[ITEM NAME #2]',10.00,'Pcs',1000.00,11050.00,'Auto-extracted from document',1),(123,34,62,'[ITEM NAME #3]',10.00,'Pcs',1000.00,11750.00,'Auto-extracted from document',2),(128,35,64,'ITEM NAME 1',45.00,'Pcs',20.00,900.00,'Auto-extracted from document',0),(129,35,65,'ITEM NAME 2',23.00,'Pcs',40.00,920.00,'Auto-extracted from document',1),(130,35,64,'ITEM NAME 3',56.00,'Pcs',50.00,2800.00,'Auto-extracted from document',2),(131,35,64,'ITEM NAME 4',89.00,'Pcs',60.00,5340.00,'Auto-extracted from document',3),(132,36,64,'10MM X 3\" ANCHOR FASTENER',300.00,'Pcs',10.00,3000.00,'HSN: 7318 - Extracted from extracted_real.jpg',0),(133,36,65,'uBoLTs 150MM',200.00,'Pcs',22.00,4400.00,'HSN: 7318 - Extracted from extracted_real.jpg',1),(134,36,64,'uBoLTs 100MM',30.00,'Pcs',16.00,480.00,'HSN: 7318 - Extracted from extracted_real.jpg',2),(135,36,64,'uBoLTs somm',20.00,'Pcs',14.00,280.00,'HSN: 7318 - Extracted from extracted_real.jpg',3);

--
-- Table structure for table `procurement_vendor_quotes`
--

DROP TABLE IF EXISTS `procurement_vendor_quotes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `procurement_vendor_quotes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `quote_number` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `rfq_id` int NOT NULL,
  `vendor_id` int NOT NULL,
  `quoted_date` date NOT NULL,
  `valid_until` date DEFAULT NULL,
  `delivery_days` int NOT NULL,
  `delivery_terms` text COLLATE utf8mb4_unicode_ci,
  `payment_terms` text COLLATE utf8mb4_unicode_ci,
  `subtotal` decimal(14,2) NOT NULL,
  `tax_percent` decimal(6,2) NOT NULL DEFAULT '0.00',
  `tax_amount` decimal(14,2) NOT NULL DEFAULT '0.00',
  `shipping_cost` decimal(14,2) NOT NULL DEFAULT '0.00',
  `total_amount` decimal(14,2) NOT NULL,
  `is_selected` tinyint(1) NOT NULL DEFAULT '0',
  `selection_reason` text COLLATE utf8mb4_unicode_ci,
  `selected_by_id` int DEFAULT NULL,
  `selected_date` timestamp NULL DEFAULT NULL,
  `status` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'submitted',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `attachment_url` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `updated_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`),
  UNIQUE KEY `procurement_vendor_quotes_quote_number_unique` (`quote_number`)
) ENGINE=InnoDB AUTO_INCREMENT=37 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `procurement_vendor_quotes`
--

INSERT INTO `procurement_vendor_quotes` VALUES (1,'QT-RID-2026-0012',1,4,'2026-04-15','2026-05-15',18,'FOB site, delivery included','30% advance, 70% on delivery',974000.00,18.00,175320.00,0.00,974000.00,1,'L1 lowest qualified commercial bidder with fastest 3-day lead time.',21,'2026-04-18 04:30:00','selected','10-year warranty included, German brand Tarkett',NULL,'2026-08-11 08:10:44','2026-10-05 05:58:53'),(2,'QT-AAR-2026-0032',1,1,'2026-04-16','2026-05-10',14,'Ex-warehouse, transport extra','50% advance, 50% on delivery',842000.00,18.00,151560.00,25000.00,1018560.00,0,NULL,NULL,NULL,'rejected','Higher price, no installation service',NULL,'2026-08-11 08:10:44','2026-08-11 08:10:44'),(3,'QT-POL-2026-0048',1,2,'2026-04-14','2026-05-05',10,'Delivered to site','25% advance, balance on delivery',885000.00,18.00,159300.00,0.00,1044300.00,0,NULL,NULL,NULL,'rejected','Fastest delivery but highest price, Chinese brand',NULL,'2026-08-11 08:10:44','2026-08-11 08:10:44'),(4,'QT-HEL-2026-0021',2,3,'2026-04-19','2026-05-19',21,'Delivered and unloaded at site','20% advance, 80% within 30 days of delivery',1180000.00,18.00,212400.00,0.00,1392400.00,0,NULL,NULL,NULL,'under_review','Premium quality, comprehensive certification',NULL,'2026-08-11 08:10:44','2026-08-11 08:10:44'),(5,'QT-AAR-2026-0033',2,1,'2026-04-20','2026-05-15',14,'Ex-warehouse Pune','40% advance, 60% on delivery',1085000.00,18.00,195300.00,32000.00,1312300.00,0,NULL,NULL,NULL,'under_review','Lower price but need to arrange transport',NULL,'2026-08-11 08:10:44','2026-08-11 08:10:44'),(6,'QT-20260917-0006',4,1,'2026-09-17',NULL,5,'FOB Site','Net 30',1140000.00,18.00,205200.00,0.00,1345200.00,0,NULL,NULL,NULL,'submitted',NULL,NULL,'2026-09-17 08:44:52','2026-09-17 08:44:52'),(7,'QT-20260917-0007',4,6,'2026-09-17',NULL,7,'Ex-Factory','Net 15',1100000.00,18.00,198000.00,0.00,1298000.00,1,'Lowest total cost and optimal delivery terms',1,'2026-09-17 08:46:48','selected',NULL,NULL,'2026-09-17 08:44:52','2026-09-17 08:44:52'),(8,'QT-20260918-0008',5,6,'2026-09-18',NULL,12,NULL,'Net 30 Days',250000.00,0.00,0.00,0.00,250000.00,0,NULL,NULL,NULL,'rejected',NULL,NULL,'2026-09-18 08:27:54','2026-09-18 05:21:03'),(9,'QT-20260918-0009',5,1,'2026-09-18',NULL,7,NULL,'Net 30 Days',245000.00,0.00,0.00,0.00,245000.00,1,'Lowest quoted price with acceptable delivery timeline.',18,'2026-09-18 05:21:03','selected',NULL,NULL,'2026-09-18 08:28:19','2026-09-18 05:21:03'),(10,'QT-20260918-0010',5,3,'2026-09-18',NULL,15,NULL,'Net 30 Days',500000.00,0.00,0.00,0.00,500000.00,0,NULL,NULL,NULL,'rejected',NULL,NULL,'2026-09-18 08:32:02','2026-09-18 05:21:03'),(11,'QT-20260918-0011',5,6,'2026-09-18',NULL,30,NULL,'Net 30 Days',245000.00,0.00,0.00,0.00,245000.00,0,NULL,NULL,NULL,'rejected',NULL,NULL,'2026-09-18 08:33:20','2026-09-18 05:21:03'),(16,'QTE-20260923-0014',8,1,'2026-09-21',NULL,3,'FOR Site Delivery (Freight Paid)','Net 30 Days after certified delivery',974000.00,18.00,175320.00,0.00,1149320.00,1,'L1 lowest qualified commercial bidder with fastest 3-day lead time.',17,'2026-09-30 02:11:36','selected',NULL,NULL,'2026-09-30 07:41:35','2026-10-05 23:48:55'),(17,'QT-20261005-0013',9,2,'2026-10-05',NULL,7,NULL,'Net 30 Days',43375.00,0.00,0.00,0.00,43375.00,1,'Lowest quoted price with acceptable delivery timeline.',17,'2026-10-05 06:07:13','selected',NULL,NULL,'2026-10-05 10:58:18','2026-10-05 06:07:13'),(18,'QT-20261005-0014',9,12,'2026-10-05',NULL,14,NULL,'Net 30 Days',58250.00,0.00,0.00,0.00,58250.00,0,'Lowest quoted price with acceptable delivery timeline.',17,'2026-10-05 05:34:10','rejected',NULL,NULL,'2026-10-05 10:59:44','2026-10-05 06:07:13'),(19,'QT-20261006-0015',9,14,'2026-10-06',NULL,7,'F.O.R Project Site (Freight Included)','Net 30 Days',125000.00,18.00,0.00,0.00,125000.00,0,NULL,NULL,NULL,'submitted','{\"documentName\":\"Apex_Quotation_Doc.pdf\",\"documentSize\":154200,\"documentType\":\"application/pdf\",\"extractedAt\":\"2026-10-07T10:01:30.941Z\",\"extracted\":{\"fileName\":\"Apex_Quotation_Doc.pdf\",\"fileSize\":154200,\"quoteNumber\":\"QT-APEX-2026-8812\",\"deliveryDays\":7,\"paymentTerms\":\"Net 30 Days\",\"deliveryTerms\":\"F.O.R Project Site (Freight Included)\",\"confidence\":99.4,\"taxPercent\":18,\"items\":[{\"rfqItemId\":52,\"itemName\":\"M s 100 mm Elbow\",\"quantity\":10,\"unit\":\"nos\",\"unitPrice\":260,\"totalPrice\":2600}]}}','/uploads/Apex_Quotation_Doc.pdf','2026-10-06 05:40:29','2026-10-07 04:31:31'),(20,'HQ-20261005-0904',9,3,'2026-10-07',NULL,7,'F.O.R Project Site (Freight Included)','Net 30 Days',510500.00,18.00,91890.00,0.00,602390.00,0,NULL,NULL,NULL,'submitted','{\"documentName\":\"Helios_HVAC_Quotation_HQ-20261005-0904.pdf\",\"documentSize\":142800,\"documentType\":\"application/pdf\",\"confidence\":99.4,\"extracted\":{\"fileName\":\"Helios_HVAC_Quotation_HQ-20261005-0904.pdf\",\"quoteNumber\":\"HQ-20261005-0904\",\"deliveryDays\":7,\"paymentTerms\":\"Net 30 Days\",\"confidence\":99.4,\"items\":[{\"rfqItemId\":52,\"itemName\":\"M s 100 mm Elbow\",\"quantity\":245,\"unit\":\"nos\",\"unitPrice\":260,\"totalPrice\":63700},{\"rfqItemId\":53,\"itemName\":\"M S Flange Size 80-mm\",\"quantity\":190,\"unit\":\"nos\",\"unitPrice\":780,\"totalPrice\":148200},{\"rfqItemId\":54,\"itemName\":\"M S 150 MM ELBOW\",\"quantity\":630,\"unit\":\"nos\",\"unitPrice\":420,\"totalPrice\":264600},{\"rfqItemId\":55,\"itemName\":\"GI U BOLT 80 MM\",\"quantity\":20,\"unit\":\"nos\",\"unitPrice\":85,\"totalPrice\":1700},{\"rfqItemId\":56,\"itemName\":\"GI U BOLT 100 MM\",\"quantity\":30,\"unit\":\"nos\",\"unitPrice\":110,\"totalPrice\":3300},{\"rfqItemId\":57,\"itemName\":\"GI U BOLT 150 MM\",\"quantity\":200,\"unit\":\"nos\",\"unitPrice\":145,\"totalPrice\":29000}]}}','/uploads/Helios_HVAC_Quotation_HQ-20261005-0904.pdf','2026-10-07 10:36:25','2026-10-07 10:36:25'),(21,'TEST-QT-1001',10,1,'2026-10-07',NULL,7,'F.O.R Project Site (Freight Included)','Net 30 Days',42900.00,18.00,7722.00,0.00,50622.00,0,NULL,NULL,NULL,'submitted','{\"documentName\":\"Quotation_QT-071_Essa tech services.pdf\",\"documentSize\":256778,\"documentType\":\"application/pdf\",\"extractedAt\":\"2026-10-07T15:39:26.708Z\",\"extracted\":{\"fileName\":\"Quotation_QT-071_Essa tech services.pdf\",\"fileSize\":256778,\"fileType\":\"application/pdf\",\"isImage\":false,\"docType\":\"Vendor Quotation (PDF)\",\"quoteNumber\":\"QT-071\",\"quoteDate\":\"Oct 7, 2026\",\"validUntil\":\"Nov 6, 2026\",\"deliveryDays\":7,\"deliveryTerms\":\"F.O.R Project Site (Freight Included)\",\"paymentTerms\":\"Net 30 Days\",\"confidence\":89,\"itemPrices\":{\"62\":395,\"63\":68},\"items\":[{\"rfqItemId\":62,\"itemName\":\"Cement Bags (50kg)\",\"specification\":\"Grade 53\",\"quantity\":100,\"unit\":\"bags\",\"unitPrice\":395,\"totalPrice\":39500,\"_source\":\"inferred\"},{\"rfqItemId\":63,\"itemName\":\"Steel Rods (12mm)\",\"specification\":\"TMT Grade\",\"quantity\":50,\"unit\":\"pieces\",\"unitPrice\":68,\"totalPrice\":3400,\"_source\":\"inferred\"}],\"subtotal\":42900,\"taxPercent\":18,\"taxAmount\":7722,\"shippingCost\":0,\"totalAmount\":50622}}','/uploads/Quotation_QT-071_Essa tech services-1791387566638-840639471.pdf','2026-10-07 12:12:38','2026-10-07 10:09:27'),(23,'TEST-HOTEL-001',1,1,'2026-10-08',NULL,2,'Direct Service / Completed','Due on 07/03/2019',5500.00,0.00,0.00,0.00,5500.00,0,NULL,NULL,NULL,'submitted','{\"documentName\":\"hotel bill--001.pdf\",\"documentSize\":135400,\"documentType\":\"application/pdf\",\"confidence\":98.6,\"extracted\":{\"fileName\":\"hotel bill--001.pdf\",\"fileSize\":135400,\"fileUrl\":\"/uploads/hotel bill--001.pdf\",\"docType\":\"Commercial Invoice / Hotel Bill\",\"quoteNumber\":\"INV-0000005\",\"deliveryDays\":1,\"paymentTerms\":\"Due on 07/03/2019\",\"deliveryTerms\":\"Direct Service / Completed\",\"subtotal\":5500,\"taxPercent\":0,\"taxAmount\":0,\"totalAmount\":5500,\"items\":[{\"id\":1,\"rfqItemId\":1,\"itemName\":\"Project\",\"quantity\":1,\"unit\":\"Job\",\"unitPrice\":5000,\"totalPrice\":5000,\"_source\":\"document\"},{\"id\":2,\"rfqItemId\":2,\"itemName\":\"Expenses\",\"quantity\":1,\"unit\":\"Item\",\"unitPrice\":500,\"totalPrice\":500,\"_source\":\"document\"}]}}','/uploads/hotel bill--001.pdf','2026-10-08 06:05:30','2026-10-08 00:35:31'),(24,'QT-071',10,15,'2026-10-08',NULL,5,'Door Delivery / F.O.R Site (Hyderabad)','Net 30 Days',8160.00,18.00,1468.80,0.00,9629.00,0,NULL,NULL,NULL,'submitted','{\"documentName\":\"Quotation_QT-071_Essa tech services.pdf\",\"documentSize\":256778,\"documentType\":\"application/pdf\",\"confidence\":98.5,\"extractedAt\":\"2026-10-08T06:58:40.884Z\",\"extracted\":{\"fileName\":\"Quotation_QT-071_Essa tech services.pdf\",\"fileSize\":256778,\"fileType\":\"application/pdf\",\"isImage\":false,\"docType\":\"Commercial Quotation (Fasteners & Hardware)\",\"quoteNumber\":\"QT-071\",\"quoteDate\":\"Oct 8, 2026\",\"validUntil\":\"Nov 7, 2026\",\"matchedVendorId\":15,\"matchedVendorName\":\"Swastik Fasteners\",\"deliveryDays\":5,\"deliveryTerms\":\"Door Delivery / F.O.R Site (Hyderabad)\",\"paymentTerms\":\"Net 30 Days\",\"confidence\":98.5,\"itemPrices\":{\"1\":10,\"2\":22,\"3\":16,\"4\":14},\"items\":[{\"id\":1,\"itemName\":\"10MM X 3\\\" ANCHOR FASTENER\",\"specification\":\"High tensile zinc plated anchor fastener (HSN 7318)\",\"quantity\":300,\"unit\":\"Pcs\",\"unitPrice\":10,\"totalPrice\":3000,\"hsn\":\"7318\",\"_source\":\"document\"},{\"id\":2,\"itemName\":\"U BOLTS 150MM\",\"specification\":\"Heavy duty galvanized pipe clamp U-bolt with nuts (HSN 7318)\",\"quantity\":200,\"unit\":\"Pcs\",\"unitPrice\":22,\"totalPrice\":4400,\"hsn\":\"7318\",\"_source\":\"document\"},{\"id\":3,\"itemName\":\"U BOLTS 100MM\",\"specification\":\"Standard pipe support U-bolt with nuts (HSN 7318)\",\"quantity\":30,\"unit\":\"Pcs\",\"unitPrice\":16,\"totalPrice\":480,\"hsn\":\"7318\",\"_source\":\"document\"},{\"id\":4,\"itemName\":\"U BOLTS 80MM\",\"specification\":\"Pipe support clamp U-bolt with nuts (HSN 7318)\",\"quantity\":20,\"unit\":\"Pcs\",\"unitPrice\":14,\"totalPrice\":280,\"hsn\":\"7318\",\"_source\":\"document\"}],\"subtotal\":8160,\"taxPercent\":18,\"taxAmount\":1468.8,\"cgstAmount\":734.4,\"sgstAmount\":734.4,\"roundingOff\":0.2,\"amountInWords\":\"Nine Thousand Six Hundred and Twenty Nine Only\",\"shippingCost\":0,\"totalAmount\":9629,\"fileUrl\":\"/uploads/Quotation_QT-071_Essa tech services-1791442716427-114451334.pdf\"}}','/uploads/Quotation_QT-071_Essa tech services-1791442716427-114451334.pdf','2026-10-08 06:58:40','2026-10-08 06:58:40'),(25,'FEE/BK/071',10,17,'2026-10-08',NULL,3,'Ex Stock (Ranigunj) - Freight Extra At Actuals','Against PI',28990.00,18.00,5218.20,0.00,34208.20,0,NULL,NULL,NULL,'submitted','{\"documentName\":\"enterprises materials.jpeg\",\"documentSize\":197617,\"documentType\":\"image/jpeg\",\"confidence\":99.8,\"extractedAt\":\"2026-10-08T08:11:36.520Z\",\"extracted\":{\"fileName\":\"enterprises materials.jpeg\",\"fileSize\":197617,\"fileType\":\"image/jpeg\",\"isImage\":true,\"docType\":\"Scanned Quotation (Hardware & Safety Supplies)\",\"quoteNumber\":\"FEE/BK/071\",\"quoteDate\":\"05/10/2026\",\"validUntil\":\"05/11/2026\",\"deliveryDays\":3,\"deliveryTerms\":\"Ex Stock (Ranigunj) - Freight Extra At Actuals\",\"paymentTerms\":\"Against PI\",\"subtotal\":28990,\"taxPercent\":18,\"taxAmount\":5218.2,\"cgstAmount\":2609.1,\"sgstAmount\":2609.1,\"totalAmount\":34208.2,\"amountInWords\":\"Thirty Four Thousand Two Hundred Eight and Twenty Paise Only\",\"matchedVendorId\":17,\"matchedVendorName\":\"Alfuraat Engineering Enterprises\",\"items\":[{\"id\":1,\"itemName\":\"Anchor Fastener Wedge Type - M10 x 80mm\",\"specification\":\"Anchor Fastener Wedge Type - M10 x 80mm zinc plated\",\"quantity\":300,\"unit\":\"Nos\",\"unitPrice\":12,\"totalPrice\":3600,\"_source\":\"image\"},{\"id\":2,\"itemName\":\"MS B/W Elbow - 150mm\",\"specification\":\"Mild steel butt weld elbow 150mm\",\"quantity\":20,\"unit\":\"Nos\",\"unitPrice\":550,\"totalPrice\":11000,\"_source\":\"image\"},{\"id\":3,\"itemName\":\"MS B/W Elbow - 100mm\",\"specification\":\"Mild steel butt weld elbow 100mm\",\"quantity\":10,\"unit\":\"Nos\",\"unitPrice\":300,\"totalPrice\":3000,\"_source\":\"image\"},{\"id\":4,\"itemName\":\"MS B/W Elbow - 80mm\",\"specification\":\"Mild steel butt weld elbow 80mm\",\"quantity\":10,\"unit\":\"Nos\",\"unitPrice\":245,\"totalPrice\":2450,\"_source\":\"image\"},{\"id\":5,\"itemName\":\"GI U Bolt - 150mm\",\"specification\":\"Galvanized iron pipe clamp U-bolt 150mm\",\"quantity\":200,\"unit\":\"Nos\",\"unitPrice\":27,\"totalPrice\":5400,\"_source\":\"image\"},{\"id\":6,\"itemName\":\"GI U Bolt - 100mm\",\"specification\":\"Galvanized iron pipe clamp U-bolt 100mm\",\"quantity\":30,\"unit\":\"Nos\",\"unitPrice\":24,\"totalPrice\":720,\"_source\":\"image\"},{\"id\":7,\"itemName\":\"GI U Bolt - 80mm\",\"specification\":\"Galvanized iron pipe clamp U-bolt 80mm\",\"quantity\":20,\"unit\":\"Nos\",\"unitPrice\":20,\"totalPrice\":400,\"_source\":\"image\"},{\"id\":8,\"itemName\":\"Alkoplus Safety Helmet - Yellow\",\"specification\":\"Industrial safety helmet yellow IS:2925\",\"quantity\":5,\"unit\":\"Nos\",\"unitPrice\":250,\"totalPrice\":1250,\"_source\":\"image\"},{\"id\":9,\"itemName\":\"Alkoplus Safety Helmet - Blue\",\"specification\":\"Industrial safety helmet blue IS:2925\",\"quantity\":1,\"unit\":\"Nos\",\"unitPrice\":250,\"totalPrice\":250,\"_source\":\"image\"},{\"id\":10,\"itemName\":\"KARAM Safety Helmet - White\",\"specification\":\"KARAM ratchet adjustment safety helmet white\",\"quantity\":2,\"unit\":\"Nos\",\"unitPrice\":315,\"totalPrice\":630,\"_source\":\"image\"},{\"id\":11,\"itemName\":\"Welding Gloves\",\"specification\":\"Industrial split leather welding gloves\",\"quantity\":2,\"unit\":\"Pair\",\"unitPrice\":145,\"totalPrice\":290,\"_source\":\"image\"},{\"id\":12,\"itemName\":\"Hand Gloves\",\"specification\":\"Cotton knitted protective hand gloves\",\"quantity\":2,\"unit\":\"Packet\",\"unitPrice\":0,\"totalPrice\":0,\"_source\":\"image\"}]}}','/uploads/enterprises materials-1791444860453-187599435.jpeg','2026-10-08 08:11:36','2026-10-08 08:11:36'),(26,'158',10,16,'2026-10-08',NULL,3,'Door Delivery / Site (Hyderabad)','20% advance before dispatch, 80% after work completion',25840.00,18.00,4651.20,0.00,30491.00,0,NULL,NULL,NULL,'submitted','{\"documentName\":\"158_2026-10-01.pdf\",\"documentSize\":330617,\"documentType\":\"application/pdf\",\"confidence\":98.5,\"extractedAt\":\"2026-10-08T08:52:12.364Z\",\"extracted\":{\"fileName\":\"158_2026-10-01.pdf\",\"fileSize\":330617,\"fileType\":\"application/pdf\",\"isImage\":false,\"docType\":\"Commercial Quotation (Fire Safety & Piping)\",\"quoteNumber\":\"158\",\"quoteDate\":\"Oct 8, 2026\",\"validUntil\":\"Nov 7, 2026\",\"matchedVendorId\":16,\"matchedVendorName\":\"Safety One Fire Service\",\"deliveryDays\":3,\"deliveryTerms\":\"Door Delivery / Site (Hyderabad)\",\"paymentTerms\":\"20% advance before dispatch, 80% after work completion\",\"confidence\":98.5,\"itemPrices\":{\"1\":245,\"2\":190,\"3\":630,\"4\":28,\"5\":31,\"6\":37},\"items\":[{\"id\":1,\"itemName\":\"M s 100 mm Elbow\",\"specification\":\"Mild steel 100 mm elbow fitting (HSN 7307)\",\"quantity\":10,\"unit\":\"NOS\",\"unitPrice\":245,\"totalPrice\":2450,\"hsn\":\"7307\",\"_source\":\"document\"},{\"id\":2,\"itemName\":\"M S Flange Size 80-mm\",\"specification\":\"Mild steel flange size 80mm standard grade (HSN 7307)\",\"quantity\":10,\"unit\":\"NOS\",\"unitPrice\":190,\"totalPrice\":1900,\"hsn\":\"7307\",\"_source\":\"document\"},{\"id\":3,\"itemName\":\"M S 150 MM ELBOW\",\"specification\":\"Mild steel 150mm heavy class elbow (HSN 7307)\",\"quantity\":20,\"unit\":\"NOS\",\"unitPrice\":630,\"totalPrice\":12600,\"hsn\":\"7307\",\"_source\":\"document\"},{\"id\":4,\"itemName\":\"GI U BOLT 80 MM\",\"specification\":\"Galvanized iron pipe clamp U-bolt 80mm with nuts & washers (HSN 7318)\",\"quantity\":20,\"unit\":\"NOS\",\"unitPrice\":28,\"totalPrice\":560,\"hsn\":\"7318\",\"_source\":\"document\"},{\"id\":5,\"itemName\":\"GI U BOLT 100 MM\",\"specification\":\"Galvanized iron pipe clamp U-bolt 100mm with nuts & washers (HSN 7318)\",\"quantity\":30,\"unit\":\"NOS\",\"unitPrice\":31,\"totalPrice\":930,\"hsn\":\"7318\",\"_source\":\"document\"},{\"id\":6,\"itemName\":\"GI U BOLT 150 MM\",\"specification\":\"Galvanized iron heavy support U-bolt 150mm with nuts & washers (HSN 7318)\",\"quantity\":200,\"unit\":\"NOS\",\"unitPrice\":37,\"totalPrice\":7400,\"hsn\":\"7318\",\"_source\":\"document\"}],\"subtotal\":25840,\"taxPercent\":18,\"taxAmount\":4651.2,\"cgstAmount\":2325.6,\"sgstAmount\":2325.6,\"roundingOff\":-0.2,\"amountInWords\":\"Thirty Thousand Four Hundred Ninety-One Only\",\"shippingCost\":0,\"totalAmount\":30491,\"fileUrl\":\"/uploads/158_2026-10-01-1791449508293-164790034.pdf\"}}','/uploads/158_2026-10-01-1791449508293-164790034.pdf','2026-10-08 08:52:12','2026-10-08 08:52:12'),(27,'MRL-2026-002',10,15,'2026-10-08',NULL,4,'F.O.R Project Site (Freight Extra)','Against Delivery / Net 15 Days',23800.00,18.00,4284.00,0.00,28084.00,0,NULL,NULL,NULL,'submitted','{\"documentName\":\"materials 2.jpeg\",\"documentSize\":72139,\"documentType\":\"image/jpeg\",\"confidence\":99.4,\"extracted\":{\"fileName\":\"materials 2.jpeg\",\"fileSize\":72139,\"fileType\":\"image/jpeg\",\"isImage\":true,\"docType\":\"Material Requirement List / Vendor Quotation\",\"quoteNumber\":\"MRL-2026-002\",\"quoteDate\":\"8/10/2026\",\"validUntil\":\"7/11/2026\",\"matchedVendorName\":\"Essa tech services\",\"deliveryDays\":4,\"deliveryTerms\":\"F.O.R Project Site (Freight Extra)\",\"paymentTerms\":\"Against Delivery / Net 15 Days\",\"confidence\":99.4,\"itemPrices\":{\"1\":0,\"2\":500,\"3\":250,\"4\":120,\"5\":35,\"6\":25,\"7\":22,\"8\":250,\"9\":250,\"10\":0,\"11\":145,\"12\":60},\"items\":[{\"id\":1,\"itemName\":\"Anchor Bolts 10 mm\",\"specification\":\"Standard anchor fasteners 10mm (Note: No Stock)\",\"quantity\":300,\"unit\":\"PCS\",\"unitPrice\":0,\"totalPrice\":0,\"_source\":\"image\"},{\"id\":2,\"itemName\":\"Short Elbows C class 150 mm\",\"specification\":\"Short radius C-class welded pipe elbows 150 mm\",\"quantity\":20,\"unit\":\"PCS\",\"unitPrice\":500,\"totalPrice\":10000,\"_source\":\"image\"},{\"id\":3,\"itemName\":\"Short Elbows C class 100 mm\",\"specification\":\"Short radius C-class welded pipe elbows 100 mm\",\"quantity\":10,\"unit\":\"PCS\",\"unitPrice\":250,\"totalPrice\":2500,\"_source\":\"image\"},{\"id\":4,\"itemName\":\"Short Elbows C class 80 mm\",\"specification\":\"Short radius C-class welded pipe elbows 80 mm\",\"quantity\":10,\"unit\":\"PCS\",\"unitPrice\":120,\"totalPrice\":1200,\"_source\":\"image\"},{\"id\":5,\"itemName\":\"U-Bolts 150 mm\",\"specification\":\"Heavy galvanized pipe clamp U-bolts 150 mm with nuts\",\"quantity\":200,\"unit\":\"PCS\",\"unitPrice\":35,\"totalPrice\":7000,\"_source\":\"image\"},{\"id\":6,\"itemName\":\"U-Bolts 100 mm\",\"specification\":\"Galvanized pipe clamp U-bolts 100 mm with nuts\",\"quantity\":30,\"unit\":\"PCS\",\"unitPrice\":25,\"totalPrice\":750,\"_source\":\"image\"},{\"id\":7,\"itemName\":\"U-Bolts 80 mm\",\"specification\":\"Galvanized pipe clamp U-bolts 80 mm with nuts\",\"quantity\":20,\"unit\":\"PCS\",\"unitPrice\":22,\"totalPrice\":440,\"_source\":\"image\"},{\"id\":8,\"itemName\":\"Safety Helmets - Yellow\",\"specification\":\"Industrial safety helmets IS:2925 standard (Yellow)\",\"quantity\":5,\"unit\":\"PCS\",\"unitPrice\":250,\"totalPrice\":1250,\"_source\":\"image\"},{\"id\":9,\"itemName\":\"Safety Helmets - Blue\",\"specification\":\"Industrial safety helmets IS:2925 standard (Blue)\",\"quantity\":1,\"unit\":\"PCS\",\"unitPrice\":250,\"totalPrice\":250,\"_source\":\"image\"},{\"id\":10,\"itemName\":\"Safety Helmets White (Karam)\",\"specification\":\"KARAM ratchet safety helmets (White - Note: No Stock)\",\"quantity\":2,\"unit\":\"PCS\",\"unitPrice\":0,\"totalPrice\":0,\"_source\":\"image\"},{\"id\":11,\"itemName\":\"Welding Gloves\",\"specification\":\"Heavy split leather industrial welding protective gloves\",\"quantity\":2,\"unit\":\"Pairs\",\"unitPrice\":145,\"totalPrice\":290,\"_source\":\"image\"},{\"id\":12,\"itemName\":\"Hand Gloves\",\"specification\":\"Cotton knitted industrial protective working gloves pack\",\"quantity\":2,\"unit\":\"Packets\",\"unitPrice\":60,\"totalPrice\":120,\"_source\":\"image\"}],\"subtotal\":23800,\"taxPercent\":18,\"taxAmount\":4284,\"cgstAmount\":2142,\"sgstAmount\":2142,\"totalAmount\":28084,\"amountInWords\":\"Twenty Eight Thousand Eighty Four Only\",\"shippingCost\":0}}','/uploads/materials 2-1791451868552-392056893.jpeg','2026-10-08 09:31:08','2026-10-08 09:31:08'),(28,'TEST-Q-1791452982030',10,17,'2026-10-08',NULL,5,'F.O.R Site','Net 30 Days',50000.00,18.00,9000.00,0.00,59000.00,0,NULL,NULL,NULL,'submitted',NULL,'/uploads/brand_new_quote_test.pdf','2026-10-08 09:49:42','2026-10-08 09:49:42'),(29,'QT-20261008-0024',11,1,'2026-10-08',NULL,5,'Door Delivery / F.O.R Site (Hyderabad)','Net 30 Days',8160.00,18.00,1468.80,0.00,9629.00,0,NULL,NULL,NULL,'submitted','{\"documentName\":\"Quotation_QT-071_Essa tech services.pdf\",\"documentSize\":256778,\"documentType\":\"application/pdf\",\"confidence\":99.5,\"extractedAt\":\"2026-10-08T10:23:40.049Z\",\"extracted\":{\"fileName\":\"Quotation_QT-071_Essa tech services.pdf\",\"fileSize\":256778,\"fileType\":\"application/pdf\",\"isImage\":false,\"docType\":\"Commercial Quotation (Fasteners & Hardware)\",\"quoteNumber\":\"QT-071\",\"quoteDate\":\"8/10/2026\",\"validUntil\":\"7/11/2026\",\"matchedVendorName\":\"Essa tech services\",\"deliveryDays\":5,\"deliveryTerms\":\"Door Delivery / F.O.R Site (Hyderabad)\",\"paymentTerms\":\"Net 30 Days\",\"confidence\":99.5,\"itemPrices\":{\"1\":10,\"2\":22,\"3\":16,\"4\":14},\"items\":[{\"id\":1,\"itemName\":\"10MM X 3\\\" ANCHOR FASTENER\",\"specification\":\"High tensile zinc plated anchor fastener (HSN 7318)\",\"quantity\":300,\"unit\":\"Pcs\",\"unitPrice\":10,\"totalPrice\":3000,\"hsn\":\"7318\",\"_source\":\"document\"},{\"id\":2,\"itemName\":\"U BOLTS 150MM\",\"specification\":\"Heavy duty galvanized pipe clamp U-bolt with nuts (HSN 7318)\",\"quantity\":200,\"unit\":\"Pcs\",\"unitPrice\":22,\"totalPrice\":4400,\"hsn\":\"7318\",\"_source\":\"document\"},{\"id\":3,\"itemName\":\"U BOLTS 100MM\",\"specification\":\"Standard pipe support U-bolt with nuts (HSN 7318)\",\"quantity\":30,\"unit\":\"Pcs\",\"unitPrice\":16,\"totalPrice\":480,\"hsn\":\"7318\",\"_source\":\"document\"},{\"id\":4,\"itemName\":\"U BOLTS 80MM\",\"specification\":\"Pipe support clamp U-bolt with nuts (HSN 7318)\",\"quantity\":20,\"unit\":\"Pcs\",\"unitPrice\":14,\"totalPrice\":280,\"hsn\":\"7318\",\"_source\":\"document\"}],\"subtotal\":8160,\"taxPercent\":18,\"taxAmount\":1468.8,\"cgstAmount\":734.4,\"sgstAmount\":734.4,\"roundingOff\":0.2,\"totalAmount\":9629,\"amountInWords\":\"Nine Thousand Six Hundred and Twenty Nine Only\",\"shippingCost\":0,\"fileUrl\":\"/uploads/Quotation_QT-071_Essa tech services-1791455017052-674483616.pdf\"}}','/uploads/Quotation_QT-071_Essa tech services-1791455017052-674483616.pdf','2026-10-08 10:23:40','2026-10-08 10:23:40'),(30,'QT-20261008-0025',11,16,'2026-10-08',NULL,3,'Door Delivery / Site (Hyderabad)','20% advance before dispatch, 80% after work completion',25840.00,18.00,4651.20,0.00,30491.00,0,NULL,NULL,NULL,'submitted','{\"documentName\":\"158_2026-10-01.pdf\",\"documentSize\":330617,\"documentType\":\"application/pdf\",\"confidence\":99.3,\"extractedAt\":\"2026-10-08T10:28:49.887Z\",\"extracted\":{\"fileName\":\"158_2026-10-01.pdf\",\"fileSize\":330617,\"fileType\":\"application/pdf\",\"isImage\":false,\"docType\":\"Commercial Quotation (Fire Safety & Piping)\",\"quoteNumber\":\"158\",\"quoteDate\":\"8/10/2026\",\"validUntil\":\"7/11/2026\",\"matchedVendorName\":\"Safety One Fire Service\",\"deliveryDays\":3,\"deliveryTerms\":\"Door Delivery / Site (Hyderabad)\",\"paymentTerms\":\"20% advance before dispatch, 80% after work completion\",\"confidence\":99.3,\"itemPrices\":{\"1\":245,\"2\":190,\"3\":630,\"4\":28,\"5\":31,\"6\":37},\"items\":[{\"id\":1,\"itemName\":\"M s 100 mm Elbow\",\"specification\":\"Mild steel 100 mm elbow fitting (HSN 7307)\",\"quantity\":10,\"unit\":\"NOS\",\"unitPrice\":245,\"totalPrice\":2450,\"hsn\":\"7307\",\"_source\":\"document\"},{\"id\":2,\"itemName\":\"M S Flange Size 80-mm\",\"specification\":\"Mild steel flange size 80mm standard grade (HSN 7307)\",\"quantity\":10,\"unit\":\"NOS\",\"unitPrice\":190,\"totalPrice\":1900,\"hsn\":\"7307\",\"_source\":\"document\"},{\"id\":3,\"itemName\":\"M S 150 MM ELBOW\",\"specification\":\"Mild steel 150mm heavy class elbow (HSN 7307)\",\"quantity\":20,\"unit\":\"NOS\",\"unitPrice\":630,\"totalPrice\":12600,\"hsn\":\"7307\",\"_source\":\"document\"},{\"id\":4,\"itemName\":\"GI U BOLT 80 MM\",\"specification\":\"Galvanized iron pipe clamp U-bolt 80mm with nuts & washers (HSN 7318)\",\"quantity\":20,\"unit\":\"NOS\",\"unitPrice\":28,\"totalPrice\":560,\"hsn\":\"7318\",\"_source\":\"document\"},{\"id\":5,\"itemName\":\"GI U BOLT 100 MM\",\"specification\":\"Galvanized iron pipe clamp U-bolt 100mm with nuts & washers (HSN 7318)\",\"quantity\":30,\"unit\":\"NOS\",\"unitPrice\":31,\"totalPrice\":930,\"hsn\":\"7318\",\"_source\":\"document\"},{\"id\":6,\"itemName\":\"GI U BOLT 150 MM\",\"specification\":\"Galvanized iron heavy support U-bolt 150mm with nuts & washers (HSN 7318)\",\"quantity\":200,\"unit\":\"NOS\",\"unitPrice\":37,\"totalPrice\":7400,\"hsn\":\"7318\",\"_source\":\"document\"}],\"subtotal\":25840,\"taxPercent\":18,\"taxAmount\":4651.2,\"cgstAmount\":2325.6,\"sgstAmount\":2325.6,\"roundingOff\":-0.2,\"totalAmount\":30491,\"amountInWords\":\"Thirty Thousand Four Hundred Ninety-One Only\",\"shippingCost\":0,\"fileUrl\":\"/uploads/158_2026-10-01-1791455316670-203082736.pdf\"}}','/uploads/158_2026-10-01-1791455316670-203082736.pdf','2026-10-08 10:28:49','2026-10-08 10:28:49'),(31,'CQ-2026-003',10,18,'2026-10-09',NULL,2,'On-site Carpentry & Installation','Due on Completion / ₹100 Advance Paid',420.00,12.00,50.40,0.00,370.40,0,NULL,NULL,NULL,'submitted','{\"documentName\":\"materials3.jpeg\",\"documentSize\":293339,\"documentType\":\"application/octet-stream\",\"extracted\":{\"fileName\":\"materials3.jpeg\",\"fileSize\":293339,\"fileType\":\"application/octet-stream\",\"isImage\":true,\"docType\":\"Carpenter Quotation / Service & Material Quotation\",\"quoteNumber\":\"CQ-2026-003\",\"quoteDate\":\"9/10/2026\",\"validUntil\":\"8/11/2026\",\"matchedVendorId\":18,\"matchedVendorName\":\"RASEED Carpentry Services\",\"deliveryDays\":2,\"deliveryTerms\":\"On-site Carpentry & Installation\",\"paymentTerms\":\"Due on Completion / ₹100 Advance Paid\",\"confidence\":99.8,\"itemPrices\":{\"1\":50,\"2\":60,\"3\":50,\"4\":50},\"items\":[{\"id\":1,\"itemName\":\"Service (Carpenter Labor)\",\"specification\":\"Skilled carpenter labor services (Hour)\",\"quantity\":1,\"unit\":\"Hour\",\"unitPrice\":50,\"totalPrice\":50,\"_source\":\"image\"},{\"id\":2,\"itemName\":\"Item (Wood Materials / Fixture)\",\"specification\":\"Standard wood / fixture component (Piece)\",\"quantity\":2,\"unit\":\"Piece\",\"unitPrice\":60,\"totalPrice\":120,\"_source\":\"image\"},{\"id\":3,\"itemName\":\"Service (Additional Carpentry Work)\",\"specification\":\"Additional carpenter service hours (Hour)\",\"quantity\":2,\"unit\":\"Hour\",\"unitPrice\":50,\"totalPrice\":100,\"_source\":\"image\"},{\"id\":4,\"itemName\":\"Item (Hardware & Accessories)\",\"specification\":\"Carpentry fittings and accessories (Piece)\",\"quantity\":3,\"unit\":\"Piece\",\"unitPrice\":50,\"totalPrice\":150,\"_source\":\"image\"}],\"subtotal\":420,\"taxPercent\":12,\"taxAmount\":50.4,\"cgstAmount\":25.2,\"sgstAmount\":25.2,\"totalAmount\":370.4,\"amountInWords\":\"Three Hundred Seventy and Forty Paise Only\",\"shippingCost\":0}}','/uploads/materials3-1791528146903-750399570.jpeg','2026-10-09 06:42:27','2026-10-09 06:42:27'),(32,'MRL-2026-002-5682',10,19,'2026-10-09',NULL,4,'F.O.R Project Site (Freight Extra)','Against Delivery / Net 15 Days',23800.00,18.00,4284.00,0.00,28084.00,0,NULL,NULL,NULL,'submitted','{\"documentName\":\"materials 2.jpeg\",\"documentSize\":72139,\"documentType\":\"application/octet-stream\",\"extractedAt\":\"2026-10-09T06:44:55.682Z\",\"extracted\":{\"fileName\":\"materials 2.jpeg\",\"fileSize\":72139,\"fileType\":\"application/octet-stream\",\"isImage\":true,\"docType\":\"Material Requirement List / Vendor Quotation\",\"quoteNumber\":\"MRL-2026-002\",\"quoteDate\":\"9/10/2026\",\"validUntil\":\"8/11/2026\",\"matchedVendorId\":19,\"matchedVendorName\":\"Essa tech services\",\"deliveryDays\":4,\"deliveryTerms\":\"F.O.R Project Site (Freight Extra)\",\"paymentTerms\":\"Against Delivery / Net 15 Days\",\"confidence\":99.4,\"itemPrices\":{\"1\":0,\"2\":500,\"3\":250,\"4\":120,\"5\":35,\"6\":25,\"7\":22,\"8\":250,\"9\":250,\"10\":0,\"11\":145,\"12\":60},\"items\":[{\"id\":1,\"itemName\":\"Anchor Bolts 10 mm\",\"specification\":\"Standard anchor fasteners 10mm (Note: No Stock)\",\"quantity\":300,\"unit\":\"PCS\",\"unitPrice\":0,\"totalPrice\":0,\"_source\":\"image\"},{\"id\":2,\"itemName\":\"Short Elbows C class 150 mm\",\"specification\":\"Short radius C-class welded pipe elbows 150 mm\",\"quantity\":20,\"unit\":\"PCS\",\"unitPrice\":500,\"totalPrice\":10000,\"_source\":\"image\"},{\"id\":3,\"itemName\":\"Short Elbows C class 100 mm\",\"specification\":\"Short radius C-class welded pipe elbows 100 mm\",\"quantity\":10,\"unit\":\"PCS\",\"unitPrice\":250,\"totalPrice\":2500,\"_source\":\"image\"},{\"id\":4,\"itemName\":\"Short Elbows C class 80 mm\",\"specification\":\"Short radius C-class welded pipe elbows 80 mm\",\"quantity\":10,\"unit\":\"PCS\",\"unitPrice\":120,\"totalPrice\":1200,\"_source\":\"image\"},{\"id\":5,\"itemName\":\"U-Bolts 150 mm\",\"specification\":\"Heavy galvanized pipe clamp U-bolts 150 mm with nuts\",\"quantity\":200,\"unit\":\"PCS\",\"unitPrice\":35,\"totalPrice\":7000,\"_source\":\"image\"},{\"id\":6,\"itemName\":\"U-Bolts 100 mm\",\"specification\":\"Galvanized pipe clamp U-bolts 100 mm with nuts\",\"quantity\":30,\"unit\":\"PCS\",\"unitPrice\":25,\"totalPrice\":750,\"_source\":\"image\"},{\"id\":7,\"itemName\":\"U-Bolts 80 mm\",\"specification\":\"Galvanized pipe clamp U-bolts 80 mm with nuts\",\"quantity\":20,\"unit\":\"PCS\",\"unitPrice\":22,\"totalPrice\":440,\"_source\":\"image\"},{\"id\":8,\"itemName\":\"Safety Helmets - Yellow\",\"specification\":\"Industrial safety helmets IS:2925 standard (Yellow)\",\"quantity\":5,\"unit\":\"PCS\",\"unitPrice\":250,\"totalPrice\":1250,\"_source\":\"image\"},{\"id\":9,\"itemName\":\"Safety Helmets - Blue\",\"specification\":\"Industrial safety helmets IS:2925 standard (Blue)\",\"quantity\":1,\"unit\":\"PCS\",\"unitPrice\":250,\"totalPrice\":250,\"_source\":\"image\"},{\"id\":10,\"itemName\":\"Safety Helmets White (Karam)\",\"specification\":\"KARAM ratchet safety helmets (White - Note: No Stock)\",\"quantity\":2,\"unit\":\"PCS\",\"unitPrice\":0,\"totalPrice\":0,\"_source\":\"image\"},{\"id\":11,\"itemName\":\"Welding Gloves\",\"specification\":\"Heavy split leather industrial welding protective gloves\",\"quantity\":2,\"unit\":\"Pairs\",\"unitPrice\":145,\"totalPrice\":290,\"_source\":\"image\"},{\"id\":12,\"itemName\":\"Hand Gloves\",\"specification\":\"Cotton knitted industrial protective working gloves pack\",\"quantity\":2,\"unit\":\"Packets\",\"unitPrice\":60,\"totalPrice\":120,\"_source\":\"image\"}],\"subtotal\":23800,\"taxPercent\":18,\"taxAmount\":4284,\"cgstAmount\":2142,\"sgstAmount\":2142,\"totalAmount\":28084,\"amountInWords\":\"Twenty Eight Thousand Eighty Four Only\",\"shippingCost\":0}}','/uploads/materials 2-1791528295675-728691098.jpeg','2026-10-09 06:44:55','2026-10-09 01:14:56'),(33,'1',10,19,'2026-10-09',NULL,5,'Door Delivery / F.O.R Site','Due on Receipt',30000.00,20.50,6150.00,500.00,34850.00,0,NULL,NULL,NULL,'submitted','{\"documentName\":\"my_custom_m5.jpg\",\"documentSize\":256573,\"documentType\":\"image/jpeg\",\"extractedAt\":\"2026-10-09T11:02:09.867Z\",\"extracted\":{\"fileName\":\"my_custom_m5.jpg\",\"fileSize\":256573,\"fileType\":\"image/jpeg\",\"isImage\":true,\"docType\":\"Commercial Quotation / Material Order\",\"quoteNumber\":\"1\",\"quoteDate\":\"9/10/2026\",\"validUntil\":\"8/11/2026\",\"matchedVendorId\":19,\"matchedVendorName\":\"Essa tech services\",\"deliveryDays\":5,\"deliveryTerms\":\"Door Delivery / F.O.R Site\",\"paymentTerms\":\"Due on Receipt\",\"confidence\":99.6,\"itemPrices\":{\"1\":1000,\"2\":1000,\"3\":1000},\"items\":[{\"id\":1,\"itemName\":\"[ITEM NAME #1]\",\"specification\":\"Standard material order (Tax: 20.5%, Disc: 5.0%)\",\"quantity\":10,\"unit\":\"Pcs\",\"unitPrice\":1000,\"totalPrice\":11550,\"_source\":\"image\"},{\"id\":2,\"itemName\":\"[ITEM NAME #2]\",\"specification\":\"Standard material order (Tax: 20.5%, Disc: 10.0%)\",\"quantity\":10,\"unit\":\"Pcs\",\"unitPrice\":1000,\"totalPrice\":11050,\"_source\":\"image\"},{\"id\":3,\"itemName\":\"[ITEM NAME #3]\",\"specification\":\"Standard material order (Tax: 20.5%, Disc: 3.0%)\",\"quantity\":10,\"unit\":\"Pcs\",\"unitPrice\":1000,\"totalPrice\":11750,\"_source\":\"image\"}],\"subtotal\":30000,\"taxPercent\":20.5,\"taxAmount\":6150,\"shippingCost\":500,\"totalAmount\":34850,\"amountInWords\":\"Thirty Four Thousand Eight Hundred Fifty Only\"}}','/uploads/my_custom_m5.jpg','2026-10-09 11:02:09','2026-10-09 05:32:10'),(34,'1-9250',10,19,'2026-10-09',NULL,5,'Door Delivery / F.O.R Site','Due on Receipt',30000.00,20.50,6150.00,500.00,34850.00,0,NULL,NULL,NULL,'submitted','{\"documentName\":\"my_custom_m5.jpg\",\"documentSize\":256573,\"documentType\":\"image/jpeg\",\"extractedAt\":\"2026-10-09T11:02:29.250Z\",\"extracted\":{\"fileName\":\"my_custom_m5.jpg\",\"fileSize\":256573,\"fileType\":\"image/jpeg\",\"isImage\":true,\"docType\":\"Commercial Quotation / Material Order\",\"quoteNumber\":\"1\",\"quoteDate\":\"9/10/2026\",\"validUntil\":\"8/11/2026\",\"matchedVendorId\":19,\"matchedVendorName\":\"Essa tech services\",\"deliveryDays\":5,\"deliveryTerms\":\"Door Delivery / F.O.R Site\",\"paymentTerms\":\"Due on Receipt\",\"confidence\":99.6,\"itemPrices\":{\"1\":1000,\"2\":1000,\"3\":1000},\"items\":[{\"id\":1,\"itemName\":\"[ITEM NAME #1]\",\"specification\":\"Standard material order (Tax: 20.5%, Disc: 5.0%)\",\"quantity\":10,\"unit\":\"Pcs\",\"unitPrice\":1000,\"totalPrice\":11550,\"_source\":\"image\"},{\"id\":2,\"itemName\":\"[ITEM NAME #2]\",\"specification\":\"Standard material order (Tax: 20.5%, Disc: 10.0%)\",\"quantity\":10,\"unit\":\"Pcs\",\"unitPrice\":1000,\"totalPrice\":11050,\"_source\":\"image\"},{\"id\":3,\"itemName\":\"[ITEM NAME #3]\",\"specification\":\"Standard material order (Tax: 20.5%, Disc: 3.0%)\",\"quantity\":10,\"unit\":\"Pcs\",\"unitPrice\":1000,\"totalPrice\":11750,\"_source\":\"image\"}],\"subtotal\":30000,\"taxPercent\":20.5,\"taxAmount\":6150,\"shippingCost\":500,\"totalAmount\":34850,\"amountInWords\":\"Thirty Four Thousand Eight Hundred Fifty Only\"}}','/uploads/my_custom_m5.jpg','2026-10-09 11:02:29','2026-10-09 05:32:29'),(35,'QT-QUOTAT-632',11,1,'2026-10-09',NULL,15,'F.O.R Project Site (Freight Included)','Payment Terms: 15 Days',9960.00,18.00,1972.00,1000.00,12932.00,0,NULL,NULL,NULL,'submitted','{\"documentName\":\"quotation2.jpeg\",\"documentSize\":450947,\"documentType\":\"image/jpeg\",\"extractedAt\":\"2026-10-09T11:46:02.004Z\",\"extracted\":{\"fileName\":\"quotation2.jpeg\",\"fileSize\":450947,\"fileType\":\"image/jpeg\",\"isImage\":true,\"docType\":\"Scanned Quotation Image\",\"quoteNumber\":\"QT-QUOTAT-632\",\"quoteDate\":\"9/10/2026\",\"validUntil\":\"8/11/2026\",\"matchedVendorId\":1,\"matchedVendorName\":\"BLUE SKY INDIA LIMITED\",\"deliveryDays\":15,\"deliveryTerms\":\"F.O.R Project Site (Freight Included)\",\"paymentTerms\":\"Payment Terms: 15 Days\",\"confidence\":99.2,\"itemPrices\":{\"1\":20,\"2\":40,\"3\":50,\"4\":60},\"items\":[{\"id\":1,\"itemName\":\"ITEM NAME 1\",\"specification\":\"HSN: 4556 - Extracted from quotation2.jpeg\",\"quantity\":45,\"unit\":\"Pcs\",\"unitPrice\":20,\"totalPrice\":900,\"hsn\":\"4556\",\"_source\":\"image\"},{\"id\":2,\"itemName\":\"ITEM NAME 2\",\"specification\":\"HSN: 8978 - Extracted from quotation2.jpeg\",\"quantity\":23,\"unit\":\"Pcs\",\"unitPrice\":40,\"totalPrice\":920,\"hsn\":\"8978\",\"_source\":\"image\"},{\"id\":3,\"itemName\":\"ITEM NAME 3\",\"specification\":\"HSN: 5645 - Extracted from quotation2.jpeg\",\"quantity\":56,\"unit\":\"Pcs\",\"unitPrice\":50,\"totalPrice\":2800,\"hsn\":\"5645\",\"_source\":\"image\"},{\"id\":4,\"itemName\":\"ITEM NAME 4\",\"specification\":\"HSN: 2312 - Extracted from quotation2.jpeg\",\"quantity\":89,\"unit\":\"Pcs\",\"unitPrice\":60,\"totalPrice\":5340,\"hsn\":\"2312\",\"_source\":\"image\"}],\"subtotal\":9960,\"taxPercent\":18,\"taxAmount\":1972,\"cgstAmount\":986,\"sgstAmount\":986,\"totalAmount\":12932,\"amountInWords\":\"Twelve Thousand Nine Hundred Thirty Two Only\",\"shippingCost\":1000}}','/uploads/quotation2-1791546360016-265548198.jpeg','2026-10-09 11:45:59','2026-10-09 06:16:02'),(36,'QT-071-8938',11,15,'2026-10-13',NULL,7,'Prices are ex-works','100% Advance',8160.00,18.00,1468.80,0.00,9629.00,0,NULL,NULL,NULL,'submitted','{\"documentName\":\"extracted_real.jpg\",\"documentSize\":253433,\"documentType\":\"image/jpeg\",\"confidence\":99.5,\"extractedAt\":\"2026-10-13T05:28:28.898Z\",\"extracted\":{\"fileName\":\"extracted_real.jpg\",\"fileSize\":253433,\"fileType\":\"image/jpeg\",\"isImage\":true,\"docType\":\"Scanned Quotation Image\",\"quoteNumber\":\"QT-071\",\"quoteDate\":\"2026-10-01\",\"validUntil\":\"12/11/2026\",\"matchedVendorId\":15,\"matchedVendorName\":\"SWASTIK FASTENERS\",\"deliveryDays\":7,\"deliveryTerms\":\"Prices are ex-works\",\"paymentTerms\":\"100% Advance\",\"confidence\":99.5,\"itemPrices\":{\"1\":10,\"2\":22,\"3\":16,\"4\":14},\"items\":[{\"id\":1,\"itemName\":\"10MM X 3\\\" ANCHOR FASTENER\",\"specification\":\"HSN: 7318 - Extracted from extracted_real.jpg\",\"quantity\":300,\"unit\":\"Pcs\",\"unitPrice\":10,\"totalPrice\":3000,\"hsn\":\"7318\",\"_source\":\"image\"},{\"id\":2,\"itemName\":\"uBoLTs 150MM\",\"specification\":\"HSN: 7318 - Extracted from extracted_real.jpg\",\"quantity\":200,\"unit\":\"Pcs\",\"unitPrice\":22,\"totalPrice\":4400,\"hsn\":\"7318\",\"_source\":\"image\"},{\"id\":3,\"itemName\":\"uBoLTs 100MM\",\"specification\":\"HSN: 7318 - Extracted from extracted_real.jpg\",\"quantity\":30,\"unit\":\"Pcs\",\"unitPrice\":16,\"totalPrice\":480,\"hsn\":\"7318\",\"_source\":\"image\"},{\"id\":4,\"itemName\":\"uBoLTs somm\",\"specification\":\"HSN: 7318 - Extracted from extracted_real.jpg\",\"quantity\":20,\"unit\":\"Pcs\",\"unitPrice\":14,\"totalPrice\":280,\"hsn\":\"7318\",\"_source\":\"image\"}],\"subtotal\":8160,\"taxPercent\":18,\"taxAmount\":1468.8,\"cgstAmount\":734.4,\"sgstAmount\":734.4,\"roundingOff\":0.2,\"amountInWords\":\"NINE THOUSAND SIX HUNDRED AND TWENTY NINE ONLY\",\"shippingCost\":0,\"totalAmount\":9629}}','/uploads/extracted_real-1791869306924-285344019.jpg','2026-10-13 05:28:28','2026-10-13 05:28:28');

--
-- Table structure for table `project_assignments`
--

DROP TABLE IF EXISTS `project_assignments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `project_assignments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `user_id` int NOT NULL,
  `role` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'team_member',
  `assigned_at` timestamp NOT NULL DEFAULT (now()),
  `assigned_by_id` int DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `updated_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `project_assignments`
--

INSERT INTO `project_assignments` VALUES (1,1,18,'project_manager','2026-09-25 08:06:55',1,'2026-09-25 08:06:55','2026-09-25 08:11:17'),(2,2,18,'project_manager','2026-09-25 08:06:55',1,'2026-09-25 08:06:55','2026-09-25 08:11:17'),(3,3,2,'project_manager','2026-09-25 08:06:55',2,'2026-09-25 08:06:55','2026-09-25 08:06:55'),(4,4,18,'project_manager','2026-09-25 08:06:55',1,'2026-09-25 08:06:55','2026-09-25 08:11:17'),(5,5,2,'project_manager','2026-09-25 08:06:55',2,'2026-09-25 08:06:55','2026-09-25 08:06:55'),(6,6,18,'project_manager','2026-09-25 08:06:55',1,'2026-09-25 08:06:55','2026-09-25 08:11:17'),(8,14,17,'project_manager','2026-09-25 08:06:55',17,'2026-09-25 08:06:55','2026-09-25 08:06:55'),(9,1,17,'admin','2026-09-25 08:11:17',17,'2026-09-25 08:11:17','2026-09-25 08:11:17'),(10,1,19,'engineer','2026-09-25 08:11:17',18,'2026-09-25 08:11:17','2026-09-25 08:11:17'),(14,16,17,'project_manager','2026-10-07 07:41:10',17,'2026-10-07 07:41:10','2026-10-07 07:41:10'),(15,17,17,'project_manager','2026-10-07 07:41:30',17,'2026-10-07 07:41:30','2026-10-07 07:41:30'),(16,18,17,'project_manager','2026-10-07 08:43:26',17,'2026-10-07 08:43:26','2026-10-07 08:43:26'),(17,19,17,'project_manager','2026-10-07 08:48:01',17,'2026-10-07 08:48:01','2026-10-07 08:48:01');

--
-- Table structure for table `projects`
--

DROP TABLE IF EXISTS `projects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `projects` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `location` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `client_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `budget` decimal(14,2) DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `status` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'planning',
  `progress` int NOT NULL DEFAULT '0',
  `team_size` int DEFAULT NULL,
  `created_by_id` int DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `updated_at` timestamp NOT NULL DEFAULT (now()),
  `lifecycle_stage` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'setup',
  `project_manager_id` int DEFAULT NULL,
  `setup_complete` tinyint(1) NOT NULL DEFAULT '0',
  `organization_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_projects_org` (`organization_id`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `projects`
--

INSERT INTO `projects` VALUES (1,'Sentinel Tech Park — Phase 2','Commercial Build-out','Hinjewadi, Pune','Sentinel Realty','2026-01-15','2026-12-20',62000000.00,'180,000 sqft commercial build-out across two floor plates with shared amenities deck.','execution',100,38,1,'2026-08-05 06:44:24','2026-10-05 00:42:57','execution',18,0,1),(2,'Citygate Residences','Residential MEP','Andheri East, Mumbai','Citygate Developers','2025-09-01','2026-08-30',94000000.00,'MEP install across 24-floor residential tower. 188 apartments.','in_progress',72,52,1,'2026-08-05 06:44:24','2026-08-05 06:44:24','setup',18,0,1),(3,'Asha Hospital East Wing','Healthcare Fit-out','Koramangala, Bengaluru','Asha Healthcare','2026-05-01','2027-02-28',56000000.00,'ICU, OT, and patient ward fit-out for 4-floor wing.','execution',8,12,2,'2026-08-05 06:44:24','2026-09-18 06:06:08','execution',2,0,1),(4,'Northbrook Logistics Hub','Industrial','Bhiwandi, Maharashtra','Northbrook Group','2025-04-10','2026-03-15',38000000.00,'180,000 sqft warehouse with cold storage.','completed',100,22,1,'2026-08-05 06:44:24','2026-08-05 06:44:24','closed',18,0,1),(5,'Maplewood Towers Lobby Refresh','Interior','Gurgaon, Haryana','Maplewood Society','2026-03-01','2026-05-30',8500000.00,'Premium lobby refresh across two towers.','on_hold',25,8,2,'2026-08-05 06:44:24','2026-08-05 06:44:24','setup',2,0,1),(6,' Orion Business Hub — Tower B','Commercial Build-out',' Whitefield, Bengaluru','Orion Developers Pvt. Ltd','2026-08-06','2027-02-20',74000000.00,NULL,'handover',0,42,1,'2026-08-06 06:33:07','2026-08-06 05:42:32','handover',18,0,1),(14,'Sapphire Grand Hotel & Convention Center','Hospitality & Commercial Turnkey','Plot 42, Aerocity Boulevard, Mumbai','BlueWave Hospitality Pvt. Ltd','2026-09-01','2027-08-31',85000000.00,'5-Star Luxury Business Hotel featuring 120 keys, 800-pax convention banquet hall, multi-cuisine restaurants, and rooftop infinity deck.','execution',35,NULL,17,'2026-09-24 12:48:26','2026-10-05 23:48:55','planning',17,1,1),(16,'Mahesh Bhatia — Hotel Interior Fit-out','Hotel Interior Fit-out','Bandra West, Mumbai','Lumina Hospitality Group','2026-10-07','2027-08-03',8790000.00,'Converted from lead LD-20260811-0001. Client EPC Turnkey project.','planning',0,NULL,17,'2026-10-07 07:41:10','2026-10-07 07:41:10','setup',17,0,NULL),(17,'Ramesh Kumar —  Resort Expansion & Renovation',' Resort Expansion & Renovation','Colva Beach, Goa','Horizon Resorts Pvt. Ltd','2026-10-07','2027-08-03',45000000.00,'Converted from lead LD-20261007-0014. Client EPC Turnkey project.','planning',0,NULL,17,'2026-10-07 07:41:30','2026-10-07 07:41:30','setup',17,0,NULL),(18,'Test Customer — Residential','Residential','Test Location','Test Customer','2026-10-07','2027-08-03',1000000.00,'Converted from lead LD-20260806-0006. Client EPC Turnkey project.','planning',0,NULL,17,'2026-10-07 08:43:26','2026-10-07 08:43:26','setup',17,0,NULL),(19,'Ritesh Khanna — Residential Tower MEP','Residential Tower MEP','Powai, Mumbai','Northshore Residences','2026-10-07','2027-08-03',84000000.00,'Converted from lead LD-20260805-0003. Client EPC Turnkey project.','planning',0,NULL,17,'2026-10-07 08:48:01','2026-10-07 08:48:01','setup',17,0,NULL);

--
-- Table structure for table `punch_list_item_comments`
--

DROP TABLE IF EXISTS `punch_list_item_comments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `punch_list_item_comments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `punch_list_item_id` int NOT NULL,
  `author_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `text` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `punch_list_item_comments`
--


--
-- Table structure for table `punch_list_items`
--

DROP TABLE IF EXISTS `punch_list_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `punch_list_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `category` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'general',
  `priority` varchar(16) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'medium',
  `status` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'open',
  `assigned_to_id` int DEFAULT NULL,
  `due_date` date DEFAULT NULL,
  `resolved_at` timestamp NULL DEFAULT NULL,
  `resolved_by_id` int DEFAULT NULL,
  `created_by_id` int DEFAULT NULL,
  `photos` json NOT NULL DEFAULT (_utf8mb4'[]'),
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `updated_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `punch_list_items`
--

INSERT INTO `punch_list_items` VALUES (1,6,'Uneven floor tiles in corridor A2',NULL,'general','medium','in_progress',NULL,'2026-08-07',NULL,NULL,1,'[]','2026-08-06 10:59:54','2026-08-06 05:32:10'),(2,8,'Uneven floor tile alignment in Lobby Area',NULL,'general','medium','open',NULL,'2026-09-25',NULL,NULL,17,'[]','2026-09-18 15:31:29','2026-09-18 15:31:29'),(5,14,'Surface touch-up of minor honeycombing at column C-4 footing','Non-shrink grout application on column C-4 kicker junction.','civil','medium','resolved',NULL,NULL,NULL,NULL,17,'[]','2026-09-30 07:43:30','2026-09-30 07:43:30'),(6,14,'Perimeter barricading and excavation pit de-watering clearance','Verify safety barriers and clear mud accumulation after rain.','safety','high','resolved',NULL,NULL,NULL,NULL,17,'[]','2026-09-30 07:43:30','2026-09-30 07:43:30'),(7,1,'Surface touch-up of minor honeycombing at column C-4 footing','Non-shrink grout application on column C-4 kicker junction.','civil','medium','resolved',NULL,NULL,NULL,NULL,17,'[]','2026-10-05 06:12:57','2026-10-05 06:12:57'),(8,1,'Perimeter barricading and excavation pit de-watering clearance','Verify safety barriers and clear mud accumulation after rain.','safety','high','resolved',NULL,NULL,NULL,NULL,17,'[]','2026-10-05 06:12:57','2026-10-05 06:12:57');

--
-- Table structure for table `purchase_orders`
--

DROP TABLE IF EXISTS `purchase_orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `purchase_orders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `vendor_id` int NOT NULL,
  `po_number` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `total_amount` decimal(14,2) NOT NULL,
  `delivery_date` date DEFAULT NULL,
  `status` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `inspection_status` varchar(16) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `created_by_id` int DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `updated_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchase_orders`
--

INSERT INTO `purchase_orders` VALUES (4,6,1,'PO-20260807-0004','This purchase order is raised for the Orion Business Hub — Tower B project. Vendor details are pending selection. The total order value is INR 850,000, with delivery date yet to be confirmed.',850000.00,'2026-08-08','draft','pending',1,'2026-08-07 10:10:01','2026-08-07 10:10:01'),(5,1,4,'PO-SEN-2026-014','Vinyl flooring — Floor 5, 12000 sqft.',742000.00,'2026-05-10','acknowledged','pending',21,'2026-08-11 08:10:44','2026-08-11 08:10:44'),(6,1,2,'PO-SEN-2026-015','MEP electrical rework materials.',1820000.00,'2026-04-30','in_transit','pending',21,'2026-08-11 08:10:44','2026-08-11 08:10:44'),(7,2,3,'PO-CTY-2026-009','HVAC chillers — 4 units.',4800000.00,'2026-04-12','delivered','passed',21,'2026-08-11 08:10:44','2026-08-11 08:10:44');

--
-- Table structure for table `quotations`
--

DROP TABLE IF EXISTS `quotations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `quotations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `rfq_id` int NOT NULL,
  `vendor_id` int NOT NULL,
  `amount` decimal(14,2) NOT NULL,
  `delivery_days` int NOT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `is_selected` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `updated_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `quotations`
--

INSERT INTO `quotations` VALUES (1,1,1,780000.00,14,'Includes installation labor.',0,'2026-08-05 06:44:24','2026-08-05 06:44:24'),(2,1,4,742000.00,18,'Material only. 10-year warranty included.',1,'2026-08-05 06:44:24','2026-08-05 06:44:24'),(3,1,2,815000.00,10,'Premium German brand, fastest delivery.',0,'2026-08-05 06:44:24','2026-08-05 06:44:24'),(4,1,1,780000.00,14,'Includes installation labor.',0,'2026-08-11 08:10:44','2026-08-11 08:10:44'),(5,1,4,742000.00,18,'Material only. 10-year warranty included.',1,'2026-08-11 08:10:44','2026-08-11 08:10:44'),(6,1,2,815000.00,10,'Premium German brand, fastest delivery.',0,'2026-08-11 08:10:44','2026-08-11 08:10:44');

--
-- Table structure for table `ra_bill_approval_history`
--

DROP TABLE IF EXISTS `ra_bill_approval_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ra_bill_approval_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ra_bill_id` int NOT NULL,
  `action` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` int NOT NULL,
  `previous_status` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `new_status` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `comments` text COLLATE utf8mb4_unicode_ci,
  `action_date` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=33 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ra_bill_approval_history`
--

INSERT INTO `ra_bill_approval_history` VALUES (5,10,'created',17,NULL,'draft','RA Bill drafted','2026-09-23 09:18:41'),(6,10,'submitted',17,'draft','submitted','Submitted for PM Approval','2026-09-23 09:18:41'),(17,9,'submitted',17,'draft','submitted','Prepared by QS and submitted for PM review along with JMR sheet.','2026-09-21 10:30:00'),(18,9,'approved',17,'submitted','approved','Certified for payment. Quality and cube strength verified against IS 456.','2026-09-22 05:30:00'),(27,1,'submitted',17,'draft','submitted','Prepared by QS and submitted for PM review along with JMR sheet.','2026-09-21 10:30:00'),(28,1,'approved',17,'submitted','approved','Certified for payment. Quality and cube strength verified against IS 456.','2026-09-22 05:30:00'),(31,12,'submitted',17,'draft','submitted','Prepared by QS and submitted for PM review along with JMR sheet.','2026-09-21 10:30:00'),(32,12,'approved',17,'submitted','approved','Certified for payment. Quality and cube strength verified against IS 456.','2026-09-22 05:30:00');

--
-- Table structure for table `ra_bill_documents`
--

DROP TABLE IF EXISTS `ra_bill_documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ra_bill_documents` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ra_bill_id` int NOT NULL,
  `document_type` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_url` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_size` int DEFAULT NULL,
  `uploaded_by_id` int DEFAULT NULL,
  `uploaded_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ra_bill_documents`
--

INSERT INTO `ra_bill_documents` VALUES (1,9,'abstract_sheet','RA_Bill_1_Abstract.pdf','/uploads/ra1_abstract.pdf',NULL,17,'2026-09-23 07:23:34');

--
-- Table structure for table `ra_bill_items`
--

DROP TABLE IF EXISTS `ra_bill_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ra_bill_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ra_bill_id` int NOT NULL,
  `contract_boq_item_id` int NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `unit` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `rate` decimal(14,2) NOT NULL,
  `contract_quantity` decimal(14,3) NOT NULL,
  `previous_billed_qty` decimal(14,3) NOT NULL DEFAULT '0.000',
  `current_billed_qty` decimal(14,3) NOT NULL DEFAULT '0.000',
  `cumulative_billed_qty` decimal(14,3) NOT NULL DEFAULT '0.000',
  `previous_amount` decimal(14,2) NOT NULL DEFAULT '0.00',
  `current_amount` decimal(14,2) NOT NULL DEFAULT '0.00',
  `cumulative_amount` decimal(14,2) NOT NULL DEFAULT '0.00',
  `sort_order` int NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `updated_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=33 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ra_bill_items`
--

INSERT INTO `ra_bill_items` VALUES (27,1,43,'M25 Grade Ready Mix Concrete in Footings & Raft','cum',5500.00,200.000,0.000,100.000,100.000,0.00,550000.00,550000.00,0,'2026-10-05 06:12:57','2026-10-05 06:12:57'),(28,1,44,'High Yield Strength Deformed (HYSD) Steel Reinforcement Fe500','kg',72.00,15000.000,0.000,7500.000,7500.000,0.00,540000.00,540000.00,1,'2026-10-05 06:12:57','2026-10-05 06:12:57'),(31,12,49,'M25 Grade Ready Mix Concrete in Footings & Raft','cum',5500.00,200.000,0.000,100.000,100.000,0.00,550000.00,550000.00,0,'2026-10-06 05:18:55','2026-10-06 05:18:55'),(32,12,50,'High Yield Strength Deformed (HYSD) Steel Reinforcement Fe500','kg',72.00,15000.000,0.000,7500.000,7500.000,0.00,540000.00,540000.00,1,'2026-10-06 05:18:55','2026-10-06 05:18:55');

--
-- Table structure for table `ra_bills`
--

DROP TABLE IF EXISTS `ra_bills`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ra_bills` (
  `id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `bill_number` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `amount` decimal(14,2) NOT NULL DEFAULT '0.00',
  `milestone` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `created_by_id` int DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `updated_at` timestamp NOT NULL DEFAULT (now()),
  `document_url` text COLLATE utf8mb4_unicode_ci,
  `contract_id` int DEFAULT NULL,
  `vendor_id` int DEFAULT NULL,
  `work_completion_id` int DEFAULT NULL,
  `billing_period_start` date DEFAULT NULL,
  `billing_period_end` date DEFAULT NULL,
  `gross_amount` decimal(14,2) NOT NULL DEFAULT '0.00',
  `retention_percent` decimal(5,2) NOT NULL DEFAULT '5.00',
  `retention_amount` decimal(14,2) NOT NULL DEFAULT '0.00',
  `advance_recovery` decimal(14,2) NOT NULL DEFAULT '0.00',
  `tds_percent` decimal(5,2) NOT NULL DEFAULT '2.00',
  `tds_amount` decimal(14,2) NOT NULL DEFAULT '0.00',
  `gst_percent` decimal(5,2) NOT NULL DEFAULT '18.00',
  `gst_amount` decimal(14,2) NOT NULL DEFAULT '0.00',
  `other_deductions` decimal(14,2) NOT NULL DEFAULT '0.00',
  `deduction_remarks` text COLLATE utf8mb4_unicode_ci,
  `net_payable_amount` decimal(14,2) NOT NULL DEFAULT '0.00',
  `submitted_at` timestamp NULL DEFAULT NULL,
  `submitted_by_id` int DEFAULT NULL,
  `approved_by_id` int DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `approval_comments` text COLLATE utf8mb4_unicode_ci,
  `revision_requested_by_id` int DEFAULT NULL,
  `revision_requested_at` timestamp NULL DEFAULT NULL,
  `revision_reason` text COLLATE utf8mb4_unicode_ci,
  `bill_type` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'client',
  `client_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cumulative_amount` decimal(14,2) NOT NULL DEFAULT '0.00',
  `payment_certified_at` timestamp NULL DEFAULT NULL,
  `payment_certified_by_id` int DEFAULT NULL,
  `payment_certificate_number` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payment_certificate_notes` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  KEY `idx_ra_bills_project` (`project_id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ra_bills`
--

INSERT INTO `ra_bills` VALUES (1,1,'RA-SEN-001','1st Running Account Bill - Foundations & Plinth Pouring (Milestone 1)',1209900.00,'1st RA Bill - Foundation','invoice_generated',2,'2026-08-05 06:44:24','2026-10-05 00:42:57',NULL,5,1,3,'2026-09-01','2026-09-20',1090000.00,5.00,54500.00,0.00,2.00,21800.00,18.00,196200.00,0.00,NULL,1209900.00,'2026-09-21 10:30:00',17,17,'2026-09-22 05:30:00','Certified for payment. Quality and cube strength verified against IS 456.',NULL,NULL,NULL,'client',NULL,0.00,NULL,NULL,NULL,NULL),(2,1,'RA-SEN-002','Milestone 2: MEP rough-in',9500000.00,'MEP rough-in','submitted',2,'2026-08-05 06:44:24','2026-08-05 06:44:24',NULL,NULL,NULL,NULL,NULL,NULL,0.00,5.00,0.00,0.00,2.00,0.00,18.00,0.00,0.00,NULL,0.00,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'client',NULL,0.00,NULL,NULL,NULL,NULL),(3,2,'RA-CTY-005','Floors 1-12 MEP complete',18000000.00,'Lower 12 floors complete','invoiced',2,'2026-08-05 06:44:24','2026-08-05 06:44:24',NULL,NULL,NULL,NULL,NULL,NULL,0.00,5.00,0.00,0.00,2.00,0.00,18.00,0.00,0.00,NULL,0.00,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'client',NULL,0.00,NULL,NULL,NULL,NULL),(4,6,' RA-2026-002','Billing for completion of superstructure works up to the first floor, including columns, beams, and slab casting. Verified against site progress and approved for payment processing.',10000.00,'Superstructure up to first floor completed','invoiced',1,'2026-08-06 11:07:45','2026-09-23 03:39:37',NULL,NULL,NULL,NULL,NULL,NULL,0.00,5.00,0.00,0.00,2.00,0.00,18.00,0.00,0.00,NULL,0.00,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'client',NULL,0.00,NULL,NULL,NULL,NULL),(8,2,'RA-2026-001','Excavation and leveling of site',25000.00,'Foundation complete','invoiced',17,'2026-09-18 15:34:12','2026-09-22 02:36:21',NULL,NULL,NULL,NULL,NULL,NULL,0.00,5.00,0.00,0.00,2.00,0.00,18.00,0.00,0.00,NULL,0.00,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'client',NULL,0.00,NULL,NULL,NULL,NULL),(12,14,'RA-20260923-0014','1st Running Account Bill - Foundations & Plinth Pouring (Milestone 1)',1209900.00,'1st RA Bill - Foundation','invoice_generated',NULL,'2026-09-30 07:43:30','2026-10-05 23:48:55',NULL,4,1,2,'2026-09-01','2026-09-20',1090000.00,5.00,54500.00,0.00,2.00,21800.00,18.00,196200.00,0.00,NULL,1209900.00,'2026-09-21 10:30:00',17,17,'2026-09-22 05:30:00','Certified for payment. Quality and cube strength verified against IS 456.',NULL,NULL,NULL,'client',NULL,0.00,NULL,NULL,NULL,NULL),(13,19,'RAB-CLI-019-01','RA Bill for M1: Mobilization Advance & Site Possession Handover (10.00% of Contract)',8400000.00,'M1: Mobilization Advance & Site Possession Handover','draft',17,'2026-10-22 06:17:43','2026-10-22 06:17:43',NULL,11,NULL,NULL,'2026-10-07','2026-10-22',8400000.00,5.00,420000.00,0.00,2.00,168000.00,18.00,1512000.00,0.00,NULL,9324000.00,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'client','Northshore Residences',8400000.00,NULL,NULL,NULL,NULL);

--
-- Table structure for table `rfqs`
--

DROP TABLE IF EXISTS `rfqs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rfqs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `material_request_id` int DEFAULT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `status` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `created_by_id` int DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `updated_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rfqs`
--

INSERT INTO `rfqs` VALUES (1,1,1,'Vinyl flooring — Floor 5 (12,000 sqft premium)','Need premium-grade vinyl flooring with 10-year warranty. Delivery to Hinjewadi site.','awarded',5,'2026-08-05 06:44:24','2026-08-11 02:40:44'),(2,2,NULL,'Copper wiring 4mm — 4500m','For riser shaft electrical pull.','draft',5,'2026-08-05 06:44:24','2026-08-05 06:44:24'),(3,6,NULL,'Supply of vitrified flooring tiles','This RFQ invites vendors to submit quotations for the supply of vitrified flooring tiles for the Orion Business Hub — Tower B project. Quotations should include:\n\nUnit pricing and total cost\n\nDelivery schedule and lead time\n\nWarranty and quality certifications\n\nPayment terms and conditions','draft',1,'2026-08-07 10:11:30','2026-08-07 10:11:30'),(4,1,1,'Vinyl flooring — Floor 5 (12,000 sqft premium)','Need premium-grade vinyl flooring with 10-year warranty. Delivery to Hinjewadi site.','quotes_received',21,'2026-08-11 08:10:44','2026-08-11 08:10:44'),(5,2,NULL,'Copper wiring 4mm — 4500m','For riser shaft electrical pull.','draft',21,'2026-08-11 08:10:44','2026-08-11 08:10:44');

--
-- Table structure for table `role_switch_requests`
--

DROP TABLE IF EXISTS `role_switch_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `role_switch_requests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `current_role` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `requested_role` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `reason` text COLLATE utf8mb4_unicode_ci,
  `status` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `requested_at` timestamp NOT NULL DEFAULT (now()),
  `reviewed_by_id` int DEFAULT NULL,
  `reviewed_at` timestamp NULL DEFAULT NULL,
  `review_comments` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `updated_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Role switch requests - Only Project Managers can approve/reject';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `role_switch_requests`
--

INSERT INTO `role_switch_requests` VALUES (1,22,'viewer','project_manager','Need PM role to lead projects and approve budgets','approved','2026-08-25 04:48:49',17,'2026-08-24 23:21:20','Test approval','2026-08-25 04:48:49','2026-08-24 23:21:20'),(2,22,'viewer','engineer','Need engineer role to create technical specs','approved','2026-08-25 04:51:38',17,'2026-08-24 23:22:46','Test approval','2026-08-25 04:51:38','2026-08-24 23:22:46');

--
-- Table structure for table `site_attendance`
--

DROP TABLE IF EXISTS `site_attendance`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `site_attendance` (
  `id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `attendance_date` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `contractor_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT 'Direct / General',
  `trade` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `skilled_count` int NOT NULL DEFAULT '0',
  `unskilled_count` int NOT NULL DEFAULT '0',
  `supervisor_count` int NOT NULL DEFAULT '0',
  `shift` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT 'Day Shift',
  `hours_worked` decimal(6,2) DEFAULT '8.00',
  `wage_rate_per_day` decimal(12,2) DEFAULT '0.00',
  `total_labor_cost` decimal(14,2) DEFAULT '0.00',
  `remarks` text COLLATE utf8mb4_unicode_ci,
  `dpr_id` int DEFAULT NULL,
  `created_by_id` int DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `updated_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `site_attendance`
--

INSERT INTO `site_attendance` VALUES (1,14,'2026-10-15','L&T Civil Infrastructure','Bar Bending & Steelwork',14,10,2,'Day Shift',8.50,950.00,24800.00,'Slab reinforcement tying for Zone B podium columns',NULL,NULL,'2026-10-15 07:04:59','2026-10-15 07:04:59'),(2,14,'2026-10-15','Supreme Formwork Systems','Carpentry & Shuttering',12,8,1,'Day Shift',8.00,900.00,19800.00,'Formwork alignment and prop checks for Tower 1 Level 3',NULL,NULL,'2026-10-15 07:04:59','2026-10-15 07:04:59'),(3,14,'2026-10-15','Sterling MEP Contractors','Electrical & Plumbing',8,6,1,'Day Shift',8.00,980.00,14700.00,'Concealed electrical conduit laying and plumbing sleeve fixing',NULL,NULL,'2026-10-15 07:04:59','2026-10-15 07:04:59'),(4,14,'2026-10-15','Direct Labor Force','General Labor & Curing',2,12,1,'Day Shift',8.00,650.00,9750.00,'Continuous water curing of cast raft foundation and site cleanup',NULL,NULL,'2026-10-15 07:04:59','2026-10-15 07:04:59'),(5,1,'2026-10-15','Classic Masonry Works','Masonry & Plaster',10,8,1,'Day Shift',8.00,920.00,17480.00,'AAC block masonry on 4th floor perimeter walls',NULL,NULL,'2026-10-15 07:04:59','2026-10-15 07:04:59'),(6,3,'2026-10-15','Apex Flooring & Finishes','Flooring & Tiling',6,4,1,'Day Shift',8.00,950.00,10450.00,'Vitrified tile flooring in patient rooms corridor',NULL,NULL,'2026-10-15 07:04:59','2026-10-15 07:04:59'),(9,19,'2026-10-16','Site Multi-trade Muster Roll','Composite Trades',6,6,2,'Day Shift',8.00,0.00,10460.00,NULL,NULL,NULL,'2026-10-16 06:53:37','2026-10-16 06:53:37');

--
-- Table structure for table `site_daily_costs`
--

DROP TABLE IF EXISTS `site_daily_costs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `site_daily_costs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `cost_date` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cost_type` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(14,2) NOT NULL DEFAULT '0.00',
  `vendor_or_payee` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `voucher_ref` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payment_status` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT 'paid',
  `dpr_id` int DEFAULT NULL,
  `created_by_id` int DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `updated_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `site_daily_costs`
--

INSERT INTO `site_daily_costs` VALUES (1,14,'2026-10-15','material','Ready Mix Concrete M35 Supply (115 cum)',621000.00,'UltraTech RMC Plant Vashi','RMC-DEL-9842','pending_approval',NULL,NULL,'2026-10-15 07:04:59','2026-10-15 07:04:59'),(2,14,'2026-10-15','labor','Daily Labor Headcount Wages (36 workers across steel & carpentry)',44600.00,'L&T Civil Infrastructure & Supreme Formwork','WAGE-2026-1014','paid',NULL,NULL,'2026-10-15 07:04:59','2026-10-15 07:04:59'),(3,14,'2026-10-15','equipment','Boom Pump & Tower Crane Daily Rental & Operations',28500.00,'InfraPlant Heavy Machinery Rentals','EQ-RENT-443','paid',NULL,NULL,'2026-10-15 07:04:59','2026-10-15 07:04:59'),(4,14,'2026-10-15','petty_cash','Emergency high-pressure water pipe couplings and binding wire rolls',4850.00,'Shree Ganesh Hardware & Tools','PC-VOUCH-102','paid',NULL,NULL,'2026-10-15 07:04:59','2026-10-15 07:04:59'),(5,1,'2026-10-15','labor','Masonry Crew Wages for 4th Floor AAC blockwork',17480.00,'Classic Masonry Works','WAGE-MAS-089','paid',NULL,NULL,'2026-10-15 07:04:59','2026-10-15 07:04:59'),(6,3,'2026-10-15','material','Epoxy Tile Grout and Polymer Adhesive supply',18600.00,'Roff Construction Chemicals','INV-ROFF-551','paid',NULL,NULL,'2026-10-15 07:04:59','2026-10-15 07:04:59');

--
-- Table structure for table `site_equipment_logs`
--

DROP TABLE IF EXISTS `site_equipment_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `site_equipment_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `log_date` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `equipment_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `equipment_type` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT 'Heavy Machinery',
  `status` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'operational',
  `hours_operated` decimal(6,2) DEFAULT '0.00',
  `fuel_consumed_litres` decimal(8,2) DEFAULT '0.00',
  `operator_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `daily_cost` decimal(14,2) DEFAULT '0.00',
  `remarks` text COLLATE utf8mb4_unicode_ci,
  `dpr_id` int DEFAULT NULL,
  `created_by_id` int DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `updated_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `site_equipment_logs`
--

INSERT INTO `site_equipment_logs` VALUES (1,14,'2026-10-15','Schwing Stetter Boom Pump 36m','Batching & Pumping','operational',6.50,65.00,'Rajesh Patil',16500.00,'Pumped 115 cum M35 concrete to podium slab smoothly',NULL,NULL,'2026-10-15 07:04:59','2026-10-15 07:04:59'),(2,14,'2026-10-15','Potain Tower Crane (50m Jib)','Lifting & Hoisting','operational',8.00,0.00,'Sanjay Kamble',12000.00,'Steel rebar bundling and shuttering panel lifting',NULL,NULL,'2026-10-15 07:04:59','2026-10-15 07:04:59'),(3,14,'2026-10-15','JCB 3DX Super Excavator','Earthmoving','idle',2.00,22.00,'Mukesh Yadav',7500.00,'Completed perimeter trenching, standby for backfilling',NULL,NULL,'2026-10-15 07:04:59','2026-10-15 07:04:59'),(4,14,'2026-10-15','Cummins 125 kVA Silent DG Set','Power Generation','operational',4.50,48.00,'Ganesh Shinde',8400.00,'Backed up tower crane during 2-hour grid switchover',NULL,NULL,'2026-10-15 07:04:59','2026-10-15 07:04:59'),(5,1,'2026-10-15','Passenger & Material Hoist (Twin Cage)','Lifting & Hoisting','operational',7.50,0.00,'Dinesh Kumar',6500.00,'Shifted AAC blocks and mortar bags to 4th floor',NULL,NULL,'2026-10-15 07:04:59','2026-10-15 07:04:59'),(6,3,'2026-10-15','High Frequency Needle Vibrators (4 Nos)','Compaction Tools','operational',5.00,12.00,'Subhash Roy',3200.00,'Full compaction done on concrete beam junctions',NULL,NULL,'2026-10-15 07:04:59','2026-10-15 07:04:59');

--
-- Table structure for table `site_issues_delays`
--

DROP TABLE IF EXISTS `site_issues_delays`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `site_issues_delays` (
  `id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `reported_date` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'material_shortage',
  `severity` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'medium',
  `status` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'open',
  `days_impact` int DEFAULT '0',
  `cost_impact` decimal(14,2) DEFAULT '0.00',
  `mitigation_plan` text COLLATE utf8mb4_unicode_ci,
  `resolution_date` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `assigned_to` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_by_id` int DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `updated_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `site_issues_delays`
--

INSERT INTO `site_issues_delays` VALUES (1,14,'2026-10-14','Delayed Delivery of 25mm High-Tensile Steel Rebar from Secondary Mill','material_shortage','medium','in_progress',2,35000.00,'Diverted 8 MT stock from Orion Business Hub central yard to avoid delaying column starter tying schedule.',NULL,'Neha Kapoor (Procurement Officer)',NULL,'2026-10-15 07:04:59','2026-10-15 07:04:59'),(2,14,'2026-10-13','Client Clarification Pending on Banquet Hall Ceiling Recessed Light Cutouts','drawing_design','low','open',1,0.00,'Raised RFI #42 to Architect Lumina Design. Proceeding with perimeter framing first.',NULL,'Rohan Mehta (Project Manager)',NULL,'2026-10-15 07:04:59','2026-10-15 07:04:59'),(3,1,'2026-10-15','Municipal Water Supply Pressure Drop for Curing Operations','power_water','low','resolved',0,4500.00,'Dispatched 2 commercial 10,000L water tankers to replenish overhead backup tanks.','2026-10-15','Amit Deshmukh (Site Engineer)',NULL,'2026-10-15 07:04:59','2026-10-15 07:04:59');

--
-- Table structure for table `site_material_logs`
--

DROP TABLE IF EXISTS `site_material_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `site_material_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `log_date` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `material_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT 'Civil & Structural',
  `unit` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Units',
  `opening_stock` decimal(12,2) DEFAULT '0.00',
  `quantity_received` decimal(12,2) DEFAULT '0.00',
  `quantity_consumed` decimal(12,2) NOT NULL DEFAULT '0.00',
  `closing_stock` decimal(12,2) NOT NULL DEFAULT '0.00',
  `unit_cost` decimal(12,2) DEFAULT '0.00',
  `total_cost` decimal(14,2) DEFAULT '0.00',
  `location` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `remarks` text COLLATE utf8mb4_unicode_ci,
  `dpr_id` int DEFAULT NULL,
  `created_by_id` int DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `updated_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `site_material_logs`
--

INSERT INTO `site_material_logs` VALUES (1,14,'2026-10-15','Ready Mix Concrete M35','Civil & Structural','Cu.m',0.00,120.00,115.00,5.00,5400.00,621000.00,'Podium Slab Bay 4','Transit mixer pour tested with cube slump 125mm',NULL,NULL,'2026-10-15 07:04:59','2026-10-15 07:04:59'),(2,14,'2026-10-15','TMT Rebar FE 550D (16mm & 20mm)','Civil & Structural','MT',42.50,25.00,14.20,53.30,68500.00,972700.00,'Steel Yard & Podium Columns','Batch test certs verified, bent as per BBS schedule Rev 3',NULL,NULL,'2026-10-15 07:04:59','2026-10-15 07:04:59'),(3,14,'2026-10-15','OPC 53 Grade Cement (Ultratech)','Civil & Structural','Bags',650.00,400.00,220.00,830.00,395.00,86900.00,'Site Godown A','Used for column starter mortar and masonry mix',NULL,NULL,'2026-10-15 07:04:59','2026-10-15 07:04:59'),(4,14,'2026-10-15','River Sand (Washed)','Civil & Structural','Brass',18.00,10.00,8.50,19.50,8200.00,69700.00,'Aggregate Yard','Zone II silt content verified < 4%',NULL,NULL,'2026-10-15 07:04:59','2026-10-15 07:04:59'),(5,1,'2026-10-15','AAC Blocks (600x200x150mm)','Masonry','Nos',1200.00,1500.00,850.00,1850.00,65.00,55250.00,'Floor 4 Storage','Block bond polymer adhesive applied',NULL,NULL,'2026-10-15 07:04:59','2026-10-15 07:04:59'),(6,3,'2026-10-15','Vitrified Tiles (800x800mm)','Finishing','Sq.ft',4500.00,0.00,620.00,3880.00,78.00,48360.00,'East Wing Floor 2','Epoxy grouting scheduled next day',NULL,NULL,'2026-10-15 07:04:59','2026-10-15 07:04:59');

--
-- Table structure for table `site_photos`
--

DROP TABLE IF EXISTS `site_photos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `site_photos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `captured_date` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'progress',
  `image_url` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `location` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `latitude` double DEFAULT NULL,
  `longitude` double DEFAULT NULL,
  `gps_accuracy` double DEFAULT NULL,
  `geotag_address` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `stage` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dpr_id` int DEFAULT NULL,
  `created_by_id` int DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `updated_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `site_photos`
--

INSERT INTO `site_photos` VALUES (1,14,'2026-10-15','Podium Slab Bay 4 Concrete Pour in Progress','progress','https://images.unsplash.com/photo-1541888946425-d0fbb186c5f8?auto=format&fit=crop&w=1200&q=80','Podium Level Bay 4',18.591245,73.738912,3.5,'Phase 2, Hinjewadi Rajiv Gandhi Infotech Park, Pune, Maharashtra 411057','Boom pump discharging M35 design mix concrete. Electric vibrator compaction team working in tandem.','Superstructure RCC',NULL,NULL,'2026-10-15 07:04:59','2026-10-23 07:11:43'),(2,14,'2026-10-15','Rebar Tying & Cover Block Inspection on Podium Columns','quality','https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=80','Grid C4-D6',18.591245,73.738912,3.5,'Phase 2, Hinjewadi Rajiv Gandhi Infotech Park, Pune, Maharashtra 411057','Lead QC inspecting 40mm cover blocks and master rings on high-tensile column cage.','Quality & Assurance',NULL,NULL,'2026-10-15 07:04:59','2026-10-23 07:11:43'),(3,14,'2026-10-14','Daily Safety Briefing & Harness Inspection','safety','https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=1200&q=80','Site Assembly Ground',18.591245,73.738912,3.5,'Phase 2, Hinjewadi Rajiv Gandhi Infotech Park, Pune, Maharashtra 411057','Safety officer Suresh Pillai reviewing height safety procedures with morning shift crew.','HSE Protocols',NULL,NULL,'2026-10-15 07:04:59','2026-10-23 07:11:43'),(4,1,'2026-10-15','Floor 4 Blockwork Layout and Lintel Casting','progress','https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80','Sentinel Tech Park Floor 4',18.591245,73.738912,3.5,'Phase 2, Hinjewadi Rajiv Gandhi Infotech Park, Pune, Maharashtra 411057','AAC block wall alignment verified with plumb bob and spirit level.','Masonry & Partitioning',NULL,NULL,'2026-10-15 07:04:59','2026-10-23 07:11:43'),(5,19,'2026-10-16','Podium Slab Bay 4 Concrete Pour with Boom Pump','progress','https://images.unsplash.com/photo-1541888946425-d0fbb186c5f8?auto=format&fit=crop&w=1200&q=80','Podium Slab Bay 4',18.591245,73.738912,3.5,'Phase 2, Hinjewadi Rajiv Gandhi Infotech Park, Pune, Maharashtra 411057','Podium Slab Bay 4 Concrete Pour with Boom Pump','RCC Casting',8,1,'2026-10-16 11:53:16','2026-10-23 07:11:43'),(6,19,'2026-10-16','Rebar Inspection & Cover Block Verification before Pour','quality','https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=80','Podium Bay 4 Beams',18.591245,73.738912,3.5,'Phase 2, Hinjewadi Rajiv Gandhi Infotech Park, Pune, Maharashtra 411057','Rebar Inspection & Cover Block Verification before Pour','Quality Inspection',8,1,'2026-10-16 11:53:16','2026-10-23 07:11:43'),(7,19,'2026-10-15','Floor 3 AAC Blockwork Alignment & Joint Filling','progress','https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80','Floor 3 West Wing',18.591245,73.738912,3.5,'Phase 2, Hinjewadi Rajiv Gandhi Infotech Park, Pune, Maharashtra 411057','Floor 3 AAC Blockwork Alignment & Joint Filling','Masonry',9,1,'2026-10-16 11:53:16','2026-10-23 07:11:43'),(8,19,'2026-10-16','DPR Work Photo - 2026-10-16','Electrical & Plumbing','/uploads/electrical_conduit_test.jpg','Tower B Level 4 Corridor',18.591245,73.738912,3.5,'Phase 2, Hinjewadi Rajiv Gandhi Infotech Park, Pune, Maharashtra 411057','Conduit laying at Corridor B4','In Progress',10,17,'2026-10-16 12:02:18','2026-10-23 07:11:43'),(9,19,'2026-10-16','Conduit laying at Corridor B4','electrical','/uploads/electrical_conduit_test.jpg','Tower B Level 4 Corridor',18.591245,73.738912,3.5,'Phase 2, Hinjewadi Rajiv Gandhi Infotech Park, Pune, Maharashtra 411057','Automated test: Completed electrical conduit layout and box fixing on 4th floor.','In Progress',11,17,'2026-10-16 12:03:44','2026-10-23 07:11:43'),(10,19,'2026-10-16','Inspection of junction box terminations','quality','/uploads/junction_box_test.jpg','Tower B Level 4 Flat 402',18.591245,73.738912,3.5,'Phase 2, Hinjewadi Rajiv Gandhi Infotech Park, Pune, Maharashtra 411057','Captured via DPR Camera Tool','Testing',11,17,'2026-10-16 12:03:44','2026-10-23 07:11:43');

--
-- Table structure for table `site_quality_inspections`
--

DROP TABLE IF EXISTS `site_quality_inspections`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `site_quality_inspections` (
  `id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `inspection_date` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `inspection_title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `checklist_category` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Civil & Structure',
  `location` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'passed',
  `inspected_by` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `checkpoints_total` int DEFAULT '0',
  `checkpoints_passed` int DEFAULT '0',
  `corrective_actions` text COLLATE utf8mb4_unicode_ci,
  `remarks` text COLLATE utf8mb4_unicode_ci,
  `linked_task_id` int DEFAULT NULL,
  `created_by_id` int DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `updated_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `site_quality_inspections`
--

INSERT INTO `site_quality_inspections` VALUES (1,14,'2026-10-15','Pre-Pour Reinforcement & Cover Inspection - Bay 4','Civil & Structure','Podium Slab Grid B4-D8','passed','Priya Iyer (QC Lead)',12,12,'Cover blocks spacing adjusted at beam bottom corners before pour.','Bar diameter, lap lengths, shear chairs verified as per GFC drawings.',NULL,NULL,'2026-10-15 07:04:59','2026-10-15 07:04:59'),(2,14,'2026-10-14','Concrete Cube Compressive Strength 7-Day Test','Materials Testing','QC Field Laboratory','passed','Naveen Chawla (QA Engineer)',6,6,'None. Achieved 28.4 MPa (> 70% of 35 MPa target).','All 6 specimen cubes from raft footing cast exceeded strength criteria.',NULL,NULL,'2026-10-15 07:04:59','2026-10-15 07:04:59'),(3,14,'2026-10-13','Substructure Waterproofing Membrane & Primer Inspection','Waterproofing','Retaining Wall Grid A1-A12','conditional_pass','Priya Iyer (QC Lead)',10,9,'Touch-up required on 3 lap seam joints near pipe penetrations.','Re-inspection completed and signed off after double torch-on patch.',NULL,NULL,'2026-10-15 07:04:59','2026-10-15 07:04:59'),(4,1,'2026-10-15','4th Floor AAC Block Masonry Plumb & Mortar Joint Check','Finishing & Walls','Floor 4 South Wing','passed','Rohan Mehta (PM)',8,8,'Lintel bearing minimum 150mm verified.','Joint thickness uniformly maintained between 3-4mm with polymer adhesive.',NULL,NULL,'2026-10-15 07:04:59','2026-10-15 07:04:59');

--
-- Table structure for table `site_safety_incidents`
--

DROP TABLE IF EXISTS `site_safety_incidents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `site_safety_incidents` (
  `id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `incident_date` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `report_type` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'observation',
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `severity` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'low',
  `status` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'open',
  `location` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `action_taken` text COLLATE utf8mb4_unicode_ci,
  `reported_by` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `workers_attended` int DEFAULT '0',
  `created_by_id` int DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `updated_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `site_safety_incidents`
--

INSERT INTO `site_safety_incidents` VALUES (1,14,'2026-10-15','toolbox_talk','Daily Pre-Shift Toolbox Briefing: Working at Heights & Full Body Harnesses','low','closed','Podium Assembly Area','Conducted mandatory 15-minute safety briefing on anchor line clipping, 100% tie-off requirement, and edge barricades for podium formwork crew.','All 34 attendees inspected for double lanyard ISI marked harnesses and helmets.','Suresh Pillai (Safety Officer)',34,NULL,'2026-10-15 07:04:59','2026-10-15 07:04:59'),(2,14,'2026-10-14','near_miss','Loose Shuttering Tie-Rod Washer Dislodged During Hoisting','medium','closed','Tower 1 Staging Yard','A loose steel washer dropped from a height of 4 meters inside the barricaded hoist exclusion zone during crane slewing. No injury occurred.','Crane lifting box was replaced with fully enclosed cargo mesh bin. Lift supervisor issued safety reminder.','Suresh Pillai (Safety Officer)',6,NULL,'2026-10-15 07:04:59','2026-10-15 07:04:59'),(3,14,'2026-10-13','ppe_audit','Weekly Mandatory PPE Compliance Site Audit','low','closed','Entire Site Premises','Inspected 56 workers across 4 sub-contractors for ISI safety shoes, high-visibility reflective vests, safety goggles during rebar cutting, and hard hats.','98% compliance achieved. 2 replacement goggles issued immediately on spot.','Suresh Pillai (Safety Officer)',56,NULL,'2026-10-15 07:04:59','2026-10-15 07:04:59'),(4,1,'2026-10-15','first_aid','Minor Finger Scratch During Block Handling','low','closed','Floor 4 Masonry Section','Worker experienced a superficial scrape on left index finger while unloading block pallets. Cleaned and dressed with antiseptic at site clinic.','First aid dressing applied, heavy-duty grip gloves issued, worker resumed normal duties.','Dr. K. Nair (Site Paramedic)',1,NULL,'2026-10-15 07:04:59','2026-10-15 07:04:59');

--
-- Table structure for table `site_visits`
--

DROP TABLE IF EXISTS `site_visits`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `site_visits` (
  `id` int NOT NULL AUTO_INCREMENT,
  `lead_id` int NOT NULL,
  `visit_date` date NOT NULL,
  `visit_time` varchar(16) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `engineer_id` int DEFAULT NULL,
  `site_address` text COLLATE utf8mb4_unicode_ci,
  `latitude` double DEFAULT NULL,
  `longitude` double DEFAULT NULL,
  `measurements` text COLLATE utf8mb4_unicode_ci,
  `observations` text COLLATE utf8mb4_unicode_ci,
  `status` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `updated_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `site_visits`
--

INSERT INTO `site_visits` VALUES (1,1,'2026-04-12','10:30',3,'Pali Hill, Bandra West, Mumbai 400050',19.0596,72.8295,'Total carpet area 18,400 sqft across 42 rooms + lobby.','Existing electrical needs full rework. HVAC ducting can be retained.','completed','2026-08-05 06:44:24','2026-08-05 06:44:24'),(2,2,'2026-04-25','14:00',3,'ITPL Main Road, Whitefield, Bengaluru 560066',12.9698,77.7499,'11,200 sqft per floor, 22,400 sqft total.','Floor plates in shell condition, ready for fit-out.','pending','2026-08-05 06:44:24','2026-08-05 06:44:24'),(3,7,'2026-08-06','18:00',NULL,'Gachibowli',NULL,NULL,NULL,'Looking at site','completed','2026-08-06 10:18:55','2026-08-06 04:49:06'),(4,1,'2026-04-12','10:30',19,'Pali Hill, Bandra West, Mumbai 400050',19.0596,72.8295,'Total carpet area 18,400 sqft across 42 rooms + lobby.','Existing electrical needs full rework. HVAC ducting can be retained.','completed','2026-08-11 08:10:43','2026-08-11 08:10:43'),(5,2,'2026-04-25','14:00',19,'ITPL Main Road, Whitefield, Bengaluru 560066',12.9698,77.7499,'11,200 sqft per floor, 22,400 sqft total.','Floor plates in shell condition, ready for fit-out.','pending','2026-08-11 08:10:43','2026-08-11 08:10:43'),(7,14,'2026-09-18','10:30 AM',19,'Plot 14-B, Sector 62, Electronic City Phase 2, Bangalore',12.8452,77.6602,'Gross Built-Up: 42,500 sq.ft | Clear Height: 4.85 m | Slab Live Load Capacity: 15.0 kN/sq.m | HT Substation Yard: 1,800 sq.ft | Dedicated Chiller Yard: 2,200 sq.ft','Site is fully cordoned and leveled. Excellent arterial access for heavy concrete transit mixers and high-capacity mobile cranes. 3-phase temporary construction power feed available. Soil bearing capacity verified at 240 kN/sq.m. Client ready for immediate site possession.','completed','2026-09-24 12:39:08','2026-09-24 12:39:08');

--
-- Table structure for table `site_work_progress`
--

DROP TABLE IF EXISTS `site_work_progress`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `site_work_progress` (
  `id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `progress_date` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `activity_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT 'Civil',
  `unit` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT 'Sq.ft',
  `planned_quantity` decimal(12,2) DEFAULT '0.00',
  `executed_today` decimal(12,2) DEFAULT '0.00',
  `cumulative_executed` decimal(12,2) DEFAULT '0.00',
  `target_quantity` decimal(12,2) DEFAULT '0.00',
  `percent_completed` int DEFAULT '0',
  `location` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `task_id` int DEFAULT NULL,
  `milestone_id` int DEFAULT NULL,
  `dpr_id` int DEFAULT NULL,
  `remarks` text COLLATE utf8mb4_unicode_ci,
  `created_by_id` int DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `updated_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `site_work_progress`
--

INSERT INTO `site_work_progress` VALUES (1,14,'2026-10-15','Raft Foundation & Column Starter Casting','Substructure RCC','Cu.m',120.00,115.00,780.00,950.00,82,'Podium Footing Bay 4',NULL,NULL,NULL,'Concrete pour certified by third-party inspection agency',NULL,'2026-10-15 07:04:59','2026-10-15 07:04:59'),(2,14,'2026-10-15','Podium Columns Rebar Fabrication & Tying','Superstructure Steel','MT',15.00,14.20,68.50,110.00,62,'Grid Lines C4 to F8',NULL,NULL,NULL,'Cover block spacing and lap staggering checked',NULL,'2026-10-15 07:04:59','2026-10-15 07:04:59'),(3,14,'2026-10-15','Basement 1 Electrical Conduiting & Cable Tray Fixings','MEP Services','Rmt',250.00,220.00,1420.00,2200.00,65,'Basement 1 Parking & Service Corridor',NULL,NULL,NULL,'Conduits pull-wired and plugged to avoid slurry ingress',NULL,'2026-10-15 07:04:59','2026-10-15 07:04:59'),(4,1,'2026-10-15','Internal AAC Block Masonry 150mm','Masonry Walls','Sq.ft',1200.00,1100.00,8400.00,12500.00,67,'Floor 4 All Partitions',NULL,NULL,NULL,'Joint reinforcement mesh installed every 3rd course',NULL,'2026-10-15 07:04:59','2026-10-15 07:04:59'),(5,3,'2026-10-15','Vitrified Tile Flooring with Epoxy Grout','Architectural Finishes','Sq.ft',700.00,620.00,3100.00,5400.00,57,'East Wing Floor 2 Patient Rooms',NULL,NULL,NULL,'Slope toward floor trap verified with laser level',NULL,'2026-10-15 07:04:59','2026-10-15 07:04:59');

--
-- Table structure for table `site_worker_attendance`
--

DROP TABLE IF EXISTS `site_worker_attendance`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `site_worker_attendance` (
  `id` int NOT NULL AUTO_INCREMENT,
  `worker_id` int NOT NULL,
  `project_id` int NOT NULL,
  `attendance_date` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'present',
  `days_worked` decimal(4,2) NOT NULL DEFAULT '1.00',
  `daily_wage_rate` decimal(12,2) NOT NULL,
  `payable_amount` decimal(12,2) NOT NULL,
  `shift` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT 'Day Shift',
  `remarks` text COLLATE utf8mb4_unicode_ci,
  `created_by_id` int DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `updated_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=757 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `site_worker_attendance`
--

INSERT INTO `site_worker_attendance` VALUES (1,1,1,'2026-10-16','present',1.00,1350.00,1350.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(2,2,1,'2026-10-16','present',1.00,1400.00,1400.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(3,3,1,'2026-10-16','present',1.00,1250.00,1250.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(4,4,1,'2026-10-16','present',1.00,950.00,950.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(5,5,1,'2026-10-16','half_day',0.50,900.00,450.00,'Day Shift','Half day afternoon',1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(6,6,1,'2026-10-16','present',1.00,850.00,850.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(7,7,1,'2026-10-16','present',1.00,920.00,920.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(8,8,1,'2026-10-16','present',1.00,880.00,880.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(9,9,1,'2026-10-16','present',1.00,950.00,950.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(10,10,1,'2026-10-16','present',1.00,550.00,550.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(11,11,1,'2026-10-16','half_day',0.50,500.00,250.00,'Day Shift','Half day afternoon',1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(12,12,1,'2026-10-16','present',1.00,480.00,480.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(13,13,1,'2026-10-16','present',1.00,520.00,520.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(14,14,1,'2026-10-16','present',1.00,450.00,450.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(15,15,1,'2026-10-16','present',1.00,1300.00,1300.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(16,16,1,'2026-10-16','present',1.00,920.00,920.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(17,17,1,'2026-10-16','half_day',0.50,500.00,250.00,'Day Shift','Half day afternoon',1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(18,18,3,'2026-10-16','present',1.00,1250.00,1250.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(19,19,3,'2026-10-16','present',1.00,950.00,950.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(20,20,3,'2026-10-16','present',1.00,480.00,480.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(21,1,1,'2026-10-15','present',1.00,1350.00,1350.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(22,2,1,'2026-10-15','present',1.00,1400.00,1400.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(23,3,1,'2026-10-15','half_day',0.50,1250.00,625.00,'Day Shift','Half day afternoon',1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(24,4,1,'2026-10-15','absent',0.00,950.00,0.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(25,5,1,'2026-10-15','present',1.00,900.00,900.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(26,6,1,'2026-10-15','present',1.00,850.00,850.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(27,7,1,'2026-10-15','present',1.00,920.00,920.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(28,8,1,'2026-10-15','present',1.00,880.00,880.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(29,9,1,'2026-10-15','half_day',0.50,950.00,475.00,'Day Shift','Half day afternoon',1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(30,10,1,'2026-10-15','present',1.00,550.00,550.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(31,11,1,'2026-10-15','present',1.00,500.00,500.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(32,12,1,'2026-10-15','present',1.00,480.00,480.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(33,13,1,'2026-10-15','present',1.00,520.00,520.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(34,14,1,'2026-10-15','present',1.00,450.00,450.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(35,15,1,'2026-10-15','half_day',0.50,1300.00,650.00,'Day Shift','Half day afternoon',1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(36,16,1,'2026-10-15','present',1.00,920.00,920.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(37,17,1,'2026-10-15','present',1.00,500.00,500.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(38,18,3,'2026-10-15','present',1.00,1250.00,1250.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(39,19,3,'2026-10-15','present',1.00,950.00,950.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(40,20,3,'2026-10-15','present',1.00,480.00,480.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(41,1,1,'2026-10-14','half_day',0.50,1350.00,675.00,'Day Shift','Half day afternoon',1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(42,2,1,'2026-10-14','absent',0.00,1400.00,0.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(43,3,1,'2026-10-14','present',1.00,1250.00,1250.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(44,4,1,'2026-10-14','present',1.00,950.00,950.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(45,5,1,'2026-10-14','present',1.00,900.00,900.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(46,6,1,'2026-10-14','present',1.00,850.00,850.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(47,7,1,'2026-10-14','half_day',0.50,920.00,460.00,'Day Shift','Half day afternoon',1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(48,8,1,'2026-10-14','absent',0.00,880.00,0.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(49,9,1,'2026-10-14','present',1.00,950.00,950.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(50,10,1,'2026-10-14','present',1.00,550.00,550.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(51,11,1,'2026-10-14','present',1.00,500.00,500.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(52,12,1,'2026-10-14','present',1.00,480.00,480.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(53,13,1,'2026-10-14','half_day',0.50,520.00,260.00,'Day Shift','Half day afternoon',1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(54,14,1,'2026-10-14','present',1.00,450.00,450.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(55,15,1,'2026-10-14','present',1.00,1300.00,1300.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(56,16,1,'2026-10-14','present',1.00,920.00,920.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(57,17,1,'2026-10-14','present',1.00,500.00,500.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(58,18,3,'2026-10-14','present',1.00,1250.00,1250.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(59,19,3,'2026-10-14','half_day',0.50,950.00,475.00,'Day Shift','Half day afternoon',1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(60,20,3,'2026-10-14','present',1.00,480.00,480.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(61,1,1,'2026-10-13','present',1.00,1350.00,1350.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(62,2,1,'2026-10-13','present',1.00,1400.00,1400.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(63,3,1,'2026-10-13','present',1.00,1250.00,1250.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(64,4,1,'2026-10-13','present',1.00,950.00,950.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(65,5,1,'2026-10-13','half_day',0.50,900.00,450.00,'Day Shift','Half day afternoon',1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(66,6,1,'2026-10-13','absent',0.00,850.00,0.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(67,7,1,'2026-10-13','present',1.00,920.00,920.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(68,8,1,'2026-10-13','present',1.00,880.00,880.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(69,9,1,'2026-10-13','present',1.00,950.00,950.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(70,10,1,'2026-10-13','present',1.00,550.00,550.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(71,11,1,'2026-10-13','half_day',0.50,500.00,250.00,'Day Shift','Half day afternoon',1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(72,12,1,'2026-10-13','absent',0.00,480.00,0.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(73,13,1,'2026-10-13','present',1.00,520.00,520.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(74,14,1,'2026-10-13','present',1.00,450.00,450.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(75,15,1,'2026-10-13','present',1.00,1300.00,1300.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(76,16,1,'2026-10-13','present',1.00,920.00,920.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(77,17,1,'2026-10-13','half_day',0.50,500.00,250.00,'Day Shift','Half day afternoon',1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(78,18,3,'2026-10-13','absent',0.00,1250.00,0.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(79,19,3,'2026-10-13','present',1.00,950.00,950.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(80,20,3,'2026-10-13','present',1.00,480.00,480.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(81,1,1,'2026-10-12','present',1.00,1350.00,1350.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(82,2,1,'2026-10-12','present',1.00,1400.00,1400.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(83,3,1,'2026-10-12','present',1.00,1250.00,1250.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(84,4,1,'2026-10-12','absent',0.00,950.00,0.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(85,5,1,'2026-10-12','present',1.00,900.00,900.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(86,6,1,'2026-10-12','present',1.00,850.00,850.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(87,7,1,'2026-10-12','present',1.00,920.00,920.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(88,8,1,'2026-10-12','present',1.00,880.00,880.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(89,9,1,'2026-10-12','present',1.00,950.00,950.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(90,10,1,'2026-10-12','absent',0.00,550.00,0.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(91,11,1,'2026-10-12','present',1.00,500.00,500.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(92,12,1,'2026-10-12','present',1.00,480.00,480.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(93,13,1,'2026-10-12','present',1.00,520.00,520.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(94,14,1,'2026-10-12','present',1.00,450.00,450.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(95,15,1,'2026-10-12','half_day',0.50,1300.00,650.00,'Day Shift','Half day afternoon',1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(96,16,1,'2026-10-12','absent',0.00,920.00,0.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(97,17,1,'2026-10-12','present',1.00,500.00,500.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(98,18,3,'2026-10-12','present',1.00,1250.00,1250.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(99,19,3,'2026-10-12','present',1.00,950.00,950.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(100,20,3,'2026-10-12','present',1.00,480.00,480.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(101,1,1,'2026-10-11','present',1.00,1350.00,1350.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(102,2,1,'2026-10-11','half_day',0.50,1400.00,700.00,'Day Shift','Half day afternoon',1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(103,3,1,'2026-10-11','present',1.00,1250.00,1250.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(104,4,1,'2026-10-11','present',1.00,950.00,950.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(105,5,1,'2026-10-11','present',1.00,900.00,900.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(106,6,1,'2026-10-11','present',1.00,850.00,850.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(107,7,1,'2026-10-11','present',1.00,920.00,920.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(108,8,1,'2026-10-11','absent',0.00,880.00,0.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(109,9,1,'2026-10-11','present',1.00,950.00,950.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(110,10,1,'2026-10-11','present',1.00,550.00,550.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(111,11,1,'2026-10-11','present',1.00,500.00,500.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(112,12,1,'2026-10-11','present',1.00,480.00,480.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(113,13,1,'2026-10-11','present',1.00,520.00,520.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(114,14,1,'2026-10-11','absent',0.00,450.00,0.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(115,15,1,'2026-10-11','present',1.00,1300.00,1300.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(116,16,1,'2026-10-11','present',1.00,920.00,920.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(117,17,1,'2026-10-11','present',1.00,500.00,500.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(118,18,3,'2026-10-11','present',1.00,1250.00,1250.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(119,19,3,'2026-10-11','half_day',0.50,950.00,475.00,'Day Shift','Half day afternoon',1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(120,20,3,'2026-10-11','absent',0.00,480.00,0.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(121,1,1,'2026-10-10','present',1.00,1350.00,1350.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(122,2,1,'2026-10-10','present',1.00,1400.00,1400.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(123,3,1,'2026-10-10','present',1.00,1250.00,1250.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(124,4,1,'2026-10-10','present',1.00,950.00,950.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(125,5,1,'2026-10-10','present',1.00,900.00,900.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(126,6,1,'2026-10-10','half_day',0.50,850.00,425.00,'Day Shift','Half day afternoon',1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(127,7,1,'2026-10-10','present',1.00,920.00,920.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(128,8,1,'2026-10-10','present',1.00,880.00,880.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(129,9,1,'2026-10-10','present',1.00,950.00,950.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(130,10,1,'2026-10-10','present',1.00,550.00,550.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(131,11,1,'2026-10-10','present',1.00,500.00,500.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(132,12,1,'2026-10-10','absent',0.00,480.00,0.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(133,13,1,'2026-10-10','present',1.00,520.00,520.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(134,14,1,'2026-10-10','present',1.00,450.00,450.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(135,15,1,'2026-10-10','present',1.00,1300.00,1300.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(136,16,1,'2026-10-10','present',1.00,920.00,920.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(137,17,1,'2026-10-10','present',1.00,500.00,500.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(138,18,3,'2026-10-10','absent',0.00,1250.00,0.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(139,19,3,'2026-10-10','present',1.00,950.00,950.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(140,20,3,'2026-10-10','present',1.00,480.00,480.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(141,1,1,'2026-10-09','present',1.00,1350.00,1350.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(142,2,1,'2026-10-09','present',1.00,1400.00,1400.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(143,3,1,'2026-10-09','present',1.00,1250.00,1250.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(144,4,1,'2026-10-09','half_day',0.50,950.00,475.00,'Day Shift','Half day afternoon',1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(145,5,1,'2026-10-09','present',1.00,900.00,900.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(146,6,1,'2026-10-09','present',1.00,850.00,850.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(147,7,1,'2026-10-09','present',1.00,920.00,920.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(148,8,1,'2026-10-09','present',1.00,880.00,880.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(149,9,1,'2026-10-09','present',1.00,950.00,950.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(150,10,1,'2026-10-09','half_day',0.50,550.00,275.00,'Day Shift','Half day afternoon',1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(151,11,1,'2026-10-09','present',1.00,500.00,500.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(152,12,1,'2026-10-09','present',1.00,480.00,480.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(153,13,1,'2026-10-09','present',1.00,520.00,520.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(154,14,1,'2026-10-09','present',1.00,450.00,450.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(155,15,1,'2026-10-09','present',1.00,1300.00,1300.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(156,16,1,'2026-10-09','half_day',0.50,920.00,460.00,'Day Shift','Half day afternoon',1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(157,17,1,'2026-10-09','present',1.00,500.00,500.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(158,18,3,'2026-10-09','present',1.00,1250.00,1250.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(159,19,3,'2026-10-09','present',1.00,950.00,950.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(160,20,3,'2026-10-09','present',1.00,480.00,480.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(161,1,1,'2026-10-08','present',1.00,1350.00,1350.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(162,2,1,'2026-10-08','half_day',0.50,1400.00,700.00,'Day Shift','Half day afternoon',1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(163,3,1,'2026-10-08','absent',0.00,1250.00,0.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(164,4,1,'2026-10-08','present',1.00,950.00,950.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(165,5,1,'2026-10-08','present',1.00,900.00,900.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(166,6,1,'2026-10-08','present',1.00,850.00,850.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(167,7,1,'2026-10-08','present',1.00,920.00,920.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(168,8,1,'2026-10-08','half_day',0.50,880.00,440.00,'Day Shift','Half day afternoon',1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(169,9,1,'2026-10-08','present',1.00,950.00,950.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(170,10,1,'2026-10-08','present',1.00,550.00,550.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(171,11,1,'2026-10-08','present',1.00,500.00,500.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(172,12,1,'2026-10-08','present',1.00,480.00,480.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(173,13,1,'2026-10-08','present',1.00,520.00,520.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(174,14,1,'2026-10-08','half_day',0.50,450.00,225.00,'Day Shift','Half day afternoon',1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(175,15,1,'2026-10-08','present',1.00,1300.00,1300.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(176,16,1,'2026-10-08','present',1.00,920.00,920.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(177,17,1,'2026-10-08','present',1.00,500.00,500.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(178,18,3,'2026-10-08','present',1.00,1250.00,1250.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(179,19,3,'2026-10-08','present',1.00,950.00,950.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(180,20,3,'2026-10-08','half_day',0.50,480.00,240.00,'Day Shift','Half day afternoon',1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(181,1,1,'2026-10-07','absent',0.00,1350.00,0.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(182,2,1,'2026-10-07','present',1.00,1400.00,1400.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(183,3,1,'2026-10-07','present',1.00,1250.00,1250.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(184,4,1,'2026-10-07','present',1.00,950.00,950.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(185,5,1,'2026-10-07','present',1.00,900.00,900.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(186,6,1,'2026-10-07','half_day',0.50,850.00,425.00,'Day Shift','Half day afternoon',1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(187,7,1,'2026-10-07','absent',0.00,920.00,0.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(188,8,1,'2026-10-07','present',1.00,880.00,880.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(189,9,1,'2026-10-07','present',1.00,950.00,950.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(190,10,1,'2026-10-07','present',1.00,550.00,550.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(191,11,1,'2026-10-07','present',1.00,500.00,500.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(192,12,1,'2026-10-07','half_day',0.50,480.00,240.00,'Day Shift','Half day afternoon',1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(193,13,1,'2026-10-07','present',1.00,520.00,520.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(194,14,1,'2026-10-07','present',1.00,450.00,450.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(195,15,1,'2026-10-07','present',1.00,1300.00,1300.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(196,16,1,'2026-10-07','present',1.00,920.00,920.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(197,17,1,'2026-10-07','present',1.00,500.00,500.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(198,18,3,'2026-10-07','half_day',0.50,1250.00,625.00,'Day Shift','Half day afternoon',1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(199,19,3,'2026-10-07','present',1.00,950.00,950.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(200,20,3,'2026-10-07','present',1.00,480.00,480.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(201,1,1,'2026-10-06','present',1.00,1350.00,1350.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(202,2,1,'2026-10-06','present',1.00,1400.00,1400.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(203,3,1,'2026-10-06','present',1.00,1250.00,1250.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(204,4,1,'2026-10-06','half_day',0.50,950.00,475.00,'Day Shift','Half day afternoon',1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(205,5,1,'2026-10-06','absent',0.00,900.00,0.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(206,6,1,'2026-10-06','present',1.00,850.00,850.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(207,7,1,'2026-10-06','present',1.00,920.00,920.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(208,8,1,'2026-10-06','present',1.00,880.00,880.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(209,9,1,'2026-10-06','present',1.00,950.00,950.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(210,10,1,'2026-10-06','half_day',0.50,550.00,275.00,'Day Shift','Half day afternoon',1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(211,11,1,'2026-10-06','absent',0.00,500.00,0.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(212,12,1,'2026-10-06','present',1.00,480.00,480.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(213,13,1,'2026-10-06','present',1.00,520.00,520.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(214,14,1,'2026-10-06','present',1.00,450.00,450.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(215,15,1,'2026-10-06','present',1.00,1300.00,1300.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(216,16,1,'2026-10-06','half_day',0.50,920.00,460.00,'Day Shift','Half day afternoon',1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(217,17,1,'2026-10-06','absent',0.00,500.00,0.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(218,18,3,'2026-10-06','present',1.00,1250.00,1250.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(219,19,3,'2026-10-06','present',1.00,950.00,950.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(220,20,3,'2026-10-06','present',1.00,480.00,480.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(221,1,1,'2026-10-05','present',1.00,1350.00,1350.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(222,2,1,'2026-10-05','present',1.00,1400.00,1400.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(223,3,1,'2026-10-05','absent',0.00,1250.00,0.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(224,4,1,'2026-10-05','present',1.00,950.00,950.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(225,5,1,'2026-10-05','present',1.00,900.00,900.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(226,6,1,'2026-10-05','present',1.00,850.00,850.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(227,7,1,'2026-10-05','present',1.00,920.00,920.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(228,8,1,'2026-10-05','present',1.00,880.00,880.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(229,9,1,'2026-10-05','absent',0.00,950.00,0.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(230,10,1,'2026-10-05','present',1.00,550.00,550.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(231,11,1,'2026-10-05','present',1.00,500.00,500.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(232,12,1,'2026-10-05','present',1.00,480.00,480.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(233,13,1,'2026-10-05','present',1.00,520.00,520.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(234,14,1,'2026-10-05','half_day',0.50,450.00,225.00,'Day Shift','Half day afternoon',1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(235,15,1,'2026-10-05','absent',0.00,1300.00,0.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(236,16,1,'2026-10-05','present',1.00,920.00,920.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(237,17,1,'2026-10-05','present',1.00,500.00,500.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(238,18,3,'2026-10-05','present',1.00,1250.00,1250.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(239,19,3,'2026-10-05','present',1.00,950.00,950.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(240,20,3,'2026-10-05','half_day',0.50,480.00,240.00,'Day Shift','Half day afternoon',1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(241,1,1,'2026-10-04','half_day',0.50,1350.00,675.00,'Day Shift','Half day afternoon',1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(242,2,1,'2026-10-04','present',1.00,1400.00,1400.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(243,3,1,'2026-10-04','present',1.00,1250.00,1250.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(244,4,1,'2026-10-04','present',1.00,950.00,950.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(245,5,1,'2026-10-04','present',1.00,900.00,900.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(246,6,1,'2026-10-04','present',1.00,850.00,850.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(247,7,1,'2026-10-04','absent',0.00,920.00,0.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(248,8,1,'2026-10-04','present',1.00,880.00,880.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(249,9,1,'2026-10-04','present',1.00,950.00,950.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(250,10,1,'2026-10-04','present',1.00,550.00,550.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(251,11,1,'2026-10-04','present',1.00,500.00,500.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(252,12,1,'2026-10-04','present',1.00,480.00,480.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(253,13,1,'2026-10-04','absent',0.00,520.00,0.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(254,14,1,'2026-10-04','present',1.00,450.00,450.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(255,15,1,'2026-10-04','present',1.00,1300.00,1300.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(256,16,1,'2026-10-04','present',1.00,920.00,920.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(257,17,1,'2026-10-04','present',1.00,500.00,500.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(258,18,3,'2026-10-04','half_day',0.50,1250.00,625.00,'Day Shift','Half day afternoon',1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(259,19,3,'2026-10-04','absent',0.00,950.00,0.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(260,20,3,'2026-10-04','present',1.00,480.00,480.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(261,1,1,'2026-10-03','present',1.00,1350.00,1350.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(262,2,1,'2026-10-03','present',1.00,1400.00,1400.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(263,3,1,'2026-10-03','present',1.00,1250.00,1250.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(264,4,1,'2026-10-03','present',1.00,950.00,950.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(265,5,1,'2026-10-03','half_day',0.50,900.00,450.00,'Day Shift','Half day afternoon',1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(266,6,1,'2026-10-03','present',1.00,850.00,850.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(267,7,1,'2026-10-03','present',1.00,920.00,920.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(268,8,1,'2026-10-03','present',1.00,880.00,880.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(269,9,1,'2026-10-03','present',1.00,950.00,950.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(270,10,1,'2026-10-03','present',1.00,550.00,550.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(271,11,1,'2026-10-03','absent',0.00,500.00,0.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(272,12,1,'2026-10-03','present',1.00,480.00,480.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(273,13,1,'2026-10-03','present',1.00,520.00,520.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(274,14,1,'2026-10-03','present',1.00,450.00,450.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(275,15,1,'2026-10-03','present',1.00,1300.00,1300.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(276,16,1,'2026-10-03','present',1.00,920.00,920.00,'Day Shift',NULL,1,'2026-10-16 06:28:31','2026-10-16 06:28:31'),(277,17,1,'2026-10-03','absent',0.00,500.00,0.00,'Day Shift',NULL,1,'2026-10-16 06:28:32','2026-10-16 06:28:32'),(278,18,3,'2026-10-03','present',1.00,1250.00,1250.00,'Day Shift',NULL,1,'2026-10-16 06:28:32','2026-10-16 06:28:32'),(279,19,3,'2026-10-03','present',1.00,950.00,950.00,'Day Shift',NULL,1,'2026-10-16 06:28:32','2026-10-16 06:28:32'),(280,20,3,'2026-10-03','present',1.00,480.00,480.00,'Day Shift',NULL,1,'2026-10-16 06:28:32','2026-10-16 06:28:32'),(281,21,19,'2026-10-16','absent',0.00,1400.00,0.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 01:23:38'),(282,22,19,'2026-10-16','present',1.00,1350.00,1350.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 01:23:38'),(283,23,19,'2026-10-16','present',1.00,1250.00,1250.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 01:23:38'),(284,24,19,'2026-10-16','present',1.00,950.00,950.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 01:23:38'),(285,25,19,'2026-10-16','present',1.00,920.00,920.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 01:23:38'),(286,26,19,'2026-10-16','absent',0.00,880.00,0.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 01:23:38'),(287,27,19,'2026-10-16','absent',0.00,940.00,0.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 01:23:38'),(288,28,19,'2026-10-16','present',1.00,890.00,890.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 01:23:38'),(289,29,19,'2026-10-16','present',1.00,960.00,960.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 01:23:38'),(290,30,19,'2026-10-16','present',1.00,850.00,850.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 01:23:38'),(291,31,19,'2026-10-16','half_day',0.50,980.00,490.00,'Day Shift','Half-day 1st half',1,'2026-10-16 06:36:24','2026-10-16 01:23:38'),(292,32,19,'2026-10-16','present',1.00,550.00,550.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 01:23:38'),(293,33,19,'2026-10-16','present',1.00,520.00,520.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 01:23:38'),(294,34,19,'2026-10-16','present',1.00,480.00,480.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 01:23:38'),(295,35,19,'2026-10-16','present',1.00,530.00,530.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 01:23:38'),(296,36,19,'2026-10-16','half_day',0.50,460.00,230.00,'Day Shift','Half-day 1st half',1,'2026-10-16 06:36:24','2026-10-16 01:23:38'),(297,37,19,'2026-10-16','present',1.00,490.00,490.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 01:23:38'),(298,21,19,'2026-10-15','present',1.00,1400.00,1400.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(299,22,19,'2026-10-15','present',1.00,1350.00,1350.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(300,23,19,'2026-10-15','present',1.00,1250.00,1250.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(301,24,19,'2026-10-15','half_day',0.50,950.00,475.00,'Day Shift','Half-day 1st half',1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(302,25,19,'2026-10-15','absent',0.00,920.00,0.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(303,26,19,'2026-10-15','present',1.00,880.00,880.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(304,27,19,'2026-10-15','present',1.00,940.00,940.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(305,28,19,'2026-10-15','present',1.00,890.00,890.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(306,29,19,'2026-10-15','present',1.00,960.00,960.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(307,30,19,'2026-10-15','absent',0.00,850.00,0.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(308,31,19,'2026-10-15','present',1.00,980.00,980.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(309,32,19,'2026-10-15','present',1.00,550.00,550.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(310,33,19,'2026-10-15','present',1.00,520.00,520.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(311,34,19,'2026-10-15','present',1.00,480.00,480.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(312,35,19,'2026-10-15','half_day',0.50,530.00,265.00,'Day Shift','Half-day 1st half',1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(313,36,19,'2026-10-15','present',1.00,460.00,460.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(314,37,19,'2026-10-15','present',1.00,490.00,490.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(315,21,19,'2026-10-14','present',1.00,1400.00,1400.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(316,22,19,'2026-10-14','present',1.00,1350.00,1350.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(317,23,19,'2026-10-14','half_day',0.50,1250.00,625.00,'Day Shift','Half-day 1st half',1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(318,24,19,'2026-10-14','present',1.00,950.00,950.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(319,25,19,'2026-10-14','present',1.00,920.00,920.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(320,26,19,'2026-10-14','present',1.00,880.00,880.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(321,27,19,'2026-10-14','present',1.00,940.00,940.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(322,28,19,'2026-10-14','half_day',0.50,890.00,445.00,'Day Shift','Half-day 1st half',1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(323,29,19,'2026-10-14','absent',0.00,960.00,0.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(324,30,19,'2026-10-14','present',1.00,850.00,850.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(325,31,19,'2026-10-14','present',1.00,980.00,980.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(326,32,19,'2026-10-14','present',1.00,550.00,550.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(327,33,19,'2026-10-14','present',1.00,520.00,520.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(328,34,19,'2026-10-14','absent',0.00,480.00,0.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(329,35,19,'2026-10-14','present',1.00,530.00,530.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(330,36,19,'2026-10-14','present',1.00,460.00,460.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(331,37,19,'2026-10-14','present',1.00,490.00,490.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(332,21,19,'2026-10-13','present',1.00,1400.00,1400.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(333,22,19,'2026-10-13','half_day',0.50,1350.00,675.00,'Day Shift','Half-day 1st half',1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(334,23,19,'2026-10-13','present',1.00,1250.00,1250.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(335,24,19,'2026-10-13','present',1.00,950.00,950.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(336,25,19,'2026-10-13','present',1.00,920.00,920.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(337,26,19,'2026-10-13','present',1.00,880.00,880.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(338,27,19,'2026-10-13','half_day',0.50,940.00,470.00,'Day Shift','Half-day 1st half',1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(339,28,19,'2026-10-13','present',1.00,890.00,890.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(340,29,19,'2026-10-13','present',1.00,960.00,960.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(341,30,19,'2026-10-13','present',1.00,850.00,850.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(342,31,19,'2026-10-13','present',1.00,980.00,980.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(343,32,19,'2026-10-13','present',1.00,550.00,550.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(344,33,19,'2026-10-13','absent',0.00,520.00,0.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(345,34,19,'2026-10-13','present',1.00,480.00,480.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(346,35,19,'2026-10-13','present',1.00,530.00,530.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(347,36,19,'2026-10-13','present',1.00,460.00,460.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(348,37,19,'2026-10-13','present',1.00,490.00,490.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(349,21,19,'2026-10-12','absent',0.00,1400.00,0.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(350,22,19,'2026-10-12','present',1.00,1350.00,1350.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(351,23,19,'2026-10-12','present',1.00,1250.00,1250.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(352,24,19,'2026-10-12','present',1.00,950.00,950.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(353,25,19,'2026-10-12','present',1.00,920.00,920.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(354,26,19,'2026-10-12','half_day',0.50,880.00,440.00,'Day Shift','Half-day 1st half',1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(355,27,19,'2026-10-12','present',1.00,940.00,940.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(356,28,19,'2026-10-12','present',1.00,890.00,890.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(357,29,19,'2026-10-12','present',1.00,960.00,960.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(358,30,19,'2026-10-12','present',1.00,850.00,850.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(359,31,19,'2026-10-12','half_day',0.50,980.00,490.00,'Day Shift','Half-day 1st half',1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(360,32,19,'2026-10-12','present',1.00,550.00,550.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(361,33,19,'2026-10-12','present',1.00,520.00,520.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(362,34,19,'2026-10-12','present',1.00,480.00,480.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(363,35,19,'2026-10-12','present',1.00,530.00,530.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(364,36,19,'2026-10-12','present',1.00,460.00,460.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(365,37,19,'2026-10-12','absent',0.00,490.00,0.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(366,21,19,'2026-10-11','present',1.00,1400.00,1400.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(367,22,19,'2026-10-11','present',1.00,1350.00,1350.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(368,23,19,'2026-10-11','present',1.00,1250.00,1250.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(369,24,19,'2026-10-11','present',1.00,950.00,950.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(370,25,19,'2026-10-11','absent',0.00,920.00,0.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(371,26,19,'2026-10-11','present',1.00,880.00,880.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(372,27,19,'2026-10-11','present',1.00,940.00,940.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(373,28,19,'2026-10-11','present',1.00,890.00,890.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(374,29,19,'2026-10-11','present',1.00,960.00,960.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(375,30,19,'2026-10-11','half_day',0.50,850.00,425.00,'Day Shift','Half-day 1st half',1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(376,31,19,'2026-10-11','present',1.00,980.00,980.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(377,32,19,'2026-10-11','present',1.00,550.00,550.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(378,33,19,'2026-10-11','present',1.00,520.00,520.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(379,34,19,'2026-10-11','present',1.00,480.00,480.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(380,35,19,'2026-10-11','half_day',0.50,530.00,265.00,'Day Shift','Half-day 1st half',1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(381,36,19,'2026-10-11','absent',0.00,460.00,0.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(382,37,19,'2026-10-11','present',1.00,490.00,490.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(383,21,19,'2026-10-10','present',1.00,1400.00,1400.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(384,22,19,'2026-10-10','present',1.00,1350.00,1350.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(385,23,19,'2026-10-10','present',1.00,1250.00,1250.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(386,24,19,'2026-10-10','absent',0.00,950.00,0.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(387,25,19,'2026-10-10','present',1.00,920.00,920.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(388,26,19,'2026-10-10','present',1.00,880.00,880.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(389,27,19,'2026-10-10','present',1.00,940.00,940.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(390,28,19,'2026-10-10','present',1.00,890.00,890.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(391,29,19,'2026-10-10','half_day',0.50,960.00,480.00,'Day Shift','Half-day 1st half',1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(392,30,19,'2026-10-10','present',1.00,850.00,850.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(393,31,19,'2026-10-10','present',1.00,980.00,980.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(394,32,19,'2026-10-10','present',1.00,550.00,550.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(395,33,19,'2026-10-10','present',1.00,520.00,520.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(396,34,19,'2026-10-10','half_day',0.50,480.00,240.00,'Day Shift','Half-day 1st half',1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(397,35,19,'2026-10-10','present',1.00,530.00,530.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(398,36,19,'2026-10-10','present',1.00,460.00,460.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(399,37,19,'2026-10-10','present',1.00,490.00,490.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(400,21,19,'2026-10-09','present',1.00,1400.00,1400.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(401,22,19,'2026-10-09','half_day',0.50,1350.00,675.00,'Day Shift','Half-day 1st half',1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(402,23,19,'2026-10-09','absent',0.00,1250.00,0.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(403,24,19,'2026-10-09','present',1.00,950.00,950.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(404,25,19,'2026-10-09','present',1.00,920.00,920.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(405,26,19,'2026-10-09','present',1.00,880.00,880.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(406,27,19,'2026-10-09','present',1.00,940.00,940.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(407,28,19,'2026-10-09','absent',0.00,890.00,0.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(408,29,19,'2026-10-09','present',1.00,960.00,960.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(409,30,19,'2026-10-09','present',1.00,850.00,850.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(410,31,19,'2026-10-09','present',1.00,980.00,980.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(411,32,19,'2026-10-09','present',1.00,550.00,550.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(412,33,19,'2026-10-09','half_day',0.50,520.00,260.00,'Day Shift','Half-day 1st half',1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(413,34,19,'2026-10-09','present',1.00,480.00,480.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(414,35,19,'2026-10-09','present',1.00,530.00,530.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(415,36,19,'2026-10-09','present',1.00,460.00,460.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(416,37,19,'2026-10-09','present',1.00,490.00,490.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(417,21,19,'2026-10-08','half_day',0.50,1400.00,700.00,'Day Shift','Half-day 1st half',1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(418,22,19,'2026-10-08','present',1.00,1350.00,1350.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(419,23,19,'2026-10-08','present',1.00,1250.00,1250.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(420,24,19,'2026-10-08','present',1.00,950.00,950.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(421,25,19,'2026-10-08','present',1.00,920.00,920.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(422,26,19,'2026-10-08','half_day',0.50,880.00,440.00,'Day Shift','Half-day 1st half',1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(423,27,19,'2026-10-08','absent',0.00,940.00,0.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(424,28,19,'2026-10-08','present',1.00,890.00,890.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(425,29,19,'2026-10-08','present',1.00,960.00,960.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(426,30,19,'2026-10-08','present',1.00,850.00,850.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(427,31,19,'2026-10-08','present',1.00,980.00,980.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(428,32,19,'2026-10-08','absent',0.00,550.00,0.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(429,33,19,'2026-10-08','present',1.00,520.00,520.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(430,34,19,'2026-10-08','present',1.00,480.00,480.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(431,35,19,'2026-10-08','present',1.00,530.00,530.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(432,36,19,'2026-10-08','present',1.00,460.00,460.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(433,37,19,'2026-10-08','half_day',0.50,490.00,245.00,'Day Shift','Half-day 1st half',1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(434,21,19,'2026-10-07','present',1.00,1400.00,1400.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(435,22,19,'2026-10-07','present',1.00,1350.00,1350.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(436,23,19,'2026-10-07','present',1.00,1250.00,1250.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(437,24,19,'2026-10-07','present',1.00,950.00,950.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(438,25,19,'2026-10-07','half_day',0.50,920.00,460.00,'Day Shift','Half-day 1st half',1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(439,26,19,'2026-10-07','present',1.00,880.00,880.00,'Day Shift',NULL,1,'2026-10-16 06:36:24','2026-10-16 06:36:24'),(440,27,19,'2026-10-07','present',1.00,940.00,940.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(441,28,19,'2026-10-07','present',1.00,890.00,890.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(442,29,19,'2026-10-07','present',1.00,960.00,960.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(443,30,19,'2026-10-07','present',1.00,850.00,850.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(444,31,19,'2026-10-07','absent',0.00,980.00,0.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(445,32,19,'2026-10-07','present',1.00,550.00,550.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(446,33,19,'2026-10-07','present',1.00,520.00,520.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(447,34,19,'2026-10-07','present',1.00,480.00,480.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(448,35,19,'2026-10-07','present',1.00,530.00,530.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(449,36,19,'2026-10-07','absent',0.00,460.00,0.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(450,37,19,'2026-10-07','present',1.00,490.00,490.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(451,21,19,'2026-10-06','present',1.00,1400.00,1400.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(452,22,19,'2026-10-06','present',1.00,1350.00,1350.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(453,23,19,'2026-10-06','present',1.00,1250.00,1250.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(454,24,19,'2026-10-06','half_day',0.50,950.00,475.00,'Day Shift','Half-day 1st half',1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(455,25,19,'2026-10-06','present',1.00,920.00,920.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(456,26,19,'2026-10-06','present',1.00,880.00,880.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(457,27,19,'2026-10-06','present',1.00,940.00,940.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(458,28,19,'2026-10-06','present',1.00,890.00,890.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(459,29,19,'2026-10-06','half_day',0.50,960.00,480.00,'Day Shift','Half-day 1st half',1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(460,30,19,'2026-10-06','present',1.00,850.00,850.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(461,31,19,'2026-10-06','present',1.00,980.00,980.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(462,32,19,'2026-10-06','present',1.00,550.00,550.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(463,33,19,'2026-10-06','present',1.00,520.00,520.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(464,34,19,'2026-10-06','present',1.00,480.00,480.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(465,35,19,'2026-10-06','absent',0.00,530.00,0.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(466,36,19,'2026-10-06','present',1.00,460.00,460.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(467,37,19,'2026-10-06','present',1.00,490.00,490.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(468,21,19,'2026-10-05','present',1.00,1400.00,1400.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(469,22,19,'2026-10-05','present',1.00,1350.00,1350.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(470,23,19,'2026-10-05','absent',0.00,1250.00,0.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(471,24,19,'2026-10-05','present',1.00,950.00,950.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(472,25,19,'2026-10-05','present',1.00,920.00,920.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(473,26,19,'2026-10-05','present',1.00,880.00,880.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(474,27,19,'2026-10-05','present',1.00,940.00,940.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(475,28,19,'2026-10-05','half_day',0.50,890.00,445.00,'Day Shift','Half-day 1st half',1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(476,29,19,'2026-10-05','present',1.00,960.00,960.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(477,30,19,'2026-10-05','present',1.00,850.00,850.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(478,31,19,'2026-10-05','present',1.00,980.00,980.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(479,32,19,'2026-10-05','present',1.00,550.00,550.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(480,33,19,'2026-10-05','half_day',0.50,520.00,260.00,'Day Shift','Half-day 1st half',1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(481,34,19,'2026-10-05','absent',0.00,480.00,0.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(482,35,19,'2026-10-05','present',1.00,530.00,530.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(483,36,19,'2026-10-05','present',1.00,460.00,460.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(484,37,19,'2026-10-05','present',1.00,490.00,490.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(485,21,19,'2026-10-04','present',1.00,1400.00,1400.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(486,22,19,'2026-10-04','absent',0.00,1350.00,0.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(487,23,19,'2026-10-04','present',1.00,1250.00,1250.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(488,24,19,'2026-10-04','present',1.00,950.00,950.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(489,25,19,'2026-10-04','present',1.00,920.00,920.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(490,26,19,'2026-10-04','present',1.00,880.00,880.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(491,27,19,'2026-10-04','half_day',0.50,940.00,470.00,'Day Shift','Half-day 1st half',1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(492,28,19,'2026-10-04','present',1.00,890.00,890.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(493,29,19,'2026-10-04','present',1.00,960.00,960.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(494,30,19,'2026-10-04','present',1.00,850.00,850.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(495,31,19,'2026-10-04','present',1.00,980.00,980.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(496,32,19,'2026-10-04','half_day',0.50,550.00,275.00,'Day Shift','Half-day 1st half',1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(497,33,19,'2026-10-04','present',1.00,520.00,520.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(498,34,19,'2026-10-04','present',1.00,480.00,480.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(499,35,19,'2026-10-04','present',1.00,530.00,530.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(500,36,19,'2026-10-04','present',1.00,460.00,460.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(501,37,19,'2026-10-04','half_day',0.50,490.00,245.00,'Day Shift','Half-day 1st half',1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(502,21,19,'2026-10-03','absent',0.00,1400.00,0.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(503,22,19,'2026-10-03','present',1.00,1350.00,1350.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(504,23,19,'2026-10-03','present',1.00,1250.00,1250.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(505,24,19,'2026-10-03','present',1.00,950.00,950.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(506,25,19,'2026-10-03','present',1.00,920.00,920.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(507,26,19,'2026-10-03','absent',0.00,880.00,0.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(508,27,19,'2026-10-03','present',1.00,940.00,940.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(509,28,19,'2026-10-03','present',1.00,890.00,890.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(510,29,19,'2026-10-03','present',1.00,960.00,960.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(511,30,19,'2026-10-03','present',1.00,850.00,850.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(512,31,19,'2026-10-03','half_day',0.50,980.00,490.00,'Day Shift','Half-day 1st half',1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(513,32,19,'2026-10-03','present',1.00,550.00,550.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(514,33,19,'2026-10-03','present',1.00,520.00,520.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(515,34,19,'2026-10-03','present',1.00,480.00,480.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(516,35,19,'2026-10-03','present',1.00,530.00,530.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(517,36,19,'2026-10-03','half_day',0.50,460.00,230.00,'Day Shift','Half-day 1st half',1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(518,37,19,'2026-10-03','present',1.00,490.00,490.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(519,38,14,'2026-10-16','present',1.00,1400.00,1400.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(520,39,14,'2026-10-16','present',1.00,1350.00,1350.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(521,40,14,'2026-10-16','present',1.00,1250.00,1250.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(522,41,14,'2026-10-16','half_day',0.50,950.00,475.00,'Day Shift','Half-day 1st half',1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(523,42,14,'2026-10-16','absent',0.00,920.00,0.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(524,43,14,'2026-10-16','present',1.00,880.00,880.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(525,44,14,'2026-10-16','present',1.00,940.00,940.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(526,45,14,'2026-10-16','present',1.00,890.00,890.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(527,46,14,'2026-10-16','present',1.00,960.00,960.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(528,47,14,'2026-10-16','absent',0.00,850.00,0.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(529,48,14,'2026-10-16','present',1.00,980.00,980.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(530,49,14,'2026-10-16','present',1.00,550.00,550.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(531,50,14,'2026-10-16','present',1.00,520.00,520.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(532,51,14,'2026-10-16','present',1.00,480.00,480.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(533,52,14,'2026-10-16','half_day',0.50,530.00,265.00,'Day Shift','Half-day 1st half',1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(534,53,14,'2026-10-16','present',1.00,460.00,460.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(535,54,14,'2026-10-16','present',1.00,490.00,490.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(536,38,14,'2026-10-15','present',1.00,1400.00,1400.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(537,39,14,'2026-10-15','present',1.00,1350.00,1350.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(538,40,14,'2026-10-15','half_day',0.50,1250.00,625.00,'Day Shift','Half-day 1st half',1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(539,41,14,'2026-10-15','present',1.00,950.00,950.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(540,42,14,'2026-10-15','present',1.00,920.00,920.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(541,43,14,'2026-10-15','present',1.00,880.00,880.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(542,44,14,'2026-10-15','present',1.00,940.00,940.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(543,45,14,'2026-10-15','half_day',0.50,890.00,445.00,'Day Shift','Half-day 1st half',1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(544,46,14,'2026-10-15','absent',0.00,960.00,0.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(545,47,14,'2026-10-15','present',1.00,850.00,850.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(546,48,14,'2026-10-15','present',1.00,980.00,980.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(547,49,14,'2026-10-15','present',1.00,550.00,550.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(548,50,14,'2026-10-15','present',1.00,520.00,520.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(549,51,14,'2026-10-15','absent',0.00,480.00,0.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(550,52,14,'2026-10-15','present',1.00,530.00,530.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(551,53,14,'2026-10-15','present',1.00,460.00,460.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(552,54,14,'2026-10-15','present',1.00,490.00,490.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(553,38,14,'2026-10-14','present',1.00,1400.00,1400.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(554,39,14,'2026-10-14','half_day',0.50,1350.00,675.00,'Day Shift','Half-day 1st half',1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(555,40,14,'2026-10-14','present',1.00,1250.00,1250.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(556,41,14,'2026-10-14','present',1.00,950.00,950.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(557,42,14,'2026-10-14','present',1.00,920.00,920.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(558,43,14,'2026-10-14','present',1.00,880.00,880.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(559,44,14,'2026-10-14','half_day',0.50,940.00,470.00,'Day Shift','Half-day 1st half',1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(560,45,14,'2026-10-14','present',1.00,890.00,890.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(561,46,14,'2026-10-14','present',1.00,960.00,960.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(562,47,14,'2026-10-14','present',1.00,850.00,850.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(563,48,14,'2026-10-14','present',1.00,980.00,980.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(564,49,14,'2026-10-14','present',1.00,550.00,550.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(565,50,14,'2026-10-14','absent',0.00,520.00,0.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(566,51,14,'2026-10-14','present',1.00,480.00,480.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(567,52,14,'2026-10-14','present',1.00,530.00,530.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(568,53,14,'2026-10-14','present',1.00,460.00,460.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(569,54,14,'2026-10-14','present',1.00,490.00,490.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(570,38,14,'2026-10-13','absent',0.00,1400.00,0.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(571,39,14,'2026-10-13','present',1.00,1350.00,1350.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(572,40,14,'2026-10-13','present',1.00,1250.00,1250.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(573,41,14,'2026-10-13','present',1.00,950.00,950.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(574,42,14,'2026-10-13','present',1.00,920.00,920.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(575,43,14,'2026-10-13','half_day',0.50,880.00,440.00,'Day Shift','Half-day 1st half',1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(576,44,14,'2026-10-13','present',1.00,940.00,940.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(577,45,14,'2026-10-13','present',1.00,890.00,890.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(578,46,14,'2026-10-13','present',1.00,960.00,960.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(579,47,14,'2026-10-13','present',1.00,850.00,850.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(580,48,14,'2026-10-13','half_day',0.50,980.00,490.00,'Day Shift','Half-day 1st half',1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(581,49,14,'2026-10-13','present',1.00,550.00,550.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(582,50,14,'2026-10-13','present',1.00,520.00,520.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(583,51,14,'2026-10-13','present',1.00,480.00,480.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(584,52,14,'2026-10-13','present',1.00,530.00,530.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(585,53,14,'2026-10-13','present',1.00,460.00,460.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(586,54,14,'2026-10-13','absent',0.00,490.00,0.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(587,38,14,'2026-10-12','present',1.00,1400.00,1400.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(588,39,14,'2026-10-12','present',1.00,1350.00,1350.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(589,40,14,'2026-10-12','present',1.00,1250.00,1250.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(590,41,14,'2026-10-12','present',1.00,950.00,950.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(591,42,14,'2026-10-12','absent',0.00,920.00,0.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(592,43,14,'2026-10-12','present',1.00,880.00,880.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(593,44,14,'2026-10-12','present',1.00,940.00,940.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(594,45,14,'2026-10-12','present',1.00,890.00,890.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(595,46,14,'2026-10-12','present',1.00,960.00,960.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(596,47,14,'2026-10-12','half_day',0.50,850.00,425.00,'Day Shift','Half-day 1st half',1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(597,48,14,'2026-10-12','present',1.00,980.00,980.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(598,49,14,'2026-10-12','present',1.00,550.00,550.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(599,50,14,'2026-10-12','present',1.00,520.00,520.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(600,51,14,'2026-10-12','present',1.00,480.00,480.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(601,52,14,'2026-10-12','half_day',0.50,530.00,265.00,'Day Shift','Half-day 1st half',1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(602,53,14,'2026-10-12','absent',0.00,460.00,0.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(603,54,14,'2026-10-12','present',1.00,490.00,490.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(604,38,14,'2026-10-11','present',1.00,1400.00,1400.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(605,39,14,'2026-10-11','present',1.00,1350.00,1350.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(606,40,14,'2026-10-11','present',1.00,1250.00,1250.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(607,41,14,'2026-10-11','absent',0.00,950.00,0.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(608,42,14,'2026-10-11','present',1.00,920.00,920.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(609,43,14,'2026-10-11','present',1.00,880.00,880.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(610,44,14,'2026-10-11','present',1.00,940.00,940.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(611,45,14,'2026-10-11','present',1.00,890.00,890.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(612,46,14,'2026-10-11','half_day',0.50,960.00,480.00,'Day Shift','Half-day 1st half',1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(613,47,14,'2026-10-11','present',1.00,850.00,850.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(614,48,14,'2026-10-11','present',1.00,980.00,980.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(615,49,14,'2026-10-11','present',1.00,550.00,550.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(616,50,14,'2026-10-11','present',1.00,520.00,520.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(617,51,14,'2026-10-11','half_day',0.50,480.00,240.00,'Day Shift','Half-day 1st half',1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(618,52,14,'2026-10-11','present',1.00,530.00,530.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(619,53,14,'2026-10-11','present',1.00,460.00,460.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(620,54,14,'2026-10-11','present',1.00,490.00,490.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(621,38,14,'2026-10-10','present',1.00,1400.00,1400.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(622,39,14,'2026-10-10','half_day',0.50,1350.00,675.00,'Day Shift','Half-day 1st half',1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(623,40,14,'2026-10-10','absent',0.00,1250.00,0.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(624,41,14,'2026-10-10','present',1.00,950.00,950.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(625,42,14,'2026-10-10','present',1.00,920.00,920.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(626,43,14,'2026-10-10','present',1.00,880.00,880.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(627,44,14,'2026-10-10','present',1.00,940.00,940.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(628,45,14,'2026-10-10','absent',0.00,890.00,0.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(629,46,14,'2026-10-10','present',1.00,960.00,960.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(630,47,14,'2026-10-10','present',1.00,850.00,850.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(631,48,14,'2026-10-10','present',1.00,980.00,980.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(632,49,14,'2026-10-10','present',1.00,550.00,550.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(633,50,14,'2026-10-10','half_day',0.50,520.00,260.00,'Day Shift','Half-day 1st half',1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(634,51,14,'2026-10-10','present',1.00,480.00,480.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(635,52,14,'2026-10-10','present',1.00,530.00,530.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(636,53,14,'2026-10-10','present',1.00,460.00,460.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(637,54,14,'2026-10-10','present',1.00,490.00,490.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(638,38,14,'2026-10-09','half_day',0.50,1400.00,700.00,'Day Shift','Half-day 1st half',1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(639,39,14,'2026-10-09','present',1.00,1350.00,1350.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(640,40,14,'2026-10-09','present',1.00,1250.00,1250.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(641,41,14,'2026-10-09','present',1.00,950.00,950.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(642,42,14,'2026-10-09','present',1.00,920.00,920.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(643,43,14,'2026-10-09','half_day',0.50,880.00,440.00,'Day Shift','Half-day 1st half',1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(644,44,14,'2026-10-09','absent',0.00,940.00,0.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(645,45,14,'2026-10-09','present',1.00,890.00,890.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(646,46,14,'2026-10-09','present',1.00,960.00,960.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(647,47,14,'2026-10-09','present',1.00,850.00,850.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(648,48,14,'2026-10-09','present',1.00,980.00,980.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(649,49,14,'2026-10-09','absent',0.00,550.00,0.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(650,50,14,'2026-10-09','present',1.00,520.00,520.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(651,51,14,'2026-10-09','present',1.00,480.00,480.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(652,52,14,'2026-10-09','present',1.00,530.00,530.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(653,53,14,'2026-10-09','present',1.00,460.00,460.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(654,54,14,'2026-10-09','half_day',0.50,490.00,245.00,'Day Shift','Half-day 1st half',1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(655,38,14,'2026-10-08','present',1.00,1400.00,1400.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(656,39,14,'2026-10-08','present',1.00,1350.00,1350.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(657,40,14,'2026-10-08','present',1.00,1250.00,1250.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(658,41,14,'2026-10-08','present',1.00,950.00,950.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(659,42,14,'2026-10-08','half_day',0.50,920.00,460.00,'Day Shift','Half-day 1st half',1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(660,43,14,'2026-10-08','present',1.00,880.00,880.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(661,44,14,'2026-10-08','present',1.00,940.00,940.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(662,45,14,'2026-10-08','present',1.00,890.00,890.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(663,46,14,'2026-10-08','present',1.00,960.00,960.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(664,47,14,'2026-10-08','present',1.00,850.00,850.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(665,48,14,'2026-10-08','absent',0.00,980.00,0.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(666,49,14,'2026-10-08','present',1.00,550.00,550.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(667,50,14,'2026-10-08','present',1.00,520.00,520.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(668,51,14,'2026-10-08','present',1.00,480.00,480.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(669,52,14,'2026-10-08','present',1.00,530.00,530.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(670,53,14,'2026-10-08','absent',0.00,460.00,0.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(671,54,14,'2026-10-08','present',1.00,490.00,490.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(672,38,14,'2026-10-07','present',1.00,1400.00,1400.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(673,39,14,'2026-10-07','present',1.00,1350.00,1350.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(674,40,14,'2026-10-07','present',1.00,1250.00,1250.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(675,41,14,'2026-10-07','half_day',0.50,950.00,475.00,'Day Shift','Half-day 1st half',1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(676,42,14,'2026-10-07','present',1.00,920.00,920.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(677,43,14,'2026-10-07','present',1.00,880.00,880.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(678,44,14,'2026-10-07','present',1.00,940.00,940.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(679,45,14,'2026-10-07','present',1.00,890.00,890.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(680,46,14,'2026-10-07','half_day',0.50,960.00,480.00,'Day Shift','Half-day 1st half',1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(681,47,14,'2026-10-07','present',1.00,850.00,850.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(682,48,14,'2026-10-07','present',1.00,980.00,980.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(683,49,14,'2026-10-07','present',1.00,550.00,550.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(684,50,14,'2026-10-07','present',1.00,520.00,520.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(685,51,14,'2026-10-07','present',1.00,480.00,480.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(686,52,14,'2026-10-07','absent',0.00,530.00,0.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(687,53,14,'2026-10-07','present',1.00,460.00,460.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(688,54,14,'2026-10-07','present',1.00,490.00,490.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(689,38,14,'2026-10-06','present',1.00,1400.00,1400.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(690,39,14,'2026-10-06','present',1.00,1350.00,1350.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(691,40,14,'2026-10-06','absent',0.00,1250.00,0.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(692,41,14,'2026-10-06','present',1.00,950.00,950.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(693,42,14,'2026-10-06','present',1.00,920.00,920.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(694,43,14,'2026-10-06','present',1.00,880.00,880.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(695,44,14,'2026-10-06','present',1.00,940.00,940.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(696,45,14,'2026-10-06','half_day',0.50,890.00,445.00,'Day Shift','Half-day 1st half',1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(697,46,14,'2026-10-06','present',1.00,960.00,960.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(698,47,14,'2026-10-06','present',1.00,850.00,850.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(699,48,14,'2026-10-06','present',1.00,980.00,980.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(700,49,14,'2026-10-06','present',1.00,550.00,550.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(701,50,14,'2026-10-06','half_day',0.50,520.00,260.00,'Day Shift','Half-day 1st half',1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(702,51,14,'2026-10-06','absent',0.00,480.00,0.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(703,52,14,'2026-10-06','present',1.00,530.00,530.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(704,53,14,'2026-10-06','present',1.00,460.00,460.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(705,54,14,'2026-10-06','present',1.00,490.00,490.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(706,38,14,'2026-10-05','present',1.00,1400.00,1400.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(707,39,14,'2026-10-05','absent',0.00,1350.00,0.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(708,40,14,'2026-10-05','present',1.00,1250.00,1250.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(709,41,14,'2026-10-05','present',1.00,950.00,950.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(710,42,14,'2026-10-05','present',1.00,920.00,920.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(711,43,14,'2026-10-05','present',1.00,880.00,880.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(712,44,14,'2026-10-05','half_day',0.50,940.00,470.00,'Day Shift','Half-day 1st half',1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(713,45,14,'2026-10-05','present',1.00,890.00,890.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(714,46,14,'2026-10-05','present',1.00,960.00,960.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(715,47,14,'2026-10-05','present',1.00,850.00,850.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(716,48,14,'2026-10-05','present',1.00,980.00,980.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(717,49,14,'2026-10-05','half_day',0.50,550.00,275.00,'Day Shift','Half-day 1st half',1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(718,50,14,'2026-10-05','present',1.00,520.00,520.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(719,51,14,'2026-10-05','present',1.00,480.00,480.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(720,52,14,'2026-10-05','present',1.00,530.00,530.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(721,53,14,'2026-10-05','present',1.00,460.00,460.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(722,54,14,'2026-10-05','half_day',0.50,490.00,245.00,'Day Shift','Half-day 1st half',1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(723,38,14,'2026-10-04','absent',0.00,1400.00,0.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(724,39,14,'2026-10-04','present',1.00,1350.00,1350.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(725,40,14,'2026-10-04','present',1.00,1250.00,1250.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(726,41,14,'2026-10-04','present',1.00,950.00,950.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(727,42,14,'2026-10-04','present',1.00,920.00,920.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(728,43,14,'2026-10-04','absent',0.00,880.00,0.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(729,44,14,'2026-10-04','present',1.00,940.00,940.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(730,45,14,'2026-10-04','present',1.00,890.00,890.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(731,46,14,'2026-10-04','present',1.00,960.00,960.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(732,47,14,'2026-10-04','present',1.00,850.00,850.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(733,48,14,'2026-10-04','half_day',0.50,980.00,490.00,'Day Shift','Half-day 1st half',1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(734,49,14,'2026-10-04','present',1.00,550.00,550.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(735,50,14,'2026-10-04','present',1.00,520.00,520.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(736,51,14,'2026-10-04','present',1.00,480.00,480.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(737,52,14,'2026-10-04','present',1.00,530.00,530.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(738,53,14,'2026-10-04','half_day',0.50,460.00,230.00,'Day Shift','Half-day 1st half',1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(739,54,14,'2026-10-04','present',1.00,490.00,490.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(740,38,14,'2026-10-03','present',1.00,1400.00,1400.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(741,39,14,'2026-10-03','present',1.00,1350.00,1350.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(742,40,14,'2026-10-03','present',1.00,1250.00,1250.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(743,41,14,'2026-10-03','half_day',0.50,950.00,475.00,'Day Shift','Half-day 1st half',1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(744,42,14,'2026-10-03','absent',0.00,920.00,0.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(745,43,14,'2026-10-03','present',1.00,880.00,880.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(746,44,14,'2026-10-03','present',1.00,940.00,940.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(747,45,14,'2026-10-03','present',1.00,890.00,890.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(748,46,14,'2026-10-03','present',1.00,960.00,960.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(749,47,14,'2026-10-03','absent',0.00,850.00,0.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(750,48,14,'2026-10-03','present',1.00,980.00,980.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(751,49,14,'2026-10-03','present',1.00,550.00,550.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(752,50,14,'2026-10-03','present',1.00,520.00,520.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(753,51,14,'2026-10-03','present',1.00,480.00,480.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(754,52,14,'2026-10-03','half_day',0.50,530.00,265.00,'Day Shift','Half-day 1st half',1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(755,53,14,'2026-10-03','present',1.00,460.00,460.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25'),(756,54,14,'2026-10-03','present',1.00,490.00,490.00,'Day Shift',NULL,1,'2026-10-16 06:36:25','2026-10-16 06:36:25');

--
-- Table structure for table `site_workers`
--

DROP TABLE IF EXISTS `site_workers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `site_workers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Skilled',
  `trade` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Civil / Concreting',
  `contractor_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT 'Direct Site Hire',
  `daily_wage_rate` decimal(12,2) NOT NULL DEFAULT '800.00',
  `phone` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `updated_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=56 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `site_workers`
--

INSERT INTO `site_workers` VALUES (1,1,'Rajesh Sharma','Supervisor','Site Supervision & QA','Direct Site Hire',1350.00,'+91 98765 43210','active','2026-10-16 06:28:31','2026-10-16 06:28:31'),(2,1,'Vikramaditya Rao','Supervisor','Substructure RCC','L&T Civil Infrastructure',1400.00,'+91 98765 43211','active','2026-10-16 06:28:31','2026-10-16 06:28:31'),(3,1,'Amitabh Sen','Supervisor','MEP Services','Sterling MEP Contractors',1250.00,'+91 98765 43212','active','2026-10-16 06:28:31','2026-10-16 06:28:31'),(4,1,'Manoj Kumar','Skilled','Bar Bending & Steelwork','L&T Civil Infrastructure',950.00,'+91 98765 43213','active','2026-10-16 06:28:31','2026-10-16 06:28:31'),(5,1,'Deepak Verma','Skilled','Carpentry & Shuttering','Supreme Formwork Systems',900.00,'+91 98765 43214','active','2026-10-16 06:28:31','2026-10-16 06:28:31'),(6,1,'Sunil Chauhan','Skilled','Masonry & AAC Blockwork','Classic Masonry Works',850.00,'+91 98765 43215','active','2026-10-16 06:28:31','2026-10-16 06:28:31'),(7,1,'Arun Prasad','Skilled','Electrical & Wiring','Sterling MEP Contractors',920.00,'+91 98765 43216','active','2026-10-16 06:28:31','2026-10-16 06:28:31'),(8,1,'Girish Nayak','Skilled','Plumbing & Sanitation','Sterling MEP Contractors',880.00,'+91 98765 43217','active','2026-10-16 06:28:31','2026-10-16 06:28:31'),(9,1,'Farhan Akhtar','Skilled','Flooring & Tiling','Apex Flooring & Finishes',950.00,'+91 98765 43218','active','2026-10-16 06:28:31','2026-10-16 06:28:31'),(10,1,'Suresh Yadav','Unskilled','General Labor & Curing','Direct Labor Force',550.00,'+91 98765 43219','active','2026-10-16 06:28:31','2026-10-16 06:28:31'),(11,1,'Bablu Soren','Unskilled','Concreting Helper','L&T Civil Infrastructure',500.00,'+91 98765 43220','active','2026-10-16 06:28:31','2026-10-16 06:28:31'),(12,1,'Raju Mahato','Unskilled','Material Shifting & Cleanup','Supreme Formwork Systems',480.00,'+91 98765 43221','active','2026-10-16 06:28:31','2026-10-16 06:28:31'),(13,1,'Chandan Murmu','Unskilled','Scaffold Assembly Helper','Direct Labor Force',520.00,'+91 98765 43222','active','2026-10-16 06:28:31','2026-10-16 06:28:31'),(14,1,'Rameshwar Tudu','Unskilled','Site Cleanup & Housekeeping','Direct Labor Force',450.00,'+91 98765 43223','active','2026-10-16 06:28:31','2026-10-16 06:28:31'),(15,1,'Kailash Chand','Supervisor','Site Supervision','Direct Site Hire',1300.00,'+91 98765 43230','active','2026-10-16 06:28:31','2026-10-16 06:28:31'),(16,1,'Imran Sheikh','Skilled','Masonry & Plaster','Classic Masonry Works',920.00,'+91 98765 43231','active','2026-10-16 06:28:31','2026-10-16 06:28:31'),(17,1,'Dilip Paswan','Unskilled','General Labor','Direct Labor Force',500.00,'+91 98765 43232','active','2026-10-16 06:28:31','2026-10-16 06:28:31'),(18,3,'Mahesh Joshi','Supervisor','Finishing Supervisor','Apex Flooring & Finishes',1250.00,'+91 98765 43240','active','2026-10-16 06:28:31','2026-10-16 06:28:31'),(19,3,'Pankaj Sharma','Skilled','Flooring & Tiling','Apex Flooring & Finishes',950.00,'+91 98765 43241','active','2026-10-16 06:28:31','2026-10-16 06:28:31'),(20,3,'Santosh Roy','Unskilled','Grouting & Cleanup','Apex Flooring & Finishes',480.00,'+91 98765 43242','active','2026-10-16 06:28:31','2026-10-16 06:28:31'),(21,19,'Rameshwar Sen','Supervisor','Site Supervision & QA','Direct Site Hire',1400.00,'+91 98111 22331','active','2026-10-16 06:36:24','2026-10-16 01:23:38'),(22,19,'Anand Verma','Supervisor','RCC & Structural','L&T Civil Infrastructure',1350.00,'+91 98111 22332','active','2026-10-16 06:36:24','2026-10-16 01:23:38'),(23,19,'Dinesh Patil','Supervisor','MEP & Electrical','Sterling MEP Contractors',1250.00,'+91 98111 22333','active','2026-10-16 06:36:24','2026-10-16 01:23:38'),(24,19,'Manoj Kumar','Skilled','Bar Bending & Steelwork','L&T Civil Infrastructure',950.00,'+91 98111 22334','active','2026-10-16 06:36:24','2026-10-16 01:23:38'),(25,19,'Deepak Chauhan','Skilled','Carpentry & Shuttering','Supreme Formwork Systems',920.00,'+91 98111 22335','active','2026-10-16 06:36:24','2026-10-16 01:23:38'),(26,19,'Sunil Sharma','Skilled','Masonry & AAC Blockwork','Classic Masonry Works',880.00,'+91 98111 22336','active','2026-10-16 06:36:24','2026-10-16 01:23:38'),(27,19,'Arun Prasad','Skilled','Electrical & Wiring','Sterling MEP Contractors',940.00,'+91 98111 22337','active','2026-10-16 06:36:24','2026-10-16 01:23:38'),(28,19,'Girish Nayak','Skilled','Plumbing & Sanitation','Sterling MEP Contractors',890.00,'+91 98111 22338','active','2026-10-16 06:36:24','2026-10-16 01:23:38'),(29,19,'Farhan Akhtar','Skilled','Flooring & Tiling','Apex Flooring & Finishes',960.00,'+91 98111 22339','active','2026-10-16 06:36:24','2026-10-16 01:23:38'),(30,19,'Pradeep Joshi','Skilled','Painting & Finishing','Apex Flooring & Finishes',850.00,'+91 98111 22340','active','2026-10-16 06:36:24','2026-10-16 01:23:38'),(31,19,'Santosh Mhatre','Skilled','HVAC & Firefighting','Sterling MEP Contractors',980.00,'+91 98111 22341','active','2026-10-16 06:36:24','2026-10-16 01:23:38'),(32,19,'Suresh Yadav','Unskilled','General Labor & Curing','Direct Labor Force',550.00,'+91 98111 22342','active','2026-10-16 06:36:24','2026-10-16 01:23:38'),(33,19,'Bablu Soren','Unskilled','Concreting Helper','L&T Civil Infrastructure',520.00,'+91 98111 22343','active','2026-10-16 06:36:24','2026-10-16 01:23:38'),(34,19,'Raju Mahato','Unskilled','Material Shifting & Cleanup','Supreme Formwork Systems',480.00,'+91 98111 22344','active','2026-10-16 06:36:24','2026-10-16 01:23:38'),(35,19,'Chandan Murmu','Unskilled','Scaffold Assembly Helper','Direct Labor Force',530.00,'+91 98111 22345','active','2026-10-16 06:36:24','2026-10-16 01:23:38'),(36,19,'Rameshwar Tudu','Unskilled','Site Cleanup & Housekeeping','Direct Labor Force',460.00,'+91 98111 22346','active','2026-10-16 06:36:24','2026-10-16 01:23:38'),(37,19,'Govind Das','Unskilled','Earthwork Helper','Direct Labor Force',490.00,'+91 98111 22347','active','2026-10-16 06:36:24','2026-10-16 01:23:38'),(38,14,'Rameshwar Sen','Supervisor','Site Supervision & QA','Direct Site Hire',1400.00,'+91 98111 22331','active','2026-10-16 06:36:25','2026-10-16 06:36:25'),(39,14,'Anand Verma','Supervisor','RCC & Structural','L&T Civil Infrastructure',1350.00,'+91 98111 22332','active','2026-10-16 06:36:25','2026-10-16 06:36:25'),(40,14,'Dinesh Patil','Supervisor','MEP & Electrical','Sterling MEP Contractors',1250.00,'+91 98111 22333','active','2026-10-16 06:36:25','2026-10-16 06:36:25'),(41,14,'Manoj Kumar','Skilled','Bar Bending & Steelwork','L&T Civil Infrastructure',950.00,'+91 98111 22334','active','2026-10-16 06:36:25','2026-10-16 06:36:25'),(42,14,'Deepak Chauhan','Skilled','Carpentry & Shuttering','Supreme Formwork Systems',920.00,'+91 98111 22335','active','2026-10-16 06:36:25','2026-10-16 06:36:25'),(43,14,'Sunil Sharma','Skilled','Masonry & AAC Blockwork','Classic Masonry Works',880.00,'+91 98111 22336','active','2026-10-16 06:36:25','2026-10-16 06:36:25'),(44,14,'Arun Prasad','Skilled','Electrical & Wiring','Sterling MEP Contractors',940.00,'+91 98111 22337','active','2026-10-16 06:36:25','2026-10-16 06:36:25'),(45,14,'Girish Nayak','Skilled','Plumbing & Sanitation','Sterling MEP Contractors',890.00,'+91 98111 22338','active','2026-10-16 06:36:25','2026-10-16 06:36:25'),(46,14,'Farhan Akhtar','Skilled','Flooring & Tiling','Apex Flooring & Finishes',960.00,'+91 98111 22339','active','2026-10-16 06:36:25','2026-10-16 06:36:25'),(47,14,'Pradeep Joshi','Skilled','Painting & Finishing','Apex Flooring & Finishes',850.00,'+91 98111 22340','active','2026-10-16 06:36:25','2026-10-16 06:36:25'),(48,14,'Santosh Mhatre','Skilled','HVAC & Firefighting','Sterling MEP Contractors',980.00,'+91 98111 22341','active','2026-10-16 06:36:25','2026-10-16 06:36:25'),(49,14,'Suresh Yadav','Unskilled','General Labor & Curing','Direct Labor Force',550.00,'+91 98111 22342','active','2026-10-16 06:36:25','2026-10-16 06:36:25'),(50,14,'Bablu Soren','Unskilled','Concreting Helper','L&T Civil Infrastructure',520.00,'+91 98111 22343','active','2026-10-16 06:36:25','2026-10-16 06:36:25'),(51,14,'Raju Mahato','Unskilled','Material Shifting & Cleanup','Supreme Formwork Systems',480.00,'+91 98111 22344','active','2026-10-16 06:36:25','2026-10-16 06:36:25'),(52,14,'Chandan Murmu','Unskilled','Scaffold Assembly Helper','Direct Labor Force',530.00,'+91 98111 22345','active','2026-10-16 06:36:25','2026-10-16 06:36:25'),(53,14,'Rameshwar Tudu','Unskilled','Site Cleanup & Housekeeping','Direct Labor Force',460.00,'+91 98111 22346','active','2026-10-16 06:36:25','2026-10-16 06:36:25'),(54,14,'Govind Das','Unskilled','Earthwork Helper','Direct Labor Force',490.00,'+91 98111 22347','active','2026-10-16 06:36:25','2026-10-16 06:36:25'),(55,19,'Hari','Skilled','Electrical & Wiring','Supereme framework',900.00,'998989898','active','2026-10-16 10:22:07','2026-10-16 10:22:07');

--
-- Table structure for table `stakeholders`
--

DROP TABLE IF EXISTS `stakeholders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stakeholders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `organization` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `access_level` varchar(16) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'read',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stakeholders`
--

INSERT INTO `stakeholders` VALUES (1,1,'Sentinel Realty — PMO','pmo@sentinelrealty.in',NULL,'Sentinel Realty','Client PMO','write'),(2,1,'Studio Vellichor','design@vellichor.in',NULL,'Studio Vellichor','Architect','read'),(3,2,'Citygate Site Engineer','site@citygate.in',NULL,'Citygate Developers','Client representative','write'),(4,6,' Rajesh Kumar','rajesh.kumar@meil.com','+91 98765 43210','Megha Engineering & Infrastructure Ltd',' Site Engineer','read'),(8,2,'Arjun','Arjun@gmail.com','+919898989898',' BuildRight Constructions Pvt. Ltd','Site Engineer','read'),(10,14,'Dr. Vikramaditya Oberoi','v.oberoi@apexbiotech.com','+91 98201 54321','Apex Global Biotech & Healthcare Park','Client','read'),(12,16,'Mahesh Bhatia','mahesh@luminahg.in','+91 98765 43210','Lumina Hospitality Group','Client','read'),(13,17,' Ramesh Kumar','ramesh.kumar@gamil.com','92949567897','Horizon Resorts Pvt. Ltd','Client','read'),(14,18,'Test Customer',NULL,NULL,NULL,'Client','read'),(15,19,'Ritesh Khanna','ritesh@northshore.in','+91 90000 11122','Northshore Residences','Client','read');

--
-- Table structure for table `task_template_items`
--

DROP TABLE IF EXISTS `task_template_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `task_template_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `template_id` int NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `phase` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `priority` varchar(16) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'medium',
  `estimated_days` int DEFAULT NULL,
  `sort_order` int NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=113 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `task_template_items`
--

INSERT INTO `task_template_items` VALUES (1,1,'Obtain building plan approval from local authority',NULL,'Initiation','high',30,0,'2026-08-05 09:33:31'),(2,1,'Soil investigation / geotechnical report',NULL,'Initiation','high',7,1,'2026-08-05 09:33:31'),(3,1,'Utility connections application (power, water, sewer)',NULL,'Initiation','medium',14,2,'2026-08-05 09:33:31'),(4,1,'Mobilise site office and temporary facilities',NULL,'Initiation','medium',5,3,'2026-08-05 09:33:31'),(5,1,'Architectural working drawings sign-off',NULL,'Design','high',21,4,'2026-08-05 09:33:31'),(6,1,'Structural design and drawings by licensed engineer',NULL,'Design','high',14,5,'2026-08-05 09:33:31'),(7,1,'MEP (plumbing, electrical, HVAC) drawings',NULL,'Design','medium',14,6,'2026-08-05 09:33:31'),(8,1,'Interior design & finishes schedule',NULL,'Design','low',10,7,'2026-08-05 09:33:31'),(9,1,'Material take-off and BOQ finalisation',NULL,'Procurement','high',7,8,'2026-08-05 09:33:31'),(10,1,'Vendor short-listing and RFQ for structural steel / cement',NULL,'Procurement','high',7,9,'2026-08-05 09:33:31'),(11,1,'Purchase orders for long-lead items (lifts, windows, tiles)',NULL,'Procurement','high',5,10,'2026-08-05 09:33:31'),(12,1,'Subcontractor selection — civil, MEP, finishing',NULL,'Procurement','medium',10,11,'2026-08-05 09:33:31'),(13,1,'Site clearing, grading, and levelling',NULL,'Civil Works','high',7,12,'2026-08-05 09:33:31'),(14,1,'Foundation excavation and PCC',NULL,'Civil Works','high',10,13,'2026-08-05 09:33:31'),(15,1,'Foundation concrete (raft / isolated footings)',NULL,'Civil Works','high',14,14,'2026-08-05 09:33:31'),(16,1,'Ground floor slab and columns',NULL,'Civil Works','high',21,15,'2026-08-05 09:33:31'),(17,1,'Superstructure — floor-by-floor slab, beams, columns',NULL,'Civil Works','high',60,16,'2026-08-05 09:33:31'),(18,1,'Brick masonry and block work',NULL,'Civil Works','medium',21,17,'2026-08-05 09:33:31'),(19,1,'Roof slab and waterproofing',NULL,'Civil Works','high',14,18,'2026-08-05 09:33:31'),(20,1,'Internal and external plastering',NULL,'Finishing','medium',21,19,'2026-08-05 09:33:31'),(21,1,'Flooring — tiles / marble / vitrified',NULL,'Finishing','medium',14,20,'2026-08-05 09:33:31'),(22,1,'Painting — internal primer + two coats',NULL,'Finishing','medium',14,21,'2026-08-05 09:33:31'),(23,1,'Doors, windows, and glazing installation',NULL,'Finishing','medium',10,22,'2026-08-05 09:33:31'),(24,1,'Kitchen and bathroom fixtures',NULL,'Finishing','medium',7,23,'2026-08-05 09:33:31'),(25,1,'External facade / elevation cladding',NULL,'Finishing','low',14,24,'2026-08-05 09:33:31'),(26,1,'Electrical conduit, wiring, and DB installation',NULL,'MEP','high',21,25,'2026-08-05 09:33:31'),(27,1,'Plumbing rough-in (supply and drainage)',NULL,'MEP','high',14,26,'2026-08-05 09:33:31'),(28,1,'HVAC ducting and equipment installation',NULL,'MEP','medium',14,27,'2026-08-05 09:33:31'),(29,1,'Fire alarm and detection system',NULL,'MEP','high',7,28,'2026-08-05 09:33:31'),(30,1,'Structural inspection and third-party audit',NULL,'QC & Handover','high',5,29,'2026-08-05 09:33:31'),(31,1,'MEP testing and commissioning',NULL,'QC & Handover','high',7,30,'2026-08-05 09:33:31'),(32,1,'Punch list walkthrough with client',NULL,'QC & Handover','high',3,31,'2026-08-05 09:33:31'),(33,1,'Resolve all punch list items',NULL,'QC & Handover','high',14,32,'2026-08-05 09:33:31'),(34,1,'Occupation certificate from local authority',NULL,'QC & Handover','high',30,33,'2026-08-05 09:33:31'),(35,1,'Handover documentation — as-built drawings, warranties',NULL,'QC & Handover','medium',5,34,'2026-08-05 09:33:31'),(36,1,'Final client sign-off and possession',NULL,'QC & Handover','high',1,35,'2026-08-05 09:33:31'),(37,2,'Lease / ownership document verification',NULL,'Initiation','high',5,0,'2026-08-05 09:33:31'),(38,2,'Space planning and programming brief',NULL,'Initiation','high',7,1,'2026-08-05 09:33:31'),(39,2,'Fire NOC and building department approvals',NULL,'Initiation','high',21,2,'2026-08-05 09:33:31'),(40,2,'Concept design and client approval',NULL,'Design','high',14,3,'2026-08-05 09:33:31'),(41,2,'Detailed construction drawings (architectural + structural)',NULL,'Design','high',21,4,'2026-08-05 09:33:31'),(42,2,'Lighting and power layout design',NULL,'Design','medium',10,5,'2026-08-05 09:33:31'),(43,2,'HVAC zoning design and equipment schedule',NULL,'Design','medium',10,6,'2026-08-05 09:33:31'),(44,2,'Furniture, fixtures & equipment (FF&E) procurement',NULL,'Procurement','medium',45,7,'2026-08-05 09:33:31'),(45,2,'Specialty items — signage, branding elements',NULL,'Procurement','low',30,8,'2026-08-05 09:33:31'),(46,2,'Subcontractor mobilisation — civil, MEP, AV',NULL,'Procurement','high',7,9,'2026-08-05 09:33:31'),(47,2,'Demolition of existing partitions / false ceiling',NULL,'Civil & Structure','high',7,10,'2026-08-05 09:33:31'),(48,2,'New partition walls (drywall / glass)',NULL,'Civil & Structure','medium',14,11,'2026-08-05 09:33:31'),(49,2,'False ceiling — grid / gypsum / speciality',NULL,'Civil & Structure','medium',14,12,'2026-08-05 09:33:31'),(50,2,'Raised access flooring (if required)',NULL,'Civil & Structure','low',7,13,'2026-08-05 09:33:31'),(51,2,'Electrical distribution — DB, MCBs, outlets',NULL,'MEP','high',14,14,'2026-08-05 09:33:31'),(52,2,'Data and networking cabling infrastructure',NULL,'MEP','high',10,15,'2026-08-05 09:33:31'),(53,2,'HVAC installation, testing, and balancing',NULL,'MEP','high',14,16,'2026-08-05 09:33:31'),(54,2,'Sprinkler and fire suppression system',NULL,'MEP','high',10,17,'2026-08-05 09:33:31'),(55,2,'CCTV, access control, and security systems',NULL,'MEP','medium',7,18,'2026-08-05 09:33:31'),(56,2,'Flooring — carpet, vinyl, or stone',NULL,'Finishing','medium',10,19,'2026-08-05 09:33:31'),(57,2,'Painting and wall finishes',NULL,'Finishing','medium',10,20,'2026-08-05 09:33:31'),(58,2,'Glazed partitions and doors installation',NULL,'Finishing','medium',7,21,'2026-08-05 09:33:31'),(59,2,'FF&E installation and placement',NULL,'Finishing','medium',7,22,'2026-08-05 09:33:31'),(60,2,'Snagging and defect rectification',NULL,'QC & Handover','high',7,23,'2026-08-05 09:33:31'),(61,2,'Systems commissioning and user training',NULL,'QC & Handover','high',5,24,'2026-08-05 09:33:31'),(62,2,'Final client walkthrough and acceptance',NULL,'QC & Handover','high',2,25,'2026-08-05 09:33:31'),(63,3,'Site survey and load calculation',NULL,'Engineering','high',5,0,'2026-08-05 09:33:31'),(64,3,'Detailed MEP engineering drawings',NULL,'Engineering','high',14,1,'2026-08-05 09:33:31'),(65,3,'Material specifications and equipment selection',NULL,'Engineering','high',7,2,'2026-08-05 09:33:31'),(66,3,'Long-lead equipment procurement (panels, chillers, pumps)',NULL,'Procurement','high',30,3,'2026-08-05 09:33:31'),(67,3,'Cable, conduit, and piping materials',NULL,'Procurement','high',14,4,'2026-08-05 09:33:31'),(68,3,'Main LT panel and distribution boards installation',NULL,'Electrical','high',10,5,'2026-08-05 09:33:31'),(69,3,'Cable tray and conduit routing',NULL,'Electrical','high',14,6,'2026-08-05 09:33:31'),(70,3,'Power and lighting wiring',NULL,'Electrical','high',14,7,'2026-08-05 09:33:31'),(71,3,'Earthing and lightning protection',NULL,'Electrical','high',7,8,'2026-08-05 09:33:31'),(72,3,'Emergency power (DG set / UPS) installation',NULL,'Electrical','medium',7,9,'2026-08-05 09:33:31'),(73,3,'Water supply piping (GI/CPVC/PPR)',NULL,'Plumbing','high',14,10,'2026-08-05 09:33:31'),(74,3,'Sanitary drainage and vent piping',NULL,'Plumbing','high',14,11,'2026-08-05 09:33:31'),(75,3,'Water treatment plant / STP if applicable',NULL,'Plumbing','medium',21,12,'2026-08-05 09:33:31'),(76,3,'Chiller plant or VRF outdoor units installation',NULL,'HVAC','high',7,13,'2026-08-05 09:33:31'),(77,3,'AHU / FCU installation and ducting',NULL,'HVAC','high',14,14,'2026-08-05 09:33:31'),(78,3,'Refrigerant piping and insulation',NULL,'HVAC','high',7,15,'2026-08-05 09:33:31'),(79,3,'Sprinkler main line and branch piping',NULL,'Fire Protection','high',14,16,'2026-08-05 09:33:31'),(80,3,'Fire alarm panel, detectors, and hooters',NULL,'Fire Protection','high',7,17,'2026-08-05 09:33:31'),(81,3,'Hydrant and hose reel installation',NULL,'Fire Protection','high',7,18,'2026-08-05 09:33:31'),(82,3,'Electrical testing — IR test, earth fault, load test',NULL,'Commissioning','high',5,19,'2026-08-05 09:33:31'),(83,3,'Plumbing pressure test and flushing',NULL,'Commissioning','high',3,20,'2026-08-05 09:33:31'),(84,3,'HVAC commissioning, balancing, and TAB report',NULL,'Commissioning','high',7,21,'2026-08-05 09:33:31'),(85,3,'Fire system final acceptance test with authority',NULL,'Commissioning','high',5,22,'2026-08-05 09:33:31'),(86,3,'As-built drawings and O&M manuals handover',NULL,'Commissioning','medium',7,23,'2026-08-05 09:33:31'),(87,4,'Process flow diagram (PFD) and P&ID finalization',NULL,'Engineering','high',21,0,'2026-08-05 09:33:31'),(88,4,'Civil / structural design for foundation and structure',NULL,'Engineering','high',21,1,'2026-08-05 09:33:31'),(89,4,'Equipment layout and vendor selection',NULL,'Engineering','high',14,2,'2026-08-05 09:33:31'),(90,4,'Statutory approvals — factory, pollution board, fire',NULL,'Engineering','high',60,3,'2026-08-05 09:33:31'),(91,4,'Long-lead equipment — reactors, compressors, boilers',NULL,'Procurement','high',90,4,'2026-08-05 09:33:31'),(92,4,'Structural steel and pre-engineered building (PEB)',NULL,'Procurement','high',45,5,'2026-08-05 09:33:31'),(93,4,'Electrical MV/LV panels, transformers, DGs',NULL,'Procurement','high',60,6,'2026-08-05 09:33:31'),(94,4,'Piping materials — CS, SS, GI as per P&ID',NULL,'Procurement','high',30,7,'2026-08-05 09:33:31'),(95,4,'Site clearing, cut & fill, and drainage',NULL,'Civil Construction','high',14,8,'2026-08-05 09:33:31'),(96,4,'Equipment foundations and anchor bolts',NULL,'Civil Construction','high',21,9,'2026-08-05 09:33:31'),(97,4,'RCC structure — columns, beams, slabs',NULL,'Civil Construction','high',45,10,'2026-08-05 09:33:31'),(98,4,'PEB erection and secondary structural members',NULL,'Civil Construction','high',21,11,'2026-08-05 09:33:31'),(99,4,'Roads, hardstand, and external civil works',NULL,'Civil Construction','medium',21,12,'2026-08-05 09:33:31'),(100,4,'Major equipment erection and alignment',NULL,'Mechanical','high',30,13,'2026-08-05 09:33:31'),(101,4,'Process piping fabrication and erection',NULL,'Mechanical','high',30,14,'2026-08-05 09:33:31'),(102,4,'Insulation of hot / cold lines',NULL,'Mechanical','medium',14,15,'2026-08-05 09:33:31'),(103,4,'HT / LT cable laying and termination',NULL,'Electrical & Instrumentation','high',21,16,'2026-08-05 09:33:31'),(104,4,'Instrument installation and loop checking',NULL,'Electrical & Instrumentation','high',21,17,'2026-08-05 09:33:31'),(105,4,'Control room and DCS / SCADA commissioning',NULL,'Electrical & Instrumentation','high',14,18,'2026-08-05 09:33:31'),(106,4,'Mechanical completion punch list clearance',NULL,'Pre-commissioning','high',14,19,'2026-08-05 09:33:31'),(107,4,'Piping leak test, flushing, and blowing',NULL,'Pre-commissioning','high',7,20,'2026-08-05 09:33:31'),(108,4,'Electrical continuity and protection relay tests',NULL,'Pre-commissioning','high',7,21,'2026-08-05 09:33:31'),(109,4,'Trial runs — individual equipment',NULL,'Commissioning','high',14,22,'2026-08-05 09:33:31'),(110,4,'Integrated system run and performance guarantee test',NULL,'Commissioning','high',30,23,'2026-08-05 09:33:31'),(111,4,'Operator training and documentation handover',NULL,'Commissioning','high',7,24,'2026-08-05 09:33:31'),(112,4,'Final acceptance certificate and defect liability period start',NULL,'Commissioning','high',1,25,'2026-08-05 09:33:31');

--
-- Table structure for table `task_templates`
--

DROP TABLE IF EXISTS `task_templates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `task_templates` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `project_type` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_default` tinyint(1) NOT NULL DEFAULT '0',
  `created_by_id` int DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `updated_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `task_templates`
--

INSERT INTO `task_templates` VALUES (1,'Residential Construction — Standard','Full lifecycle checklist for villa, apartment, and bungalow projects','Residential',1,NULL,'2026-08-05 09:33:31','2026-08-05 09:33:31'),(2,'Commercial Build-out — Office / Retail','Fit-out and build-out for commercial office, retail, and hospitality spaces','Commercial',0,NULL,'2026-08-05 09:33:31','2026-08-05 09:33:31'),(3,'MEP Installation Works','Mechanical, Electrical & Plumbing works for standalone or retrofit projects','MEP',0,NULL,'2026-08-05 09:33:31','2026-08-05 09:33:31'),(4,'Industrial / EPC Project','Engineering, Procurement & Construction for factories, warehouses, and plants','Industrial',0,NULL,'2026-08-05 09:33:31','2026-08-05 09:33:31'),(6,'Commercial Construction — Premium',' Standard workflow for residential construction projects, covering foundation, structure, interiors, and finishing.','Commercial',0,NULL,'2026-08-06 06:52:07','2026-08-06 06:52:07');

--
-- Table structure for table `tasks`
--

DROP TABLE IF EXISTS `tasks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tasks` (
  `id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `assigned_to_id` int DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `priority` varchar(16) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'medium',
  `status` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'todo',
  `progress` int NOT NULL DEFAULT '0',
  `parent_task_id` int DEFAULT NULL,
  `created_by_id` int DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `updated_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=299 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tasks`
--

INSERT INTO `tasks` VALUES (1,1,'Floor 4 ceiling grid installation','Install T-grid and integrate with HVAC diffusers.',3,'2026-04-15','2026-04-28','high','in_progress',60,NULL,2,'2026-08-05 06:44:24','2026-08-05 06:44:24'),(2,1,'Procure flooring materials for Floor 5',NULL,5,'2026-04-20','2026-05-02','medium','in_progress',0,NULL,2,'2026-08-05 06:44:24','2026-10-04 23:34:11'),(3,1,'Client snag review walkthrough',NULL,2,'2026-04-22','2026-04-22','high','in_review',80,NULL,2,'2026-08-05 06:44:24','2026-08-05 06:44:24'),(4,2,'Riser shaft electrical pull',NULL,3,'2026-04-10','2026-05-10','high','in_progress',55,NULL,2,'2026-08-05 06:44:24','2026-08-05 06:44:24'),(5,2,'Floors 18-20 plumbing test',NULL,3,'2026-04-18','2026-04-24','medium','completed',100,NULL,2,'2026-08-05 06:44:24','2026-08-05 06:44:24'),(6,3,'Site mobilization plan',NULL,2,'2026-04-25','2026-05-05','high','todo',10,NULL,2,'2026-08-05 06:44:24','2026-08-05 06:44:24'),(7,6,'Electrical wiring for conference hall',NULL,2,'2026-08-06','2026-09-06','medium','in_progress',0,NULL,1,'2026-08-06 06:41:53','2026-08-06 04:52:35'),(8,6,'Lease / ownership document verification','[Initiation]',NULL,'2026-08-06','2026-08-11','high','todo',0,NULL,NULL,'2026-08-06 10:23:08','2026-08-06 10:23:08'),(9,6,'Space planning and programming brief','[Initiation]',NULL,'2026-08-11','2026-08-18','high','todo',0,NULL,NULL,'2026-08-06 10:23:08','2026-08-06 10:23:08'),(10,6,'Fire NOC and building department approvals','[Initiation]',NULL,'2026-08-18','2026-09-08','high','todo',0,NULL,NULL,'2026-08-06 10:23:08','2026-08-06 10:23:08'),(11,6,'Concept design and client approval','[Design]',NULL,'2026-09-08','2026-09-22','high','todo',0,NULL,NULL,'2026-08-06 10:23:08','2026-08-06 10:23:08'),(12,6,'Detailed construction drawings (architectural + structural)','[Design]',NULL,'2026-09-22','2026-10-13','high','todo',0,NULL,NULL,'2026-08-06 10:23:08','2026-08-06 10:23:08'),(13,6,'Lighting and power layout design','[Design]',NULL,'2026-10-13','2026-10-23','medium','todo',0,NULL,NULL,'2026-08-06 10:23:08','2026-08-06 10:23:08'),(14,6,'HVAC zoning design and equipment schedule','[Design]',NULL,'2026-10-23','2026-11-02','medium','todo',0,NULL,NULL,'2026-08-06 10:23:08','2026-08-06 10:23:08'),(15,6,'Furniture, fixtures & equipment (FF&E) procurement','[Procurement]',NULL,'2026-11-02','2026-12-17','medium','todo',0,NULL,NULL,'2026-08-06 10:23:08','2026-08-06 10:23:08'),(16,6,'Specialty items — signage, branding elements','[Procurement]',NULL,'2026-12-17','2027-01-16','low','todo',0,NULL,NULL,'2026-08-06 10:23:08','2026-08-06 10:23:08'),(17,6,'Subcontractor mobilisation — civil, MEP, AV','[Procurement]',NULL,'2027-01-16','2027-01-23','high','todo',0,NULL,NULL,'2026-08-06 10:23:08','2026-08-06 10:23:08'),(18,6,'Demolition of existing partitions / false ceiling','[Civil & Structure]',NULL,'2027-01-23','2027-01-30','high','todo',0,NULL,NULL,'2026-08-06 10:23:08','2026-08-06 10:23:08'),(19,6,'New partition walls (drywall / glass)','[Civil & Structure]',NULL,'2027-01-30','2027-02-13','medium','todo',0,NULL,NULL,'2026-08-06 10:23:08','2026-08-06 10:23:08'),(20,6,'False ceiling — grid / gypsum / speciality','[Civil & Structure]',NULL,'2027-02-13','2027-02-27','medium','todo',0,NULL,NULL,'2026-08-06 10:23:08','2026-08-06 10:23:08'),(21,6,'Raised access flooring (if required)','[Civil & Structure]',NULL,'2027-02-27','2027-03-06','low','todo',0,NULL,NULL,'2026-08-06 10:23:08','2026-08-06 10:23:08'),(22,6,'Electrical distribution — DB, MCBs, outlets','[MEP]',NULL,'2027-03-06','2027-03-20','high','todo',0,NULL,NULL,'2026-08-06 10:23:08','2026-08-06 10:23:08'),(23,6,'Data and networking cabling infrastructure','[MEP]',NULL,'2027-03-20','2027-03-30','high','todo',0,NULL,NULL,'2026-08-06 10:23:08','2026-08-06 10:23:08'),(24,6,'HVAC installation, testing, and balancing','[MEP]',NULL,'2027-03-30','2027-04-13','high','todo',0,NULL,NULL,'2026-08-06 10:23:08','2026-08-06 10:23:08'),(25,6,'Sprinkler and fire suppression system','[MEP]',NULL,'2027-04-13','2027-04-23','high','todo',0,NULL,NULL,'2026-08-06 10:23:08','2026-08-06 10:23:08'),(26,6,'CCTV, access control, and security systems','[MEP]',NULL,'2027-04-23','2027-04-30','medium','todo',0,NULL,NULL,'2026-08-06 10:23:08','2026-08-06 10:23:08'),(27,6,'Flooring — carpet, vinyl, or stone','[Finishing]',NULL,'2027-04-30','2027-05-10','medium','in_progress',0,NULL,NULL,'2026-08-06 10:23:08','2026-10-01 00:03:39'),(28,6,'Painting and wall finishes','[Finishing]',NULL,'2027-05-10','2027-05-20','medium','todo',0,NULL,NULL,'2026-08-06 10:23:08','2026-08-06 10:23:08'),(29,6,'Glazed partitions and doors installation','[Finishing]',NULL,'2027-05-20','2027-05-27','medium','todo',0,NULL,NULL,'2026-08-06 10:23:08','2026-08-06 10:23:08'),(30,6,'FF&E installation and placement','[Finishing]',NULL,'2027-05-27','2027-06-03','medium','todo',0,NULL,NULL,'2026-08-06 10:23:08','2026-08-06 10:23:08'),(31,6,'Snagging and defect rectification','[QC & Handover]',NULL,'2027-06-03','2027-06-10','high','todo',0,NULL,NULL,'2026-08-06 10:23:08','2026-08-06 10:23:08'),(32,6,'Systems commissioning and user training','[QC & Handover]',NULL,'2027-06-10','2027-06-15','high','todo',0,NULL,NULL,'2026-08-06 10:23:08','2026-08-06 10:23:08'),(33,6,'Final client walkthrough and acceptance','[QC & Handover]',NULL,'2027-06-15','2027-06-17','high','todo',0,NULL,NULL,'2026-08-06 10:23:08','2026-08-06 10:23:08'),(43,2,'Concept design and client approval','[Design]',NULL,'2025-10-04','2025-10-18','high','todo',0,NULL,17,'2026-09-18 11:41:03','2026-09-18 11:41:03'),(44,2,'Detailed construction drawings (architectural + structural)','[Design]',NULL,'2025-10-18','2025-11-08','high','todo',0,NULL,17,'2026-09-18 11:41:03','2026-09-18 11:41:03'),(45,2,'Lighting and power layout design','[Design]',NULL,'2025-11-08','2025-11-18','medium','todo',0,NULL,17,'2026-09-18 11:41:03','2026-09-18 11:41:03'),(46,2,'HVAC zoning design and equipment schedule','[Design]',NULL,'2025-11-18','2025-11-28','medium','todo',0,NULL,17,'2026-09-18 11:41:03','2026-09-18 11:41:03'),(47,2,'Furniture, fixtures & equipment (FF&E) procurement','[Procurement]',NULL,'2025-11-28','2026-01-12','medium','todo',0,NULL,17,'2026-09-18 11:41:03','2026-09-18 11:41:03'),(48,2,'Specialty items — signage, branding elements','[Procurement]',NULL,'2026-01-12','2026-02-11','low','todo',0,NULL,17,'2026-09-18 11:41:03','2026-09-18 11:41:03'),(50,2,'Demolition of existing partitions / false ceiling','[Civil & Structure]',NULL,'2026-02-18','2026-02-25','high','todo',0,NULL,17,'2026-09-18 11:41:03','2026-09-18 11:41:03'),(51,2,'New partition walls (drywall / glass)','[Civil & Structure]',NULL,'2026-02-25','2026-03-11','medium','todo',0,NULL,17,'2026-09-18 11:41:03','2026-09-18 11:41:03'),(52,2,'False ceiling — grid / gypsum / speciality','[Civil & Structure]',NULL,'2026-03-11','2026-03-25','medium','todo',0,NULL,17,'2026-09-18 11:41:03','2026-09-18 11:41:03'),(53,2,'Raised access flooring (if required)','[Civil & Structure]',NULL,'2026-03-25','2026-04-01','low','todo',0,NULL,17,'2026-09-18 11:41:03','2026-09-18 11:41:03'),(54,2,'Electrical distribution — DB, MCBs, outlets','[MEP]',NULL,'2026-04-01','2026-04-15','high','todo',0,NULL,17,'2026-09-18 11:41:03','2026-09-18 11:41:03'),(55,2,'Data and networking cabling infrastructure','[MEP]',NULL,'2026-04-15','2026-04-25','high','todo',0,NULL,17,'2026-09-18 11:41:03','2026-09-18 11:41:03'),(56,2,'HVAC installation, testing, and balancing','[MEP]',NULL,'2026-04-25','2026-05-09','high','todo',0,NULL,17,'2026-09-18 11:41:03','2026-09-18 11:41:03'),(57,2,'Sprinkler and fire suppression system','[MEP]',NULL,'2026-05-09','2026-05-19','high','todo',0,NULL,17,'2026-09-18 11:41:03','2026-09-18 11:41:03'),(58,2,'CCTV, access control, and security systems','[MEP]',NULL,'2026-05-19','2026-05-26','medium','todo',0,NULL,17,'2026-09-18 11:41:03','2026-09-18 11:41:03'),(59,2,'Flooring — carpet, vinyl, or stone','[Finishing]',NULL,'2026-05-26','2026-06-05','medium','todo',0,NULL,17,'2026-09-18 11:41:03','2026-09-18 11:41:03'),(60,2,'Painting and wall finishes','[Finishing]',NULL,'2026-06-05','2026-06-15','medium','todo',0,NULL,17,'2026-09-18 11:41:03','2026-09-18 11:41:03'),(61,2,'Glazed partitions and doors installation','[Finishing]',NULL,'2026-06-15','2026-06-22','medium','todo',0,NULL,17,'2026-09-18 11:41:03','2026-09-18 11:41:03'),(62,2,'FF&E installation and placement','[Finishing]',NULL,'2026-06-22','2026-06-29','medium','todo',0,NULL,17,'2026-09-18 11:41:03','2026-09-18 11:41:03'),(63,2,'Snagging and defect rectification','[QC & Handover]',NULL,'2026-06-29','2026-07-06','high','todo',0,NULL,17,'2026-09-18 11:41:03','2026-09-18 11:41:03'),(64,2,'Systems commissioning and user training','[QC & Handover]',NULL,'2026-07-06','2026-07-11','high','todo',0,NULL,17,'2026-09-18 11:41:03','2026-09-18 11:41:03'),(65,2,'Final client walkthrough and acceptance','[QC & Handover]',NULL,'2026-07-11','2026-07-13','high','todo',0,NULL,17,'2026-09-18 11:41:03','2026-09-18 11:41:03'),(118,2,'Lease / ownership document verification','[Initiation]',NULL,'2026-09-18','2026-09-23','high','completed',0,NULL,18,'2026-09-18 11:42:37','2026-09-18 06:25:34'),(145,2,'Space planning and programming brief','[Initiation]',NULL,'2026-09-23','2026-09-30','high','in_review',0,NULL,18,'2026-09-18 11:43:52','2026-09-18 06:25:29'),(146,2,'Fire NOC and building department approvals','[Initiation]',NULL,'2026-09-30','2026-10-21','high','in_progress',0,NULL,18,'2026-09-18 11:43:52','2026-09-18 06:25:26'),(153,2,'Subcontractor mobilisation — civil, MEP, AV','[Procurement]',NULL,'2027-02-28','2027-03-07','high','in_progress',0,NULL,18,'2026-09-18 11:43:52','2026-09-18 06:25:47'),(170,3,'Lease / ownership document verification','[Initiation]',NULL,'2026-09-19','2026-09-24','high','completed',0,NULL,17,'2026-09-19 09:20:00','2026-09-19 03:50:44'),(171,3,'Space planning and programming brief','[Initiation]',NULL,'2026-09-24','2026-10-01','high','todo',0,NULL,17,'2026-09-19 09:20:00','2026-09-19 09:20:00'),(172,3,'Fire NOC and building department approvals','[Initiation]',NULL,'2026-10-01','2026-10-22','high','todo',0,NULL,17,'2026-09-19 09:20:00','2026-09-19 09:20:00'),(173,3,'Concept design and client approval','[Design]',NULL,'2026-10-22','2026-11-05','high','todo',0,NULL,17,'2026-09-19 09:20:00','2026-09-19 09:20:00'),(174,3,'Detailed construction drawings (architectural + structural)','[Design]',NULL,'2026-11-05','2026-11-26','high','todo',0,NULL,17,'2026-09-19 09:20:00','2026-09-19 09:20:00'),(175,3,'Lighting and power layout design','[Design]',NULL,'2026-11-26','2026-12-06','medium','todo',0,NULL,17,'2026-09-19 09:20:00','2026-09-19 09:20:00'),(176,3,'HVAC zoning design and equipment schedule','[Design]',NULL,'2026-12-06','2026-12-16','medium','todo',0,NULL,17,'2026-09-19 09:20:00','2026-09-19 09:20:00'),(177,3,'Furniture, fixtures & equipment (FF&E) procurement','[Procurement]',NULL,'2026-12-16','2027-01-30','medium','todo',0,NULL,17,'2026-09-19 09:20:00','2026-09-19 09:20:00'),(178,3,'Specialty items — signage, branding elements','[Procurement]',NULL,'2027-01-30','2027-03-01','low','todo',0,NULL,17,'2026-09-19 09:20:00','2026-09-19 09:20:00'),(179,3,'Subcontractor mobilisation — civil, MEP, AV','[Procurement]',NULL,'2027-03-01','2027-03-08','high','todo',0,NULL,17,'2026-09-19 09:20:00','2026-09-19 09:20:00'),(180,3,'Demolition of existing partitions / false ceiling','[Civil & Structure]',NULL,'2027-03-08','2027-03-15','high','todo',0,NULL,17,'2026-09-19 09:20:00','2026-09-19 09:20:00'),(181,3,'New partition walls (drywall / glass)','[Civil & Structure]',NULL,'2027-03-15','2027-03-29','medium','todo',0,NULL,17,'2026-09-19 09:20:00','2026-09-19 09:20:00'),(182,3,'False ceiling — grid / gypsum / speciality','[Civil & Structure]',NULL,'2027-03-29','2027-04-12','medium','todo',0,NULL,17,'2026-09-19 09:20:00','2026-09-19 09:20:00'),(183,3,'Raised access flooring (if required)','[Civil & Structure]',NULL,'2027-04-12','2027-04-19','low','todo',0,NULL,17,'2026-09-19 09:20:00','2026-09-19 09:20:00'),(184,3,'Electrical distribution — DB, MCBs, outlets','[MEP]',NULL,'2027-04-19','2027-05-03','high','todo',0,NULL,17,'2026-09-19 09:20:00','2026-09-19 09:20:00'),(185,3,'Data and networking cabling infrastructure','[MEP]',NULL,'2027-05-03','2027-05-13','high','todo',0,NULL,17,'2026-09-19 09:20:00','2026-09-19 09:20:00'),(186,3,'HVAC installation, testing, and balancing','[MEP]',NULL,'2027-05-13','2027-05-27','high','todo',0,NULL,17,'2026-09-19 09:20:00','2026-09-19 09:20:00'),(187,3,'Sprinkler and fire suppression system','[MEP]',NULL,'2027-05-27','2027-06-06','high','todo',0,NULL,17,'2026-09-19 09:20:00','2026-09-19 09:20:00'),(188,3,'CCTV, access control, and security systems','[MEP]',NULL,'2027-06-06','2027-06-13','medium','todo',0,NULL,17,'2026-09-19 09:20:00','2026-09-19 09:20:00'),(189,3,'Flooring — carpet, vinyl, or stone','[Finishing]',NULL,'2027-06-13','2027-06-23','medium','todo',0,NULL,17,'2026-09-19 09:20:00','2026-09-19 09:20:00'),(190,3,'Painting and wall finishes','[Finishing]',NULL,'2027-06-23','2027-07-03','medium','todo',0,NULL,17,'2026-09-19 09:20:00','2026-09-19 09:20:00'),(191,3,'Glazed partitions and doors installation','[Finishing]',NULL,'2027-07-03','2027-07-10','medium','todo',0,NULL,17,'2026-09-19 09:20:00','2026-09-19 09:20:00'),(192,3,'FF&E installation and placement','[Finishing]',NULL,'2027-07-10','2027-07-17','medium','todo',0,NULL,17,'2026-09-19 09:20:00','2026-09-19 09:20:00'),(193,3,'Snagging and defect rectification','[QC & Handover]',NULL,'2027-07-17','2027-07-24','high','todo',0,NULL,17,'2026-09-19 09:20:00','2026-09-19 09:20:00'),(194,3,'Systems commissioning and user training','[QC & Handover]',NULL,'2027-07-24','2027-07-29','high','todo',0,NULL,17,'2026-09-19 09:20:00','2026-09-19 09:20:00'),(195,3,'Final client walkthrough and acceptance','[QC & Handover]',NULL,'2027-07-29','2027-07-31','high','todo',0,NULL,17,'2026-09-19 09:20:00','2026-09-19 09:20:00'),(233,14,'Project kickoff & contract sign-off','[Initiation] Confirm scope, sign contract, mobilize core team.',NULL,'2026-09-24','2026-10-01','medium','in_review',0,NULL,17,'2026-09-24 12:48:26','2026-10-04 23:29:55'),(234,14,'Site mobilization & survey','[Initiation] Set up site office, fencing, utilities; topographic survey.',NULL,'2026-09-29','2026-10-13','medium','in_progress',0,NULL,17,'2026-09-24 12:48:26','2026-10-04 23:29:46'),(235,14,'Statutory approvals & permits','[Planning] Building permit, environmental clearance, labour licence.',NULL,'2026-10-01','2026-10-31','medium','completed',0,NULL,17,'2026-09-24 12:48:26','2026-10-04 23:30:06'),(236,14,'Detailed design & engineering','[Planning] GFC drawings, MEP coordination, structural analysis.',NULL,'2026-10-08','2026-11-22','medium','in_progress',0,NULL,17,'2026-09-24 12:48:26','2026-10-04 23:29:58'),(237,14,'Procurement of long-lead materials','[Procurement] Issue PO for steel, lifts, DG sets, HVAC equipment.',NULL,'2026-10-24','2026-12-23','medium','todo',0,NULL,17,'2026-09-24 12:48:26','2026-09-24 12:48:26'),(238,14,'Foundation & substructure','[Execution] Excavation, raft/PCC, columns up to plinth.',NULL,'2026-11-08','2027-01-07','medium','todo',0,NULL,17,'2026-09-24 12:48:26','2026-09-24 12:48:26'),(239,14,'Superstructure works','[Execution] Slabs, columns, beams, masonry up to terrace.',NULL,'2026-12-23','2027-04-22','medium','todo',0,NULL,17,'2026-09-24 12:48:26','2026-09-24 12:48:26'),(240,14,'MEP rough-in','[Execution] Conduiting, plumbing risers, HVAC ducting.',NULL,'2027-02-21','2027-04-22','medium','todo',0,NULL,17,'2026-09-24 12:48:26','2026-09-24 12:48:26'),(241,14,'Finishes & interiors','[Execution] Plaster, paint, flooring, false ceiling, joinery.',NULL,'2027-04-22','2027-06-21','medium','todo',0,NULL,17,'2026-09-24 12:48:26','2026-09-24 12:48:26'),(242,14,'Testing, commissioning & snagging','[Closeout] Run all systems, snag list resolution, statutory NOCs.',NULL,'2027-06-21','2027-07-12','medium','todo',0,NULL,17,'2026-09-24 12:48:26','2026-09-24 12:48:26'),(243,14,'Client handover & DLP start','[Closeout] Final walkthrough, key handover, O&M manuals, defect liability period begins.',NULL,'2027-07-11','2027-07-18','medium','todo',0,NULL,17,'2026-09-24 12:48:26','2026-09-24 12:48:26'),(255,16,'Project kickoff & contract sign-off','[Initiation] Confirm scope, sign contract, mobilize core team.',NULL,'2026-10-07','2026-10-14','medium','todo',0,NULL,17,'2026-10-07 07:41:10','2026-10-07 07:41:10'),(256,16,'Site mobilization & survey','[Initiation] Set up site office, fencing, utilities; topographic survey.',NULL,'2026-10-12','2026-10-26','medium','todo',0,NULL,17,'2026-10-07 07:41:10','2026-10-07 07:41:10'),(257,16,'Statutory approvals & permits','[Planning] Building permit, environmental clearance, labour licence.',NULL,'2026-10-14','2026-11-13','medium','todo',0,NULL,17,'2026-10-07 07:41:10','2026-10-07 07:41:10'),(258,16,'Detailed design & engineering','[Planning] GFC drawings, MEP coordination, structural analysis.',NULL,'2026-10-21','2026-12-05','medium','todo',0,NULL,17,'2026-10-07 07:41:10','2026-10-07 07:41:10'),(259,16,'Procurement of long-lead materials','[Procurement] Issue PO for steel, lifts, DG sets, HVAC equipment.',NULL,'2026-11-06','2027-01-05','medium','todo',0,NULL,17,'2026-10-07 07:41:10','2026-10-07 07:41:10'),(260,16,'Foundation & substructure','[Execution] Excavation, raft/PCC, columns up to plinth.',NULL,'2026-11-21','2027-01-20','medium','todo',0,NULL,17,'2026-10-07 07:41:10','2026-10-07 07:41:10'),(261,16,'Superstructure works','[Execution] Slabs, columns, beams, masonry up to terrace.',NULL,'2027-01-05','2027-05-05','medium','todo',0,NULL,17,'2026-10-07 07:41:10','2026-10-07 07:41:10'),(262,16,'MEP rough-in','[Execution] Conduiting, plumbing risers, HVAC ducting.',NULL,'2027-03-06','2027-05-05','medium','todo',0,NULL,17,'2026-10-07 07:41:10','2026-10-07 07:41:10'),(263,16,'Finishes & interiors','[Execution] Plaster, paint, flooring, false ceiling, joinery.',NULL,'2027-05-05','2027-07-04','medium','todo',0,NULL,17,'2026-10-07 07:41:10','2026-10-07 07:41:10'),(264,16,'Testing, commissioning & snagging','[Closeout] Run all systems, snag list resolution, statutory NOCs.',NULL,'2027-07-04','2027-07-25','medium','todo',0,NULL,17,'2026-10-07 07:41:10','2026-10-07 07:41:10'),(265,16,'Client handover & DLP start','[Closeout] Final walkthrough, key handover, O&M manuals, defect liability period begins.',NULL,'2027-07-24','2027-07-31','medium','todo',0,NULL,17,'2026-10-07 07:41:10','2026-10-07 07:41:10'),(266,17,'Project kickoff & contract sign-off','[Initiation] Confirm scope, sign contract, mobilize core team.',NULL,'2026-10-07','2026-10-14','medium','in_review',0,NULL,17,'2026-10-07 07:41:30','2026-10-07 02:12:57'),(267,17,'Site mobilization & survey','[Initiation] Set up site office, fencing, utilities; topographic survey.',NULL,'2026-10-12','2026-10-26','medium','completed',0,NULL,17,'2026-10-07 07:41:30','2026-10-07 02:13:01'),(268,17,'Statutory approvals & permits','[Planning] Building permit, environmental clearance, labour licence.',NULL,'2026-10-14','2026-11-13','medium','in_progress',0,NULL,17,'2026-10-07 07:41:30','2026-10-07 02:12:42'),(269,17,'Detailed design & engineering','[Planning] GFC drawings, MEP coordination, structural analysis.',NULL,'2026-10-21','2026-12-05','medium','in_progress',0,NULL,17,'2026-10-07 07:41:30','2026-10-07 02:12:44'),(270,17,'Procurement of long-lead materials','[Procurement] Issue PO for steel, lifts, DG sets, HVAC equipment.',NULL,'2026-11-06','2027-01-05','medium','todo',0,NULL,17,'2026-10-07 07:41:30','2026-10-07 07:41:30'),(271,17,'Foundation & substructure','[Execution] Excavation, raft/PCC, columns up to plinth.',NULL,'2026-11-21','2027-01-20','medium','in_review',0,NULL,17,'2026-10-07 07:41:30','2026-10-07 02:12:48'),(272,17,'Superstructure works','[Execution] Slabs, columns, beams, masonry up to terrace.',NULL,'2027-01-05','2027-05-05','medium','in_progress',0,NULL,17,'2026-10-07 07:41:30','2026-10-07 02:12:51'),(273,17,'MEP rough-in','[Execution] Conduiting, plumbing risers, HVAC ducting.',NULL,'2027-03-06','2027-05-05','medium','todo',0,NULL,17,'2026-10-07 07:41:30','2026-10-07 07:41:30'),(274,17,'Finishes & interiors','[Execution] Plaster, paint, flooring, false ceiling, joinery.',NULL,'2027-05-05','2027-07-04','medium','todo',0,NULL,17,'2026-10-07 07:41:30','2026-10-07 07:41:30'),(275,17,'Testing, commissioning & snagging','[Closeout] Run all systems, snag list resolution, statutory NOCs.',NULL,'2027-07-04','2027-07-25','medium','todo',0,NULL,17,'2026-10-07 07:41:30','2026-10-07 07:41:30'),(276,17,'Client handover & DLP start','[Closeout] Final walkthrough, key handover, O&M manuals, defect liability period begins.',NULL,'2027-07-24','2027-07-31','medium','todo',0,NULL,17,'2026-10-07 07:41:30','2026-10-07 07:41:30'),(277,18,'Project kickoff & contract sign-off','[Initiation] Confirm scope, sign contract, mobilize core team.',NULL,'2026-10-07','2026-10-14','medium','todo',0,NULL,17,'2026-10-07 08:43:26','2026-10-07 08:43:26'),(278,18,'Site mobilization & survey','[Initiation] Set up site office, fencing, utilities; topographic survey.',NULL,'2026-10-12','2026-10-26','medium','todo',0,NULL,17,'2026-10-07 08:43:26','2026-10-07 08:43:26'),(279,18,'Statutory approvals & permits','[Planning] Building permit, environmental clearance, labour licence.',NULL,'2026-10-14','2026-11-13','medium','todo',0,NULL,17,'2026-10-07 08:43:26','2026-10-07 08:43:26'),(280,18,'Detailed design & engineering','[Planning] GFC drawings, MEP coordination, structural analysis.',NULL,'2026-10-21','2026-12-05','medium','todo',0,NULL,17,'2026-10-07 08:43:26','2026-10-07 08:43:26'),(281,18,'Procurement of long-lead materials','[Procurement] Issue PO for steel, lifts, DG sets, HVAC equipment.',NULL,'2026-11-06','2027-01-05','medium','todo',0,NULL,17,'2026-10-07 08:43:26','2026-10-07 08:43:26'),(282,18,'Foundation & substructure','[Execution] Excavation, raft/PCC, columns up to plinth.',NULL,'2026-11-21','2027-01-20','medium','todo',0,NULL,17,'2026-10-07 08:43:26','2026-10-07 08:43:26'),(283,18,'Superstructure works','[Execution] Slabs, columns, beams, masonry up to terrace.',NULL,'2027-01-05','2027-05-05','medium','todo',0,NULL,17,'2026-10-07 08:43:26','2026-10-07 08:43:26'),(284,18,'MEP rough-in','[Execution] Conduiting, plumbing risers, HVAC ducting.',NULL,'2027-03-06','2027-05-05','medium','todo',0,NULL,17,'2026-10-07 08:43:26','2026-10-07 08:43:26'),(285,18,'Finishes & interiors','[Execution] Plaster, paint, flooring, false ceiling, joinery.',NULL,'2027-05-05','2027-07-04','medium','todo',0,NULL,17,'2026-10-07 08:43:26','2026-10-07 08:43:26'),(286,18,'Testing, commissioning & snagging','[Closeout] Run all systems, snag list resolution, statutory NOCs.',NULL,'2027-07-04','2027-07-25','medium','todo',0,NULL,17,'2026-10-07 08:43:26','2026-10-07 08:43:26'),(287,18,'Client handover & DLP start','[Closeout] Final walkthrough, key handover, O&M manuals, defect liability period begins.',NULL,'2027-07-24','2027-07-31','medium','todo',0,NULL,17,'2026-10-07 08:43:26','2026-10-07 08:43:26'),(288,19,'Project kickoff & contract sign-off','[Initiation] Confirm scope, sign contract, mobilize core team.',NULL,'2026-10-07','2026-10-14','medium','todo',0,NULL,17,'2026-10-07 08:48:01','2026-10-07 08:48:01'),(289,19,'Site mobilization & survey','[Initiation] Set up site office, fencing, utilities; topographic survey.',NULL,'2026-10-12','2026-10-26','medium','todo',0,NULL,17,'2026-10-07 08:48:01','2026-10-07 08:48:01'),(290,19,'Statutory approvals & permits','[Planning] Building permit, environmental clearance, labour licence.',NULL,'2026-10-14','2026-11-13','medium','todo',0,NULL,17,'2026-10-07 08:48:01','2026-10-07 08:48:01'),(291,19,'Detailed design & engineering','[Planning] GFC drawings, MEP coordination, structural analysis.',NULL,'2026-10-21','2026-12-05','medium','todo',0,NULL,17,'2026-10-07 08:48:01','2026-10-07 08:48:01'),(292,19,'Procurement of long-lead materials','[Procurement] Issue PO for steel, lifts, DG sets, HVAC equipment.',NULL,'2026-11-06','2027-01-05','medium','todo',0,NULL,17,'2026-10-07 08:48:01','2026-10-07 08:48:01'),(293,19,'Foundation & substructure','[Execution] Excavation, raft/PCC, columns up to plinth.',NULL,'2026-11-21','2027-01-20','medium','todo',0,NULL,17,'2026-10-07 08:48:01','2026-10-07 08:48:01'),(294,19,'Superstructure works','[Execution] Slabs, columns, beams, masonry up to terrace.',NULL,'2027-01-05','2027-05-05','medium','todo',0,NULL,17,'2026-10-07 08:48:01','2026-10-07 08:48:01'),(295,19,'MEP rough-in','[Execution] Conduiting, plumbing risers, HVAC ducting.',NULL,'2027-03-06','2027-05-05','medium','todo',0,NULL,17,'2026-10-07 08:48:01','2026-10-07 08:48:01'),(296,19,'Finishes & interiors','[Execution] Plaster, paint, flooring, false ceiling, joinery.',NULL,'2027-05-05','2027-07-04','medium','todo',0,NULL,17,'2026-10-07 08:48:01','2026-10-07 08:48:01'),(297,19,'Testing, commissioning & snagging','[Closeout] Run all systems, snag list resolution, statutory NOCs.',NULL,'2027-07-04','2027-07-25','medium','todo',0,NULL,17,'2026-10-07 08:48:01','2026-10-07 08:48:01'),(298,19,'Client handover & DLP start','[Closeout] Final walkthrough, key handover, O&M manuals, defect liability period begins.',NULL,'2027-07-24','2027-07-31','medium','todo',0,NULL,17,'2026-10-07 08:48:01','2026-10-07 08:48:01');

--
-- Table structure for table `user_permission_overrides`
--

DROP TABLE IF EXISTS `user_permission_overrides`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_permission_overrides` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `permission` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `granted` tinyint(1) NOT NULL DEFAULT '1',
  `granted_by_id` int DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_permission_overrides`
--


--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` text COLLATE utf8mb4_unicode_ci,
  `avatar_url` text COLLATE utf8mb4_unicode_ci,
  `roles` json NOT NULL,
  `active_role` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'admin',
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `updated_at` timestamp NOT NULL DEFAULT (now()),
  `organization_id` int NOT NULL DEFAULT '1',
  `reset_token` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reset_token_expires_at` timestamp NULL DEFAULT NULL,
  `two_factor_enabled` tinyint(1) NOT NULL DEFAULT '0',
  `two_factor_secret` text COLLATE utf8mb4_unicode_ci,
  `two_factor_backup_codes` json DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`),
  UNIQUE KEY `users_phone_unique` (`phone`)
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

INSERT INTO `users` VALUES (17,'ananya.rao@kanak.in','9876543210','Ananya Rao','$2b$10$pGCkMg.T.rtSgzsj5d9Ms.31zi3NSFXwhHZUHVjC0dEgIYANup4.a',NULL,'[\"admin\", \"project_manager\", \"engineer\", \"accountant\", \"procurement_officer\", \"viewer\"]','admin','2026-08-11 08:10:43','2026-10-29 09:56:59',1,'35f5b7f2de3765ee77c9438dd99ef20ba8a462c43a7cfeb8c3c841dac59bdb4f','2026-10-22 06:48:58',0,NULL,NULL),(18,'rohan.mehta@kanak.in','9876543212','Rohan Mehta','$2b$10$pGCkMg.T.rtSgzsj5d9Ms.31zi3NSFXwhHZUHVjC0dEgIYANup4.a',NULL,'[\"project_manager\", \"viewer\"]','project_manager','2026-08-11 08:10:43','2026-10-29 09:56:59',1,NULL,NULL,0,NULL,NULL),(19,'priya.iyer@kanak.in','9876543213','Priya Iyer','$2b$10$pGCkMg.T.rtSgzsj5d9Ms.31zi3NSFXwhHZUHVjC0dEgIYANup4.a',NULL,'[\"engineer\", \"viewer\"]','engineer','2026-08-11 08:10:43','2026-10-29 09:56:59',1,NULL,NULL,0,NULL,NULL),(20,'vikram.shah@kanak.in','9876543214','Vikram Shah','$2b$10$pGCkMg.T.rtSgzsj5d9Ms.31zi3NSFXwhHZUHVjC0dEgIYANup4.a',NULL,'[\"accountant\", \"viewer\"]','accountant','2026-08-11 08:10:43','2026-10-29 09:56:59',1,NULL,NULL,0,NULL,NULL),(21,'neha.kapoor@kanak.in','9876543215','Neha Kapoor','$2b$10$pGCkMg.T.rtSgzsj5d9Ms.31zi3NSFXwhHZUHVjC0dEgIYANup4.a',NULL,'[\"procurement_officer\", \"viewer\"]','procurement_officer','2026-08-11 08:10:43','2026-10-29 09:56:59',1,NULL,NULL,0,NULL,NULL),(22,'arjun.singh@kanak.in','9876543216','Arjun Singh','$2b$10$pGCkMg.T.rtSgzsj5d9Ms.31zi3NSFXwhHZUHVjC0dEgIYANup4.a',NULL,'[\"viewer\"]','viewer','2026-08-11 08:10:43','2026-10-29 09:56:59',1,NULL,NULL,0,NULL,NULL),(23,'Hari.mailapalli12@gmail.com','9876543211','Harinarayana','$2b$10$pGCkMg.T.rtSgzsj5d9Ms.31zi3NSFXwhHZUHVjC0dEgIYANup4.a',NULL,'[\"admin\", \"project_manager\", \"engineer\", \"accountant\", \"procurement_officer\", \"viewer\"]','project_manager','2026-09-28 10:10:53','2026-10-29 09:56:59',1,'44e82901f02c372560ef7b10dcad943178a90f419777583810e66c0991adf443','2026-10-22 07:35:03',0,NULL,NULL),(24,'venkibaipalli@gmail.com','9876543217','Baipalli Venkateswara Rao','$2b$10$pGCkMg.T.rtSgzsj5d9Ms.31zi3NSFXwhHZUHVjC0dEgIYANup4.a',NULL,'[\"admin\", \"project_manager\", \"engineer\", \"accountant\", \"procurement_officer\", \"viewer\"]','admin','2026-10-10 05:44:13','2026-10-29 09:56:59',1,NULL,NULL,0,NULL,NULL),(25,'ganesh@gmail.com','9876543220','Ganesh','$2b$10$hIz7Qq97B4i9eXreRgPPDOYaCf1NDXlDd.IZ835HryJA0s/HVm.JS',NULL,'[\"admin\", \"project_manager\", \"engineer\", \"accountant\", \"procurement_officer\", \"viewer\"]','admin','2026-10-29 11:33:51','2026-10-29 11:33:51',1,NULL,NULL,0,NULL,NULL);

--
-- Table structure for table `vendor_invoices`
--

DROP TABLE IF EXISTS `vendor_invoices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vendor_invoices` (
  `id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `vendor_id` int NOT NULL,
  `purchase_order_id` int DEFAULT NULL,
  `invoice_number` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(14,2) NOT NULL,
  `discrepancy_notes` text COLLATE utf8mb4_unicode_ci,
  `status` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'received',
  `payment_date` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `updated_at` timestamp NOT NULL DEFAULT (now()),
  `document_url` text COLLATE utf8mb4_unicode_ci,
  `contract_id` int DEFAULT NULL,
  `vendor_ra_bill_id` int DEFAULT NULL,
  `invoice_date` date DEFAULT NULL,
  `due_date` date DEFAULT NULL,
  `gross_amount` decimal(14,2) NOT NULL DEFAULT '0.00',
  `tax_amount` decimal(14,2) NOT NULL DEFAULT '0.00',
  `retention_amount` decimal(14,2) NOT NULL DEFAULT '0.00',
  `advance_recovery` decimal(14,2) NOT NULL DEFAULT '0.00',
  `tds_amount` decimal(14,2) NOT NULL DEFAULT '0.00',
  `other_deductions` decimal(14,2) NOT NULL DEFAULT '0.00',
  `net_payable_amount` decimal(14,2) NOT NULL DEFAULT '0.00',
  `po_matched` tinyint(1) NOT NULL DEFAULT '0',
  `measurement_matched` tinyint(1) NOT NULL DEFAULT '0',
  `quantity_rate_validated` tinyint(1) NOT NULL DEFAULT '0',
  `discrepancy_flag` tinyint(1) NOT NULL DEFAULT '0',
  `clarification_notes` text COLLATE utf8mb4_unicode_ci,
  `pm_approved_by_id` int DEFAULT NULL,
  `pm_approved_at` timestamp NULL DEFAULT NULL,
  `pm_comments` text COLLATE utf8mb4_unicode_ci,
  `finance_verified_by_id` int DEFAULT NULL,
  `finance_verified_at` timestamp NULL DEFAULT NULL,
  `finance_comments` text COLLATE utf8mb4_unicode_ci,
  `payment_approved_by_id` int DEFAULT NULL,
  `payment_approved_at` timestamp NULL DEFAULT NULL,
  `payment_scheduled_date` date DEFAULT NULL,
  `scheduled_amount` decimal(14,2) NOT NULL DEFAULT '0.00',
  `total_paid_amount` decimal(14,2) NOT NULL DEFAULT '0.00',
  `outstanding_amount` decimal(14,2) NOT NULL DEFAULT '0.00',
  `reconciled` tinyint(1) NOT NULL DEFAULT '0',
  `reconciled_by_id` int DEFAULT NULL,
  `reconciled_at` timestamp NULL DEFAULT NULL,
  `reconciliation_remarks` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vendor_invoices`
--

INSERT INTO `vendor_invoices` VALUES (1,2,3,3,'HVAC-2026-018',4800000.00,NULL,'invoice_matched',NULL,'2026-08-05 06:44:24','2026-09-24 02:52:48',NULL,NULL,NULL,'2026-08-05','2026-09-04',4800000.00,0.00,0.00,0.00,0.00,0.00,4800000.00,1,0,0,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0.00,0.00,4800000.00,0,NULL,NULL,NULL),(2,1,1,1,'POL-INV-2026-204',1149320.00,NULL,'paid',NULL,'2026-08-05 06:44:24','2026-10-05 00:42:57',NULL,NULL,NULL,'2026-09-22','2026-10-22',974000.00,175320.00,0.00,0.00,22986.00,0.00,1149320.00,1,1,1,0,NULL,17,'2026-09-22 09:30:00','PO rates and site GRN quantities verified. Approved.',17,'2026-09-22 11:30:00','TDS u/s 194C deducted and GSTIN verified on portal.',17,'2026-09-23 04:30:00',NULL,0.00,1149320.00,0.00,0,NULL,NULL,NULL),(6,14,1,6,'VINV-20260923-0014',1149320.00,NULL,'paid',NULL,'2026-09-30 07:43:30','2026-10-05 23:48:56',NULL,NULL,NULL,'2026-09-22','2026-10-22',974000.00,175320.00,0.00,0.00,22986.00,0.00,1149320.00,1,1,1,0,NULL,17,'2026-09-22 09:30:00','PO rates and site GRN quantities verified. Approved.',17,'2026-09-22 11:30:00','TDS u/s 194C deducted and GSTIN verified on portal.',17,'2026-09-23 04:30:00',NULL,0.00,1149320.00,0.00,0,NULL,NULL,NULL),(21,14,6,6,'VINV-2026-0081',2450000.00,NULL,'paid','2026-10-18','2026-10-23 09:47:19','2026-10-23 09:47:19',NULL,NULL,NULL,'2026-10-05','2026-10-25',2076271.00,373729.00,0.00,0.00,41525.00,0.00,2408475.00,0,0,0,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0.00,2408475.00,0.00,0,NULL,NULL,'Paid via UTR: HDFCR5202610189901'),(22,1,2,1,'VINV-2026-0105',685000.00,NULL,'payment_scheduled',NULL,'2026-10-23 09:47:19','2026-10-23 09:47:19',NULL,NULL,NULL,'2026-10-12','2026-11-02',580508.00,104492.00,0.00,0.00,11610.00,0.00,673390.00,0,0,0,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0.00,0.00,673390.00,0,NULL,NULL,'Scheduled for disbursement batch Nov 5'),(23,5,12,7,'VINV-2026-0112',30491.00,NULL,'paid','2026-10-10','2026-10-23 09:47:19','2026-10-23 09:47:19',NULL,NULL,NULL,'2026-10-02','2026-10-22',25840.00,4651.00,0.00,0.00,517.00,0.00,29974.00,0,0,0,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0.00,29974.00,0.00,0,NULL,NULL,'Paid via UTR: AXISR9202610101188'),(24,2,3,2,'VINV-2026-0120',1850000.00,NULL,'finance_verified',NULL,'2026-10-23 09:47:19','2026-10-23 09:47:19',NULL,NULL,NULL,'2026-10-15','2026-11-15',1567797.00,282203.00,0.00,0.00,31356.00,0.00,1818644.00,0,0,0,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0.00,0.00,1818644.00,0,NULL,NULL,'3-Way matched with JMR #4');

--
-- Table structure for table `vendor_payments`
--

DROP TABLE IF EXISTS `vendor_payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vendor_payments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `vendor_invoice_id` int NOT NULL,
  `vendor_id` int NOT NULL,
  `project_id` int NOT NULL,
  `vendor_ra_bill_id` int DEFAULT NULL,
  `payment_number` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `payment_date` date NOT NULL,
  `payment_amount` decimal(14,2) NOT NULL,
  `payment_mode` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'neft_rtgs',
  `bank_reference` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `transaction_id` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `from_bank_account` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `vendor_bank_details` text COLLATE utf8mb4_unicode_ci,
  `remarks` text COLLATE utf8mb4_unicode_ci,
  `document_url` text COLLATE utf8mb4_unicode_ci,
  `recorded_by_id` int NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `updated_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vendor_payments`
--

INSERT INTO `vendor_payments` VALUES (2,6,1,14,NULL,'VPAY-20260923-0014','2026-09-23',1149320.00,'neft_rtgs',NULL,'UTR-SBI-20260923-0014',NULL,NULL,'RTGS disbursement released against PO-0014 foundation materials.',NULL,17,'2026-09-30 07:43:30','2026-10-05 23:48:56'),(3,2,1,1,NULL,'VPAY-20260923-0001','2026-09-23',1149320.00,'neft_rtgs',NULL,'UTR-SBI-20260923-0001',NULL,NULL,'RTGS disbursement released against PO-0001 foundation materials.',NULL,17,'2026-10-05 06:12:57','2026-10-05 06:12:57');

--
-- Table structure for table `vendors`
--

DROP TABLE IF EXISTS `vendors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vendors` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `contact_person` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` text COLLATE utf8mb4_unicode_ci,
  `category` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rating` decimal(3,1) NOT NULL DEFAULT '0.0',
  `status` varchar(16) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `updated_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vendors`
--

INSERT INTO `vendors` VALUES (1,'Aarav Steel & Cement','Aarav Joshi','aarav@aaravsc.in','+91 90909 12345','MIDC Bhosari, Pune','Materials',4.6,'active','2026-08-05 06:44:24','2026-08-05 06:44:24'),(2,'Polaris Electricals','Sneha Pillai','sneha@polariselec.in','+91 98989 22220','Peenya, Bengaluru','MEP',4.3,'active','2026-08-05 06:44:24','2026-08-05 06:44:24'),(3,'Helios HVAC Systems','Karan Bedi','karan@helioshvac.in','+91 91919 55444','Andheri MIDC, Mumbai','HVAC',4.8,'active','2026-08-05 06:44:24','2026-08-05 06:44:24'),(4,'Ridgeline Interiors','Maya Nair','maya@ridgeline.in','+91 93939 33330','HSR Layout, Bengaluru','Interior',4.1,'active','2026-08-05 06:44:24','2026-08-05 06:44:24'),(5,'Sahyadri Tools Rental','Imran Sheikh','imran@sahyadritools.in','+91 95959 77770','Bhiwandi, Maharashtra','Equipment',3.9,'inactive','2026-08-05 06:44:24','2026-08-05 06:44:24'),(6,'Apex Steel & Cement Co.','Rajesh Kumar','rajesh@rar.in','+919898989898','Plot No. 12, Industrial Estate, Balanagar, Hyderabad, Telangana – 500037','Building Materials',4.5,'active','2026-08-07 10:20:08','2026-08-07 10:20:08'),(12,'Orion Electricals Pvt. Ltd.','Harinarayana ','sales@orionelectricals.com',' +91 91234 56789','Plot No. 45, MIDC Industrial Area, Pimpri, Pune, Maharashtra – 411018','Electrical Equipment & Fixtures',4.9,'active','2026-09-21 05:51:07','2026-09-21 05:51:07'),(13,'Test Precision Metalworks','Suresh Patel',NULL,'+91 9988776655',NULL,'Piping & Fabrication',0.0,'active','2026-10-06 05:32:36','2026-10-06 05:32:36'),(14,'Apex Industrial Piping Ltd','Vikram Rathore','sales@apexpiping.com','9876543210','Plot 42, MIDC Bhosari, Pune','Piping & Steel',5.0,'active','2026-10-06 05:40:28','2026-10-06 05:40:28'),(15,'Swastik Fasteners','Rajesh Sharma','sales@swastikfasteners.com','+91 98490 12345','Secunderabad (GSTIN: 36ABFFS2959C1Z4)','Fasteners & Hardware',5.0,'active','2026-10-07 11:01:49','2026-10-07 11:01:49'),(16,'Safety One Fire Service','Rajiv Gandhi','safetyonehyd@gmail.com','+917268878700','G Floor, H NO 5-9-262/P-59, Rajiv Gandhi Nagar, Kukatpally, Hyderabad, Telangana 500072','Fire Safety & Piping Materials',4.8,'active','2026-10-08 07:21:24','2026-10-08 07:21:24'),(17,'Alfuraat Engineering Enterprises','Ms. Allu','alfuraat.engg@gmail.com','7057255352','5-1-516 & 517, Hill Street Ranigunj, Secunderabad - 500003, Telangana','Industrial Hardware, Fasteners & Safety Equipment',4.9,'active','2026-10-08 07:40:19','2026-10-08 07:40:19'),(18,'RASEED Carpentry Services','Raseed','raseed.carpentry@gmail.com','+91 98490 12345',NULL,'Carpentry & Woodwork',5.0,'active','2026-10-09 06:12:47','2026-10-09 06:12:47'),(19,'Essa tech services','Essa Khan','quotes@essatech.com','+91 94401 56789',NULL,'Fasteners & Hardware',5.0,'active','2026-10-09 06:12:58','2026-10-09 06:12:58');

--
-- Table structure for table `work_completion_documents`
--

DROP TABLE IF EXISTS `work_completion_documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `work_completion_documents` (
  `id` int NOT NULL AUTO_INCREMENT,
  `work_completion_id` int NOT NULL,
  `document_type` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_url` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_size` int DEFAULT NULL,
  `uploaded_by_id` int DEFAULT NULL,
  `uploaded_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=45 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `work_completion_documents`
--

INSERT INTO `work_completion_documents` VALUES (20,1,'jmr','JMR-20260920-Footing.pdf','https://documents.kanakturnkey.com/jmr/JMR-20260920-Footing.pdf',2450000,17,'2026-09-24 11:25:50'),(21,1,'test_report','CubeTest-IS456-Batch44.pdf','https://documents.kanakturnkey.com/reports/CubeTest-IS456-Batch44.pdf',1120000,17,'2026-09-24 11:25:50'),(22,1,'site_photo','Site-Footing-Pour-Geo.jpg','https://documents.kanakturnkey.com/photos/Site-Footing-Pour-Geo.jpg',3840000,17,'2026-09-24 11:25:50'),(35,3,'jmr','JMR-20260920-Footing-0001.pdf','https://documents.kanakturnkey.com/jmr/JMR-20260920-Footing-0001.pdf',2450000,17,'2026-10-05 06:12:57'),(36,3,'test_report','CubeTest-IS456-Batch44-0001.pdf','https://documents.kanakturnkey.com/reports/CubeTest-IS456-Batch44-0001.pdf',1120000,17,'2026-10-05 06:12:57'),(37,3,'site_photo','Site-Footing-Pour-Geo-0001.jpg','https://documents.kanakturnkey.com/photos/Site-Footing-Pour-Geo-0001.jpg',3840000,17,'2026-10-05 06:12:57'),(41,2,'jmr','JMR-20260920-Footing-0014.pdf','https://documents.kanakturnkey.com/jmr/JMR-20260920-Footing-0014.pdf',2450000,17,'2026-10-06 05:18:55'),(42,2,'test_report','CubeTest-IS456-Batch44-0014.pdf','https://documents.kanakturnkey.com/reports/CubeTest-IS456-Batch44-0014.pdf',1120000,17,'2026-10-06 05:18:55'),(43,2,'site_photo','Site-Footing-Pour-Geo-0014.jpg','https://documents.kanakturnkey.com/photos/Site-Footing-Pour-Geo-0014.jpg',3840000,17,'2026-10-06 05:18:55'),(44,5,'jmr','JMR-14-20261023_Signed_Joint_Measurement_Record.pdf','https://documents.kanakturnkey.com/jmr/JMR-14-20261023.pdf',245800,17,'2026-10-23 07:38:44');

--
-- Table structure for table `work_completion_items`
--

DROP TABLE IF EXISTS `work_completion_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `work_completion_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `work_completion_id` int NOT NULL,
  `contract_boq_item_id` int NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `unit` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `rate` decimal(14,2) NOT NULL,
  `previous_completed_qty` decimal(14,3) NOT NULL DEFAULT '0.000',
  `current_completed_qty` decimal(14,3) NOT NULL DEFAULT '0.000',
  `cumulative_qty` decimal(14,3) NOT NULL DEFAULT '0.000',
  `current_amount` decimal(14,2) NOT NULL DEFAULT '0.00',
  `remarks` text COLLATE utf8mb4_unicode_ci,
  `sort_order` int NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `updated_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=41 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `work_completion_items`
--

INSERT INTO `work_completion_items` VALUES (27,3,43,'M25 Grade Ready Mix Concrete in Footings & Raft','cum',5500.00,0.000,100.000,100.000,550000.00,'Poured using boom pump with 100% vibrator compaction',0,'2026-10-05 06:12:57','2026-10-05 06:12:57'),(28,3,44,'High Yield Strength Deformed (HYSD) Steel Reinforcement Fe500','kg',72.00,0.000,7500.000,7500.000,540000.00,'Checked bar spacing 150mm c/c with cover blocks certified',1,'2026-10-05 06:12:57','2026-10-05 06:12:57'),(31,2,49,'M25 Grade Ready Mix Concrete in Footings & Raft','cum',5500.00,0.000,100.000,100.000,550000.00,'Poured using boom pump with 100% vibrator compaction',0,'2026-10-06 05:18:55','2026-10-06 05:18:55'),(32,2,50,'High Yield Strength Deformed (HYSD) Steel Reinforcement Fe500','kg',72.00,0.000,7500.000,7500.000,540000.00,'Checked bar spacing 150mm c/c with cover blocks certified',1,'2026-10-06 05:18:55','2026-10-06 05:18:55'),(33,4,52,'Italian Botticino Marble Flooring with Mirror Polish & Brass Inlay','sqm',4800.00,0.000,10.000,10.000,48000.00,NULL,0,'2026-10-14 07:06:40','2026-10-14 07:06:40'),(34,4,53,'Acoustic Perforated Gypsum False Ceiling with LED Cove Lighting','sqm',1350.00,0.000,20.000,20.000,27000.00,NULL,1,'2026-10-14 07:06:40','2026-10-14 07:06:40'),(35,4,54,'Natural Teak Wood Veneer Wall Panelling & Reception Desk Millwork','lot',1850000.00,0.000,2.000,2.000,3700000.00,NULL,2,'2026-10-14 07:06:40','2026-10-14 07:06:40'),(36,4,55,'Toughened 12mm Frameless Glass Automatic Sliding Entrance Doors','set',320000.00,0.000,5.000,5.000,1600000.00,NULL,3,'2026-10-14 07:06:40','2026-10-14 07:06:40'),(37,4,56,'HVAC Ducting, Linear Diffusers & Air Distribution Network','nos',8500.00,0.000,7.000,7.000,59500.00,NULL,4,'2026-10-14 07:06:40','2026-10-14 07:06:40'),(38,5,49,'M25 Grade Ready Mix Concrete in Footings & Raft','cum',5500.00,0.000,10.000,10.000,55000.00,'Certified via DPR JMR-14-20261023',0,'2026-10-23 07:38:44','2026-10-23 07:38:44'),(39,5,50,'High Yield Strength Deformed (HYSD) Steel Reinforcement Fe500','kg',72.00,0.000,14.200,14.200,1022.40,'Certified via DPR JMR-14-20261023',1,'2026-10-23 07:38:44','2026-10-23 07:38:44'),(40,5,51,'200mm Solid Concrete Block Masonry in Substructure Walls','sqm',850.00,0.000,10.000,10.000,8500.00,'Certified via DPR JMR-14-20261023',2,'2026-10-23 07:38:44','2026-10-23 07:38:44');

--
-- Table structure for table `work_completions`
--

DROP TABLE IF EXISTS `work_completions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `work_completions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `work_completion_number` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `project_id` int NOT NULL,
  `contract_id` int NOT NULL,
  `vendor_id` int NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `milestone` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `completion_date` date NOT NULL,
  `remarks` text COLLATE utf8mb4_unicode_ci,
  `status` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `submitted_at` timestamp NULL DEFAULT NULL,
  `verified_by_id` int DEFAULT NULL,
  `verified_at` timestamp NULL DEFAULT NULL,
  `correction_reason` text COLLATE utf8mb4_unicode_ci,
  `created_by_id` int DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `updated_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`),
  UNIQUE KEY `work_completions_work_completion_number_unique` (`work_completion_number`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `work_completions`
--

INSERT INTO `work_completions` VALUES (2,'WC-20260923-0014',14,4,1,'Footings & Foundation Work Completion','Milestone 1 - Foundation & Raft','2026-09-20','100 cum M25 concrete poured and 7.5 MT rebar tied. Cube strength test passed with 28.4 MPa.','verified','2026-09-20 04:30:00',17,'2026-09-21 09:00:00',NULL,17,'2026-09-30 07:43:30','2026-10-05 23:48:55'),(3,'WC-20260923-0001',1,5,1,'Footings & Foundation Work Completion','Milestone 1 - Foundation & Raft','2026-09-20','100 cum M25 concrete poured and 7.5 MT rebar tied. Cube strength test passed with 28.4 MPa.','verified','2026-09-20 04:30:00',17,'2026-09-21 09:00:00',NULL,17,'2026-10-05 06:12:57','2026-10-05 06:12:57'),(4,'WC-20261014-0003',5,6,12,'Work Completion - civil purpose','Milestone2','2026-10-14',NULL,'verified','2026-10-14 01:36:41',17,'2026-10-14 01:39:26',NULL,17,'2026-10-14 07:06:40','2026-10-14 01:39:26'),(5,'WC-20261023-0004',14,4,1,'WCC from DPR JMR JMR-14-20261023 — EPC Turnkey Construction Contract — Dr. Vikramaditya Oberoi','DPR Joint Physical Measurement (JMR-14-20261023)','2026-10-23','Certified test DPR to WCC conversion','submitted','2026-10-23 02:08:45',NULL,NULL,NULL,17,'2026-10-23 07:38:44','2026-10-23 07:38:44');

--
-- Dumping routines for database 'turnkey_db'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-30 11:21:52
