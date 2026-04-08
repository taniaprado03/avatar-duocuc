<?php
require_once __DIR__ . '/db.php';

header('Content-Type: application/json');

try {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!isset($input['accion'])) {
        echo json_encode(['success' => false, 'message' => 'No action specified']);
        exit;
    }

    $pdo = Database::getInstance()->getConnection();
    $id = $input['id'] ?? null;
    $mesa = $input['mesa'] ?? null;

    if ($input['accion'] === 'llamar' && $id && $mesa) {
        $stmt = $pdo->prepare("UPDATE tickets SET status = 'llamando', mesa = ? WHERE id = ?");
        $success = $stmt->execute([$mesa, $id]);
        echo json_encode(['success' => $success]);
    } elseif ($input['accion'] === 'finalizar' && $id) {
        $stmt = $pdo->prepare("UPDATE tickets SET status = 'atendido' WHERE id = ?");
        $success = $stmt->execute([$id]);
        echo json_encode(['success' => $success]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Invalid parameters']);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
