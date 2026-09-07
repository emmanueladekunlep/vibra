<?php
// VIBRA - Get User API
// File: /api/get_user.php

require_once 'config.php';

$userId = $_GET['user_id'] ?? '';

if (empty($userId)) {
    sendError('User ID is required');
}

$pdo = getDB();

// Try to find user by id, userId, or phone
$stmt = $pdo->prepare('
    SELECT * FROM users 
    WHERE id = ? OR userId = ? OR phone = ?
');
$stmt->execute([$userId, $userId, $userId]);
$user = $stmt->fetch();

// If not found, try by id as integer
if (!$user && is_numeric($userId)) {
    $stmt = $pdo->prepare('SELECT * FROM users WHERE id = ?');
    $stmt->execute([$userId]);
    $user = $stmt->fetch();
}

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
        'isFounder' => (bool)($user['isFounder'] ?? 0),
        'referralCode' => $user['referral_code'],
        'pinEnabled' => (bool)($user['pin_enabled'] ?? 0),
        'dateOfBirth' => $user['date_of_birth'],
        'lifeGoals' => $user['life_goals'],
        'dealbreakers' => $user['dealbreakers'],
        'datingPace' => $user['dating_pace'],
        'lifestyle' => $user['lifestyle'],
        'bio' => $user['bio'],
        'location' => $user['location'],
        'interests' => $user['interests'] ? explode(',', $user['interests']) : [],
        'photos' => $user['photos'] ? json_decode($user['photos'], true) : [],
        'vibraScore' => (float)($user['vibraScore'] ?? 3.5),
        'status' => $user['status'] ?? 'active',
    ]
]);