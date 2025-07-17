<?php
/**
 * Market Overview - Database Configuration
 * Centralized database configuration and connection management
 */

// Database Configuration Class
class DatabaseConfig {
    // Database Connection Settings
    private const DB_HOST = 'localhost';
    private const DB_NAME = 'market_overview';
    private const DB_USER = 'root';  // Change this to your MySQL username
    private const DB_PASS = 'admin';      // Change this to your MySQL password
    private const DB_PORT = 3306;
    private const DB_CHARSET = 'utf8mb4';

    private static $instance = null;
    private $connection = null;

    private function __construct() {
        $this->connect();
    }

    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function connect() {
        try {
            $dsn = "mysql:host=" . self::DB_HOST .
                ";port=" . self::DB_PORT .
                ";dbname=" . self::DB_NAME .
                ";charset=" . self::DB_CHARSET;

            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::ATTR_PERSISTENT => false, // Changed to false for better debugging
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4"
            ];

            $this->connection = new PDO($dsn, self::DB_USER, self::DB_PASS, $options);

            // Log successful connection
            error_log("Database connected successfully to " . self::DB_NAME);

        } catch (PDOException $e) {
            // Log the error
            error_log("Database connection failed: " . $e->getMessage());

            // Try to create database if it doesn't exist
            $this->createDatabase();
        }
    }

    private function createDatabase() {
        try {
            $dsn = "mysql:host=" . self::DB_HOST . ";port=" . self::DB_PORT . ";charset=" . self::DB_CHARSET;
            $tempConnection = new PDO($dsn, self::DB_USER, self::DB_PASS, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
            ]);

            // Create database
            $tempConnection->exec("CREATE DATABASE IF NOT EXISTS " . self::DB_NAME . " CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");

            // Now connect to the new database
            $dsn = "mysql:host=" . self::DB_HOST . ";port=" . self::DB_PORT . ";dbname=" . self::DB_NAME . ";charset=" . self::DB_CHARSET;
            $this->connection = new PDO($dsn, self::DB_USER, self::DB_PASS, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false
            ]);

            error_log("Database '" . self::DB_NAME . "' created successfully");

        } catch (PDOException $e) {
            error_log("Failed to create database: " . $e->getMessage());
            throw new Exception("Database setup failed: " . $e->getMessage());
        }
    }

    public function getConnection() {
        return $this->connection;
    }

    public function testConnection() {
        try {
            $stmt = $this->connection->query("SELECT 1");
            return $stmt !== false;
        } catch (PDOException $e) {
            error_log("Connection test failed: " . $e->getMessage());
            return false;
        }
    }

    public function getDatabaseInfo() {
        try {
            $stmt = $this->connection->query("SELECT DATABASE() as db_name, VERSION() as version");
            return $stmt->fetch();
        } catch (PDOException $e) {
            error_log("Failed to get database info: " . $e->getMessage());
            return null;
        }
    }
}

// Test connection when file is loaded
if (basename($_SERVER['PHP_SELF']) === 'config.php') {
    // This runs only when config.php is accessed directly
    header('Content-Type: application/json');

    try {
        $db = DatabaseConfig::getInstance();
        $info = $db->getDatabaseInfo();

        echo json_encode([
            'success' => true,
            'message' => 'Database connection successful',
            'database' => $info['db_name'],
            'version' => $info['version']
        ]);

    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Database connection failed: ' . $e->getMessage()
        ]);
    }
}
?>