<?php
/**
 * Generate User ID (VIB-XXXX)
 */
function generateUserId($conn) {
    $stmt = $conn->prepare("SELECT user_id FROM users ORDER BY id DESC LIMIT 1");
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        $row = $result->fetch_assoc();
        $lastId = $row['user_id'];
        $num = intval(substr($lastId, 4));
        $next = $num + 1;
    } else {
        $next = 1001;
    }
    
    return 'VIB-' . $next;
}
?>