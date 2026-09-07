<?php
// VIBRA - Upload Photo API
// File: /api/upload_photo.php

require_once 'config.php';

$userId = $_POST['user_id'] ?? '';
if (empty($userId)) {
    sendError('User ID is required');
}

if (!isset($_FILES['photo'])) {
    sendError('Photo file is required');
}

$file = $_FILES['photo'];

// Check for upload errors
if ($file['error'] !== UPLOAD_ERR_OK) {
    sendError('File upload failed: ' . $file['error']);
}

// Validate file type
$allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
if (!in_array($file['type'], $allowedTypes)) {
    sendError('Invalid file type. Only JPEG, PNG, GIF, WEBP allowed');
}

// Validate file size (5MB max)
if ($file['size'] > 5 * 1024 * 1024) {
    sendError('File too large. Max 5MB');
}

$pdo = getDB();

// Get current user
$stmt = $pdo->prepare('SELECT * FROM users WHERE id = ? OR userId = ?');
$stmt->execute([$userId, $userId]);
$user = $stmt->fetch();

if (!$user) {
    sendError('User not found', 404);
}

// Create uploads directory if not exists
$uploadDir = __DIR__ . '/uploads/';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

// Generate unique filename
$extension = pathinfo($file['name'], PATHINFO_EXTENSION);
$filename = 'user_' . $user['id'] . '_' . time() . '_' . bin2hex(random_bytes(4)) . '.' . $extension;
$filepath = $uploadDir . $filename;

// Move file
if (!move_uploaded_file($file['tmp_name'], $filepath)) {
    sendError('Failed to save file');
}

// Build photo URL
$photoUrl = 'https://api.vibra.ng/api/uploads/' . $filename;

// Get existing photos
$photos = $user['photos'] ? json_decode($user['photos'], true) : [];
$photoId = 'photo_' . time() . '_' . bin2hex(random_bytes(4));
$photos[] = ['id' => $photoId, 'url' => $photoUrl];

// Update user
$stmt = $pdo->prepare('UPDATE users SET photos = ? WHERE id = ?');
$stmt->execute([json_encode($photos), $user['id']]);

sendSuccess([
    'photo' => ['id' => $photoId, 'url' => $photoUrl],
    'photos' => $photos,
]);