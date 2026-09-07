<?php
// VIBRA - Database Configuration
// File: /api/config.php

// Set timezone to Nigeria
date_default_timezone_set('Africa/Lagos');

// Database credentials
define('DB_HOST', 'localhost');
define('DB_NAME', 'arcakwhd_vibra_api');
define('DB_USER', 'arcakwhd_vibra_user');
define('DB_PASS', 'Lawrenceamanda1*');

// API settings
define('API_URL', 'https://api.vibra.ng/api');

// CORS headers - allow all for now
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Allow-Credentials: true');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Database connection function
function getDB() {
    try {
        $pdo = new PDO(
            'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
            DB_USER,
            DB_PASS,
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ]
        );
        // Set MySQL timezone to Nigeria time
        $pdo->exec("SET time_zone = '+01:00'");
        return $pdo;
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database connection failed: ' . $e->getMessage()]);
        exit();
    }
}

// Helper: send JSON response
function sendResponse($data) {
    echo json_encode($data);
    exit();
}

// Helper: send error response
function sendError($message, $code = 400) {
    http_response_code($code);
    echo json_encode(['success' => false, 'message' => $message]);
    exit();
}

// Helper: send success response
function sendSuccess($data = []) {
    echo json_encode(['success' => true] + $data);
    exit();
}