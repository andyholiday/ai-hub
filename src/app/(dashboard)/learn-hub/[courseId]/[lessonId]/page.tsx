"use client";

// =============================================================================
// Learn Hub - Lesson Detail Page
// Displays lesson content with markdown rendering, quiz support,
// completion actions, navigation, and XP animation.
// =============================================================================

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Quiz } from "@/components/features/learn-hub/quiz";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Star,
  BookOpen,
  FileText,
  Video,
  HelpCircle,
  Zap,
} from "lucide-react";
import { quizContentSchema } from "@/lib/validators/learn-hub";
import type { QuizContent } from "@/lib/validators/learn-hub";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LessonDetail {
  id: string;
  course_id: string;
  title: string;
  content: string;
  lesson_type: "text" | "video" | "quiz" | "interactive";
  order_index: number;
  duration_minutes: number;
  courseTitle: string;
  isCompleted: boolean;
  quizScore: number | null;
  currentIndex: number;
  totalLessons: number;
  completedLessonIds: string[];
  previousLesson: { id: string; title: string } | null;
  nextLesson: { id: string; title: string } | null;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const LESSON_XP = 20;

const LESSON_TYPE_LABELS: Record<string, string> = {
  text: "Text",
  video: "Video",
  quiz: "Quiz",
  interactive: "Interaktiv",
};

const LESSON_TYPE_ICONS: Record<string, typeof FileText> = {
  text: FileText,
  video: Video,
  quiz: HelpCircle,
  interactive: Zap,
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function LessonDetailPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  const lessonId = params.lessonId as string;

  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [showXPAnimation, setShowXPAnimation] = useState(false);
  const [completionMessage, setCompletionMessage] = useState<string | null>(
    null,
  );

  // --- Fetch Lesson ---
  useEffect(() => {
    async function fetchLesson() {
      setIsLoading(true);
      setError(null);
      setCompletionMessage(null);
      setShowXPAnimation(false);

      try {
        const res = await fetch(
          `/api/learn-hub/courses/${courseId}/lessons/${lessonId}`,
        );
        const json = await res.json();

        if (json.error) {
          setError(json.error.message);
          return;
        }

        setLesson(json.data);
      } catch {
        setError("Lektion konnte nicht geladen werden.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchLesson();
  }, [courseId, lessonId]);

  // --- XP Animation ---
  const triggerXPAnimation = useCallback(() => {
    setShowXPAnimation(true);
    setTimeout(() => setShowXPAnimation(false), 3000);
  }, []);

  // --- Complete Lesson (non-quiz) ---
  const handleComplete = useCallback(async () => {
    if (!lesson || lesson.isCompleted) return;
    setIsCompleting(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/learn-hub/courses/${courseId}/lessons/${lessonId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        },
      );
      const json = await res.json();

      if (json.error) {
        setError(json.error.message);
        return;
      }

      if (json.data?.passed) {
        setLesson((prev) => (prev ? { ...prev, isCompleted: true } : prev));
        setCompletionMessage(json.data.message);
        triggerXPAnimation();
      }
    } catch {
      setError("Lektion konnte nicht abgeschlossen werden.");
    } finally {
      setIsCompleting(false);
    }
  }, [lesson, courseId, lessonId, triggerXPAnimation]);

  // --- Complete Quiz Lesson ---
  const handleQuizComplete = useCallback(
    async (
      score: number,
      _passed: boolean,
      answers: Array<{ questionIndex: number; selectedOption: number }>,
    ) => {
      if (!lesson || lesson.isCompleted) return;
      setIsCompleting(true);
      setError(null);

      try {
        const res = await fetch(
          `/api/learn-hub/courses/${courseId}/lessons/${lessonId}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ quiz_answers: answers }),
          },
        );
        const json = await res.json();

        if (json.error) {
          setError(json.error.message);
          return;
        }

        if (json.data?.passed) {
          setLesson((prev) =>
            prev ? { ...prev, isCompleted: true, quizScore: score } : prev,
          );
          setCompletionMessage(json.data.message);
          triggerXPAnimation();
        }
      } catch {
        setError("Quiz konnte nicht ausgewertet werden.");
      } finally {
        setIsCompleting(false);
      }
    },
    [lesson, courseId, lessonId, triggerXPAnimation],
  );

  // --- Parse Quiz Content ---
  const getQuizContent = useCallback((): QuizContent | null => {
    if (!lesson || lesson.lesson_type !== "quiz") return null;

    try {
      const parsed = quizContentSchema.safeParse(JSON.parse(lesson.content));
      if (parsed.success) return parsed.data;
    } catch {
      // Content is not valid quiz JSON
    }
    return null;
  }, [lesson]);

  // --- Loading ---
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-lr-green-500" />
      </div>
    );
  }

  // --- Error ---
  if (error && !lesson) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          iconLeft={<ArrowLeft />}
          onClick={() => router.push(`/learn-hub/${courseId}`)}
        >
          Zurueck zum Kurs
        </Button>
        <Card className="border-error bg-error-light p-4">
          <p className="text-body-sm text-error-dark">{error}</p>
        </Card>
      </div>
    );
  }

  if (!lesson) return null;

  const LessonIcon =
    LESSON_TYPE_ICONS[lesson.lesson_type] ?? FileText;
  const quizContent = getQuizContent();
  const completedCount = lesson.completedLessonIds.length;
  const overallProgress =
    lesson.totalLessons > 0
      ? Math.round(
          ((completedCount + (lesson.isCompleted ? 0 : 0)) /
            lesson.totalLessons) *
            100,
        )
      : 0;

  return (
    <div className="space-y-6">
      {/* XP Animation Overlay */}
      {showXPAnimation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="animate-bounce rounded-2xl bg-white p-8 shadow-2xl">
            <div className="text-center">
              <Star className="mx-auto h-12 w-12 text-lr-gold-500" />
              <p className="mt-3 text-3xl font-bold text-surface-900">
                +{LESSON_XP} XP
              </p>
              <p className="mt-1 text-body-sm text-surface-500">
                Lektion abgeschlossen!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          iconLeft={<ArrowLeft />}
          onClick={() => router.push(`/learn-hub/${courseId}`)}
        >
          {lesson.courseTitle}
        </Button>

        <div className="flex items-center gap-2">
          <LessonIcon className="h-4 w-4 text-surface-400" />
          <Badge variant="gray" size="sm">
            {LESSON_TYPE_LABELS[lesson.lesson_type]}
          </Badge>
        </div>
      </div>

      {/* Progress Bar */}
      <ProgressBar
        value={overallProgress}
        label={`Lektion ${lesson.currentIndex} von ${lesson.totalLessons}`}
        size="sm"
        variant="gradient"
      />

      {/* Lesson Content */}
      <Card>
        {/* Lesson Header */}
        <div className="border-b border-surface-200 pb-4">
          <h1 className="font-display text-xl font-bold text-surface-900">
            {lesson.title}
          </h1>
          <div className="mt-2 flex items-center gap-3 text-body-sm text-surface-500">
            <div className="flex items-center gap-1">
              <BookOpen className="h-4 w-4" />
              <span>
                Lektion {lesson.currentIndex} von {lesson.totalLessons}
              </span>
            </div>
            <span>-</span>
            <span>{lesson.duration_minutes} Min.</span>
          </div>
        </div>

        {/* Content Area */}
        {lesson.lesson_type === "quiz" && quizContent ? (
          // Quiz Content
          <div className="mt-4">
            {lesson.isCompleted ? (
              <div className="rounded-lg bg-lr-green-50 p-6 text-center">
                <CheckCircle2 className="mx-auto h-10 w-10 text-lr-green-500" />
                <p className="mt-2 text-title-sm font-semibold text-lr-green-700">
                  Quiz bereits bestanden!
                </p>
                {lesson.quizScore != null && (
                  <p className="mt-1 text-body-sm text-lr-green-600">
                    Dein Ergebnis: {lesson.quizScore}%
                  </p>
                )}
              </div>
            ) : (
              <Quiz
                questions={quizContent.questions}
                passingScore={quizContent.passingScore}
                onComplete={handleQuizComplete}
                isSubmitting={isCompleting}
              />
            )}
          </div>
        ) : (
          // Text / Video / Interactive Content
          <div className="mt-4">
            <div
              className="prose prose-surface max-w-none prose-headings:font-heading prose-headings:text-surface-900 prose-p:text-surface-700 prose-strong:text-surface-900 prose-code:rounded prose-code:bg-surface-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:text-lr-green-700 prose-pre:rounded-lg prose-pre:bg-surface-900"
              dangerouslySetInnerHTML={{
                __html: renderMarkdown(lesson.content),
              }}
            />
          </div>
        )}
      </Card>

      {/* Error */}
      {error && (
        <Card className="border-error bg-error-light p-4">
          <p className="text-body-sm text-error-dark">{error}</p>
        </Card>
      )}

      {/* Completion Message */}
      {completionMessage && (
        <Card className="border-lr-green-200 bg-lr-green-50 p-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-lr-green-600" />
            <p className="text-body-sm font-medium text-lr-green-700">
              {completionMessage}
            </p>
          </div>
        </Card>
      )}

      {/* Bottom Actions */}
      <div className="flex items-center justify-between gap-4">
        {/* Previous Lesson */}
        <div>
          {lesson.previousLesson && (
            <Link
              href={`/learn-hub/${courseId}/${lesson.previousLesson.id}`}
            >
              <Button variant="ghost" size="sm" iconLeft={<ArrowLeft />}>
                <span className="hidden sm:inline">
                  {lesson.previousLesson.title}
                </span>
                <span className="sm:hidden">Zurueck</span>
              </Button>
            </Link>
          )}
        </div>

        {/* Center: Complete Button */}
        <div>
          {!lesson.isCompleted && lesson.lesson_type !== "quiz" && (
            <Button
              iconLeft={<CheckCircle2 />}
              onClick={handleComplete}
              isLoading={isCompleting}
            >
              Lektion abschliessen
            </Button>
          )}

          {lesson.isCompleted && !lesson.nextLesson && (
            <Link href={`/learn-hub/${courseId}`}>
              <Button variant="primary" iconLeft={<BookOpen />}>
                Zurueck zum Kurs
              </Button>
            </Link>
          )}
        </div>

        {/* Next Lesson */}
        <div>
          {lesson.nextLesson && (
            <Link
              href={`/learn-hub/${courseId}/${lesson.nextLesson.id}`}
            >
              <Button
                variant={lesson.isCompleted ? "primary" : "ghost"}
                size="sm"
                iconRight={<ArrowRight />}
              >
                <span className="hidden sm:inline">
                  {lesson.nextLesson.title}
                </span>
                <span className="sm:hidden">Weiter</span>
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Simple Markdown Renderer
// Converts basic Markdown to HTML for lesson content display.
// ---------------------------------------------------------------------------

function renderMarkdown(content: string): string {
  let html = escapeHtml(content);

  // Headings (h1-h3)
  html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^## (.+)$/gm, "<h2>$1</h2>");
  html = html.replace(/^# (.+)$/gm, "<h1>$1</h1>");

  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

  // Italic
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");

  // Inline code
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

  // Code blocks
  html = html.replace(
    /```(\w*)\n([\s\S]*?)```/g,
    "<pre><code class=\"language-$1\">$2</code></pre>",
  );

  // Unordered lists
  html = html.replace(/^- (.+)$/gm, "<li>$1</li>");
  html = html.replace(
    /(<li>[\s\S]*?<\/li>)/g,
    (match) => `<ul>${match}</ul>`,
  );
  // Remove nested uls
  html = html.replace(/<\/ul>\s*<ul>/g, "");

  // Ordered lists
  html = html.replace(/^\d+\. (.+)$/gm, "<li>$1</li>");

  // Links
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>',
  );

  // Horizontal rules
  html = html.replace(/^---$/gm, "<hr />");

  // Blockquotes
  html = html.replace(/^> (.+)$/gm, "<blockquote>$1</blockquote>");
  html = html.replace(/<\/blockquote>\n<blockquote>/g, "\n");

  // Paragraphs (lines not already wrapped in tags)
  html = html.replace(
    /^(?!<[a-zA-Z])((?!<\/)[^\n]+)$/gm,
    "<p>$1</p>",
  );

  // Remove empty paragraphs
  html = html.replace(/<p>\s*<\/p>/g, "");

  return html;
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
  };
  return text.replace(/[&<>]/g, (char) => map[char] ?? char);
}
