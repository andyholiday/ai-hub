-- =============================================================================
-- FIX: handle_new_user trigger loop or null bug
-- Description: The migration 00009 broke new user signups because of how it
-- updated auth.users.raw_app_meta_data. This script fixes the trigger to properly 
-- default to an empty JSON object before appending the role, and limits recursion.
-- =============================================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- 1. Create the profile
    INSERT INTO public.profiles (id, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data ->> 'full_name',
        NEW.raw_user_meta_data ->> 'avatar_url'
    );

    -- 2. Safely add the default role 'user' to the JWT app metadata
    -- Using COALESCE prevents NULL || jsonb from evaluating to completely NULL.
    UPDATE auth.users
    SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', 'user')
    WHERE id = NEW.id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
