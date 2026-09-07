<?php
// VIBRA - Redeem Gift API
// File: /api/redeem_gift.php

require_once 'config.php';

$input = json_decode(file_get_contents('php://input'), true);

$code = $input['code'] ?? '';
$userId = $input['user_id'] ?? '';
$merchantId = $input['merchant_id'] ?? '';

if (empty($code)) {
    sendError('Redemption code is required');
}

$pdo = getDB();

// Get gift by code
$stmt = $pdo->prepare('SELECT * FROM gifts WHERE redemption_code = ?');
$stmt->execute([$code]);
$gift = $stmt->fetch();

if (!$gift) {
    sendError('Invalid redemption code', 404);
}

if ($gift['status'] !== 'pending') {
    sendError('Gift has already been redeemed');
}

// Check if user is recipient
if (!empty($userId)) {
    $stmt = $pdo->prepare('SELECT * FROM users WHERE id = ? OR userId = ?');
    $stmt->execute([$userId, $userId]);
    $user = $stmt->fetch();
    
    if (!$user) {
        sendError('User not found', 404);
    }
    
    if ($gift['recipient_id'] != $user['id']) {
        sendError('You are not the recipient of this gift');
    }
}

// Handle cash gift withdrawal
if ($gift['gift_type'] === 'cash') {
    if (empty($userId)) {
        sendError('User ID is required for cash withdrawal');
    }
    
    $fee = $gift['price'] * 0.05;
    $amount = $gift['price'] - $fee;
    
    // Update gift status
    $stmt = $pdo->prepare('UPDATE gifts SET status = ?, redeemed_at = NOW() WHERE id = ?');
    $stmt->execute(['withdrawn', $gift['id']]);
    
    // Add points to recipient
    $newPoints = $user['points'] + $gift['price'];
    $stmt = $pdo->prepare('UPDATE users SET points = ?, hasWithdrawn = 1 WHERE id = ?');
    $stmt->execute([$newPoints, $user['id']]);
    
    sendSuccess([
        'gift' => $gift,
        'amount' => $amount,
        'fee' => $fee,
        'message' => 'Cash gift withdrawn successfully! Amount: ₦' . $amount
    ]);
}

// Handle service gift redemption (merchant)
if ($gift['gift_type'] === 'service') {
    if (empty($merchantId)) {
        sendError('Merchant ID is required for service gift redemption');
    }
    
    $commission = $gift['price'] * 0.20;
    $payout = $gift['price'] - $commission;
    
    // Update gift status
    $stmt = $pdo->prepare('UPDATE gifts SET status = ?, redeemed_at = NOW(), merchant_id = ? WHERE id = ?');
    $stmt->execute(['redeemed', $merchantId, $gift['id']]);
    
    // Add points to recipient
    $stmt = $pdo->prepare('SELECT * FROM users WHERE id = ?');
    $stmt->execute([$gift['recipient_id']]);
    $recipient = $stmt->fetch();
    
    if ($recipient) {
        $newPoints = $recipient['points'] + $gift['price'];
        $stmt = $pdo->prepare('UPDATE users SET points = ? WHERE id = ?');
        $stmt->execute([$newPoints, $recipient['id']]);
    }
    
    sendSuccess([
        'gift' => $gift,
        'payout' => $payout,
        'commission' => $commission,
        'message' => 'Gift redeemed successfully! Payout: ₦' . $payout
    ]);
}

sendError('Unknown gift type');