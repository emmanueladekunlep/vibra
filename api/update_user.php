<?php
// VIBRA - Update User API
// File: /api/update_user.php

require_once 'config.php';

$input = json_decode(file_get_contents('php://input'), true);

$userId = $input['user_id'] ?? '';
if (empty($userId)) {
    sendError('User ID is required');
}

$pdo = getDB();

// Build update query
$fields = [];
$params = [];

$allowedFields = [
    'bio', 
    'location', 
    'age', 
    'gender', 
    'level', 
    'points', 
    'isVerified', 
    'hasWithdrawn', 
    'vibraScore', 
    'interests', 
    'date_of_birth',
    'lifeGoals',
    'dealbreakers',
    'datingPace',
    'lifestyle'
];

foreach ($allowedFields as $field) {
    if (array_key_exists($field, $input)) {
        // Map frontend field names to database column names
        $dbField = $field;
        if ($field === 'lifeGoals') {
            $dbField = 'life_goals';
        } elseif ($field === 'datingPace') {
            $dbField = 'dating_pace';
        }
        
        if ($field === 'interests' && is_array($input[$field])) {
            $fields[] = 'interests = ?';
            $params[] = implode(',', $input[$field]);
        } else {
            $fields[] = $dbField . ' = ?';
            $params[] = $input[$field];
        }
    }
}

// Map 'name' to 'registration_name'
if (isset($input['name'])) {
    $fields[] = 'registration_name = ?';
    $params[] = $input['name'];
}

if (empty($fields)) {
    sendError('No fields to update');
}

// Get user ID from database first
$stmt = $pdo->prepare('SELECT id FROM users WHERE id = ? OR userId = ?');
$stmt->execute([$userId, $userId]);
$user = $stmt->fetch();

if (!$user) {
    sendError('User not found', 404);
}

$dbUserId = $user['id'];
$params[] = $dbUserId;

$sql = 'UPDATE users SET ' . implode(', ', $fields) . ' WHERE id = ?';

$stmt = $pdo->prepare($sql);
$stmt->execute($params);

// Get updated user
$stmt = $pdo->prepare('SELECT * FROM users WHERE id = ?');
$stmt->execute([$dbUserId]);
$updatedUser = $stmt->fetch();

sendSuccess([
    'user' => [
        'id' => $updatedUser['id'],
        'userId' => $updatedUser['userId'],
        'name' => $updatedUser['registration_name'],
        'phone' => $updatedUser['phone'],
        'level' => $updatedUser['level'],
        'points' => (int)$updatedUser['points'],
        'isVerified' => (bool)$updatedUser['isVerified'],
        'isIdentityLocked' => (bool)$updatedUser['isIdentityLocked'],
        'verifiedLegalName' => $updatedUser['verifiedLegalName'],
        'hasWithdrawn' => (bool)$updatedUser['hasWithdrawn'],
        'dateOfBirth' => $updatedUser['date_of_birth'],
        'lifeGoals' => $updatedUser['life_goals'],
        'dealbreakers' => $updatedUser['dealbreakers'],
        'datingPace' => $updatedUser['dating_pace'],
        'lifestyle' => $updatedUser['lifestyle'],
        'bio' => $updatedUser['bio'],
        'location' => $updatedUser['location'],
        'interests' => $updatedUser['interests'] ? explode(',', $updatedUser['interests']) : [],
        'photos' => $updatedUser['photos'] ? json_decode($updatedUser['photos'], true) : [],
        'vibraScore' => (float)($updatedUser['vibraScore'] ?? 3.5),
    ]
]);