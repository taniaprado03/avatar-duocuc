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

    if (!isset($input['to_email']) || !isset($input['base64'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Email y base64 son requeridos']);
        exit;
    }

    $toEmail = $input['to_email'];
    $toName = $input['to_name'] ?? 'Alumno';
    $documento = $input['documento'] ?? 'Certificado de Alumno Regular';
    $base64 = $input['base64'];

    // Decodificar el PDF
    $pdfData = base64_decode($base64);
    if ($pdfData === false) {
        echo json_encode(['success' => false, 'message' => 'Base64 inválido']);
        exit;
    }

    // Construir el correo con adjunto usando MIME
    $boundary = md5(time());
    $filename = str_replace(' ', '_', $documento) . '.pdf';

    $headers = "From: Totem Duoc UC <noreply@cittsb.cl>\r\n";
    $headers .= "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: multipart/mixed; boundary=\"{$boundary}\"\r\n";

    // Cuerpo del correo
    $body = "--{$boundary}\r\n";
    $body .= "Content-Type: text/html; charset=UTF-8\r\n";
    $body .= "Content-Transfer-Encoding: 7bit\r\n\r\n";
    $body .= "<html><body>";
    $body .= "<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>";
    $body .= "<div style='background: #003D7A; padding: 20px; text-align: center;'>";
    $body .= "<h1 style='color: white; margin: 0;'>Duoc UC</h1>";
    $body .= "<p style='color: #FFB800; margin: 5px 0 0;'>Sede San Bernardo</p>";
    $body .= "</div>";
    $body .= "<div style='padding: 30px; background: #f5f5f5;'>";
    $body .= "<h2 style='color: #003D7A;'>Hola {$toName},</h2>";
    $body .= "<p>Tu <strong>{$documento}</strong> ha sido generado exitosamente desde el Tótem de Autoservicio.</p>";
    $body .= "<p>Encontrarás el documento adjunto en este correo en formato PDF.</p>";
    $body .= "<p style='color: #666; font-size: 12px; margin-top: 30px;'>Fecha: " . date('d/m/Y H:i') . "</p>";
    $body .= "</div>";
    $body .= "<div style='background: #003D7A; padding: 10px; text-align: center;'>";
    $body .= "<p style='color: white; font-size: 12px; margin: 0;'>Tótem de Autoservicio — Duoc UC San Bernardo</p>";
    $body .= "</div>";
    $body .= "</div>";
    $body .= "</body></html>\r\n\r\n";

    // Adjunto PDF
    $body .= "--{$boundary}\r\n";
    $body .= "Content-Type: application/pdf; name=\"{$filename}\"\r\n";
    $body .= "Content-Transfer-Encoding: base64\r\n";
    $body .= "Content-Disposition: attachment; filename=\"{$filename}\"\r\n\r\n";
    $body .= chunk_split($base64) . "\r\n";
    $body .= "--{$boundary}--";

    $subject = "=?UTF-8?B?" . base64_encode("Tu {$documento} — Duoc UC") . "?=";

    $sent = mail($toEmail, $subject, $body, $headers);

    if ($sent) {
        echo json_encode(['success' => true, 'message' => 'Correo enviado con PDF adjunto']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Error al enviar correo desde el servidor']);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
