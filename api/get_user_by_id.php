<?php
// VIBRA - Get User by User ID API (Admin)
// File: /api/get_user_by_id.php

require_once 'config.php';

$userId = $_GET['user_id'] ?? '';

if (empty($userId)) {
    sendError('User ID is required');
}

$pdo = getDB();

$stmt = $pdo->prepare('SELECT * FROM users WHERE userId = ?');
$stmt->execute([$userId]);
$user = $stmt->fetch();

if (!$user) {
    sendError('User not found', 404);
}

sendSuccess([
    'user' => [
        'id' => $user['id'],
        'userId' => $user['userId'],
        'name' => $user['registration_name'],
        'phone' => $user['phone'],
        'level' => $user['level'],
        'points' => (int)$user['points'],
        'isVerified' => (bool)$user['isVerified'],
        'isIdentityLocked' => (bool)$user['isIdentityLocked'],
        'verifiedLegalName' => $user['verifiedLegalName'],
        'hasWithdrawn' => (bool)$user['hasWithdrawn'],
        'status' => $user['status'] ?? 'active',
        'bio' => $user['bio'],
        'location' => $user['location'],
        'createdAt' => $user['createdAt'],
    ]
]);