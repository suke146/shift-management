<?php
// DB 接続: 環境変数 DATABASE_URL があれば Postgres 等を使い、なければ SQLite を使うフォールバック
// DATABASE_URL 例: postgres://user:pass@host:5432/dbname

try {
    $databaseUrl = getenv('DATABASE_URL');
    if ($databaseUrl) {
        $parts = parse_url($databaseUrl);
        if ($parts === false) throw new Exception('Invalid DATABASE_URL');

        $scheme = $parts['scheme'] ?? null;
        $user = $parts['user'] ?? null;
        $pass = $parts['pass'] ?? null;
        $host = $parts['host'] ?? '127.0.0.1';
        $port = $parts['port'] ?? null;
        $path = $parts['path'] ?? '';
        $dbname = ltrim($path, '/');

        if ($scheme === 'postgres' || $scheme === 'pgsql') {
            $dsn = "pgsql:host={$host}" . ($port ? ";port={$port}" : '') . ";dbname={$dbname}";
            $pdo = new PDO($dsn, $user, $pass, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            ]);
        } else {
            throw new Exception('Unsupported DATABASE_URL scheme: ' . $scheme);
        }
    } else {
        // fallback to sqlite
        $db_file = __DIR__ . '/../data/shift_management.db';
        $data_dir = dirname($db_file);
        if (!is_dir($data_dir)) mkdir($data_dir, 0755, true);

        $pdo = new PDO("sqlite:$db_file");
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        // 外部キー制約
        $pdo->exec('PRAGMA foreign_keys = ON');
    }

} catch (Exception $e) {
    // 起動時に致命的な DB エラーは JSON で返すのではなくログ出力すること
    error_log('DB connection error: ' . $e->getMessage());
    die(json_encode(['success' => false, 'message' => 'データベース接続エラー']));
}
?>
