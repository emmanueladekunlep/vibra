<?php
require_once 'config.php';

$conversationId = $_GET['conversation_id'] ?? '';
$limit = $_GET['limit'] ?? 50;

if (empty($conversationId)) {
    sendError('Conversation ID is required');
}

$pdo = getDB();

// Create messages table if not exists
$pdo->exec("
    CREATE TABLE IF NOT EXISTS messages (
        id VARCHAR(50) PRIMARY KEY,
        conversation_id VARCHAR(50) NOT NULL,
        sender_id INT NOT NULL,
        text TEXT NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_read TINYINT(1) DEFAULT 0,
        INDEX idx_conversation (conversation_id),
        INDEX idx_sender (sender_id)
    )
");

$stmt = $pdo->prepare('
    SELECT * FROM messages 
    WHERE conversation_id = ? 
    ORDER BY timestamp ASC 
    LIMIT ?
');
$stmt->execute([$conversationId, $limit]);
$messages = $stmt->fetchAll();

sendSuccess(['messages' => $messages]);