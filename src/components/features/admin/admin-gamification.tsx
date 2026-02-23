import { useState, useEffect } from "react";
import { Loader2, Medal, Target, BookOpen } from "lucide-react";

export function AdminGamificationTab() {
    const [data, setData] = useState<{ courses: any[], badges: any[], challenges: any[] } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch("/api/admin/gamification")
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
                <Loader2 className="h-8 w-8 animate-spin text-lr-green-500" />
                <p className="text-sm text-surface-500">Gamification-Daten werden geladen...</p>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="rounded-[14px] border border-red-200 bg-red-50 p-6 text-center text-red-600">
                Fehler beim Laden der Daten: {error}
            </div>
        );
    }

    return (
        <div className="animate-fade-in space-y-8">

            {/* Badges Section */}
            <div className="overflow-hidden rounded-[14px] border border-surface-200 bg-white shadow-sm">
                <div className="border-b border-surface-200 bg-surface-50 p-5">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                            <Medal className="h-6 w-6" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-surface-900">Achievements & Badges</h2>
                            <p className="text-sm text-surface-500">{data.badges.length} registrierte Badges im System</p>
                        </div>
                    </div>
                </div>

                <div className="p-5 grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {data.badges.map((b) => (
                        <div key={b.id} className="rounded-xl border border-surface-200 p-4">
                            <div className="font-semibold text-surface-900 text-sm mb-1">{b.name}</div>
                            <div className="text-xs text-surface-500 mb-2 truncate" title={b.description}>{b.description}</div>
                            <div className="flex items-center justify-between mt-auto">
                                <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md">{b.category}</span>
                                {b.xp_threshold > 0 && <span className="text-xs text-surface-400">Mindestens {b.xp_threshold} XP</span>}
                            </div>
                        </div>
                    ))}
                    {data.badges.length === 0 && (
                        <div className="col-span-full text-center text-sm p-4 text-surface-500">Keine Badges vorhanden.</div>
                    )}
                </div>
            </div>

            {/* Courses Section */}
            <div className="overflow-hidden rounded-[14px] border border-surface-200 bg-white shadow-sm">
                <div className="border-b border-surface-200 bg-surface-50 p-5">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                            <BookOpen className="h-6 w-6" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-surface-900">Lern-Kurse (Courses)</h2>
                            <p className="text-sm text-surface-500">{data.courses.length} Lernmodule verfuegbar</p>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-surface-600">
                        <thead className="border-b border-surface-200 text-xs text-surface-400 bg-surface-50">
                            <tr>
                                <th className="px-6 py-4 font-semibold uppercase">Kursname</th>
                                <th className="px-6 py-4 font-semibold uppercase">Level</th>
                                <th className="px-6 py-4 font-semibold uppercase">Belohnung</th>
                                <th className="px-6 py-4 font-semibold uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-100">
                            {data.courses.map((course) => (
                                <tr key={course.id} className="hover:bg-surface-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-semibold text-surface-900">{course.title}</div>
                                        <div className="text-xs text-surface-400">{course.category}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-block rounded-md px-2 py-1 text-xs font-medium bg-surface-100 text-surface-600">
                                            {course.difficulty}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-medium text-amber-500">
                                        +{course.xp_reward} XP
                                    </td>
                                    <td className="px-6 py-4">
                                        {course.is_published ? (
                                            <span className="text-lr-green-600 text-xs font-medium">Published</span>
                                        ) : (
                                            <span className="text-surface-400 text-xs font-medium">Draft</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {data.courses.length === 0 && (
                                <tr><td colSpan={4} className="p-8 text-center text-surface-500">Keine Kurse gefunden.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
}
