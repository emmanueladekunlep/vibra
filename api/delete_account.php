<?php
// VIBRA - Delete Account API
// File: /api/delete_account.php

require_once 'config.php';

$input = json_decode(file_get_contents('php://input'), true);
$userId = $input['user_id'] ?? '';

if (empty($userId)) {
    sendError('User ID is required');
}

$pdo = getDB();

// Get user
$stmt = $pdo->prepare('SELECT * FROM users WHERE id = ? OR userId = ?');
$stmt->execute([$userId, $userId]);
$user = $stmt->fetch();

if (!$user) {
    sendError('User not found', 404);
}

// Delete related records first
$tables = ['gifts', 'events', 'merchants', 'messages', 'referrals'];
foreach ($tables as $table) {
    $stmt = $pdo->prepare("DELETE FROM $table WHERE user_id = ? OR sender_id = ? OR recipient_id = ? OR host_id = ?");
    $stmt->execute([$user['id'], $user['id'], $user['id'], $user['id']]);
}

// Delete user
$stmt = $pdo->prepare('DELETE FROM users WHERE id = ?');
$stmt->execute([$user['id']]);

sendSuccess([
    'message' => 'Account deleted successfully',
]);