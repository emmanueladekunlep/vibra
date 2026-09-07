<?php
// VIBRA - Admin Update User API
// File: /api/admin_update.php

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

// Build update query
$fields = [];
$params = [];

$allowedFields = ['level', 'points', 'isVerified', 'hasWithdrawn', 'status'];

foreach ($allowedFields as $field) {
    if (array_key_exists($field, $input)) {
        $fields[] = $field . ' = ?';
        $params[] = $input[$field];
    }
}

if (empty($fields)) {
    sendError('No fields to update');
}

$params[] = $user['id'];
$sql = 'UPDATE users SET ' . implode(', ', $fields) . ' WHERE id = ?';

$stmt = $pdo->prepare($sql);
$stmt->execute($params);

// Get updated user
$stmt = $pdo->prepare('SELECT * FROM users WHERE id = ?');
$stmt->execute([$user['id']]);
$updated = $stmt->fetch();

sendSuccess([
    'user' => [
        'id' => $updated['id'],
        'userId' => $updated['userId'],
        'name' => $updated['registration_name'],
        'level' => $updated['level'],
        'points' => (int)$updated['points'],
        'isVerified' => (bool)$updated['isVerified'],
        'isIdentityLocked' => (bool)$updated['isIdentityLocked'],
        'hasWithdrawn' => (bool)$updated['hasWithdrawn'],
        'status' => $updated['status'] ?? 'active',
    ],
    'message' => 'User updated successfully'
]);