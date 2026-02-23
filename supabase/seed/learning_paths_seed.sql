-- =============================================================================
-- LR AI Hub - Learning Paths Seed Data
-- Date: 2026-02-21
-- Description: Seed data for learning paths with references to existing courses.
--   Creates 3 curated learning paths using the courses from the main seed file.
-- =============================================================================

-- =============================================================================
-- 1. LEARNING PATHS
-- =============================================================================

INSERT INTO learning_paths (id, title, description, slug, difficulty, estimated_hours, icon, color, is_published, order_index)
VALUES
    (
        'a0000000-0000-0000-0000-a00000000001',
        'KI-Grundlagen fuer LR Partner',
        'Dein Einstieg in die Welt der Kuenstlichen Intelligenz -- speziell fuer LR Partner. Dieser Lernpfad fuehrt dich Schritt fuer Schritt von den Basics ueber Prompt Engineering bis hin zu ethischen Grundlagen. Nach Abschluss bist du bestens geruestet, KI verantwortungsvoll und effektiv im Alltag einzusetzen.',
        'ki-grundlagen-lr-partner',
        'beginner',
        4.5,
        'Route',
        'green',
        true,
        1
    ),
    (
        'a0000000-0000-0000-0000-a00000000002',
        'Vom Einsteiger zum Prompt-Profi',
        'Du kennst die Grundlagen und willst mehr? Dieser Lernpfad bringt dich vom KI-Grundwissen direkt zur Prompt Engineering Masterclass. Lerne, wie du mit praezisen Prompts bessere Ergebnisse erzielst und deine Produktivitaet steigerst.',
        'einsteiger-zum-prompt-profi',
        'intermediate',
        2.5,
        'Sparkles',
        'blue',
        true,
        2
    ),
    (
        'a0000000-0000-0000-0000-a00000000003',
        'KI-Komplett: Alles was du wissen musst',
        'Der umfassende Lernpfad fuer alle, die KI vollstaendig verstehen wollen. Von den allerersten Grundlagen ueber fortgeschrittenes Prompt Engineering bis hin zu ethischen Fragen -- dieser Pfad deckt alle wichtigen Themen ab und macht dich zum KI-Experten in deinem Team.',
        'ki-komplett',
        'advanced',
        6.0,
        'Map',
        'purple',
        true,
        3
    )
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 2. LEARNING PATH COURSES (Mapping)
-- =============================================================================

-- Lernpfad 1: KI-Grundlagen fuer LR Partner
-- Reihenfolge: Grundlagen -> Prompt Engineering -> Ethik
INSERT INTO learning_path_courses (id, learning_path_id, course_id, order_index, is_required)
VALUES
    (
        'a0c00000-0000-0000-0000-a00000000001',
        'a0000000-0000-0000-0000-a00000000001',
        'c0000000-0000-0000-0000-c00000000001', -- KI-Grundlagen fuer den Arbeitsalltag
        0,
        true
    ),
    (
        'a0c00000-0000-0000-0000-a00000000002',
        'a0000000-0000-0000-0000-a00000000001',
        'c0000000-0000-0000-0000-c00000000002', -- Prompt Engineering Masterclass
        1,
        true
    ),
    (
        'a0c00000-0000-0000-0000-a00000000003',
        'a0000000-0000-0000-0000-a00000000001',
        'c0000000-0000-0000-0000-c00000000003', -- KI-Ethik und verantwortungsvoller Einsatz
        2,
        true
    )
ON CONFLICT (learning_path_id, course_id) DO NOTHING;

-- Lernpfad 2: Vom Einsteiger zum Prompt-Profi
-- Reihenfolge: Grundlagen -> Prompt Engineering
INSERT INTO learning_path_courses (id, learning_path_id, course_id, order_index, is_required)
VALUES
    (
        'a0c00000-0000-0000-0000-a00000000004',
        'a0000000-0000-0000-0000-a00000000002',
        'c0000000-0000-0000-0000-c00000000001', -- KI-Grundlagen fuer den Arbeitsalltag
        0,
        true
    ),
    (
        'a0c00000-0000-0000-0000-a00000000005',
        'a0000000-0000-0000-0000-a00000000002',
        'c0000000-0000-0000-0000-c00000000002', -- Prompt Engineering Masterclass
        1,
        true
    )
ON CONFLICT (learning_path_id, course_id) DO NOTHING;

-- Lernpfad 3: KI-Komplett: Alles was du wissen musst
-- Reihenfolge: Grundlagen -> Ethik -> Prompt Engineering (Ethik vor Prompts, da man erst verstehen soll, DANN anwenden)
INSERT INTO learning_path_courses (id, learning_path_id, course_id, order_index, is_required)
VALUES
    (
        'a0c00000-0000-0000-0000-a00000000006',
        'a0000000-0000-0000-0000-a00000000003',
        'c0000000-0000-0000-0000-c00000000001', -- KI-Grundlagen fuer den Arbeitsalltag
        0,
        true
    ),
    (
        'a0c00000-0000-0000-0000-a00000000007',
        'a0000000-0000-0000-0000-a00000000003',
        'c0000000-0000-0000-0000-c00000000003', -- KI-Ethik und verantwortungsvoller Einsatz
        1,
        true
    ),
    (
        'a0c00000-0000-0000-0000-a00000000008',
        'a0000000-0000-0000-0000-a00000000003',
        'c0000000-0000-0000-0000-c00000000002', -- Prompt Engineering Masterclass
        2,
        true
    )
ON CONFLICT (learning_path_id, course_id) DO NOTHING;

-- =============================================================================
-- SEED COMPLETE
-- =============================================================================
