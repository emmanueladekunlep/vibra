<?php
// VIBRA - Get Points History API
// File: /api/get_points_history.php

require_once 'config.php';

$userId = $_GET['user_id'] ?? '';

if (empty($userId)) {
    sendError('User ID is required');
}

$pdo = getDB();

// Create table if not exists
$pdo->exec("
    CREATE TABLE IF NOT EXISTS points_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        points INT NOT NULL,
        source VARCHAR(50) NOT NULL,
        description TEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user (user_id),
        INDEX idx_source (source)
    )
");

$stmt = $pdo->prepare('
    SELECT * FROM points_history 
    WHERE user_id = ? 
    ORDER BY created_at DESC 
    LIMIT 100
');
$stmt->execute([$userId]);
$history = $stmt->fetchAll();

sendSuccess(['history' => $history]);