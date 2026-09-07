<?php
require_once 'config.php';

$userId = $_GET['user_id'] ?? '';

if (empty($userId)) {
    sendError('User ID is required');
}

$pdo = getDB();

// Create conversations table if not exists
$pdo->exec("
    CREATE TABLE IF NOT EXISTS conversations (
        id VARCHAR(50) PRIMARY KEY,
        participants TEXT NOT NULL,
        last_message TEXT DEFAULT NULL,
        last_message_time TIMESTAMP NULL DEFAULT NULL,
        unread_count TEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
");

// Get conversations for this user
$stmt = $pdo->prepare('
    SELECT * FROM conversations 
    WHERE participants LIKE ? 
    ORDER BY updated_at DESC
');
$stmt->execute(['%' . $userId . '%']);
$conversations = $stmt->fetchAll();

$result = [];
foreach ($conversations as $conv) {
    $participants = json_decode($conv['participants'], true);
    $otherUser = null;
    foreach ($participants as $p) {
        if ($p != $userId) {
            $otherUser = $p;
            break;
        }
    }
    
    $result[] = [
        'id' => $conv['id'],
        'otherUser' => [
            'id' => $otherUser, 
            'name' => 'User ' . substr($otherUser, -4),
            'level' => 'Bronze',
            'isVerified' => false,
            'photos' => []
        ],
        'lastMessage' => $conv['last_message'] ? ['text' => $conv['last_message']] : null,
        'unreadCount' => 0,
        'createdAt' => $conv['created_at'],
    ];
}

sendSuccess(['conversations' => $result]);