<?php
// VIBRA - Redeem Referral API
// File: /api/redeem_referral.php

require_once 'config.php';

$input = json_decode(file_get_contents('php://input'), true);

$code = $input['code'] ?? '';
$userId = $input['user_id'] ?? '';

if (empty($code)) {
    sendError('Referral code is required');
}

if (empty($userId)) {
    sendError('User ID is required');
}

$pdo = getDB();

// Get current user
$stmt = $pdo->prepare('SELECT * FROM users WHERE id = ? OR userId = ?');
$stmt->execute([$userId, $userId]);
$currentUser = $stmt->fetch();

if (!$currentUser) {
    sendError('User not found', 404);
}

// Check if user already redeemed a referral code
if (!empty($currentUser['referral_redeemed_by'])) {
    sendError('You have already redeemed a referral code');
}

// Find the referrer by referral_code
$stmt = $pdo->prepare('SELECT * FROM users WHERE referral_code = ?');
$stmt->execute([$code]);
$referrer = $stmt->fetch();

if (!$referrer) {
    sendError('Invalid referral code');
}

if ($referrer['id'] == $currentUser['id']) {
    sendError('You cannot redeem your own referral code');
}

// Points to give
$REFERRER_POINTS = 500;
$NEW_USER_POINTS = 200;

// Update referrer
$stmt = $pdo->prepare('UPDATE users SET points = points + ?, total_referrals = total_referrals + 1 WHERE id = ?');
$stmt->execute([$REFERRER_POINTS, $referrer['id']]);

// Update current user (add points and mark as redeemed)
$stmt = $pdo->prepare('UPDATE users SET points = points + ?, referral_redeemed_by = ? WHERE id = ?');
$stmt->execute([$NEW_USER_POINTS, $referrer['id'], $currentUser['id']]);

sendSuccess([
    'referrer_id' => $referrer['id'],
    'referrer_name' => $referrer['registration_name'],
    'points_earned' => $NEW_USER_POINTS,
    'message' => 'You earned ' . $NEW_USER_POINTS . ' points!',
]);