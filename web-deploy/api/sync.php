<?php
// Güzelyalı ERP Central SQLite Database Sync Handler
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$dataDir = __DIR__ . '/../data';
if (!file_exists($dataDir)) {
    mkdir($dataDir, 0755, true);
}

$dbFile = $dataDir . '/guzelyali_erp.sqlite';
$action = $_GET['action'] ?? 'status';

if ($action === 'load') {
    if (file_exists($dbFile) && filesize($dbFile) > 100) {
        header('Content-Type: application/octet-stream');
        header('Content-Disposition: attachment; filename="guzelyali_erp.sqlite"');
        header('Content-Length: ' . filesize($dbFile));
        header('Cache-Control: no-cache, must-revalidate');
        readfile($dbFile);
        exit;
    } else {
        http_response_code(204);
        exit;
    }
}

if ($action === 'save' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = file_get_contents('php://input');
    if (!$input || strlen($input) < 100) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid or empty database payload']);
        exit;
    }

    // Atomic write via temporary file
    $tmpFile = $dbFile . '.tmp.' . uniqid();
    if (file_put_contents($tmpFile, $input) !== false) {
        rename($tmpFile, $dbFile);
        header('Content-Type: application/json');
        echo json_encode([
            'success' => true,
            'updated_at' => filemtime($dbFile),
            'size' => filesize($dbFile),
            'message' => 'Database synchronized successfully'
        ]);
        exit;
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to write database file']);
        exit;
    }
}

if ($action === 'status') {
    header('Content-Type: application/json');
    $exists = file_exists($dbFile) && filesize($dbFile) > 100;
    echo json_encode([
        'exists' => $exists,
        'updated_at' => $exists ? filemtime($dbFile) : null,
        'size' => $exists ? filesize($dbFile) : 0,
        'server_time' => time()
    ]);
    exit;
}

http_response_code(400);
echo json_encode(['error' => 'Unknown action']);
