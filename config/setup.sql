-- SQLiteバージョン

-- ユーザーテーブル
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role TEXT CHECK(role IN ('user', 'admin')) DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_role ON users(role);

-- シフト提出テーブル
CREATE TABLE IF NOT EXISTS shift_submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    week_start DATE NOT NULL,
    day_of_week INTEGER NOT NULL, -- 0=月曜, 6=日曜
    start_time TIME NULL,
    end_time TIME NULL,
    is_available BOOLEAN DEFAULT 1,
    status TEXT CHECK(status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, week_start, day_of_week)
);

CREATE INDEX IF NOT EXISTS idx_user_week ON shift_submissions(user_id, week_start);
CREATE INDEX IF NOT EXISTS idx_week_day ON shift_submissions(week_start, day_of_week);

-- 確定シフトテーブル
CREATE TABLE IF NOT EXISTS final_shifts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    shift_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    created_by INTEGER NOT NULL, -- 作成した管理者のID
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_user_date ON final_shifts(user_id, shift_date);
CREATE INDEX IF NOT EXISTS idx_date ON final_shifts(shift_date);

-- デフォルト管理者アカウント作成 (パスワード: admin123)
INSERT OR IGNORE INTO users (name, email, password, role) VALUES 
('管理者', 'admin@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin');
