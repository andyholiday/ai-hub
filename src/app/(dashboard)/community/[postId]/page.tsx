"use client";

// =============================================================================
// Community Post Detail Page
// Shows a single post with its threaded comments.
// =============================================================================

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import {
  ArrowLeft,
  ThumbsUp,
  MessageSquare,
  Eye,
  Pin,
  Loader2,
  Send,
  Reply,
  Trash2,
  Sparkles,
} from "lucide-react";
import type { CommunityPostType } from "@/lib/validators/community";
import type { UseCaseEvaluation } from "@/lib/validators/evaluation";
import { EvaluationCard } from "@/components/features/community/evaluation-card";
import { useUiSound } from "@/hooks/use-ui-sound";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Author {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  level: number;
}

interface CommentNode {
  id: string;
  content: string;
  author_id: string;
  parent_id: string | null;
  created_at: string;
  upvotes_count: number;
  author: Author;
  replies: CommentNode[];
}

interface PostDetail {
  id: string;
  title: string;
  content: string;
  type: CommunityPostType;
  tags: string[];
  upvotes_count: number;
  comments_count: number;
  views_count: number;
  is_pinned: boolean;
  is_resolved: boolean;
  author_id: string;
  created_at: string;
  updated_at: string;
  author: Author;
  hasUpvoted: boolean;
  comments: CommentNode[];
  evaluation: UseCaseEvaluation | null;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const POST_TYPE_LABELS: Record<CommunityPostType, string> = {
  discussion: "Diskussion",
  idea: "Idee",
  show_and_tell: "Show & Tell",
  question: "Frage",
  challenge: "Challenge",
};

const POST_TYPE_COLORS: Record<CommunityPostType, "green" | "blue" | "gold" | "purple" | "red"> = {
  discussion: "blue",
  idea: "gold",
  show_and_tell: "purple",
  question: "green",
  challenge: "red",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CommunityPostPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.postId as string;
  const { playSuccessChime } = useUiSound();

  const [post, setPost] = useState<PostDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationError, setEvaluationError] = useState<string | null>(null);

