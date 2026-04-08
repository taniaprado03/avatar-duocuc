<?php
require_once __DIR__ . '/db.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

try {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!isset($input['rut']) || !isset($input['nombre'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'RUT y nombre son requeridos']);
        exit;
    }

    $rut = $input['rut'];
    $nombre = $input['nombre'];
    $motivo = $input['motivo'] ?? 'Consulta General';

    $pdo = Database::getInstance()->getConnection();

    // Insertar ticket en estado 'espera'
    $stmt = $pdo->prepare("INSERT INTO tickets (rut, nombre, motivo, status) VALUES (?, ?, ?, 'espera')");
    $success = $stmt->execute([$rut, $nombre, $motivo]);

    if ($success) {
        $ticketId = $pdo->lastInsertId();

        // Generar número de ticket legible
        $prefix = 'ASE';
        $motivoMap = [
            'Académico' => 'ACA',
            'Práctica y Título' => 'PRA',
            'Inclusión' => 'INC',
            'Financiero' => 'FIN'
        ];
        if (isset($motivoMap[$motivo])) {
            $prefix = $motivoMap[$motivo];
        }
        $ticketNumber = $prefix . '-' . str_pad($ticketId, 3, '0', STR_PAD_LEFT);

        echo json_encode([
            'success' => true,
            'ticketId' => (int)$ticketId,
            'ticketNumber' => $ticketNumber
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Error al crear ticket']);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
