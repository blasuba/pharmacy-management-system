-- Pharmacy Profile (single row)
CREATE TABLE IF NOT EXISTS pharmacy_profile (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    legal_name VARCHAR(100) NOT NULL,
    logo_path VARCHAR(255),
    address TEXT NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100) NOT NULL,
    tin VARCHAR(50) NOT NULL,
    license_number VARCHAR(50) NOT NULL,
    license_expiry DATE NOT NULL,
    website VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- System Settings (single row)
CREATE TABLE IF NOT EXISTS system_settings (
    id BIGSERIAL PRIMARY KEY,
    currency VARCHAR(10) DEFAULT 'ETB',
    currency_symbol VARCHAR(10) DEFAULT 'Br',
    date_format VARCHAR(20) DEFAULT 'DD/MM/YYYY',
    time_zone VARCHAR(50) DEFAULT 'Africa/Addis_Ababa',
    language VARCHAR(10) DEFAULT 'en',
    receipt_footer TEXT DEFAULT 'Thank you! Get well soon!',
    receipt_printer VARCHAR(20) DEFAULT 'PDF',
    low_stock_threshold INT DEFAULT 20,
    expiry_alert_days INT DEFAULT 30,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tax Configuration (single row)
CREATE TABLE IF NOT EXISTS tax_config (
    id BIGSERIAL PRIMARY KEY,
    vat_rate DECIMAL(5, 2) DEFAULT 15.00,
    tax_inclusive BOOLEAN DEFAULT FALSE,
    tax_registration_number VARCHAR(50),
    default_tax_code VARCHAR(20) DEFAULT 'VAT-15',
    tax_exempt_categories TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Notification Settings (single row)
CREATE TABLE IF NOT EXISTS notification_settings (
    id BIGSERIAL PRIMARY KEY,
    email_enabled BOOLEAN DEFAULT FALSE,
    smtp_host VARCHAR(100),
    smtp_port INT,
    smtp_username VARCHAR(100),
    smtp_password VARCHAR(255),
    sender_email VARCHAR(100),
    sms_enabled BOOLEAN DEFAULT FALSE,
    sms_api_key VARCHAR(255),
    sms_sender_id VARCHAR(50),
    telegram_enabled BOOLEAN DEFAULT FALSE,
    telegram_bot_token VARCHAR(255),
    telegram_chat_id VARCHAR(50),
    low_stock_alert_enabled BOOLEAN DEFAULT TRUE,
    expiry_alert_enabled BOOLEAN DEFAULT TRUE,
    daily_report_enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Backup Schedule (single row)
CREATE TABLE IF NOT EXISTS backup_schedule (
    id BIGSERIAL PRIMARY KEY,
    frequency VARCHAR(20) DEFAULT 'DAILY',
    backup_time TIME DEFAULT '02:00:00',
    retention_days INT DEFAULT 30,
    last_backup_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
