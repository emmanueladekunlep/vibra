<?php
require_once 'config.php';

$input = json_decode(file_get_contents('php://input'), true);

$userId1 = $input['user_id1'] ?? '';
$userId2 = $input['user_id2'] ?? '';

if (empty($userId1) || empty($userId2)) {
    sendError('Both user IDs are required');
}

$pdo = getDB();

// Create table if not exists
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

$ids = [$userId1, $userId2];
sort($ids);
$convId = 'conv_' . $ids[0] . '_' . $ids[1];

$stmt = $pdo->prepare('SELECT * FROM conversations WHERE id = ?');
$stmt->execute([$convId]);
$conversation = $stmt->fetch();

if (!$conversation) {
    $participants = json_encode([$userId1, $userId2]);
    $stmt = $pdo->prepare('
        INSERT INTO conversations (id, participants, created_at, updated_at)
        VALUES (?, ?, NOW(), NOW())
    ');
    $stmt->execute([$convId, $participants]);
    
    $conversation = [
        'id' => $convId,
        'participants' => $participants,
        'last_message' => null,
        'created_at' => date('Y-m-d H:i:s'),
        'updated_at' => date('Y-m-d H:i:s')
    ];
}

sendSuccess([
    'conversation' => [
        'id' => $conversation['id'],
        'participants' => json_decode($conversation['participants'], true),
        'lastMessage' => $conversation['last_message'] ?? null,
        'createdAt' => $conversation['created_at'],
        'updatedAt' => $conversation['updated_at']
    ]
]);