<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

try {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!isset($input['to_email']) || !isset($input['ticket'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Email y ticket son requeridos']);
        exit;
    }

    $toEmail = $input['to_email'];
    $toName = $input['to_name'] ?? 'Alumno';
    $ticket = $input['ticket'];
    $area = $input['area'] ?? 'General';

    $headers = "From: Totem Duoc UC <noreply@cittsb.cl>\r\n";
    $headers .= "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: text/html; charset=UTF-8\r\n";

    $body = "<html><body>";
    $body .= "<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>";
    $body .= "<div style='background: #003D7A; padding: 20px; text-align: center;'>";
    $body .= "<h1 style='color: white; margin: 0;'>Duoc UC</h1>";
    $body .= "<p style='color: #FFB800; margin: 5px 0 0;'>Sede San Bernardo</p>";
    $body .= "</div>";
    $body .= "<div style='padding: 30px; background: #f5f5f5; text-align: center;'>";
    $body .= "<h2 style='color: #003D7A;'>Hola {$toName},</h2>";
    $body .= "<p style='font-size: 16px;'>Tu ticket de atención ha sido generado exitosamente.</p>";
    $body .= "<div style='background: #003D7A; color: white; padding: 20px; border-radius: 15px; margin: 20px auto; max-width: 300px;'>";
    $body .= "<p style='margin: 0; font-size: 14px; color: #FFB800;'>Tu número de ticket</p>";
    $body .= "<h1 style='margin: 10px 0; font-size: 48px; letter-spacing: 5px;'>{$ticket}</h1>";
    $body .= "<p style='margin: 0; font-size: 14px;'>Área: {$area}</p>";
    $body .= "</div>";
    $body .= "<p style='font-size: 14px; color: #666;'>Por favor acércate al mesón cuando tu número aparezca en la pantalla.</p>";
    $body .= "<p style='color: #666; font-size: 12px; margin-top: 20px;'>Fecha: " . date('d/m/Y H:i') . "</p>";
    $body .= "</div>";
    $body .= "<div style='background: #003D7A; padding: 10px; text-align: center;'>";
    $body .= "<p style='color: white; font-size: 12px; margin: 0;'>Tótem de Autoservicio — Duoc UC San Bernardo</p>";
    $body .= "</div>";
    $body .= "</div>";
    $body .= "</body></html>";

    $subject = "=?UTF-8?B?" . base64_encode("Ticket {$ticket} — Duoc UC San Bernardo") . "?=";

    $sent = mail($toEmail, $subject, $body, $headers);

    if ($sent) {
        echo json_encode(['success' => true, 'message' => 'Ticket enviado por correo']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Error al enviar correo']);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
