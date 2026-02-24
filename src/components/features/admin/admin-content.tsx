"use client";

import { useState, useEffect } from "react";
import { Loader2, FileText, CheckCircle, ExternalLink, MessageCircle } from "lucide-react";
import Link from "next/link";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ProfileRef {
    full_name: string | null;
}

interface BestPracticeRow {
    id: string;
    title: string;
    category: string;
    status: string;
    views_count: number;
    upvotes_count: number;
    profiles: ProfileRef | null;
}

interface CommunityPostRow {
    id: string;
    title: string;
    type: string;
    views_count: number;
    upvotes_count: number;
    profiles: ProfileRef | null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AdminContentTab() {
    const [data, setData] = useState<{ bestPractices: BestPracticeRow[], communityPosts: CommunityPostRow[] } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch("/api/admin/content")
            .then((res) => res.json())
            .then((json) => {
                if (json.error) throw new Error(json.error.message);
                setData(json.data);
            })
            .catch((err) => setError(err.message))
            .finally(() => setIsLoading(false));
    }, []);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center gap-3 py-20 animate-fade-in">
                <Loader2 className="h-8 w-8 animate-spin text-brand-primary-500" />
                <p className="text-sm text-surface-500">Content wird geladen...</p>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="rounded-[14px] border border-red-200 bg-red-50 p-6 text-center text-red-600">
                Fehler beim Laden von Content: {error}
            </div>
        );
    }

    return (
        <div className="animate-fade-in space-y-8">

            {/* Best Practices Section */}
            <div className="overflow-hidden rounded-[14px] border border-surface-200 bg-white shadow-sm">
                <div className="border-b border-surface-200 bg-surface-50 p-5">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                            <FileText className="h-6 w-6" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-surface-900">Best Practices</h2>
                            <p className="text-sm text-surface-500">Geprueftes Wissen und Use-Cases</p>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-surface-600">
                        <thead className="border-b border-surface-200 text-xs text-surface-400">
                            <tr>
                                <th className="px-6 py-4 font-semibold uppercase">Titel & Autor</th>
                                <th className="px-6 py-4 font-semibold uppercase">Kategorie</th>
                                <th className="px-6 py-4 font-semibold uppercase">Status</th>
                                <th className="px-6 py-4 font-semibold uppercase">Aufrufe</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-100">
                            {data.bestPractices.map((bp) => (
                                <tr key={bp.id} className="group hover:bg-surface-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <Link href={`/best-practices/${bp.id}`} className="font-semibold text-surface-900 hover:text-brand-primary-600 flex items-center gap-1.5">
                                            {bp.title} <ExternalLink className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </Link>
                                        <div className="mt-1 text-xs text-surface-400">{bp.profiles?.full_name || 'Unbekannt'}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-block rounded-md bg-surface-100 px-2 py-1 text-xs font-medium text-surface-600">
                                            {bp.category}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${bp.status === 'published' ? "bg-brand-primary-100 text-brand-primary-700" : "bg-surface-200 text-surface-600"
                                            }`}>
                                            {bp.status === 'published' && <CheckCircle className="h-3 w-3" />}
                                            {bp.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-surface-900">{bp.views_count} 👁️</div>
                                        <div className="text-xs text-surface-400">{bp.upvotes_count} ↑</div>
                                    </td>
                                </tr>
                            ))}
                            {data.bestPractices.length === 0 && (
                                <tr><td colSpan={4} className="p-8 text-center text-surface-500">Keine Einträge gefunden.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Community Posts Section */}
            <div className="overflow-hidden rounded-[14px] border border-surface-200 bg-white shadow-sm">
                <div className="border-b border-surface-200 bg-surface-50 p-5">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                            <MessageCircle className="h-6 w-6" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-surface-900">Community & Ideen</h2>
                            <p className="text-sm text-surface-500">UGC und Diskussionen</p>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-surface-600">
                        <thead className="border-b border-surface-200 text-xs text-surface-400">
                            <tr>
                                <th className="px-6 py-4 font-semibold uppercase">Thema</th>
                                <th className="px-6 py-4 font-semibold uppercase">Typ</th>
                                <th className="px-6 py-4 font-semibold uppercase">Interaktionen</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-100">
                            {data.communityPosts.map((post) => (
                                <tr key={post.id} className="hover:bg-surface-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-semibold text-surface-900">{post.title}</div>
                                        <div className="mt-1 text-xs text-surface-400">Von {post.profiles?.full_name || 'Unbekannt'}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-block rounded-md px-2 py-1 text-xs font-medium ${post.type === 'idea' ? "bg-amber-100 text-amber-800" : "bg-surface-100 text-surface-700"
                                            }`}>
                                            {post.type.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-surface-900">{post.views_count} 👁️</div>
                                        <div className="text-xs text-surface-400">{post.upvotes_count} ↑</div>
                                    </td>
                                </tr>
                            ))}
                            {data.communityPosts.length === 0 && (
                                <tr><td colSpan={3} className="p-8 text-center text-surface-500">Keine Einträge gefunden.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
}
