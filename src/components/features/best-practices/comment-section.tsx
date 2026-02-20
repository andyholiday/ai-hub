// =============================================================================
// CommentSection Component
// Comment input, list, and nested replies for Best Practices detail pages
// =============================================================================

"use client";

import { useState } from "react";
import { ThumbsUp, Reply, CornerDownRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface CommentData {
  id: string;
  author: {
    name: string;
    avatarUrl?: string | null;
  };
  text: string;
  createdAt: string;
  upvotes: number;
  replies?: CommentData[];
}

export interface CommentSectionProps {
  comments: CommentData[];
  className?: string;
}

// -----------------------------------------------------------------------------
// CommentInput
// -----------------------------------------------------------------------------

function CommentInput({
  placeholder = "Schreibe einen Kommentar...",
  onSubmit,
  autoFocus = false,
  compact = false,
}: {
  placeholder?: string;
  onSubmit?: (text: string) => void;
  autoFocus?: boolean;
  compact?: boolean;
}) {
  const [text, setText] = useState("");

  const handleSubmit = () => {
    if (text.trim()) {
      onSubmit?.(text.trim());
      setText("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleSubmit();
    }
  };

  return (
    <div className={cn("flex gap-3", compact && "gap-2")}>
      <Avatar name="Sarah Hoffmann" size={compact ? "xs" : "sm"} />
      <div className="flex-1">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          rows={compact ? 2 : 3}
          className={cn(
            "w-full resize-none rounded-[10px] border border-surface-300 bg-white px-3.5 py-2.5",
            "text-body text-surface-900 placeholder:text-surface-400",
            "transition-all duration-200 ease-out",
            "focus:border-lr-green-500 focus:outline-none focus:ring-2 focus:ring-lr-green-500/20",
            compact && "text-body-sm py-2 px-3"
          )}
        />
        <div className="mt-2 flex items-center justify-between">
          <p className="text-caption text-surface-400">
            Cmd+Enter zum Absenden
          </p>
          <Button
            size="sm"
            disabled={!text.trim()}
            onClick={handleSubmit}
          >
            Kommentieren
          </Button>
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// SingleComment
// -----------------------------------------------------------------------------

function SingleComment({
  comment,
  depth = 0,
}: {
  comment: CommentData;
  depth?: number;
}) {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [isUpvoted, setIsUpvoted] = useState(false);
  const maxNestingDepth = 2;

  return (
    <div
      className={cn(
        "group",
        depth > 0 && "ml-8 border-l-2 border-surface-200 pl-4"
      )}
    >
      {/* Comment Content */}
      <div className="flex gap-3">
        <Avatar
          name={comment.author.name}
          src={comment.author.avatarUrl}
          size="sm"
        />
        <div className="min-w-0 flex-1">
          {/* Author + Date */}
          <div className="flex items-center gap-2">
            <span className="text-body-sm font-semibold text-surface-800">
              {comment.author.name}
            </span>
            <span className="text-caption text-surface-400">
              {comment.createdAt}
            </span>
          </div>

          {/* Comment Text */}
          <p className="mt-1 text-body-sm leading-relaxed text-surface-700">
            {comment.text}
          </p>

          {/* Actions */}
          <div className="mt-2 flex items-center gap-3">
            {/* Upvote */}
            <button
              onClick={() => setIsUpvoted(!isUpvoted)}
              className={cn(
                "flex items-center gap-1 rounded-md px-2 py-1 text-caption font-medium",
                "transition-colors duration-200",
                isUpvoted
                  ? "bg-lr-green-50 text-lr-green-600"
                  : "text-surface-400 hover:bg-surface-100 hover:text-surface-600"
              )}
              aria-label={isUpvoted ? "Upvote entfernen" : "Upvoten"}
            >
              <ThumbsUp className={cn("h-3 w-3", isUpvoted && "fill-current")} />
              <span>{isUpvoted ? comment.upvotes + 1 : comment.upvotes}</span>
            </button>

            {/* Reply Button (only if within max nesting) */}
            {depth < maxNestingDepth && (
              <button
                onClick={() => setShowReplyInput(!showReplyInput)}
                className={cn(
                  "flex items-center gap-1 rounded-md px-2 py-1 text-caption font-medium",
                  "text-surface-400 transition-colors duration-200",
                  "hover:bg-surface-100 hover:text-surface-600"
                )}
              >
                <Reply className="h-3 w-3" />
                <span>Antworten</span>
              </button>
            )}
          </div>

          {/* Reply Input */}
          {showReplyInput && (
            <div className="mt-3">
              <CommentInput
                placeholder="Antwort schreiben..."
                compact
                autoFocus
                onSubmit={() => setShowReplyInput(false)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Nested Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-4 space-y-4">
          {comment.replies.map((reply) => (
            <SingleComment key={reply.id} comment={reply} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// CommentSection
// -----------------------------------------------------------------------------

export function CommentSection({ comments, className }: CommentSectionProps) {
  return (
    <section className={cn("", className)} aria-label="Kommentare">
      {/* Section Header */}
      <div className="flex items-center gap-2 mb-6">
        <h2 className="font-heading text-title font-semibold text-surface-900">
          Kommentare
        </h2>
        <span className="flex h-6 min-w-[24px] items-center justify-center rounded-full bg-surface-100 px-2 text-caption font-semibold text-surface-500">
          {comments.length}
        </span>
      </div>

      {/* New Comment Input */}
      <div className="mb-8">
        <CommentInput />
      </div>

      {/* Comment List */}
      <div className="space-y-6">
        {comments.length === 0 ? (
          <div className="rounded-[14px] border border-dashed border-surface-300 p-8 text-center">
            <CornerDownRight className="mx-auto h-8 w-8 text-surface-300" />
            <p className="mt-2 text-body-sm text-surface-500">
              Noch keine Kommentare. Sei der Erste!
            </p>
          </div>
        ) : (
          comments.map((comment) => (
            <SingleComment key={comment.id} comment={comment} />
          ))
        )}
      </div>
    </section>
  );
}
