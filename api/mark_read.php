<?php
require_once 'config.php';

$input = json_decode(file_get_contents('php://input'), true);

$conversationId = $input['conversation_id'] ?? '';
$userId = $input['user_id'] ?? '';

if (empty($conversationId) || empty($userId)) {
    sendError('Conversation ID and User ID are required');
}

$pdo = getDB();

// Update messages as read
$stmt = $pdo->prepare('
    UPDATE messages 
    SET is_read = 1 
    WHERE conversation_id = ? AND sender_id != ?
');
$stmt->execute([$conversationId, $userId]);

$messagesRead = $stmt->rowCount();

sendSuccess([
    'messagesRead' => $messagesRead,
    'message' => 'Marked ' . $messagesRead . ' messages as read'
]);