<?php
// VIBRA - Add Points API (Admin)
// File: /api/add_points.php

require_once 'config.php';

$input = json_decode(file_get_contents('php://input'), true);

$userId = $input['user_id'] ?? '';
$points = $input['points'] ?? 0;
$reason = $input['reason'] ?? 'Admin added points';

if (empty($userId)) {
    sendError('User ID is required');
}

if ($points <= 0) {
    sendError('Points must be positive');
}

$pdo = getDB();

// Get user
$stmt = $pdo->prepare('SELECT * FROM users WHERE id = ? OR userId = ?');
$stmt->execute([$userId, $userId]);
$user = $stmt->fetch();

if (!$user) {
    sendError('User not found', 404);
}

// Add points
$newPoints = $user['points'] + $points;
$stmt = $pdo->prepare('UPDATE users SET points = ? WHERE id = ?');
$stmt->execute([$newPoints, $user['id']]);

sendSuccess([
    'user_id' => $user['id'],
    'previous_points' => (int)$user['points'],
    'new_points' => $newPoints,
    'points_added' => $points,
    'message' => 'Added ' . $points . ' points to user'
]);