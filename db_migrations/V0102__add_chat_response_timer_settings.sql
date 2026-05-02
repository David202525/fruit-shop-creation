ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS chat_response_warning_seconds INTEGER DEFAULT 60;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS chat_response_danger_seconds INTEGER DEFAULT 180;

UPDATE site_settings SET chat_response_warning_seconds = 60 WHERE chat_response_warning_seconds IS NULL;
UPDATE site_settings SET chat_response_danger_seconds = 180 WHERE chat_response_danger_seconds IS NULL;
