-- =============================================================================
-- Atomic XP Award with DB-side Idempotency
-- Replaces the old award_xp RPC for idempotent callers.
-- The xp_log INSERT is the gate: only if a row is inserted (ON CONFLICT DO
-- NOTHING returns nothing on duplicate) is profiles.xp incremented.
-- Non-idempotent callers (idempotency_key IS NULL) always award.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.award_xp_idempotent(
    target_user_id UUID,
    xp_amount INT,
    action_text TEXT,
    idem_key TEXT DEFAULT NULL
)
RETURNS TABLE (new_xp INT, new_level INT, leveled_up BOOLEAN, awarded BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    log_id UUID;
    current_xp INT;
    current_level INT;
    calculated_level INT;
BEGIN
    -- Gate: insert log row. If idem_key non-null and duplicate, no row returned.
    INSERT INTO public.xp_log (user_id, action, amount, idempotency_key)
    VALUES (target_user_id, action_text, xp_amount, idem_key)
    ON CONFLICT (user_id, action, idempotency_key) WHERE idempotency_key IS NOT NULL
    DO NOTHING
    RETURNING id INTO log_id;

    IF log_id IS NULL AND idem_key IS NOT NULL THEN
        -- Already awarded: return current state with awarded=false
        SELECT p.xp, p.level INTO current_xp, current_level
        FROM profiles p WHERE p.id = target_user_id;
        RETURN QUERY SELECT current_xp, current_level, false, false;
        RETURN;
    END IF;

    -- Award XP atomically (row-level lock on UPDATE)
    UPDATE profiles
    SET xp = xp + xp_amount
    WHERE id = target_user_id
    RETURNING xp, level INTO current_xp, current_level;

    calculated_level := CASE
        WHEN current_xp >= 5500 THEN 10
        WHEN current_xp >= 4000 THEN 9
        WHEN current_xp >= 3000 THEN 8
        WHEN current_xp >= 2200 THEN 7
        WHEN current_xp >= 1500 THEN 6
        WHEN current_xp >= 1000 THEN 5
        WHEN current_xp >= 600  THEN 4
        WHEN current_xp >= 300  THEN 3
        WHEN current_xp >= 100  THEN 2
        ELSE 1
    END;

    IF calculated_level <> current_level THEN
        UPDATE profiles SET level = calculated_level WHERE id = target_user_id;
    END IF;

    RETURN QUERY SELECT current_xp, calculated_level, (calculated_level > current_level), true;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.award_xp_idempotent FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.award_xp_idempotent TO service_role;