  // --- Fetch Post ---
  const fetchPost = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/community/posts/${postId}`);
      const json = await res.json();

      if (json.error) {
        setError(json.error.message);
        return;
      }

      setPost(json.data);
    } catch {
      setError("Beitrag konnte nicht geladen werden.");
    } finally {
      setIsLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  // --- Toggle Vote ---
  const handleVote = async () => {
    if (!post) return;
    setIsVoting(true);

    try {
      const res = await fetch(`/api/community/posts/${postId}/vote`, {
        method: "POST",
      });
      const json = await res.json();

      if (json.data) {
        setPost((prev) =>
          prev
            ? {
              ...prev,
              hasUpvoted: json.data.voted,
              upvotes_count:
                prev.upvotes_count + (json.data.voted ? 1 : -1),
            }
            : prev,
        );
      }
    } finally {
      setIsVoting(false);
    }
  };

  // --- Delete Post ---
  const handleDelete = async () => {
    if (!post) return;
    if (!confirm("Beitrag wirklich loeschen?")) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/community/posts/${postId}`, {
        method: "DELETE",
      });
      const json = await res.json();

      if (json.data?.deleted) {
        router.push("/community");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  // --- Request AI Evaluation ---
  const handleRequestEvaluation = async () => {
    if (!post || post.type !== "idea") return;
    setIsEvaluating(true);
    setEvaluationError(null);

    try {
      const res = await fetch("/api/ai/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: post.id,
          title: post.title,
          description: post.content,
        }),
      });

      const json = await res.json();

      if (json.error) {
        setEvaluationError(json.error.message);
        return;
      }

      // Update post with evaluation data
      setPost((prev) =>
        prev
          ? { ...prev, evaluation: json.data.evaluation }
          : prev,
      );

      // Play a success chime to notify the user
      playSuccessChime();
    } catch {
      setEvaluationError("Bewertung konnte nicht angefordert werden.");
    } finally {
      setIsEvaluating(false);
    }
  };

  // --- Handle Comment Added ---
  const handleCommentAdded = (comment: CommentNode) => {
    setPost((prev) => {
      if (!prev) return prev;

      if (comment.parent_id) {
        // Add as reply to parent
        return {
          ...prev,
          comments_count: prev.comments_count + 1,
          comments: addReplyToTree(prev.comments, comment.parent_id, comment),
        };
      }

      // Add as top-level comment
      return {
        ...prev,
        comments_count: prev.comments_count + 1,
        comments: [...prev.comments, comment],
      };
    });
  };

  // --- Loading ---
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-lr-green-500" />
      </div>
    );
  }

  // --- Error ---
  if (error || !post) {
    return (
      <div className="space-y-4">
        <Link
          href="/community"
          className="inline-flex items-center gap-1.5 text-body-sm text-surface-500 hover:text-surface-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Zurueck zur Community
        </Link>
        <Card className="py-12 text-center">
          <p className="text-title-sm font-semibold text-surface-700">
            {error ?? "Beitrag nicht gefunden"}
          </p>
        </Card>
      </div>
    );
  }

  const createdDate = new Date(post.created_at).toLocaleDateString("de-DE", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Back Link */}
      <Link
        href="/community"
        className="inline-flex items-center gap-1.5 text-body-sm text-surface-500 hover:text-surface-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Zurueck zur Community
      </Link>

      {/* Post Card */}
      <Card>
        {/* Header */}
        <div className="flex items-start gap-4">
          {/* Vote Column */}
          <div className="flex flex-col items-center gap-1 pt-1">
            <button
              onClick={handleVote}
              disabled={isVoting}
              className={`flex h-12 w-12 items-center justify-center rounded-xl transition-colors ${post.hasUpvoted
                  ? "bg-lr-green-50 text-lr-green-600"
                  : "bg-surface-100 text-surface-400 hover:bg-surface-200 hover:text-surface-600"
                }`}
              aria-label="Upvote"
            >
              <ThumbsUp className="h-5 w-5" />
            </button>
            <span
              className={`text-body-sm font-bold ${post.hasUpvoted ? "text-lr-green-600" : "text-surface-500"
                }`}
            >
              {post.upvotes_count}
            </span>
          </div>

          {/* Content */}
          <div className="min-w-0 flex-1">
            {/* Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              {post.is_pinned && (
                <Pin className="h-3.5 w-3.5 text-lr-gold-500" />
              )}
              <Badge variant={POST_TYPE_COLORS[post.type]} size="md">
                {POST_TYPE_LABELS[post.type]}
              </Badge>
              {post.tags.map((tag) => (
                <Badge key={tag} variant="gray" size="sm">
                  {tag}
                </Badge>
              ))}
            </div>

            {/* Title */}
            <h1 className="mt-3 font-display text-xl font-bold text-surface-900 sm:text-2xl">
              {post.title}
            </h1>

            {/* Author / Meta */}
            <div className="mt-3 flex items-center gap-3 text-body-sm text-surface-500">
              <div className="flex items-center gap-2">
                <Avatar
                  name={post.author.full_name ?? ""}
                  src={post.author.avatar_url}
                  size="sm"
                />
                <div>
                  <span className="font-medium text-surface-700">
                    {post.author.full_name ?? "Anonym"}
                  </span>
                  <span className="ml-1.5 text-caption text-surface-400">
                    Level {post.author.level}
                  </span>
                </div>
              </div>
              <span className="text-surface-300">|</span>
              <span>{createdDate}</span>
            </div>

            {/* Content */}
            <div className="mt-5 whitespace-pre-wrap text-body text-surface-700 leading-relaxed">
              {post.content}
            </div>

            {/* Stats */}
            <div className="mt-5 flex items-center gap-4 border-t border-surface-200 pt-4 text-body-sm text-surface-400">
              <div className="flex items-center gap-1.5">
                <MessageSquare className="h-4 w-4" />
                <span>
                  {post.comments_count}{" "}
                  {post.comments_count === 1 ? "Kommentar" : "Kommentare"}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Eye className="h-4 w-4" />
                <span>{post.views_count} Aufrufe</span>
              </div>

              {/* Delete button for author */}
              <div className="ml-auto">
                <Button
                  variant="ghost"
                  size="sm"
                  iconLeft={<Trash2 />}
                  onClick={handleDelete}
                  isLoading={isDeleting}
                  className="text-surface-400 hover:text-error"
                >
                  Loeschen
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* AI Evaluation Section (only for idea posts) */}
      {post.type === "idea" && (
        <div className="space-y-4">
          {post.evaluation ? (
            <EvaluationCard evaluation={post.evaluation} />
          ) : (
            <Card className="text-center">
              <div className="space-y-3 py-4">
                <Sparkles className="mx-auto h-10 w-10 text-lr-gold-500" />
                <div>
                  <h3 className="font-heading text-title-sm font-semibold text-surface-900">
                    KI-Bewertung
                  </h3>
                  <p className="mt-1 text-body-sm text-surface-500">
                    Lass diese Idee von der KI bewerten und erhalte detailliertes Feedback zu
                    Machbarkeit, Impact und mehr.
                  </p>
                </div>
                {evaluationError && (
                  <p className="text-caption font-medium text-error">
                    {evaluationError}
                  </p>
                )}
                <Button
                  onClick={handleRequestEvaluation}
                  isLoading={isEvaluating}
                  loadingText="KI bewertet..."
                  iconLeft={<Sparkles />}
                >
                  KI-Bewertung anfordern
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Comment Section */}
      <div className="space-y-4">
        <h2 className="font-heading text-title-sm font-semibold text-surface-900">
          Kommentare ({post.comments_count})
        </h2>

        {/* New Comment Form */}
        <CommentForm postId={postId} onCommentAdded={handleCommentAdded} />

        {/* Comment Tree */}
        {post.comments.length === 0 && (
          <Card className="py-8 text-center">
            <MessageSquare className="mx-auto h-10 w-10 text-surface-300" />
            <p className="mt-3 text-body-sm text-surface-500">
              Noch keine Kommentare. Sei der Erste!
            </p>
          </Card>
        )}

        {post.comments.map((comment) => (
          <CommentThread
            key={comment.id}
            comment={comment}
            postId={postId}
            onReplyAdded={handleCommentAdded}
            depth={0}
          />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// CommentForm Component
// ---------------------------------------------------------------------------

function CommentForm({
  postId,
  parentId,
  onCommentAdded,
  onCancel,
  autoFocus = false,
}: {
  postId: string;
  parentId?: string;
  onCommentAdded: (comment: CommentNode) => void;
  onCancel?: () => void;
  autoFocus?: boolean;
}) {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    setFormError(null);

    try {
      const res = await fetch(`/api/community/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content.trim(),
          parent_id: parentId ?? null,
        }),
      });

      const json = await res.json();

      if (json.error) {
        setFormError(json.error.message);
        return;
      }

      onCommentAdded(json.data);
      setContent("");
    } catch {
      setFormError("Kommentar konnte nicht erstellt werden.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className={parentId ? "ml-6 border-l-2 border-lr-green-200" : ""}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          className="w-full rounded-[10px] border border-surface-300 bg-white px-3.5 py-2.5 text-body text-surface-900 placeholder:text-surface-400 focus:border-lr-green-500 focus:outline-none focus:ring-2 focus:ring-lr-green-500/20"
          rows={parentId ? 2 : 3}
          placeholder={
            parentId ? "Antwort schreiben..." : "Schreibe einen Kommentar..."
          }
          value={content}
          onChange={(e) => setContent(e.target.value)}
          autoFocus={autoFocus}
        />

        {formError && (
          <p className="text-caption font-medium text-error">{formError}</p>
        )}

        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button variant="ghost" size="sm" type="button" onClick={onCancel}>
              Abbrechen
            </Button>
          )}
          <Button
            size="sm"
            type="submit"
            isLoading={isSubmitting}
            disabled={!content.trim()}
            iconLeft={<Send />}
          >
            {parentId ? "Antworten" : "Kommentieren"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// CommentThread Component (recursive for nested comments)
// ---------------------------------------------------------------------------

function CommentThread({
  comment,
  postId,
  onReplyAdded,
  depth,
}: {
  comment: CommentNode;
  postId: string;
  onReplyAdded: (comment: CommentNode) => void;
  depth: number;
}) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const maxDepth = 4;

  const timeAgo = getTimeAgo(comment.created_at);

  return (
    <div className={depth > 0 ? "ml-6 border-l-2 border-surface-200 pl-4" : ""}>
      <Card className="p-4">
        {/* Author */}
        <div className="flex items-center gap-2">
          <Avatar
            name={comment.author.full_name ?? ""}
            src={comment.author.avatar_url}
            size="xs"
          />
          <span className="text-body-sm font-medium text-surface-700">
            {comment.author.full_name ?? "Anonym"}
          </span>
          <span className="text-caption text-surface-400">
            Level {comment.author.level}
          </span>
          <span className="text-caption text-surface-400">{timeAgo}</span>
        </div>

        {/* Content */}
        <p className="mt-2 whitespace-pre-wrap text-body-sm text-surface-600 leading-relaxed">
          {comment.content}
        </p>

        {/* Actions */}
        <div className="mt-2 flex items-center gap-3">
          {depth < maxDepth && (
            <button
              onClick={() => setShowReplyForm(!showReplyForm)}
              className="flex items-center gap-1 text-caption text-surface-400 hover:text-lr-green-600"
            >
              <Reply className="h-3.5 w-3.5" />
              Antworten
            </button>
          )}
        </div>
      </Card>

      {/* Reply Form */}
      {showReplyForm && (
        <div className="mt-2">
          <CommentForm
            postId={postId}
            parentId={comment.id}
            onCommentAdded={(newComment) => {
              onReplyAdded(newComment);
              setShowReplyForm(false);
            }}
            onCancel={() => setShowReplyForm(false)}
            autoFocus
          />
        </div>
      )}

      {/* Nested Replies */}
      {comment.replies.length > 0 && (
        <div className="mt-2 space-y-2">
          {comment.replies.map((reply) => (
            <CommentThread
              key={reply.id}
              comment={reply}
              postId={postId}
              onReplyAdded={onReplyAdded}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function addReplyToTree(
  comments: CommentNode[],
  parentId: string,
  reply: CommentNode,
): CommentNode[] {
  return comments.map((comment) => {
    if (comment.id === parentId) {
      return {
        ...comment,
        replies: [...comment.replies, reply],
      };
    }
    if (comment.replies.length > 0) {
      return {
        ...comment,
        replies: addReplyToTree(comment.replies, parentId, reply),
      };
    }
    return comment;
  });
}

function getTimeAgo(dateString: string): string {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const diffMs = now - then;

  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "gerade eben";
  if (minutes < 60) return `vor ${minutes} Min.`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `vor ${hours} Std.`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `vor ${days} ${days === 1 ? "Tag" : "Tagen"}`;

  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `vor ${weeks} ${weeks === 1 ? "Woche" : "Wochen"}`;

  const months = Math.floor(days / 30);
  return `vor ${months} ${months === 1 ? "Monat" : "Monaten"}`;
}
