-- Rename the reserved, inactive POIGAI owner admin identity; retain email and existing security state.
UPDATE admin_users SET id='Admin' WHERE id='POIGAI-ADMIN-001' AND email='contact@poigai.com' AND status='pending' AND password_hash IS NULL;
