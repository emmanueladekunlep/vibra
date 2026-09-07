<?php
// VIBRA - Create Gift API
// File: /api/create_gift.php

require_once 'config.php';

$input = json_decode(file_get_contents('php://input'), true);

$senderId = $input['sender_id'] ?? '';
$recipientId = $input['recipient_id'] ?? '';
$giftId = $input['gift_id'] ?? '';
$message = $input['message'] ?? '';

if (empty($senderId) || empty($recipientId) || empty($giftId)) {
    sendError('Sender ID, Recipient ID, and Gift ID are required');
}

$pdo = getDB();

// Get sender
$stmt = $pdo->prepare('SELECT * FROM users WHERE id = ? OR userId = ?');
$stmt->execute([$senderId, $senderId]);
$sender = $stmt->fetch();

if (!$sender) {
    sendError('Sender not found', 404);
}

// Get recipient
$stmt = $pdo->prepare('SELECT * FROM users WHERE id = ? OR userId = ?');
$stmt->execute([$recipientId, $recipientId]);
$recipient = $stmt->fetch();

if (!$recipient) {
    sendError('Recipient not found', 404);
}

// Gift catalog
$gifts = [
    'food_3000' => ['name' => 'Food Gift', 'price' => 3000, 'type' => 'service'],
    'food_5000' => ['name' => 'Food Gift Plus', 'price' => 5000, 'type' => 'service'],
    'drinks_2000' => ['name' => 'Drink Gift', 'price' => 2000, 'type' => 'service'],
    'entertainment_4000' => ['name' => 'Cinema Gift', 'price' => 4000, 'type' => 'service'],
    'shopping_5000' => ['name' => 'Shopping Gift', 'price' => 5000, 'type' => 'service'],
    'data_1000' => ['name' => 'Data Gift', 'price' => 1000, 'type' => 'service'],
    'cash_2000' => ['name' => 'Cash Gift', 'price' => 2000, 'type' => 'cash'],
    'cash_5000' => ['name' => 'Cash Gift Plus', 'price' => 5000, 'type' => 'cash'],
    'cash_10000' => ['name' => 'Cash Gift Premium', 'price' => 10000, 'type' => 'cash'],
];

if (!isset($gifts[$giftId])) {
    sendError('Invalid gift ID');
}

$gift = $gifts[$giftId];
$price = $gift['price'];
$pointsCost = $price * 2;

// Check sender points
if ($sender['points'] < $pointsCost) {
    sendError('Insufficient points. Need ' . $pointsCost . ' points');
}

// Generate 6-digit redemption code
$code = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

// Create gift record
$stmt = $pdo->prepare('
    INSERT INTO gifts (gift_id, gift_name, gift_type, price, sender_id, recipient_id, message, redemption_code, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
');
$stmt->execute([
    $giftId,
    $gift['name'],
    $gift['type'],
    $price,
    $sender['id'],
    $recipient['id'],
    $message,
    $code,
    'pending'
]);

$giftRecordId = $pdo->lastInsertId();

// Deduct points from sender
$newPoints = $sender['points'] - $pointsCost;
$stmt = $pdo->prepare('UPDATE users SET points = ? WHERE id = ?');
$stmt->execute([$newPoints, $sender['id']]);

sendSuccess([
    'gift' => [
        'id' => $giftRecordId,
        'gift_id' => $giftId,
        'gift_name' => $gift['name'],
        'gift_type' => $gift['type'],
        'price' => $price,
        'sender_id' => $sender['id'],
        'recipient_id' => $recipient['id'],
        'message' => $message,
        'redemption_code' => $code,
        'status' => 'pending',
    ],
    'redemption_code' => $code,
    'message' => 'Gift sent successfully! Redemption code: ' . $code
]);