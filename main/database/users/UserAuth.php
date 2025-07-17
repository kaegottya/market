<?php
/**
 * Market Overview - User Authentication Class
 * Clean class file without AJAX handling
 */

// Include database configuration using absolute path
require_once __DIR__ . '/../config.php';

// User Authentication Class
class UserAuth {
    private $db;
    private $table = 'users';

    public function __construct() {
        $this->db = DatabaseConfig::getInstance()->getConnection();
    }

    /**
     * Register a new user
     */
    public function register($email, $username, $password) {
        try {
            // Input validation
            if (!$this->validateEmail($email)) {
                throw new Exception("Invalid email format");
            }

            if (!$this->validateUsername($username)) {
                throw new Exception("Username must be 3-20 characters long and contain only letters, numbers, and underscores");
            }

            if (!$this->validatePassword($password)) {
                throw new Exception("Password must be at least 8 characters long and contain uppercase, lowercase, and number");
            }

            // Check if user already exists
            if ($this->userExists($email, $username)) {
                throw new Exception("User with this email or username already exists");
            }

            // Hash password
            $passwordHash = password_hash($password, PASSWORD_DEFAULT);

            // Generate verification token
            $verificationToken = bin2hex(random_bytes(32));

            // Insert user
            $sql = "INSERT INTO {$this->table} (email, username, password_hash, verification_token, created_at) 
                    VALUES (?, ?, ?, ?, NOW())";

            $stmt = $this->db->prepare($sql);
            $stmt->execute([$email, $username, $passwordHash, $verificationToken]);

            $userId = $this->db->lastInsertId();

            // Log successful registration
            $this->logActivity($userId, $email, 'registration', 'User registered successfully');

            return [
                'success' => true,
                'message' => 'Registration successful',
                'user_id' => $userId,
                'verification_token' => $verificationToken
            ];

        } catch (Exception $e) {
            error_log("Registration failed: " . $e->getMessage());
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }

    /**
     * Login user
     */
    public function login($email, $password) {
        try {
            // Input validation
            if (!$this->validateEmail($email)) {
                throw new Exception("Invalid email format");
            }

            if (empty($password)) {
                throw new Exception("Password is required");
            }

            // Check if account is locked
            if ($this->isAccountLocked($email)) {
                throw new Exception("Account is temporarily locked due to multiple failed login attempts");
            }

            // Get user data
            $sql = "SELECT id, email, username, password_hash, first_name, last_name, is_active, failed_login_attempts, is_verified 
                    FROM {$this->table} WHERE email = ?";

            $stmt = $this->db->prepare($sql);
            $stmt->execute([$email]);
            $user = $stmt->fetch();

            if (!$user) {
                $this->incrementFailedLoginAttempts($email);
                throw new Exception("Invalid email or password");
            }

            // Check if account is active
            if (!$user['is_active']) {
                throw new Exception("Account is inactive. Please contact support.");
            }

            // Verify password
            if (!password_verify($password, $user['password_hash'])) {
                $this->incrementFailedLoginAttempts($email);
                throw new Exception("Invalid email or password");
            }

            // Reset failed login attempts
            $this->resetFailedLoginAttempts($email);

            // Update last login
            $this->updateLastLogin($user['id']);

            // Create session
            $this->createSession($user);

            // Create session token for database tracking
            $sessionToken = $this->createSessionToken($user['id']);

            // Log successful login
            $this->logActivity($user['id'], $email, 'login', 'User logged in successfully');

            return [
                'success' => true,
                'message' => 'Login successful',
                'user' => [
                    'id' => $user['id'],
                    'email' => $user['email'],
                    'username' => $user['username'],
                    'first_name' => $user['first_name'],
                    'last_name' => $user['last_name'],
                    'is_verified' => $user['is_verified']
                ],
                'session_token' => $sessionToken
            ];

        } catch (Exception $e) {
            error_log("Login failed: " . $e->getMessage());
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }

    /**
     * Logout user
     */
    public function logout() {
        try {
            // Log logout activity if user is logged in
            if ($this->isLoggedIn()) {
                $this->logActivity(
                    $_SESSION['user_id'],
                    $_SESSION['user_email'],
                    'logout',
                    'User logged out successfully'
                );
            }

            // Clear session
            session_unset();
            session_destroy();

            return [
                'success' => true,
                'message' => 'Logout successful'
            ];

        } catch (Exception $e) {
            error_log("Logout failed: " . $e->getMessage());
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }

    /**
     * Check if user is logged in
     */
    public function isLoggedIn() {
        return isset($_SESSION['logged_in']) &&
            $_SESSION['logged_in'] === true &&
            isset($_SESSION['session_timeout']) &&
            $_SESSION['session_timeout'] > time();
    }

    /**
     * Get current user info
     */
    public function getCurrentUser() {
        if (!$this->isLoggedIn()) {
            return null;
        }

        return [
            'id' => $_SESSION['user_id'],
            'email' => $_SESSION['user_email'],
            'username' => $_SESSION['user_username'],
            'first_name' => $_SESSION['user_first_name'],
            'last_name' => $_SESSION['user_last_name'],
            'is_verified' => $_SESSION['is_verified']
        ];
    }

    /**
     * Validate email format
     */
    private function validateEmail($email) {
        return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
    }

    /**
     * Validate username
     */
    private function validateUsername($username) {
        return preg_match('/^[a-zA-Z0-9_]{3,20}$/', $username);
    }

    /**
     * Validate password strength
     */
    private function validatePassword($password) {
        return strlen($password) >= 8 &&
            preg_match('/[A-Z]/', $password) &&
            preg_match('/[a-z]/', $password) &&
            preg_match('/[0-9]/', $password);
    }

    /**
     * Check if user exists
     */
    private function userExists($email, $username) {
        $sql = "SELECT id FROM {$this->table} WHERE email = ? OR username = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$email, $username]);
        return $stmt->fetch() !== false;
    }

    /**
     * Check if account is locked
     */
    private function isAccountLocked($email) {
        $sql = "SELECT locked_until FROM {$this->table} WHERE email = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$email]);
        $result = $stmt->fetch();

        if ($result && $result['locked_until']) {
            return strtotime($result['locked_until']) > time();
        }

        return false;
    }

    /**
     * Increment failed login attempts
     */
    private function incrementFailedLoginAttempts($email) {
        $sql = "UPDATE {$this->table} 
                SET failed_login_attempts = failed_login_attempts + 1,
                    locked_until = CASE 
                        WHEN failed_login_attempts >= 4 THEN DATE_ADD(NOW(), INTERVAL 15 MINUTE)
                        ELSE NULL 
                    END
                WHERE email = ?";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([$email]);
    }

    /**
     * Reset failed login attempts
     */
    private function resetFailedLoginAttempts($email) {
        $sql = "UPDATE {$this->table} 
                SET failed_login_attempts = 0, locked_until = NULL 
                WHERE email = ?";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([$email]);
    }

    /**
     * Update last login time
     */
    private function updateLastLogin($userId) {
        $sql = "UPDATE {$this->table} SET last_login = NOW() WHERE id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$userId]);
    }

    /**
     * Create user session
     */
    private function createSession($user) {
        session_regenerate_id(true);

        $_SESSION['user_id'] = $user['id'];
        $_SESSION['user_email'] = $user['email'];
        $_SESSION['user_username'] = $user['username'];
        $_SESSION['user_first_name'] = $user['first_name'];
        $_SESSION['user_last_name'] = $user['last_name'];
        $_SESSION['logged_in'] = true;
        $_SESSION['login_time'] = time();
        $_SESSION['is_verified'] = $user['is_verified'];
        $_SESSION['session_timeout'] = time() + (24 * 60 * 60);
    }

    /**
     * Create session token for database tracking
     */
    private function createSessionToken($userId) {
        $sessionToken = bin2hex(random_bytes(32));
        $expiresAt = date('Y-m-d H:i:s', time() + (24 * 60 * 60));

        $sql = "INSERT INTO user_sessions (user_id, session_token, ip_address, user_agent, expires_at) 
                VALUES (?, ?, ?, ?, ?)";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            $userId,
            $sessionToken,
            $this->getClientIP(),
            $_SERVER['HTTP_USER_AGENT'] ?? '',
            $expiresAt
        ]);

        return $sessionToken;
    }

    /**
     * Log user activity
     */
    private function logActivity($userId, $email, $action, $details) {
        try {
            $sql = "INSERT INTO user_activity (user_id, email, action, details, ip_address, user_agent, created_at) 
                    VALUES (?, ?, ?, ?, ?, ?, NOW())";

            $stmt = $this->db->prepare($sql);
            $stmt->execute([
                $userId,
                $email,
                $action,
                $details,
                $this->getClientIP(),
                $_SERVER['HTTP_USER_AGENT'] ?? ''
            ]);
        } catch (Exception $e) {
            // Log error but don't stop execution
            error_log("Failed to log activity: " . $e->getMessage());
        }
    }

    /**
     * Get client IP address
     */
    private function getClientIP() {
        if (!empty($_SERVER['HTTP_CLIENT_IP'])) {
            return $_SERVER['HTTP_CLIENT_IP'];
        } elseif (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
            return $_SERVER['HTTP_X_FORWARDED_FOR'];
        } else {
            return $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        }
    }
}
?>