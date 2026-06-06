<?php
require_once __DIR__ . '/db.php';

header('Content-Type: application/json');

try {
    $pdo = Database::getInstance()->getConnection();

    // Get waiting tickets
    $stmtWait = $pdo->query("SELECT * FROM tickets WHERE status = 'espera' ORDER BY created_at ASC");
    $waiting = $stmtWait->fetchAll();

    // Get active calls
    $stmtCall = $pdo->query("SELECT * FROM tickets WHERE status = 'llamando'");
    $calling = $stmtCall->fetchAll();

    echo json_encode([
        'espera' => $waiting,
        'llamados' => $calling
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
