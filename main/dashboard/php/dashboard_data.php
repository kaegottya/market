<?php
/**
 * Dashboard Data Handler
 * Handles all dashboard-related data requests
 */

// Start session only if not already started
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// CORS headers for cross-origin requests (same as credentials.php)
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
error_log("Dashboard Data Request - Method: " . $_SERVER['REQUEST_METHOD']);
error_log("Dashboard Data Request - POST data: " . print_r($_POST, true));
error_log("Dashboard Data Request - Session: " . print_r($_SESSION, true));

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

// Include database configuration using absolute path
require_once __DIR__ . '/../../database/config.php';

// Include user authentication class without the AJAX handling part
require_once __DIR__ . '/../../database/users/UserAuth.php';

// Check if user is logged in
$userAuth = new UserAuth();
if (!$userAuth->isLoggedIn()) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Not authenticated']);
    exit;
}

// Handle different actions
$action = $_POST['action'] ?? '';

try {
    $db = DatabaseConfig::getInstance()->getConnection();
    $userId = $_SESSION['user_id'];

    switch ($action) {
        case 'get_dashboard_data':
            // Get portfolio summary - using correct column names from setup.sql
            $portfolioStmt = $db->prepare("SELECT COUNT(*) as positions, COALESCE(SUM(shares * avg_price), 0) as total_value FROM portfolio WHERE user_id = ?");
            $portfolioStmt->execute([$userId]);
            $portfolioData = $portfolioStmt->fetch();

            // Get watchlist count
            $watchlistStmt = $db->prepare("SELECT COUNT(*) as count FROM watchlist WHERE user_id = ?");
            $watchlistStmt->execute([$userId]);
            $watchlistData = $watchlistStmt->fetch();

            echo json_encode([
                'success' => true,
                'stats' => [
                    'portfolio_value' => $portfolioData['total_value'] ?? 0,
                    'portfolio_change' => 0,
                    'day_pl' => 0,
                    'day_pl_percent' => 0,
                    'active_positions' => $portfolioData['positions'] ?? 0,
                    'watchlist_count' => $watchlistData['count'] ?? 0
                ],
                'movers' => [
                    'gainers' => [
                        ['symbol' => 'AAPL', 'change' => 5.2],
                        ['symbol' => 'GOOGL', 'change' => 3.8],
                        ['symbol' => 'MSFT', 'change' => 2.1]
                    ],
                    'losers' => [
                        ['symbol' => 'TSLA', 'change' => -2.5],
                        ['symbol' => 'NFLX', 'change' => -1.8],
                        ['symbol' => 'AMZN', 'change' => -1.2]
                    ],
                    'active' => [
                        ['symbol' => 'SPY', 'change' => 0.8],
                        ['symbol' => 'QQQ', 'change' => 1.2],
                        ['symbol' => 'IWM', 'change' => -0.5]
                    ]
                ],
                'activity' => [
                    [
                        'description' => 'Dashboard loaded successfully',
                        'timestamp' => date('Y-m-d H:i:s'),
                        'icon' => 'fa-chart-line',
                        'color' => 'text-info'
                    ]
                ],
                'market_status' => [
                    'status' => 'open',
                    'next_close' => '16:00 EST'
                ]
            ]);
            break;

        case 'get_portfolio':
            $stmt = $db->prepare("SELECT * FROM portfolio WHERE user_id = ? ORDER BY purchase_date DESC");
            $stmt->execute([$userId]);
            $portfolio = $stmt->fetchAll();

            echo json_encode([
                'success' => true,
                'portfolio' => $portfolio
            ]);
            break;

        case 'get_watchlist':
            $stmt = $db->prepare("SELECT * FROM watchlist WHERE user_id = ? ORDER BY added_at DESC");
            $stmt->execute([$userId]);
            $watchlist = $stmt->fetchAll();

            echo json_encode([
                'success' => true,
                'watchlist' => $watchlist
            ]);
            break;

        case 'get_news':
            echo json_encode([
                'success' => true,
                'news' => [
                    [
                        'title' => 'Market Update: Strong Trading Session',
                        'summary' => 'Markets showed positive momentum with technology stocks leading gains...',
                        'source' => 'Market News',
                        'published_at' => date('Y-m-d H:i:s', strtotime('-1 hour')),
                        'url' => '#',
                        'image' => null
                    ]
                ]
            ]);
            break;

        case 'get_alerts':
            echo json_encode([
                'success' => true,
                'alerts' => []
            ]);
            break;

        case 'add_to_watchlist':
            $symbol = $_POST['symbol'] ?? '';
            if (empty($symbol)) {
                throw new Exception('Symbol is required');
            }

            // Check if already in watchlist
            $checkStmt = $db->prepare("SELECT id FROM watchlist WHERE user_id = ? AND symbol = ?");
            $checkStmt->execute([$userId, $symbol]);

            if ($checkStmt->fetch()) {
                throw new Exception('Symbol already in watchlist');
            }

            // Add to watchlist
            $insertStmt = $db->prepare("INSERT INTO watchlist (user_id, symbol, added_at) VALUES (?, ?, NOW())");
            $insertStmt->execute([$userId, $symbol]);

            echo json_encode([
                'success' => true,
                'message' => 'Added to watchlist successfully'
            ]);
            break;

        case 'remove_from_watchlist':
            $symbol = $_POST['symbol'] ?? '';
            if (empty($symbol)) {
                throw new Exception('Symbol is required');
            }

            $deleteStmt = $db->prepare("DELETE FROM watchlist WHERE user_id = ? AND symbol = ?");
            $deleteStmt->execute([$userId, $symbol]);

            echo json_encode([
                'success' => true,
                'message' => 'Removed from watchlist successfully'
            ]);
            break;

        case 'add_to_portfolio':
            $symbol = $_POST['symbol'] ?? '';
            $shares = $_POST['shares'] ?? 0;
            $avgPrice = $_POST['avg_price'] ?? 0;
            $companyName = $_POST['company_name'] ?? '';
            $notes = $_POST['notes'] ?? '';

            if (empty($symbol) || $shares <= 0 || $avgPrice <= 0) {
                throw new Exception('Symbol, shares, and average price are required');
            }

            // Add to portfolio
            $insertStmt = $db->prepare("INSERT INTO portfolio (user_id, symbol, company_name, shares, avg_price, notes, purchase_date) VALUES (?, ?, ?, ?, ?, ?, NOW())");
            $insertStmt->execute([$userId, $symbol, $companyName, $shares, $avgPrice, $notes]);

            echo json_encode([
                'success' => true,
                'message' => 'Added to portfolio successfully'
            ]);
            break;

        case 'remove_from_portfolio':
            $id = $_POST['id'] ?? '';
            if (empty($id)) {
                throw new Exception('Portfolio ID is required');
            }

            $deleteStmt = $db->prepare("DELETE FROM portfolio WHERE id = ? AND user_id = ?");
            $deleteStmt->execute([$id, $userId]);

            echo json_encode([
                'success' => true,
                'message' => 'Removed from portfolio successfully'
            ]);
            break;

        default:
            throw new Exception('Invalid action');
    }

} catch (Exception $e) {
    error_log("Dashboard Data Error: " . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>