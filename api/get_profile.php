<?php
// VIBRA - Get Profile API
// File: /api/get_profile.php

require_once 'config.php';

$userId = $_GET['user_id'] ?? '';

if (empty($userId)) {
    sendError('User ID is required');
}

$pdo = getDB();

$stmt = $pdo->prepare('SELECT * FROM users WHERE id = ? OR userId = ?');
$stmt->execute([$userId, $userId]);
$user = $stmt->fetch();

if (!$user) {
    sendError('User not found', 404);
}

sendSuccess([
    'profile' => [
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
        'bio' => $user['bio'],
        'location' => $user['location'],
        'age' => $user['age'],
        'gender' => $user['gender'],
        'interests' => $user['interests'] ? explode(',', $user['interests']) : [],
        'photos' => $user['photos'] ? json_decode($user['photos'], true) : [],
        'vibraScore' => (float)($user['vibraScore'] ?? 3.5),
        'dateOfBirth' => $user['date_of_birth'],
        'lifeGoals' => $user['life_goals'],
        'dealbreakers' => $user['dealbreakers'],
        'datingPace' => $user['dating_pace'],
        'lifestyle' => $user['lifestyle'],
    ]
]);