import { useState, useEffect, useCallback } from "react";

const API_BASE = "http://localhost:5000/api/employees";

// ── helpers ──────────────────────────────────────────────────────────────────
const apiFetch = async (url, options = {}) => {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
};

const EMPTY_FORM = { name: "", course: "", roll_no: "" };

// ── tiny components ───────────────────────────────────────────────────────────
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3200);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl text-sm font-medium tracking-wide transition-all
        ${type === "error" ? "bg-red-500 text-white" : "bg-emerald-500 text-white"}`}
    >
      <span>{type === "error" ? "✕" : "✓"}</span>
      {message}
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100">✕</button>
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-50 w-full max-w-md bg-[#0f1117] border border-white/10 rounded-2xl shadow-2xl p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-white tracking-tight">{title}</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors text-xl leading-none">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function EmployeeForm({ initial = EMPTY_FORM, onSubmit, loading, submitLabel }) {
  const [form, setForm] = useState(initial);
  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {[
        { key: "name", label: "Full Name", placeholder: "e.g. Riya Sharma" },
        { key: "course", label: "Course", placeholder: "e.g. B.Tech CSE" },
        { key: "roll_no", label: "Roll No.", placeholder: "e.g. CS2024001" },
      ].map(({ key, label, placeholder }) => (
        <div key={key}>
          <label className="block text-xs font-medium text-white/50 mb-1.5 tracking-widest uppercase">
            {label}
          </label>
          <input
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-white/20 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/30 transition"
            value={form[key]}
            onChange={set(key)}
            placeholder={placeholder}
            required
          />
        </div>
      ))}
      <button
        type="submit"
        disabled={loading}
        className="w-full mt-2 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors tracking-wide"
      >
        {loading ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}

function StatCard({ label, value, accent }) {
  return (
    <div className={`rounded-2xl p-5 border ${accent} bg-white/[0.03]`}>
      <p className="text-xs text-white/40 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-3xl font-bold text-white">{value}</p>
    </div>
  );
}

// ── main app ──────────────────────────────────────────────────────────────────
export default function App() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [search, setSearch]       = useState("");
  const [modal, setModal]         = useState(null); // "add" | { type:"edit", emp } | { type:"delete", emp }
  const [toast, setToast]         = useState(null);

  const notify = (message, type = "success") => setToast({ message, type });
  const closeModal = () => setModal(null);

  // ── fetch ──
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch(API_BASE);
      setEmployees(data);
    } catch (e) {
      notify(e.message, "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── CRUD ──
  const handleCreate = async (form) => {
    setSaving(true);
    try {
      const created = await apiFetch(API_BASE, { method: "POST", body: JSON.stringify(form) });
      setEmployees((p) => [...p, created]);
      notify("Employee added successfully");
      closeModal();
    } catch (e) { notify(e.message, "error"); }
    finally { setSaving(false); }
  };

  const handleUpdate = async (form) => {
    const { id } = modal.emp;
    setSaving(true);
    try {
      const updated = await apiFetch(`${API_BASE}/${id}`, { method: "PUT", body: JSON.stringify(form) });
      setEmployees((p) => p.map((e) => (e.id === id ? updated : e)));
      notify("Employee updated");
      closeModal();
    } catch (e) { notify(e.message, "error"); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    const { id } = modal.emp;
    setSaving(true);
    try {
      await apiFetch(`${API_BASE}/${id}`, { method: "DELETE" });
      setEmployees((p) => p.filter((e) => e.id !== id));
      notify("Employee removed");
      closeModal();
    } catch (e) { notify(e.message, "error"); }
    finally { setSaving(false); }
  };

  // ── filtered list ──
  const filtered = employees.filter((e) =>
    [e.name, e.course, e.roll_no].some((v) =>
      String(v).toLowerCase().includes(search.toLowerCase())
    )
  );

  const courses = [...new Set(employees.map((e) => e.course))].length;

  return (
    <div className="min-h-screen bg-[#080a0f] text-white font-sans">
      {/* noise texture overlay */}
      <div className="pointer-events-none fixed inset-0 opacity-[0.03] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJub2lzZSI+PGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjAuNjUiIG51bU9jdGF2ZXM9IjMiIHN0aXRjaFRpbGVzPSJzdGl0Y2giLz48L2ZpbHRlcj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgZmlsdGVyPSJ1cmwoI25vaXNlKSIgb3BhY2l0eT0iMSIvPjwvc3ZnPg==')]" />

      {/* glow blobs */}
      <div className="pointer-events-none fixed top-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
      <div className="pointer-events-none fixed bottom-0 right-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl" />

      <div className="relative max-w-6xl mx-auto px-6 py-10">

        {/* ── header ── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <p className="text-xs text-indigo-400 tracking-[0.25em] uppercase mb-1">Management System</p>
            <h1 className="text-4xl font-bold tracking-tight">
              Employee{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">
                Directory
              </span>
            </h1>
          </div>
          <button
            onClick={() => setModal("add")}
            className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-400 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-lg shadow-indigo-500/20"
          >
            <span className="text-lg leading-none">+</span> Add Employee
          </button>
        </div>

        {/* ── stats ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
          <StatCard label="Total Employees" value={employees.length} accent="border-indigo-500/20" />
          <StatCard label="Courses" value={courses} accent="border-violet-500/20" />
          <StatCard label="Search Results" value={filtered.length} accent="border-sky-500/20" />
        </div>

        {/* ── search ── */}
        <div className="relative mb-6">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-sm">⌕</span>
          <input
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-white/25 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/30 transition"
            placeholder="Search by name, course, or roll no…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* ── table ── */}
        <div className="rounded-2xl border border-white/8 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-white/[0.04] border-b border-white/8">
                {["#", "Name", "Course", "Roll No.", "Actions"].map((h) => (
                  <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-white/40 tracking-widest uppercase">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-20 text-white/30">
                    <div className="inline-block w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-20 text-white/25">
                    {search ? "No results match your search." : "No employees yet. Add one!"}
                  </td>
                </tr>
              ) : (
                filtered.map((emp, i) => (
                  <tr
                    key={emp.id}
                    className="border-b border-white/5 hover:bg-white/[0.03] transition-colors group"
                  >
                    <td className="px-5 py-4 text-white/30 font-mono text-xs">{String(i + 1).padStart(2, "0")}</td>
                    <td className="px-5 py-4 font-medium text-white">{emp.name}</td>
                    <td className="px-5 py-4">
                      <span className="px-2.5 py-1 bg-indigo-500/15 text-indigo-300 rounded-md text-xs font-medium">
                        {emp.course}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-mono text-white/60 text-xs">{emp.roll_no}</td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setModal({ type: "edit", emp })}
                          className="px-3 py-1.5 text-xs font-medium bg-white/8 hover:bg-indigo-500/20 hover:text-indigo-300 rounded-lg transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setModal({ type: "delete", emp })}
                          className="px-3 py-1.5 text-xs font-medium bg-white/8 hover:bg-red-500/20 hover:text-red-400 rounded-lg transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <p className="text-center text-xs text-white/20 mt-6">
          {filtered.length} of {employees.length} employees shown
        </p>
      </div>

      {/* ── modals ── */}
      {modal === "add" && (
        <Modal title="Add New Employee" onClose={closeModal}>
          <EmployeeForm onSubmit={handleCreate} loading={saving} submitLabel="Add Employee" />
        </Modal>
      )}

      {modal?.type === "edit" && (
        <Modal title="Edit Employee" onClose={closeModal}>
          <EmployeeForm
            initial={modal.emp}
            onSubmit={handleUpdate}
            loading={saving}
            submitLabel="Save Changes"
          />
        </Modal>
      )}

      {modal?.type === "delete" && (
        <Modal title="Confirm Deletion" onClose={closeModal}>
          <p className="text-white/60 mb-6">
            Are you sure you want to remove{" "}
            <span className="text-white font-semibold">{modal.emp.name}</span>? This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <button
              onClick={closeModal}
              className="flex-1 py-2.5 rounded-lg bg-white/8 hover:bg-white/12 text-white/70 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={saving}
              className="flex-1 py-2.5 rounded-lg bg-red-500 hover:bg-red-400 disabled:opacity-50 text-white font-semibold transition-colors"
            >
              {saving ? "Deleting…" : "Delete"}
            </button>
          </div>
        </Modal>
      )}

      {/* ── toast ── */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}