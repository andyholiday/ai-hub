"use client";

// =============================================================================
// Quiz Component
// Multiple-choice quiz with immediate feedback, scoring, and pass/fail logic.
// Parses quiz data from lesson content JSON.
// =============================================================================

import { useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress-bar";
import {
  CheckCircle2,
  XCircle,
  RotateCcw,
  ArrowRight,
  Trophy,
  AlertTriangle,
} from "lucide-react";
import type { QuizQuestion } from "@/lib/validators/learn-hub";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface QuizProps {
  questions: QuizQuestion[];
  passingScore: number;
  onComplete: (
    score: number,
    passed: boolean,
    answers: Array<{ questionIndex: number; selectedOption: number }>,
  ) => void;
  isSubmitting?: boolean;
}

interface AnswerState {
  selectedOption: number;
  isCorrect: boolean;
  hasAnswered: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Quiz({
  questions,
  passingScore,
  onComplete,
  isSubmitting = false,
}: QuizProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Map<number, AnswerState>>(new Map());
  const [isFinished, setIsFinished] = useState(false);

  const question = questions[currentQuestion];
  const currentAnswer = answers.get(currentQuestion);
  const totalQuestions = questions.length;

  // --- Handle Option Selection ---
  const handleSelectOption = useCallback(
    (optionIndex: number) => {
      if (currentAnswer?.hasAnswered || !question) return;

      const isCorrect = optionIndex === question.correctIndex;

      setAnswers((prev) => {
        const updated = new Map(prev);
        updated.set(currentQuestion, {
          selectedOption: optionIndex,
          isCorrect,
          hasAnswered: true,
        });
        return updated;
      });
    },
    [currentAnswer, currentQuestion, question],
  );

  // --- Navigate to Next Question ---
  const handleNext = useCallback(() => {
    if (currentQuestion < totalQuestions - 1) {
      setCurrentQuestion((prev) => prev + 1);
    } else {
      setIsFinished(true);
    }
  }, [currentQuestion, totalQuestions]);

  // --- Calculate Score ---
  const correctCount = Array.from(answers.values()).filter(
    (a) => a.isCorrect,
  ).length;
  const score =
    totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
  const passed = score >= passingScore;

  // --- Submit Results ---
  const handleSubmit = useCallback(() => {
    const answerData = Array.from(answers.entries()).map(
      ([questionIndex, state]) => ({
        questionIndex,
        selectedOption: state.selectedOption,
      }),
    );
    onComplete(score, passed, answerData);
  }, [answers, score, passed, onComplete]);

  // --- Reset Quiz ---
  const handleReset = useCallback(() => {
    setCurrentQuestion(0);
    setAnswers(new Map());
    setIsFinished(false);
  }, []);

  // --- Finished State ---
  if (isFinished) {
    return (
      <Card>
        <div className="text-center">
          {/* Result Icon */}
          <div className="mx-auto mb-4">
            {passed ? (
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-brand-primary-50">
                <Trophy className="h-8 w-8 text-brand-primary-600" />
              </div>
            ) : (
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
            )}
          </div>

          {/* Title */}
          <h3 className="font-heading text-title font-semibold text-surface-900">
            {passed ? "Quiz bestanden!" : "Leider nicht bestanden"}
          </h3>

          {/* Score */}
          <div className="mt-4">
            <p className="text-4xl font-bold tabular-nums text-surface-900">
              {score}%
            </p>
            <p className="mt-1 text-body-sm text-surface-500">
              {correctCount} von {totalQuestions} richtig
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mx-auto mt-4 max-w-xs">
            <ProgressBar
              value={score}
              variant={passed ? "green" : "gold"}
              showLabel={false}
              size="lg"
            />
            <p className="mt-1 text-caption text-surface-400">
              Mindestens {passingScore}% zum Bestehen erforderlich
            </p>
          </div>

          {/* Question Review */}
          <div className="mt-6 space-y-2 text-left">
            {questions.map((q, index) => {
              const answer = answers.get(index);
              return (
                <div
                  key={index}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 ${
                    answer?.isCorrect
                      ? "bg-brand-primary-50"
                      : "bg-red-50"
                  }`}
                >
                  {answer?.isCorrect ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-brand-primary-500" />
                  ) : (
                    <XCircle className="h-4 w-4 shrink-0 text-red-500" />
                  )}
                  <span className="text-body-sm text-surface-700 line-clamp-1">
                    {q.question}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Actions */}
          <div className="mt-6 flex justify-center gap-3">
            {!passed && (
              <Button
                variant="ghost"
                iconLeft={<RotateCcw />}
                onClick={handleReset}
              >
                Erneut versuchen
              </Button>
            )}
            {passed && (
              <Button
                iconLeft={<CheckCircle2 />}
                onClick={handleSubmit}
                isLoading={isSubmitting}
              >
                Lektion abschliessen
              </Button>
            )}
          </div>
        </div>
      </Card>
    );
  }

  // --- Question View ---
  if (!question) return null;

  return (
    <Card>
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-body-sm font-medium text-surface-500">
          Frage {currentQuestion + 1} von {totalQuestions}
        </p>
        <p className="text-caption text-surface-400">
          {correctCount} richtig
        </p>
      </div>

      {/* Progress */}
      <div className="mt-2">
        <ProgressBar
          value={((currentQuestion + 1) / totalQuestions) * 100}
          showLabel={false}
          size="sm"
          variant="blue"
        />
      </div>

      {/* Question */}
      <h3 className="mt-4 font-heading text-title-sm font-semibold text-surface-900">
        {question.question}
      </h3>

      {/* Options */}
      <div className="mt-4 space-y-2">
        {question.options.map((option, optionIndex) => {
          const isSelected = currentAnswer?.selectedOption === optionIndex;
          const isCorrectOption = optionIndex === question.correctIndex;
          const hasAnswered = currentAnswer?.hasAnswered ?? false;

          let optionStyle = "border-surface-200 hover:border-surface-300 hover:bg-surface-50";

          if (hasAnswered) {
            if (isCorrectOption) {
              optionStyle = "border-brand-primary-300 bg-brand-primary-50";
            } else if (isSelected && !isCorrectOption) {
              optionStyle = "border-red-300 bg-red-50";
            } else {
              optionStyle = "border-surface-200 opacity-60";
            }
          } else if (isSelected) {
            optionStyle = "border-brand-primary-500 bg-brand-primary-50";
          }

          return (
            <button
              key={optionIndex}
              onClick={() => handleSelectOption(optionIndex)}
              disabled={hasAnswered}
              className={`flex w-full items-center gap-3 rounded-lg border p-4 text-left transition-colors ${optionStyle}`}
            >
              {/* Option Letter */}
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-caption font-semibold ${
                  hasAnswered && isCorrectOption
                    ? "bg-brand-primary-500 text-white"
                    : hasAnswered && isSelected && !isCorrectOption
                      ? "bg-red-500 text-white"
                      : "bg-surface-200 text-surface-600"
                }`}
              >
                {String.fromCharCode(65 + optionIndex)}
              </span>

              {/* Option Text */}
              <span className="text-body text-surface-700">{option}</span>

              {/* Result Icon */}
              {hasAnswered && isCorrectOption && (
                <CheckCircle2 className="ml-auto h-5 w-5 shrink-0 text-brand-primary-500" />
              )}
              {hasAnswered && isSelected && !isCorrectOption && (
                <XCircle className="ml-auto h-5 w-5 shrink-0 text-red-500" />
              )}
            </button>
          );
        })}
      </div>

      {/* Explanation */}
      {currentAnswer?.hasAnswered && question.explanation && (
        <div className="mt-4 rounded-lg bg-blue-50 p-3">
          <p className="text-body-sm font-medium text-blue-700">Erklaerung</p>
          <p className="mt-0.5 text-body-sm text-blue-600">
            {question.explanation}
          </p>
        </div>
      )}

      {/* Next Button */}
      {currentAnswer?.hasAnswered && (
        <div className="mt-4 flex justify-end">
          <Button
            iconRight={<ArrowRight />}
            onClick={handleNext}
          >
            {currentQuestion < totalQuestions - 1
              ? "Naechste Frage"
              : "Ergebnis anzeigen"}
          </Button>
        </div>
      )}
    </Card>
  );
}
