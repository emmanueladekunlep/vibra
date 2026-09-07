<?php
// VIBRA - Set PIN API
// File: /api/set_pin.php

require_once 'config.php';

$input = json_decode(file_get_contents('php://input'), true);

$userId = $input['user_id'] ?? '';
$pin = $input['pin'] ?? '';

if (empty($userId)) {
    sendError('User ID is required');
}

if (empty($pin) || strlen($pin) !== 4 || !is_numeric($pin)) {
    sendError('PIN must be 4 digits');
}

$pdo = getDB();

// Get user by phone or userId
$stmt = $pdo->prepare('SELECT * FROM users WHERE phone = ? OR userId = ?');
$stmt->execute([$userId, $userId]);
$user = $stmt->fetch();

if (!$user) {
    sendError('User not found', 404);
}

// Update PIN
$stmt = $pdo->prepare('UPDATE users SET login_pin = ?, pin_enabled = 1 WHERE id = ?');
$stmt->execute([$pin, $user['id']]);

sendSuccess([
    'message' => 'PIN set successfully',
    'pinEnabled' => true,
]);