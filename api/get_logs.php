<?php
// VIBRA - Get System Logs API
// File: /api/get_logs.php

require_once 'config.php';

$limit = $_GET['limit'] ?? 50;

$pdo = getDB();

// Create logs table if not exists
$pdo->exec("
    CREATE TABLE IF NOT EXISTS system_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        action VARCHAR(100) NOT NULL,
        details TEXT DEFAULT NULL,
        user_id VARCHAR(50) DEFAULT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_action (action),
        INDEX idx_user (user_id)
    )
");

$stmt = $pdo->prepare('
    SELECT * FROM system_logs 
    ORDER BY timestamp DESC 
    LIMIT ?
');
$stmt->execute([$limit]);
$logs = $stmt->fetchAll();

sendSuccess(['logs' => $logs]);