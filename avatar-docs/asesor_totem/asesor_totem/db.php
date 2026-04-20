<?php

class Database
{
    private static $instance = null;
    private $pdo;

    private function __construct()
    {
        try {
            // Path to the SQLite database file
            // Usamos /data/ que es un volumen Docker con permisos de escritura para www-data
            $dbPath = '/var/www/html/data/database.sqlite';
            $this->pdo = new PDO("sqlite:" . $dbPath);
            $this->pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

            // Create table if it doesn't exist
            $this->createTables();
        } catch (PDOException $e) {
            die("Database connection failed: " . $e->getMessage());
        }
    }

    public static function getInstance()
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function getConnection()
    {
        return $this->pdo;
    }

    private function createTables()
    {
        $query = "CREATE TABLE IF NOT EXISTS tickets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            rut TEXT NOT NULL,
            nombre TEXT NOT NULL,
            motivo TEXT,
            status TEXT DEFAULT 'espera', -- espera, llamando, atendido
            mesa INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )";
        $this->pdo->exec($query);

        // Seed some data if empty
        $stmt = $this->pdo->query("SELECT COUNT(*) FROM tickets");
        if ($stmt->fetchColumn() == 0) {
            $this->seedData();
        }
    }

    private function seedData()
    {
        $tickets = [
            ['11.111.111-1', 'Juan Perez', 'Consulta General'],
            ['22.222.222-2', 'Maria Lopez', 'Matricula'],
            ['33.333.333-3', 'Carlos Diaz', 'Certificados'],
            ['44.444.444-4', 'Ana Silva', 'Beneficios']
        ];

        $stmt = $this->pdo->prepare("INSERT INTO tickets (rut, nombre, motivo) VALUES (?, ?, ?)");
        foreach ($tickets as $ticket) {
            $stmt->execute($ticket);
        }
    }
}
