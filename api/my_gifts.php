<?php
// VIBRA - My Gifts API
// File: /api/my_gifts.php

require_once 'config.php';

$userId = $_GET['user_id'] ?? '';

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

// Get sent gifts
$stmt = $pdo->prepare('SELECT * FROM gifts WHERE sender_id = ? ORDER BY created_at DESC');
$stmt->execute([$user['id']]);
$sent = $stmt->fetchAll();

// Get received gifts
$stmt = $pdo->prepare('SELECT * FROM gifts WHERE recipient_id = ? ORDER BY created_at DESC');
$stmt->execute([$user['id']]);
$received = $stmt->fetchAll();

sendSuccess([
    'sent' => $sent,
    'received' => $received,
]);