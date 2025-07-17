<?php
/**
 * Market Overview - User Credentials Handler
 * Handles login and registration requests via AJAX
 */

// Start session only if not already started
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Include database configuration and user auth class
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/UserAuth.php';

// CORS headers for cross-origin requests
header('Access-Control-Allow-Origin: http://localhost:63342');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Max-Age: 86400'); // 24 hours

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Set JSON response headers
header('Content-Type: application/json');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');

// Debug logging
error_log("Credentials Request - Method: " . $_SERVER['REQUEST_METHOD']);
error_log("Credentials Request - POST data: " . print_r($_POST, true));
error_log("Credentials Request - Session: " . print_r($_SESSION, true));

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

// Get the action
$action = $_POST['action'] ?? '';

// Initialize UserAuth
$userAuth = new UserAuth();

try {
    switch ($action) {
        case 'login':
            $email = $_POST['email'] ?? '';
            $password = $_POST['password'] ?? '';

            if (empty($email) || empty($password)) {
                throw new Exception('Email and password are required');
            }

            $result = $userAuth->login($email, $password);
            echo json_encode($result);
            break;

        case 'register':
            $email = $_POST['email'] ?? '';
            $username = $_POST['username'] ?? '';
            $password = $_POST['password'] ?? '';

            if (empty($email) || empty($username) || empty($password)) {
                throw new Exception('All fields are required');
            }

            $result = $userAuth->register($email, $username, $password);
            echo json_encode($result);
            break;

        case 'logout':
            $result = $userAuth->logout();
            echo json_encode($result);
            break;

        case 'check_auth':
            $currentUser = $userAuth->getCurrentUser();
            echo json_encode([
                'success' => true,
                'logged_in' => $currentUser !== null,
                'user' => $currentUser
            ]);
            break;

        case 'get_user':
            // This is what the dashboard is looking for
            if (!$userAuth->isLoggedIn()) {
                throw new Exception('User not logged in');
            }

            $currentUser = $userAuth->getCurrentUser();
            echo json_encode([
                'success' => true,
                'user' => $currentUser
            ]);
            break;

        default:
            throw new Exception('Invalid action');
    }

} catch (Exception $e) {
    error_log("Credentials Error: " . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>