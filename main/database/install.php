<?php
/**
 * Database Installation Script
 * Run this once to set up the database
 */

require_once 'config.php';

header('Content-Type: application/json');

try {
    // Initialize database connection
    $db = DatabaseConfig::getInstance();
    $connection = $db->getConnection();

    // Read and execute setup SQL
    $sqlFile = __DIR__ . '/sql/setup.sql';

    if (!file_exists($sqlFile)) {
        throw new Exception("SQL setup file not found");
    }

    $sql = file_get_contents($sqlFile);

    // Split SQL into individual statements
    $statements = array_filter(
        array_map('trim', explode(';', $sql)),
        'strlen'
    );

    $results = [];

    foreach ($statements as $statement) {
        if (empty($statement) || strpos($statement, '--') === 0) {
            continue;
        }

        try {
            $connection->exec($statement);
            $results[] = "✓ Executed: " . substr($statement, 0, 50) . "...";
        } catch (PDOException $e) {
            $results[] = "✗ Failed: " . substr($statement, 0, 50) . "... - " . $e->getMessage();
        }
    }

    // Generate password hashes for default users
    $adminHash = password_hash('Admin123!', PASSWORD_DEFAULT);
    $demoHash = password_hash('Demo123!', PASSWORD_DEFAULT);

    // Update password hashes
    $stmt = $connection->prepare("UPDATE users SET password_hash = ? WHERE username = 'admin'");
    $stmt->execute([$adminHash]);

    $stmt = $connection->prepare("UPDATE users SET password_hash = ? WHERE username = 'demo'");
    $stmt->execute([$demoHash]);

    echo json_encode([
        'success' => true,
        'message' => 'Database installation completed successfully',
        'results' => $results,
        'default_users' => [
            'admin' => 'admin@marketoverview.com / Admin123!',
            'demo' => 'demo@example.com / Demo123!'
        ]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database installation failed: ' . $e->getMessage()
    ]);
}
?>