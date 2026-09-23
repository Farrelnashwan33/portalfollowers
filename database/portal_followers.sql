-- ==========================================================
-- PortalFollowers Full Database Schema for MySQL (MAMP)
-- Host: localhost | Port: 8889 | Database: portal_followers
-- ==========================================================

CREATE DATABASE IF NOT EXISTS `portal_followers`
    DEFAULT CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE `portal_followers`;

SET FOREIGN_KEY_CHECKS = 0;

-- Drop existing tables to ensure clean schema update
DROP TABLE IF EXISTS `webhook_events`;
DROP TABLE IF EXISTS `admin_logs`;
DROP TABLE IF EXISTS `order_status_history`;
DROP TABLE IF EXISTS `fulfillment_tasks`;
DROP TABLE IF EXISTS `payments`;
DROP TABLE IF EXISTS `orders`;
DROP TABLE IF EXISTS `packages`;
DROP TABLE IF EXISTS `profiles`;
DROP TABLE IF EXISTS `users`;

-- 1. Tabel Users (Customer & Admin Authentication)
CREATE TABLE `users` (
    `id` VARCHAR(36) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `full_name` VARCHAR(255) NULL,
    `role` ENUM('CUSTOMER', 'ADMIN') NOT NULL DEFAULT 'CUSTOMER',
    `reset_token` VARCHAR(255) NULL,
    `reset_token_expiry` DATETIME NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `idx_users_email` (`email`),
    INDEX `idx_users_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Tabel Profiles (1-to-1 dengan Users)
CREATE TABLE `profiles` (
    `id` VARCHAR(36) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `full_name` VARCHAR(255) NULL,
    `role` ENUM('CUSTOMER', 'ADMIN') NOT NULL DEFAULT 'CUSTOMER',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_profiles_user` FOREIGN KEY (`id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Tabel Packages (Layanan Followers & Promosi)
CREATE TABLE `packages` (
    `id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `category` ENUM('INDONESIA', 'INTERNATIONAL', 'PROMOTION_PAID', 'PROMOTION_FREE') NOT NULL DEFAULT 'INDONESIA',
    `followers` INT NOT NULL,
    `price` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `description` TEXT NULL,
    `estimated_processing_minutes` INT NOT NULL DEFAULT 5,
    `estimated_time` VARCHAR(100) NOT NULL DEFAULT '1–5 Menit',
    `badge` VARCHAR(100) NULL,
    `provider_service_id` VARCHAR(50) NULL,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_packages_category` (`category`),
    INDEX `idx_packages_is_active` (`is_active`),
    INDEX `idx_packages_followers` (`followers`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Tabel Orders (Data Pesanan & Transaksi)
CREATE TABLE `orders` (
    `id` VARCHAR(36) NOT NULL,
    `order_code` VARCHAR(50) NOT NULL,
    `user_id` VARCHAR(36) NULL,
    `package_id` VARCHAR(36) NOT NULL,
    `customer_name` VARCHAR(255) NOT NULL,
    `customer_email` VARCHAR(255) NOT NULL,
    `instagram_username` VARCHAR(100) NOT NULL,
    `instagram_url` VARCHAR(255) NULL,
    `followers_amount` INT NOT NULL,
    `price` DECIMAL(12, 2) NOT NULL,
    `payment_status` ENUM('PENDING_PAYMENT', 'PAID', 'FAILED', 'EXPIRED', 'REFUNDED') NOT NULL DEFAULT 'PENDING_PAYMENT',
    `service_status` ENUM('PENDING_PAYMENT', 'PAID', 'WAITING_FOR_FULFILLMENT', 'PROCESSING', 'PARTIALLY_COMPLETED', 'COMPLETED', 'CANCELLED', 'FAILED', 'ADMIN_APPROVED') NOT NULL DEFAULT 'PENDING_PAYMENT',
    `payment_method` VARCHAR(50) NOT NULL DEFAULT 'xendit',
    `xendit_invoice_id` VARCHAR(255) NULL,
    `xendit_payment_url` TEXT NULL,
    `is_admin_order` TINYINT(1) NOT NULL DEFAULT 0,
    `payment_required` TINYINT(1) NOT NULL DEFAULT 1,
    `admin_reason` TEXT NULL,
    `customer_note` TEXT NULL,
    `admin_note` TEXT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `idx_orders_order_code` (`order_code`),
    INDEX `idx_orders_user_id` (`user_id`),
    INDEX `idx_orders_package_id` (`package_id`),
    INDEX `idx_orders_payment_status` (`payment_status`),
    INDEX `idx_orders_service_status` (`service_status`),
    INDEX `idx_orders_is_admin_order` (`is_admin_order`),
    INDEX `idx_orders_created_at` (`created_at`),
    CONSTRAINT `fk_orders_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
    CONSTRAINT `fk_orders_package` FOREIGN KEY (`package_id`) REFERENCES `packages` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Tabel Payments (Log Transaksi Pembayaran Xendit)
CREATE TABLE `payments` (
    `id` VARCHAR(36) NOT NULL,
    `order_id` VARCHAR(36) NOT NULL,
    `xendit_id` VARCHAR(255) NULL,
    `external_id` VARCHAR(255) NOT NULL,
    `payment_method` VARCHAR(50) NULL,
    `channel_code` VARCHAR(50) NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `status` VARCHAR(50) NOT NULL,
    `paid_at` DATETIME NULL,
    `payload_json` LONGTEXT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_payments_order_id` (`order_id`),
    INDEX `idx_payments_xendit_id` (`xendit_id`),
    INDEX `idx_payments_external_id` (`external_id`),
    CONSTRAINT `fk_payments_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Tabel Fulfillment Tasks (Pengelolaan Tugas Pengiriman Layanan)
CREATE TABLE `fulfillment_tasks` (
    `id` VARCHAR(36) NOT NULL,
    `order_id` VARCHAR(36) NOT NULL,
    `provider` VARCHAR(100) NOT NULL DEFAULT 'INTERNAL',
    `provider_order_id` VARCHAR(100) NULL,
    `service_type` VARCHAR(100) NOT NULL DEFAULT 'INSTAGRAM_FOLLOWERS',
    `requested_quantity` INT NOT NULL,
    `delivered_quantity` INT NOT NULL DEFAULT 0,
    `start_count` INT NOT NULL DEFAULT 0,
    `remains` INT NOT NULL DEFAULT 0,
    `provider_status` VARCHAR(50) NULL,
    `status` ENUM('WAITING_FOR_FULFILLMENT', 'PROCESSING', 'PARTIALLY_COMPLETED', 'COMPLETED', 'FAILED') NOT NULL DEFAULT 'WAITING_FOR_FULFILLMENT',
    `started_at` DATETIME NULL,
    `completed_at` DATETIME NULL,
    `error_message` TEXT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_fulfillment_order_id` (`order_id`),
    INDEX `idx_fulfillment_status` (`status`),
    INDEX `idx_fulfillment_provider_order_id` (`provider_order_id`),
    CONSTRAINT `fk_fulfillment_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Tabel Order Status History (Log Kronologis Riwayat Status Pesanan)
CREATE TABLE `order_status_history` (
    `id` VARCHAR(36) NOT NULL,
    `order_id` VARCHAR(36) NOT NULL,
    `status` VARCHAR(50) NOT NULL,
    `note` TEXT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_history_order_id` (`order_id`),
    CONSTRAINT `fk_history_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Tabel Admin Logs (Audit Aktivitas Admin)
CREATE TABLE `admin_logs` (
    `id` VARCHAR(36) NOT NULL,
    `admin_id` VARCHAR(36) NOT NULL,
    `admin_email` VARCHAR(255) NOT NULL,
    `action` VARCHAR(100) NOT NULL,
    `target_id` VARCHAR(255) NULL,
    `details` TEXT NULL,
    `ip_address` VARCHAR(50) NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_logs_admin_id` (`admin_id`),
    INDEX `idx_logs_action` (`action`),
    INDEX `idx_logs_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Tabel Webhook Events (Pencegahan Event Ganda / Idempotensi Xendit)
CREATE TABLE `webhook_events` (
    `id` VARCHAR(36) NOT NULL,
    `event_id` VARCHAR(255) NOT NULL,
    `event_type` VARCHAR(100) NOT NULL,
    `payload_json` LONGTEXT NOT NULL,
    `status` ENUM('PROCESSED', 'FAILED', 'IGNORED') NOT NULL DEFAULT 'PROCESSED',
    `processed_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `idx_webhook_event_id` (`event_id`),
    INDEX `idx_webhook_type` (`event_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ==========================================================
-- SEED DATA
-- ==========================================================

-- 1. Default Admin Account (password: admin123)
-- bcrypt hash for 'admin123': $2a$10$WpZJ0Qd.tC20K4qYh8m9O.pTqHkJ6I0yD9K2Y5M9O7W.aW9a9wG1a
INSERT INTO users (id, email, password_hash, full_name, role)
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'admin@portalfollowers.com', '$2b$10$AK6AMG514DiVwsaQVFXRw.gBzof5UApLVWycKa4IR9sOhpsLHkE4e', 'Super Administrator', 'ADMIN')
ON DUPLICATE KEY UPDATE email=email;

INSERT INTO `profiles` (`id`, `email`, `full_name`, `role`, `created_at`, `updated_at`)
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'admin@portalfollowers.com', 'Super Administrator', 'ADMIN', NOW(), NOW());

-- 2. Default Seed Packages (4 Kategori)
INSERT INTO `packages` (`id`, `name`, `category`, `followers`, `price`, `description`, `estimated_processing_minutes`, `estimated_time`, `badge`, `is_active`, `created_at`, `updated_at`)
VALUES
    -- Kategori A: Followers Indonesia
    ('10000001-0000-0000-0000-000000000001', 'Starter Indo 100', 'INDONESIA', 100, 25000.00, 'Followers akun aktif Indonesia berkualitas tinggi untuk social proof awal.', 5, '1–5 Menit', 'Indo Pemula', 1, NOW(), NOW()),
    ('10000001-0000-0000-0000-000000000002', 'Creator Indo 500', 'INDONESIA', 500, 75000.00, 'Populer untuk content creator & olshop Indonesia.', 10, '5–15 Menit', 'Best Indo', 1, NOW(), NOW()),
    ('10000001-0000-0000-0000-000000000003', 'Influencer Indo 1.000', 'INDONESIA', 1000, 135000.00, 'Meningkatkan algoritma & konversi target audience lokal Indonesia.', 15, '15–30 Menit', 'Paling Populer', 1, NOW(), NOW()),
    ('10000001-0000-0000-0000-000000000004', 'Sultan Indo 5.000', 'INDONESIA', 5000, 590000.00, 'Pertumbuhan masif akun brand authority skala nasional.', 30, '1–2 Jam', 'Sultan', 1, NOW(), NOW()),

    -- Kategori B: Followers Internasional
    ('20000002-0000-0000-0000-000000000001', 'Global Boost 100', 'INTERNATIONAL', 100, 15000.00, 'Followers global worldwide instan & ekonomis.', 3, '1–3 Menit', 'Hemat', 1, NOW(), NOW()),
    ('20000002-0000-0000-0000-000000000002', 'Global Growth 500', 'INTERNATIONAL', 500, 45000.00, 'Pilihan tepat menaikkan angka profil global secara cepat.', 5, '1–5 Menit', 'Populer Global', 1, NOW(), NOW()),
    ('20000002-0000-0000-0000-000000000003', 'Global Influencer 1.000', 'INTERNATIONAL', 1000, 79000.00, 'Paket global paling diminati dengan pengiriman instan stabil.', 10, '5–15 Menit', 'Best Value', 1, NOW(), NOW()),
    ('20000002-0000-0000-0000-000000000004', 'Global Celebrity 5.000', 'INTERNATIONAL', 5000, 320000.00, 'Pertumbuhan followers global masif dan natural.', 20, '15–30 Menit', 'Eksklusif', 1, NOW(), NOW()),

    -- Kategori C: Layanan Promosi Berbayar
    ('30000003-0000-0000-0000-000000000001', 'Promo Launching 250', 'PROMOTION_PAID', 250, 29000.00, 'Paket promosi khusus member baru untuk akselerasi profil.', 5, '1–5 Menit', 'Diskon 50%', 1, NOW(), NOW()),
    ('30000003-0000-0000-0000-000000000002', 'Promo Flash Deal 2.500', 'PROMOTION_PAID', 2500, 165000.00, 'Promo flash deal terbatas dengan bonus engagement boost.', 15, '10–20 Menit', 'Flash Deal', 1, NOW(), NOW()),

    -- Kategori D: Layanan Promosi Gratis Khusus Admin
    ('40000004-0000-0000-0000-000000000001', 'Admin Free Test 50', 'PROMOTION_FREE', 50, 0.00, 'Uji coba sistem internal dan audit layanan tanpa biaya.', 1, '1 Menit', 'Free Test', 1, NOW(), NOW()),
    ('40000004-0000-0000-0000-000000000002', 'Admin Promo Giveaway 500', 'PROMOTION_FREE', 500, 0.00, 'Alokasi promosi giveaway resmi dan endorsement khusus admin.', 5, '1–5 Menit', 'Admin Free', 1, NOW(), NOW());
