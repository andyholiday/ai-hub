"use client";

// =============================================================================
// Community Page
// Lists community posts with filtering, sorting, and post creation.
// =============================================================================

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import {
  MessageSquare,
  ThumbsUp,
  Eye,
  Plus,
  Search,
  Filter,
  X,
  Pin,
  Loader2,
} from "lucide-react";
import type { CommunityPostType } from "@/lib/validators/community";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PostAuthor {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  level: number;
}

interface Post {
  id: string;
  title: string;
  content: string;
  type: CommunityPostType;
  tags: string[];
  upvotes_count: number;
  comments_count: number;
  views_count: number;
  is_pinned: boolean;
  created_at: string;
  author: PostAuthor;
  hasUpvoted: boolean;
}

type SortOption = "newest" | "most_upvoted" | "most_viewed";

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

const SORT_LABELS: Record<SortOption, string> = {
  newest: "Neueste",
  most_upvoted: "Beliebteste",
  most_viewed: "Meistgesehen",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CommunityPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeType, setActiveType] = useState<CommunityPostType | null>(null);
  const [sort, setSort] = useState<SortOption>("newest");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [votingPostId, setVotingPostId] = useState<string | null>(null);

  // --- Fetch Posts ---
  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set("sort", sort);
      if (activeType) params.set("type", activeType);
      if (search.trim()) params.set("search", search.trim());

      const res = await fetch(`/api/community/posts?${params.toString()}`);
      const json = await res.json();

      if (json.error) {
        setError(json.error.message);
        return;
      }

      setPosts(json.data ?? []);
    } catch {
      setError("Beitraege konnten nicht geladen werden.");
    } finally {
      setIsLoading(false);
    }
  }, [sort, activeType, search]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // --- Toggle Vote ---
  const handleVote = async (postId: string) => {
    setVotingPostId(postId);
    try {
      const res = await fetch(`/api/community/posts/${postId}/vote`, {
        method: "POST",
      });
      const json = await res.json();

      if (json.data) {
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId
              ? {
                  ...p,
                  hasUpvoted: json.data.voted,
                  upvotes_count: p.upvotes_count + (json.data.voted ? 1 : -1),
                }
              : p,
          ),
        );
      }
    } finally {
      setVotingPostId(null);
    }
  };

  // --- Handle Post Created ---
  const handlePostCreated = (newPost: Post) => {
    setPosts((prev) => [newPost, ...prev]);
    setShowCreateForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-surface-900">
            Community
          </h1>
          <p className="mt-1 text-body-sm text-surface-500">
            Diskutiere, teile Ideen und lerne von der Community.
          </p>
        </div>
        <Button
          iconLeft={<Plus />}
          onClick={() => setShowCreateForm(true)}
        >
          Neuer Beitrag
        </Button>
      </div>

      {/* Create Post Form */}
      {showCreateForm && (
        <CreatePostForm
          onClose={() => setShowCreateForm(false)}
          onCreated={handlePostCreated}
        />
      )}

      {/* Filters & Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex-1">
          <Input
            placeholder="Beitraege durchsuchen..."
            prefixIcon={<Search />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="sm"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-surface-400" />
          {(Object.keys(POST_TYPE_LABELS) as CommunityPostType[]).map(
            (type) => (
              <button
                key={type}
                onClick={() =>
                  setActiveType(activeType === type ? null : type)
                }
                className={`rounded-full px-3 py-1 text-caption font-medium transition-colors ${
                  activeType === type
                    ? "bg-lr-green-500 text-white"
                    : "bg-surface-100 text-surface-600 hover:bg-surface-200"
                }`}
              >
                {POST_TYPE_LABELS[type]}
              </button>
            ),
          )}
        </div>
      </div>

      {/* Sort */}
      <div className="flex items-center gap-2">
        <span className="text-body-sm text-surface-500">Sortieren:</span>
        {(Object.keys(SORT_LABELS) as SortOption[]).map((option) => (
          <button
            key={option}
            onClick={() => setSort(option)}
            className={`rounded-lg px-3 py-1 text-caption font-medium transition-colors ${
              sort === option
                ? "bg-lr-green-50 text-lr-green-700"
                : "text-surface-500 hover:text-surface-700"
            }`}
          >
            {SORT_LABELS[option]}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <Card className="border-error bg-error-light p-4">
          <p className="text-body-sm text-error-dark">{error}</p>
        </Card>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-lr-green-500" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && posts.length === 0 && (
        <Card className="py-12 text-center">
          <MessageSquare className="mx-auto h-12 w-12 text-surface-300" />
          <p className="mt-4 text-title-sm font-semibold text-surface-700">
            Keine Beitraege gefunden
          </p>
          <p className="mt-1 text-body-sm text-surface-500">
            Sei der Erste und erstelle einen Beitrag!
          </p>
        </Card>
      )}

      {/* Post List */}
      {!isLoading && posts.length > 0 && (
        <div className="space-y-3">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onVote={handleVote}
              isVoting={votingPostId === post.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// PostCard Component
// ---------------------------------------------------------------------------

function PostCard({
  post,
  onVote,
  isVoting,
}: {
  post: Post;
  onVote: (postId: string) => void;
  isVoting: boolean;
}) {
  const timeAgo = getTimeAgo(post.created_at);

  return (
    <Card hoverable className="p-0">
      <Link href={`/community/${post.id}`} className="block p-5">
        <div className="flex gap-4">
          {/* Vote Column */}
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onVote(post.id);
              }}
              disabled={isVoting}
              className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${
                post.hasUpvoted
                  ? "bg-lr-green-50 text-lr-green-600"
                  : "bg-surface-100 text-surface-400 hover:bg-surface-200 hover:text-surface-600"
              }`}
              aria-label="Upvote"
            >
              <ThumbsUp className="h-4 w-4" />
            </button>
            <span
              className={`text-caption font-semibold ${
                post.hasUpvoted ? "text-lr-green-600" : "text-surface-500"
              }`}
            >
              {post.upvotes_count}
            </span>
          </div>

          {/* Content */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              {post.is_pinned && (
                <Pin className="h-3.5 w-3.5 text-lr-gold-500" />
              )}
              <Badge variant={POST_TYPE_COLORS[post.type]} size="sm">
                {POST_TYPE_LABELS[post.type]}
              </Badge>
              {post.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="gray" size="sm">
                  {tag}
                </Badge>
              ))}
            </div>

            <h3 className="mt-2 font-heading text-title-sm font-semibold text-surface-900 line-clamp-1">
              {post.title}
            </h3>

            <p className="mt-1 text-body-sm text-surface-500 line-clamp-2">
              {post.content}
            </p>

            {/* Meta Row */}
            <div className="mt-3 flex items-center gap-4 text-caption text-surface-400">
              <div className="flex items-center gap-1.5">
                <Avatar
                  name={post.author.full_name ?? ""}
                  src={post.author.avatar_url}
                  size="xs"
                />
                <span>{post.author.full_name ?? "Anonym"}</span>
              </div>

              <span>{timeAgo}</span>

              <div className="flex items-center gap-1">
                <MessageSquare className="h-3.5 w-3.5" />
                <span>{post.comments_count}</span>
              </div>

              <div className="flex items-center gap-1">
                <Eye className="h-3.5 w-3.5" />
                <span>{post.views_count}</span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// CreatePostForm Component
// ---------------------------------------------------------------------------

function CreatePostForm({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (post: Post) => void;
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState<CommunityPostType>("discussion");
  const [tagsInput, setTagsInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      const res = await fetch("/api/community/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, type, tags }),
      });

      const json = await res.json();

      if (json.error) {
        setFormError(json.error.message);
        return;
      }

      onCreated(json.data);
    } catch {
      setFormError("Beitrag konnte nicht erstellt werden.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading text-title-sm font-semibold text-surface-900">
          Neuer Beitrag
        </h2>
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-surface-400 hover:bg-surface-100 hover:text-surface-600"
          aria-label="Schliessen"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type Selection */}
        <div>
          <label className="mb-1.5 block text-body-sm font-medium text-surface-700">
            Typ
          </label>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(POST_TYPE_LABELS) as CommunityPostType[]).map(
              (t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`rounded-full px-3 py-1.5 text-caption font-medium transition-colors ${
                    type === t
                      ? "bg-lr-green-500 text-white"
                      : "bg-surface-100 text-surface-600 hover:bg-surface-200"
                  }`}
                >
                  {POST_TYPE_LABELS[t]}
                </button>
              ),
            )}
          </div>
        </div>

        <Input
          label="Titel"
          placeholder="Worum geht es?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <div>
          <label
            htmlFor="post-content"
            className="mb-1.5 block text-body-sm font-medium text-surface-700"
          >
            Inhalt
          </label>
          <textarea
            id="post-content"
            className="w-full rounded-[10px] border border-surface-300 bg-white px-3.5 py-2.5 text-body text-surface-900 placeholder:text-surface-400 focus:border-lr-green-500 focus:outline-none focus:ring-2 focus:ring-lr-green-500/20"
            rows={5}
            placeholder="Beschreibe deinen Beitrag..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          />
        </div>

        <Input
          label="Tags"
          placeholder="KI, Automatisierung, Tools (kommagetrennt)"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          hint="Maximal 10 Tags, kommagetrennt"
        />

        {formError && (
          <p className="text-caption font-medium text-error">{formError}</p>
        )}

        <div className="flex justify-end gap-3">
          <Button variant="ghost" type="button" onClick={onClose}>
            Abbrechen
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Beitrag erstellen
          </Button>
        </div>
      </form>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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
