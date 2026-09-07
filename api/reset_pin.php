<?php
// VIBRA - Reset PIN API
// File: /api/reset_pin.php

require_once 'config.php';

$input = json_decode(file_get_contents('php://input'), true);

$phone = $input['phone'] ?? '';
$pin = $input['pin'] ?? '';
$answers = $input['answers'] ?? [];

if (empty($phone)) {
    sendError('Phone number is required');
}

if (empty($pin) || strlen($pin) !== 4 || !is_numeric($pin)) {
    sendError('PIN must be 4 digits');
}

$pdo = getDB();

// Get user by phone
$stmt = $pdo->prepare('SELECT * FROM users WHERE phone = ?');
$stmt->execute([$phone]);
$user = $stmt->fetch();

if (!$user) {
    sendError('User not found');
}

// If answers are provided, verify them (security check)
if (!empty($answers)) {
    $correctCount = 0;
    
    foreach ($answers as $answerData) {
        $question = $answerData['question'] ?? '';
        $answer = strtolower(trim($answerData['answer'] ?? ''));
        
        if (empty($question) || empty($answer)) continue;
        
        // Check based on question type
        if (strpos($question, 'date of birth') !== false && !empty($user['date_of_birth'])) {
            $dob = date('Y-m-d', strtotime($user['date_of_birth']));
            if (strtolower($dob) === $answer || strtolower($user['date_of_birth']) === $answer) {
                $correctCount++;
            }
        } elseif (strpos($question, 'location') !== false && !empty($user['location'])) {
            if (strtolower($user['location']) === $answer) {
                $correctCount++;
            }
        } elseif (strpos($question, 'referral code') !== false && !empty($user['referral_code'])) {
            if (strtolower($user['referral_code']) === $answer) {
                $correctCount++;
            }
        } elseif (strpos($question, 'User ID') !== false && !empty($user['userId'])) {
            if (strtolower($user['userId']) === $answer) {
                $correctCount++;
            }
        } elseif (strpos($question, 'phone number') !== false) {
            if ($user['phone'] === $answer || substr($user['phone'], -4) === $answer) {
                $correctCount++;
            }
        }
    }
    
    // Need at least 2 correct answers
    if ($correctCount < 2) {
        sendError('Security verification failed. Please check your answers.');
    }
}

// Update PIN
$stmt = $pdo->prepare('UPDATE users SET login_pin = ?, pin_enabled = 1 WHERE id = ?');
$stmt->execute([$pin, $user['id']]);

sendSuccess([
    'message' => 'PIN reset successfully',
    'pinEnabled' => true
]);