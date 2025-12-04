<?php
require_once 'config/db.php';

echo "Users table columns:\n";
$result = $pdo->query('PRAGMA table_info(users)');
foreach($result->fetchAll() as $col) {
    echo "- {$col['name']} ({$col['type']})\n";
}

echo "\nChecking if nickname column exists:\n";
$columns = $pdo->query("PRAGMA table_info(users)")->fetchAll(PDO::FETCH_COLUMN, 1);
if (in_array('nickname', $columns)) {
    echo "✓ nickname column EXISTS\n";
} else {
    echo "✗ nickname column DOES NOT EXIST\n";
    echo "\nAdding nickname column...\n";
    try {
        $pdo->exec("ALTER TABLE users ADD COLUMN nickname VARCHAR(100) NULL");
        echo "✓ nickname column added successfully!\n";
    } catch (PDOException $e) {
        echo "✗ Error: " . $e->getMessage() . "\n";
    }
}
?>
