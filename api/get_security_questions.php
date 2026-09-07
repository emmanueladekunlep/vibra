<?php
// VIBRA - Get Security Questions API
// File: /api/get_security_questions.php

require_once 'config.php';

$input = json_decode(file_get_contents('php://input'), true);
$phone = $input['phone'] ?? '';

if (empty($phone)) {
    sendError('Phone number is required');
}

$pdo = getDB();

// Get user by phone
$stmt = $pdo->prepare('SELECT * FROM users WHERE phone = ?');
$stmt->execute([$phone]);
$user = $stmt->fetch();

if (!$user) {
    sendError('User not found');
}

// Generate security questions based on user data
$questions = [];

// Question 1: What is your date of birth?
if (!empty($user['date_of_birth'])) {
    $questions[] = [
        'question' => 'What is your date of birth?',
        'answers' => [date('Y-m-d', strtotime($user['date_of_birth']))],
        'type' => 'date'
    ];
}

// Question 2: What is your location?
if (!empty($user['location'])) {
    $questions[] = [
        'question' => 'What is your location?',
        'answers' => [$user['location']],
        'type' => 'text'
    ];
}

// Question 3: What is your referral code?
if (!empty($user['referral_code'])) {
    $questions[] = [
        'question' => 'What is your referral code?',
        'answers' => [$user['referral_code']],
        'type' => 'text'
    ];
}

// Question 4: What is your User ID?
if (!empty($user['userId'])) {
    $questions[] = [
        'question' => 'What is your User ID?',
        'answers' => [$user['userId']],
        'type' => 'text'
    ];
}

// Question 5: What is your phone number? (always available)
$questions[] = [
    'question' => 'What is the phone number you registered with?',
    'answers' => [$user['phone']],
    'type' => 'phone'
];

// If no questions available, add fallback
if (empty($questions)) {
    $questions[] = [
        'question' => 'What is your phone number?',
        'answers' => [$user['phone']],
        'type' => 'phone'
    ];
}

sendSuccess([
    'questions' => $questions,
    'user_id' => $user['id']
]);