<?php
/**
 * 小さなマイグレーション: users.nickname と shift_submissions.note を追加する
 * 使い方: php migrate_add_columns.php
 */

require_once __DIR__ . '/config/db.php';

try {
    // users テーブルに nickname があるか
    $cols = $pdo->query("PRAGMA table_info(users)")->fetchAll(PDO::FETCH_ASSOC);
    $names = array_column($cols, 'name');

    if (!in_array('nickname', $names)) {
        echo "Adding nickname column to users...\n";
        $pdo->exec("ALTER TABLE users ADD COLUMN nickname VARCHAR(100) NULL");
        // 既存ユーザーの nickname を name で埋める
        $pdo->exec("UPDATE users SET nickname = name WHERE nickname IS NULL OR nickname = ''");
        echo "Done.\n";
    } else {
        echo "users.nickname already exists.\n";
    }

    // shift_submissions に note があるか
    $cols2 = $pdo->query("PRAGMA table_info(shift_submissions)")->fetchAll(PDO::FETCH_ASSOC);
    $names2 = array_column($cols2, 'name');

    if (!in_array('note', $names2)) {
        echo "Adding note column to shift_submissions...\n";
        $pdo->exec("ALTER TABLE shift_submissions ADD COLUMN note TEXT NULL");
        echo "Done.\n";
    } else {
        echo "shift_submissions.note already exists.\n";
    }

    echo "Migration finished.\n";
} catch (PDOException $e) {
    echo "Migration failed: " . $e->getMessage() . "\n";
    exit(1);
}

?>