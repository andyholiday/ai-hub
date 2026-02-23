import { useState, useEffect } from "react";
import { Loader2, Users, Search, Shield, CheckCircle, XCircle, Plus, X } from "lucide-react";

export function AdminUsersTab() {
    const [users, setUsers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Create User Form State
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [fullName, setFullName] = useState("");
    const [role, setRole] = useState("user");
    const [isApproved, setIsApproved] = useState(true);
    const [isCreating, setIsCreating] = useState(false);

    const fetchUsers = () => {
        setIsLoading(true);
        fetch("/api/admin/users")
            .then((res) => res.json())
            .then((data) => {
                if (data.error) throw new Error(data.error.message);
                setUsers(data.data || []);
            })
            .catch((err) => setError(err.message))
            .finally(() => setIsLoading(false));
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const toggleApproval = async (id: string, currentStatus: boolean) => {
        try {
            const res = await fetch("/api/admin/users", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, is_approved: !currentStatus })
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error.message);

            // Update local state
            setUsers(users.map(u => u.id === id ? { ...u, is_approved: !currentStatus } : u));
        } catch (err: any) {
            alert("Fehler beim Aktualisieren: " + err.message);
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreating(true);
        try {
            const res = await fetch("/api/admin/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password, full_name: fullName, role, is_approved: isApproved })
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error.message);

            setIsCreateModalOpen(false);
            setEmail("");
            setPassword("");
            setFullName("");
            setRole("user");

            fetchUsers();
        } catch (err: any) {
            alert("Fehler beim Erstellen: " + err.message);
        } finally {
            setIsCreating(false);
        }
    };

    if (isLoading && users.length === 0) {
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
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center gap-2 rounded-xl bg-lr-green-600 px-4 py-2 font-medium text-white transition-colors hover:bg-lr-green-700"
                >
                    <Plus className="h-4 w-4" />
                    Neuer Benutzer
                </button>
            </div>

            <div className="overflow-hidden rounded-[14px] border border-surface-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-surface-600">
                        <thead className="border-b border-surface-200 bg-surface-50 text-xs text-surface-500">
                            <tr>
                                <th className="px-6 py-4 font-semibold uppercase">Benutzer</th>
                                <th className="px-6 py-4 font-semibold uppercase">Details</th>
                                <th className="px-6 py-4 font-semibold uppercase">Freigabe</th>
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
                                        <button
                                            onClick={() => toggleApproval(user.id, user.is_approved)}
                                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${user.is_approved
                                                    ? "bg-green-100 text-green-700 hover:bg-green-200"
                                                    : "bg-red-100 text-red-700 hover:bg-red-200"
                                                }`}
                                        >
                                            {user.is_approved ? (
                                                <><CheckCircle className="h-3 w-3" /> Freigegeben</>
                                            ) : (
                                                <><XCircle className="h-3 w-3" /> Gesperrt</>
                                            )}
                                        </button>
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

            {/* Create User Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-900/50 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl animate-scale-up">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-xl font-bold text-surface-900">Neuen Benutzer anlegen</h3>
                            <button
                                onClick={() => setIsCreateModalOpen(false)}
                                className="rounded-full p-1 text-surface-400 hover:bg-surface-100 hover:text-surface-700"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateUser} className="space-y-4">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-surface-700">Vollständiger Name</label>
                                <input
                                    type="text"
                                    required
                                    value={fullName}
                                    onChange={e => setFullName(e.target.value)}
                                    className="w-full rounded-xl border border-surface-200 bg-surface-50 px-4 py-2 outline-none focus:border-lr-green-500 focus:ring-1 focus:ring-lr-green-500"
                                    placeholder="Max Mustermann"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-surface-700">E-Mail Adresse</label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="w-full rounded-xl border border-surface-200 bg-surface-50 px-4 py-2 outline-none focus:border-lr-green-500 focus:ring-1 focus:ring-lr-green-500"
                                    placeholder="max@example.com"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-surface-700">Passwort</label>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="w-full rounded-xl border border-surface-200 bg-surface-50 px-4 py-2 outline-none focus:border-lr-green-500 focus:ring-1 focus:ring-lr-green-500"
                                    placeholder="Mind. 6 Zeichen"
                                    minLength={6}
                                />
                            </div>
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="mb-1 block text-sm font-medium text-surface-700">Rolle</label>
                                    <select
                                        value={role}
                                        onChange={e => setRole(e.target.value)}
                                        className="w-full rounded-xl border border-surface-200 bg-surface-50 px-4 py-2 outline-none focus:border-lr-green-500 focus:ring-1 focus:ring-lr-green-500"
                                    >
                                        <option value="user">User</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                                <div className="flex flex-col justify-center pt-5">
                                    <label className="flex items-center gap-2 text-sm font-medium text-surface-700 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={isApproved}
                                            onChange={e => setIsApproved(e.target.checked)}
                                            className="h-4 w-4 rounded border-surface-300 text-lr-green-600 focus:ring-lr-green-500"
                                        />
                                        Direkt freigeben
                                    </label>
                                </div>
                            </div>

                            <div className="mt-6 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="rounded-xl border border-surface-200 px-4 py-2 font-medium text-surface-600 hover:bg-surface-50"
                                >
                                    Abbrechen
                                </button>
                                <button
                                    type="submit"
                                    disabled={isCreating}
                                    className="flex items-center rounded-xl bg-lr-green-600 px-4 py-2 font-medium text-white hover:bg-lr-green-700 disabled:opacity-50"
                                >
                                    {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Benutzer anlegen
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
