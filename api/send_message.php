<?php
require_once 'config.php';

$input = json_decode(file_get_contents('php://input'), true);

$conversationId = $input['conversation_id'] ?? '';
$senderId = $input['sender_id'] ?? '';
$text = $input['text'] ?? '';

if (empty($conversationId) || empty($senderId) || empty($text)) {
    sendError('Missing required fields');
}

$pdo = getDB();

$messageId = 'msg_' . time() . '_' . bin2hex(random_bytes(4));

$stmt = $pdo->prepare('
    INSERT INTO messages (id, conversation_id, sender_id, text, timestamp)
    VALUES (?, ?, ?, ?, NOW())
');
$stmt->execute([$messageId, $conversationId, $senderId, $text]);

// Update conversation
$stmt = $pdo->prepare('
    UPDATE conversations 
    SET last_message = ?, updated_at = NOW() 
    WHERE id = ?
');
$stmt->execute([$text, $conversationId]);

sendSuccess([
    'message' => [
        'id' => $messageId,
        'conversationId' => $conversationId,
        'senderId' => $senderId,
        'text' => $text,
        'timestamp' => date('Y-m-d H:i:s'),
        'read' => false
    ]
]);