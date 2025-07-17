-- Market Overview Database Setup
-- Run this script to create all necessary tables

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS market_overview CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE market_overview;

-- Users table
CREATE TABLE IF NOT EXISTS users (
                                     id INT AUTO_INCREMENT PRIMARY KEY,
                                     email VARCHAR(255) NOT NULL UNIQUE,
                                     username VARCHAR(50) NOT NULL UNIQUE,
                                     password_hash VARCHAR(255) NOT NULL,
                                     first_name VARCHAR(100) NULL,
                                     last_name VARCHAR(100) NULL,
                                     profile_picture VARCHAR(255) NULL,
                                     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                                     is_active BOOLEAN DEFAULT TRUE,
                                     is_verified BOOLEAN DEFAULT FALSE,
                                     last_login TIMESTAMP NULL,
                                     failed_login_attempts INT DEFAULT 0,
                                     locked_until TIMESTAMP NULL,
                                     verification_token VARCHAR(100) NULL,
                                     reset_token VARCHAR(100) NULL,
                                     reset_token_expires TIMESTAMP NULL,
                                     preferences JSON NULL,
                                     timezone VARCHAR(50) DEFAULT 'UTC',

                                     INDEX idx_email (email),
                                     INDEX idx_username (username),
                                     INDEX idx_verification_token (verification_token),
                                     INDEX idx_reset_token (reset_token),
                                     INDEX idx_active (is_active),
                                     INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
                                             id INT AUTO_INCREMENT PRIMARY KEY,
                                             user_id INT NOT NULL,
                                             session_token VARCHAR(255) NOT NULL UNIQUE,
                                             ip_address VARCHAR(45) NOT NULL,
                                             user_agent TEXT,
                                             created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                             expires_at TIMESTAMP NOT NULL,
                                             is_active BOOLEAN DEFAULT TRUE,

                                             FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                                             INDEX idx_user_id (user_id),
                                             INDEX idx_session_token (session_token),
                                             INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User activity log
CREATE TABLE IF NOT EXISTS user_activity (
                                             id INT AUTO_INCREMENT PRIMARY KEY,
                                             user_id INT NULL,
                                             email VARCHAR(255) NULL,
                                             action VARCHAR(100) NOT NULL,
                                             details TEXT NULL,
                                             ip_address VARCHAR(45) NULL,
                                             user_agent TEXT NULL,
                                             created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

                                             FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
                                             INDEX idx_user_id (user_id),
                                             INDEX idx_action (action),
                                             INDEX idx_created_at (created_at),
                                             INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Watchlist table (for dashboard)
CREATE TABLE IF NOT EXISTS watchlist (
                                         id INT AUTO_INCREMENT PRIMARY KEY,
                                         user_id INT NOT NULL,
                                         symbol VARCHAR(20) NOT NULL,
                                         company_name VARCHAR(200) NULL,
                                         added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                         notes TEXT NULL,
                                         alert_price DECIMAL(10, 2) NULL,
                                         alert_enabled BOOLEAN DEFAULT FALSE,

                                         FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                                         UNIQUE KEY unique_user_symbol (user_id, symbol),
                                         INDEX idx_user_id (user_id),
                                         INDEX idx_symbol (symbol),
                                         INDEX idx_added_at (added_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Portfolio table (for dashboard)
CREATE TABLE IF NOT EXISTS portfolio (
                                         id INT AUTO_INCREMENT PRIMARY KEY,
                                         user_id INT NOT NULL,
                                         symbol VARCHAR(20) NOT NULL,
                                         company_name VARCHAR(200) NULL,
                                         shares DECIMAL(15, 6) NOT NULL,
                                         avg_price DECIMAL(10, 2) NOT NULL,
                                         purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                         notes TEXT NULL,

                                         FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                                         INDEX idx_user_id (user_id),
                                         INDEX idx_symbol (symbol),
                                         INDEX idx_purchase_date (purchase_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default admin user (password: Admin123!)
INSERT INTO users (email, username, password_hash, first_name, last_name, is_active, is_verified)
VALUES (
           'admin@marketoverview.com',
           'admin',
           '$2y$10$YourHashedPasswordHere',  -- You'll need to generate this
           'Admin',
           'User',
           TRUE,
           TRUE
       ) ON DUPLICATE KEY UPDATE email=email;

-- Insert demo user (password: Demo123!)
INSERT INTO users (email, username, password_hash, first_name, last_name, is_active, is_verified)
VALUES (
           'demo@example.com',
           'demo',
           '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',  -- Demo123!
           'Demo',
           'User',
           TRUE,
           TRUE
       ) ON DUPLICATE KEY UPDATE email=email;