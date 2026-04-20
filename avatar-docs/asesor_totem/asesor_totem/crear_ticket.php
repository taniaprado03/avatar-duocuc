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

    $rut    = $input['rut'];
    $nombre = $input['nombre'];
    $motivo = $input['motivo'] ?? 'Consulta General';

    $pdo = Database::getInstance()->getConnection();

    // ── Mapeo motivo → prefijo ──────────────────────────────
    $motivoMap = [
        'Académico'        => 'ACA',
        'Practica y Titulo'=> 'PRA',
        'Práctica y Título'=> 'PRA',
        'Inclusión'        => 'INC',
        'Financiero'       => 'FIN',
    ];
    $prefix = $motivoMap[$motivo] ?? 'ASE';

    // ── Insertar ticket ─────────────────────────────────────
    $stmt    = $pdo->prepare("INSERT INTO tickets (rut, nombre, motivo, status) VALUES (?, ?, ?, 'espera')");
    $success = $stmt->execute([$rut, $nombre, $motivo]);

    if (!$success) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Error al insertar ticket']);
        exit;
    }

    $ticketId = (int) $pdo->lastInsertId();

    // ── Número correlativo DIARIO ───────────────────────────
    // Cuenta cuántos tickets se han creado HOY (fecha local Chile UTC-4)
    // El resultado es el número de orden del ticket de hoy: 1, 2, 3...
    $hoy = date('Y-m-d');   // Usa la zona horaria del contenedor (UTC)
    $stmtCount = $pdo->prepare(
        "SELECT COUNT(*) FROM tickets WHERE DATE(created_at) = ?"
    );
    $stmtCount->execute([$hoy]);
    $correlativo = (int) $stmtCount->fetchColumn();  // Incluye el ticket recién insertado

    // Formato: ACA-001, FIN-007, etc.  (máx 3 dígitos → reinicia en 001 cada día)
    $ticketNumber = $prefix . '-' . str_pad($correlativo, 3, '0', STR_PAD_LEFT);

    echo json_encode([
        'success'      => true,
        'ticketId'     => $ticketId,
        'ticketNumber' => $ticketNumber,
        'fecha'        => $hoy,
        'correlativo'  => $correlativo,
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
