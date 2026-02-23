import { useState, useEffect } from "react";
import { Loader2, Users, Search, Shield } from "lucide-react";

export function AdminUsersTab() {
    const [users, setUsers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch("/api/admin/users")
            .then((res) => res.json())
            .then((data) => {
                if (data.error) throw new Error(data.error.message);
                setUsers(data.data || []);
            })
            .catch((err) => setError(err.message))
            .finally(() => setIsLoading(false));
    }, []);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center gap-3 py-20 animate-fade-in">
                <Loader2 className="h-8 w-8 animate-spin text-lr-green-500" />
                <p className="text-sm text-surface-500">Benutzerdaten werden geladen...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-[14px] border border-red-200 bg-red-50 p-6 text-center text-red-600">
                Fehler beim Laden der Benutzer: {error}
            </div>
        );
    }

    return (
        <div className="animate-fade-in space-y-5">
            <div className="flex items-center justify-between rounded-[14px] border border-surface-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-lr-green-50 text-lr-green-600">
                        <Users className="h-6 w-6" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-surface-900">Benutzer-Verwaltung</h2>
                        <p className="text-sm text-surface-500">{users.length} Registrierte Accounts</p>
                    </div>
                </div>
            </div>

            <div className="overflow-hidden rounded-[14px] border border-surface-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-surface-600">
                        <thead className="border-b border-surface-200 bg-surface-50 text-xs text-surface-500">
                            <tr>
                                <th className="px-6 py-4 font-semibold uppercase">Benutzer</th>
                                <th className="px-6 py-4 font-semibold uppercase">Details</th>
                                <th className="px-6 py-4 font-semibold uppercase">XP / Level</th>
                                <th className="px-6 py-4 font-semibold uppercase">Rolle</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-100">
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-surface-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-semibold text-surface-900">{user.full_name}</div>
                                        <div className="text-xs text-surface-400">{user.email}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {user.department ? (
                                            <div>
                                                <span className="font-medium text-surface-700">{user.department}</span>
                                                <br />
                                                <span className="text-xs text-surface-400">{user.position}</span>
                                            </div>
                                        ) : (
                                            <span className="text-xs italic text-surface-400">Keine Angabe</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1.5 font-medium text-surface-900">
                                            <span className="text-amber-500">★</span> {user.xp} XP
                                        </div>
                                        <div className="text-xs text-surface-400">Level {user.level}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span
                                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${user.role === "admin"
                                                    ? "bg-purple-100 text-purple-700"
                                                    : "bg-surface-100 text-surface-600"
                                                }`}
                                        >
                                            {user.role === "admin" && <Shield className="h-3 w-3" />}
                                            {user.role}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {users.length === 0 && (
                        <div className="p-10 text-center text-surface-500">Keine Benutzer gefunden.</div>
                    )}
                </div>
            </div>
        </div>
    );
}
