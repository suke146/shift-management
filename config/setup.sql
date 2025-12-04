-- SQLiteバージョン

-- ユーザーテーブル
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    nickname VARCHAR(100) NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role TEXT CHECK(role IN ('user', 'admin')) DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_role ON users(role);

-- シフト提出テーブル (半月ごと)
CREATE TABLE IF NOT EXISTS shift_submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    period_start DATE NOT NULL, -- 半月の開始日 (1日または16日)
    shift_date DATE NOT NULL, -- 実際のシフト日
    start_time TIME NULL,
    end_time TIME NULL,
    is_available BOOLEAN DEFAULT 1,
    note TEXT NULL,
    status TEXT CHECK(status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, period_start, shift_date)
);

CREATE INDEX IF NOT EXISTS idx_user_period ON shift_submissions(user_id, period_start);
CREATE INDEX IF NOT EXISTS idx_period ON shift_submissions(period_start);
CREATE INDEX IF NOT EXISTS idx_shift_date ON shift_submissions(shift_date);

-- 確定シフトテーブル
CREATE TABLE IF NOT EXISTS final_shifts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    shift_date DATE NOT NULL,
    start_time TIME NULL, -- 休みの場合はNULL
    end_time TIME NULL,   -- 休みの場合はNULL
    is_day_off INTEGER DEFAULT 0, -- 休み: 1, 勤務: 0
    created_by INTEGER NOT NULL, -- 作成した管理者のID
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id),
    UNIQUE(user_id, shift_date)
);

CREATE INDEX IF NOT EXISTS idx_user_date ON final_shifts(user_id, shift_date);
CREATE INDEX IF NOT EXISTS idx_date ON final_shifts(shift_date);

-- デフォルト管理者アカウント作成 (パスワード: admin123)
INSERT OR IGNORE INTO users (name, email, password, role) VALUES 
('管理者', 'admin@example.com', '$2y$12$hctBhCI4JjGBFWHHTRwAdutgS5v/RBnQWOHgZFDVyTdHSmLhr3FfS', 'admin');
