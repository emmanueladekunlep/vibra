<?php
// VIBRA - Login API
// File: /api/login.php

require_once 'config.php';

$input = json_decode(file_get_contents('php://input'), true);
$phone = $input['phone'] ?? '';
$name = $input['name'] ?? '';
$pin = $input['pin'] ?? '';

if (empty($phone)) {
    sendError('Phone number is required');
}

$pdo = getDB();

// Check if user exists
$stmt = $pdo->prepare('SELECT * FROM users WHERE phone = ?');
$stmt->execute([$phone]);
$user = $stmt->fetch();

if (!$user) {
    // Generate User ID
    $stmt = $pdo->query('SELECT MAX(id) as max_id FROM users');
    $result = $stmt->fetch();
    $nextId = ($result['max_id'] ?? 0) + 1;
    $userId = 'VIB-' . str_pad($nextId + 1000, 4, '0', STR_PAD_LEFT);
    
    $referralCode = substr($phone, -6);
    
    $stmt = $pdo->prepare('
        INSERT INTO users (userId, phone, registration_name, level, points, hasWithdrawn, isFounder, referral_code, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
    ');
    $stmt->execute([
        $userId,
        $phone,
        $name ?: 'User ' . substr($phone, -4),
        'Bronze',
        1000,
        0,
        0,
        $referralCode
    ]);
    
    $userIdDb = $pdo->lastInsertId();
    
    $stmt = $pdo->prepare('SELECT * FROM users WHERE id = ?');
    $stmt->execute([$userIdDb]);
    $user = $stmt->fetch();
}

// Check if PIN is required (user has PIN set)
$pinEnabled = !empty($user['login_pin']) && $user['pin_enabled'] == 1;

// If PIN is enabled and no PIN provided, return requiresPin
if ($pinEnabled && empty($pin)) {
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
            'pinEnabled' => true,
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
        ],
        'requiresPin' => true,
        'message' => 'PIN required'
    ]);
}

// If PIN is enabled and PIN provided, verify it
if ($pinEnabled && !empty($pin)) {
    if ($pin !== $user['login_pin']) {
        sendError('Invalid PIN', 401);
    }
}

// Return user data (full login)
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
        'pinEnabled' => $pinEnabled,
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
    ],
    'requiresPin' => false
]);