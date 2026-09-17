DROP TRIGGER IF EXISTS email_verification_challenges_set_updated_at ON email_verification_challenges;
DROP TABLE IF EXISTS email_verification_challenges;

-- email_verified_at не очищается: down migration не может безопасно отличить
-- grandfathered аккаунты от реально подтверждённых.
