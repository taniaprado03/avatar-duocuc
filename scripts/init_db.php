<?php
// Script para inicializar la BD e inspeccionar los tickets
require_once '/var/www/html/db.php';

$db = Database::getInstance();
$pdo = $db->getConnection();

echo "BD inicializada correctamente\n";

$stmt = $pdo->query("SELECT count(*) as c FROM tickets");
$row = $stmt->fetch();
echo "Tickets en la BD: " . $row['c'] . "\n\n";

$stmt = $pdo->query("SELECT * FROM tickets ORDER BY created_at DESC");
$tickets = $stmt->fetchAll();

foreach ($tickets as $t) {
    echo "ID:".$t['id']." | RUT:".$t['rut']." | ".$t['nombre']." | ".$t['motivo']." | Estado:".$t['status']."\n";
}
echo "---FIN---\n";
