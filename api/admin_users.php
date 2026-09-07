<?php
// VIBRA - Admin Get All Users API
// File: /api/admin_users.php

require_once 'config.php';

$level = $_GET['level'] ?? '';
$status = $_GET['status'] ?? '';
$isVerified = $_GET['isVerified'] ?? '';
$search = $_GET['search'] ?? '';
$lifeGoals = $_GET['lifeGoals'] ?? '';
$dealbreakers = $_GET['dealbreakers'] ?? '';
$datingPace = $_GET['datingPace'] ?? '';
$lifestyle = $_GET['lifestyle'] ?? '';

$pdo = getDB();

$sql = 'SELECT id, userId, phone, registration_name, level, points, isVerified, isIdentityLocked, hasWithdrawn, status, location, createdAt, life_goals, dealbreakers, dating_pace, lifestyle FROM users WHERE 1=1';
$params = [];

if (!empty($level)) {
    $sql .= ' AND level = ?';
    $params[] = $level;
}

if (!empty($status)) {
    $sql .= ' AND status = ?';
    $params[] = $status;
}

if ($isVerified === 'true') {
    $sql .= ' AND isVerified = 1';
} elseif ($isVerified === 'false') {
    $sql .= ' AND isVerified = 0';
}

if (!empty($search)) {
    $sql .= ' AND (registration_name LIKE ? OR phone LIKE ? OR location LIKE ?)';
    $params[] = '%' . $search . '%';
    $params[] = '%' . $search . '%';
    $params[] = '%' . $search . '%';
}

if (!empty($lifeGoals)) {
    $sql .= ' AND life_goals = ?';
    $params[] = $lifeGoals;
}

if (!empty($dealbreakers)) {
    $sql .= ' AND dealbreakers = ?';
    $params[] = $dealbreakers;
}

if (!empty($datingPace)) {
    $sql .= ' AND dating_pace = ?';
    $params[] = $datingPace;
}

if (!empty($lifestyle)) {
    $sql .= ' AND lifestyle = ?';
    $params[] = $lifestyle;
}

$sql .= ' ORDER BY id DESC';

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$users = $stmt->fetchAll();

$result = [];
foreach ($users as $user) {
    $result[] = [
        'id' => $user['id'],
        'userId' => $user['userId'],
        'name' => $user['registration_name'],
        'phone' => $user['phone'],
        'level' => $user['level'],
        'points' => (int)$user['points'],
        'isVerified' => (bool)$user['isVerified'],
        'isIdentityLocked' => (bool)$user['isIdentityLocked'],
        'hasWithdrawn' => (bool)$user['hasWithdrawn'],
        'status' => $user['status'] ?? 'active',
        'location' => $user['location'],
        'createdAt' => $user['createdAt'],
        'lifeGoals' => $user['life_goals'],
        'dealbreakers' => $user['dealbreakers'],
        'datingPace' => $user['dating_pace'],
        'lifestyle' => $user['lifestyle'],
    ];
}

sendSuccess(['users' => $result]);