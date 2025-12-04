<?php
require_once 'config/db.php';

echo "Checking shift_submissions table structure...\n\n";

// 現在のテーブル構造を確認
$result = $pdo->query('PRAGMA table_info(shift_submissions)');
$columns = $result->fetchAll(PDO::FETCH_COLUMN, 1);

echo "Current columns:\n";
foreach ($columns as $col) {
    echo "- $col\n";
}

// noteカラムが存在するか確認
if (!in_array('note', $columns)) {
    echo "\n✗ note column DOES NOT EXIST\n";
    echo "Adding note column...\n";
    
    try {
        $pdo->exec("ALTER TABLE shift_submissions ADD COLUMN note TEXT NULL");
        echo "✓ note column added successfully!\n";
    } catch (PDOException $e) {
        echo "✗ Error: " . $e->getMessage() . "\n";
    }
} else {
    echo "\n✓ note column already exists\n";
}

echo "\nFinal table structure:\n";
$result = $pdo->query('PRAGMA table_info(shift_submissions)');
foreach ($result->fetchAll() as $col) {
    echo "- {$col['name']} ({$col['type']})\n";
}
?>
