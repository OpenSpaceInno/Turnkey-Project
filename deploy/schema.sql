
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
) ENGINE=InnoDB AUTO_INCREMENT=60 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
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
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

-- ─── Pre-seeded Essential Demo Accounts (Default Password: password123) ───
INSERT INTO `users` (`id`, `organization_id`, `name`, `email`, `phone`, `password_hash`, `roles`, `active_role`, `two_factor_enabled`, `created_at`, `updated_at`) VALUES
(1, 1, 'Ananya Rao', 'ananya.rao@kanak.in', '9876543210', '$2b$10$30Dv.yPPXZb0YZRnngseEubrqOuKeNB4tUVDQN49txc6OsJT1oCj.', '["admin", "project_manager", "engineer", "accountant", "procurement_officer", "viewer"]', 'admin', 0, NOW(), NOW()),
(2, 1, 'Harinarayana', 'Hari.mailapalli12@gmail.com', '9876543211', '$2b$10$30Dv.yPPXZb0YZRnngseEubrqOuKeNB4tUVDQN49txc6OsJT1oCj.', '["admin", "project_manager", "engineer", "accountant", "procurement_officer", "viewer"]', 'project_manager', 0, NOW(), NOW()),
(3, 1, 'Rohan Mehta', 'rohan.mehta@kanak.in', '9876543212', '$2b$10$30Dv.yPPXZb0YZRnngseEubrqOuKeNB4tUVDQN49txc6OsJT1oCj.', '["project_manager", "viewer"]', 'project_manager', 0, NOW(), NOW()),
(4, 1, 'Priya Iyer', 'priya.iyer@kanak.in', '9876543213', '$2b$10$30Dv.yPPXZb0YZRnngseEubrqOuKeNB4tUVDQN49txc6OsJT1oCj.', '["engineer", "viewer"]', 'engineer', 0, NOW(), NOW()),
(5, 1, 'Vikram Shah', 'vikram.shah@kanak.in', '9876543214', '$2b$10$30Dv.yPPXZb0YZRnngseEubrqOuKeNB4tUVDQN49txc6OsJT1oCj.', '["accountant", "viewer"]', 'accountant', 0, NOW(), NOW()),
(6, 1, 'Neha Kapoor', 'neha.kapoor@kanak.in', '9876543215', '$2b$10$30Dv.yPPXZb0YZRnngseEubrqOuKeNB4tUVDQN49txc6OsJT1oCj.', '["procurement_officer", "viewer"]', 'procurement_officer', 0, NOW(), NOW()),
(7, 1, 'Arjun Singh', 'arjun.singh@kanak.in', '9876543216', '$2b$10$30Dv.yPPXZb0YZRnngseEubrqOuKeNB4tUVDQN49txc6OsJT1oCj.', '["viewer"]', 'viewer', 0, NOW(), NOW()),
(8, 1, 'Baipalli Venkateswara Rao', 'venkibaipalli@gmail.com', '9876543217', '$2b$10$30Dv.yPPXZb0YZRnngseEubrqOuKeNB4tUVDQN49txc6OsJT1oCj.', '["admin", "project_manager", "engineer", "accountant", "procurement_officer", "viewer"]', 'admin', 0, NOW(), NOW()),
(9, 1, 'Ganesh', 'ganesh@gmail.com', '9876543220', '$2b$10$rVDVEE1xTpUDKJzzDxgHyuCYS0jBT38ZZf9SSGNoaxR3Sff4i3KXq', '["admin", "project_manager", "engineer", "accountant", "procurement_officer", "viewer"]', 'admin', 0, NOW(), NOW())
ON DUPLICATE KEY UPDATE `password_hash` = VALUES(`password_hash`), `phone` = VALUES(`phone`), `roles` = VALUES(`roles`), `active_role` = VALUES(`active_role`), `two_factor_enabled` = 0;

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
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

