"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase, Transaction } from "@/lib/supabase";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const CATEGORIES = ["Vendas", "Serviços", "Salários", "Aluguel", "Fornecedores", "Marketing", "Impostos", "Outros"];

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const MONTHS = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<{ email: string; name: string } | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [filterCategory, setFilterCategory] = useState("todas");
  const [formData, setFormData] = useState({
    type: "entrada" as "entrada" | "saida",
    description: "",
    category: "Vendas",
    amount: "",
    transaction_date: new Date().toISOString().split("T")[0],
  });
  const [saving, setSaving] = useState(false);

  const fetchTransactions = useCallback(async (uid: string) => {
    const monthStr = String(filterMonth).padStart(2, "0");
    const startDate = `${filterYear}-${monthStr}-01`;
    const endDay = new Date(filterYear, filterMonth, 0).getDate();
    const endDate = `${filterYear}-${monthStr}-${endDay}`;
    const { data } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", uid)
      .gte("transaction_date", startDate)
      .lte("transaction_date", endDate)
      .order("transaction_date", { ascending: false });
    setTransactions(data || []);
  }, [filterMonth, filterYear]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) { router.replace("/login"); return; }
      const u = data.session.user;
      setUser({ email: u.email!, name: u.user_metadata?.name || u.email! });
      fetchTransactions(u.id).finally(() => setLoading(false));
    });
  }, [router, fetchTransactions]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  const handleSave = async () => {
    if (!formData.description || !formData.amount) return;
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    await supabase.from("transactions").insert({
      user_id: session.user.id,
      type: formData.type,
      description: formData.description,
      category: formData.category,
      amount: parseFloat(formData.amount),
      transaction_date: formData.transaction_date,
    });
    await fetchTransactions(session.user.id);
    setShowForm(false);
    setFormData({ type: "entrada", description: "", category: "Vendas", amount: "", transaction_date: new Date().toISOString().split("T")[0] });
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir esta movimentação?")) return;
    await supabase.from("transactions").delete().eq("id", id);
    const { data: { session } } = await supabase.auth.getSession();
    if (session) fetchTransactions(session.user.id);
  };

  const filtered = filterCategory === "todas"
    ? transactions
    : transactions.filter(t => t.category === filterCategory);

  const totalEntradas = filtered.filter(t => t.type === "entrada").reduce((s, t) => s + t.amount, 0);
  const totalSaidas = filtered.filter(t => t.type === "saida").reduce((s, t) => s + t.amount, 0);
  const saldo = totalEntradas - totalSaidas;

  const chartData = [
    { name: "Entradas", value: totalEntradas, color: "#4caf7d" },
    { name: "Saídas", value: totalSaidas, color: "#e05252" },
    { name: "Resultado", value: Math.abs(saldo), color: saldo >= 0 ? "#c9a84c" : "#e05252" },
  ];

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#0a0a0a" }}>
      <div style={{ width: 32, height: 32, border: "2px solid #2a2a2a", borderTop: "2px solid #c9a84c", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={s.page}>
      {/* Sidebar */}
      <aside style={s.sidebar}>
        <div style={s.logo}>
          <div style={s.logoIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#0a0a0a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span style={s.logoText}>FinPro</span>
        </div>

        <nav style={{ flex: 1 }}>
          <div style={s.navItem}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
            </svg>
            <span style={{ color: "#c9a84c", fontSize: 13, fontWeight: 600 }}>Dashboard</span>
          </div>
        </nav>

        <div style={s.userBox}>
          <div style={s.userAvatar}>{user?.name?.[0]?.toUpperCase() || "U"}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#e8e8e8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.name}</div>
            <div style={{ fontSize: 10, color: "#5a5a5a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.email}</div>
          </div>
          <button onClick={handleLogout} title="Sair" style={{ background: "none", border: "none", cursor: "pointer", color: "#5a5a5a", padding: 4, display: "flex" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
            </svg>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={s.main}>
        {/* Header */}
        <header style={s.header}>
          <div>
            <h1 style={s.pageTitle}>Visão Geral</h1>
            <p style={s.pageSubtitle}>
              {MONTHS[filterMonth - 1]} {filterYear}
            </p>
          </div>
          <button onClick={() => setShowForm(true)} style={s.btnGold}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Nova Movimentação
          </button>
        </header>

        {/* Stats */}
        <div style={s.statsGrid} className="animate-fade">
          <StatCard label="Saldo Atual" value={fmt(saldo)} color={saldo >= 0 ? "#4caf7d" : "#e05252"} icon="💼" />
          <StatCard label="Total Entradas" value={fmt(totalEntradas)} color="#4caf7d" icon="↑" />
          <StatCard label="Total Saídas" value={fmt(totalSaidas)} color="#e05252" icon="↓" />
          <StatCard label="Movimentações" value={String(filtered.length)} color="#c9a84c" icon="#" />
        </div>

        {/* Filters + Chart */}
        <div style={s.row} className="animate-fade-1">
          {/* Filters */}
          <div style={s.filtersCard}>
            <div style={s.cardHeader}>Filtros</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={s.label}>Mês</label>
                <select style={s.select} value={filterMonth} onChange={e => setFilterMonth(Number(e.target.value))}>
                  {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                </select>
              </div>
              <div>
                <label style={s.label}>Ano</label>
                <select style={s.select} value={filterYear} onChange={e => setFilterYear(Number(e.target.value))}>
                  {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div>
                <label style={s.label}>Categoria</label>
                <select style={s.select} value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                  <option value="todas">Todas</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Chart */}
          <div style={s.chartCard}>
            <div style={s.cardHeader}>Entradas × Saídas × Resultado</div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData} barCategoryGap={40}>
                <XAxis dataKey="name" tick={{ fill: "#5a5a5a", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#5a5a5a", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: "#161616", border: "1px solid #2a2a2a", borderRadius: 8, color: "#e8e8e8", fontSize: 12 }}
                  formatter={(v: unknown) => [fmt(Number(v)), ""]}
                  cursor={{ fill: "rgba(255,255,255,0.02)" }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Table */}
        <div style={s.tableCard} className="animate-fade-2">
          <div style={s.cardHeader}>
            Movimentações
            <span style={{ fontSize: 11, color: "#5a5a5a", fontWeight: 400 }}>{filtered.length} registros</span>
          </div>
          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#5a5a5a" }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#2a2a2a" strokeWidth="1.5" style={{ margin: "0 auto 12px", display: "block" }}>
                <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
              </svg>
              <p style={{ margin: 0, fontSize: 13 }}>Nenhuma movimentação neste período</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={s.table}>
                <thead>
                  <tr>
                    {["Data", "Descrição", "Categoria", "Tipo", "Valor", ""].map(h => (
                      <th key={h} style={s.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((t, i) => (
                    <tr key={t.id} style={{ ...s.tr, animationDelay: `${i * 0.03}s` }} className="animate-fade">
                      <td style={s.td}>
                        <span style={{ fontFamily: "monospace", fontSize: 12, color: "#a0a0a0" }}>
                          {new Date(t.transaction_date + "T12:00:00").toLocaleDateString("pt-BR")}
                        </span>
                      </td>
                      <td style={{ ...s.td, fontWeight: 500, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.description}</td>
                      <td style={s.td}>
                        <span style={s.catBadge}>{t.category}</span>
                      </td>
                      <td style={s.td}>
                        <span style={t.type === "entrada" ? s.badgeIn : s.badgeOut}>
                          {t.type === "entrada" ? "↑ Entrada" : "↓ Saída"}
                        </span>
                      </td>
                      <td style={{ ...s.td, fontWeight: 700, color: t.type === "entrada" ? "#4caf7d" : "#e05252", fontFamily: "monospace" }}>
                        {t.type === "entrada" ? "+" : "-"}{fmt(t.amount)}
                      </td>
                      <td style={s.td}>
                        <button onClick={() => handleDelete(t.id)} style={s.deleteBtn} title="Excluir">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Modal */}
      {showForm && (
        <div style={s.modalOverlay} onClick={() => setShowForm(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={s.goldLine} />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#e8e8e8" }}>Nova Movimentação</h3>
              <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", color: "#5a5a5a", cursor: "pointer", padding: 4 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              {(["entrada", "saida"] as const).map(t => (
                <button key={t} onClick={() => setFormData(f => ({ ...f, type: t }))}
                  style={{
                    flex: 1, padding: "9px 0", borderRadius: 8, border: `1px solid ${formData.type === t ? (t === "entrada" ? "#4caf7d" : "#e05252") : "#2a2a2a"}`,
                    background: formData.type === t ? (t === "entrada" ? "rgba(76,175,125,0.12)" : "rgba(224,82,82,0.12)") : "transparent",
                    color: formData.type === t ? (t === "entrada" ? "#4caf7d" : "#e05252") : "#5a5a5a",
                    cursor: "pointer", fontSize: 13, fontWeight: 600, transition: "all 0.2s",
                  }}>
                  {t === "entrada" ? "↑ Entrada" : "↓ Saída"}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={s.label}>Descrição</label>
                <input style={s.input} placeholder="Ex: Venda de produto A" value={formData.description} onChange={e => setFormData(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={s.label}>Categoria</label>
                  <select style={s.select} value={formData.category} onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={s.label}>Data</label>
                  <input style={s.input} type="date" value={formData.transaction_date} onChange={e => setFormData(f => ({ ...f, transaction_date: e.target.value }))} />
                </div>
              </div>
              <div>
                <label style={s.label}>Valor (R$)</label>
                <input style={s.input} type="number" min="0" step="0.01" placeholder="0,00" value={formData.amount} onChange={e => setFormData(f => ({ ...f, amount: e.target.value }))} />
              </div>
              <button onClick={handleSave} disabled={saving} style={s.btnGold}>
                {saving ? "Salvando..." : "Salvar Movimentação"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color, icon }: { label: string; value: string; color: string; icon: string }) {
  return (
    <div style={s.statCard}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#5a5a5a" }}>{label}</span>
        <span style={{ fontSize: 18, width: 32, height: 32, background: "#1c1c1c", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color }}>{icon}</span>
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color, fontFamily: "monospace", letterSpacing: "-0.02em" }}>{value}</div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { display: "flex", minHeight: "100vh", background: "#0a0a0a" },
  sidebar: {
    width: 220, background: "#111111", borderRight: "1px solid #1e1e1e",
    display: "flex", flexDirection: "column", padding: "24px 16px", position: "fixed", top: 0, bottom: 0, left: 0, zIndex: 10,
  },
  logo: { display: "flex", alignItems: "center", gap: 10, marginBottom: 32, paddingLeft: 4 },
  logoIcon: { width: 34, height: 34, borderRadius: 8, background: "linear-gradient(135deg, #c9a84c, #e8c96a)", display: "flex", alignItems: "center", justifyContent: "center" },
  logoText: { fontSize: 20, fontWeight: 700, color: "#e8e8e8", letterSpacing: "-0.02em" },
  navItem: { display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 8, background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.15)", marginBottom: 4 },
  userBox: { display: "flex", alignItems: "center", gap: 10, padding: "12px", background: "#161616", borderRadius: 10, border: "1px solid #2a2a2a" },
  userAvatar: { width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, #c9a84c, #e8c96a)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#0a0a0a", flexShrink: 0 },
  main: { flex: 1, marginLeft: 220, padding: "32px 32px 48px", maxWidth: "calc(100vw - 220px)" },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 12 },
  pageTitle: { margin: 0, fontSize: 24, fontWeight: 700, color: "#e8e8e8", letterSpacing: "-0.02em" },
  pageSubtitle: { margin: "2px 0 0", fontSize: 12, color: "#5a5a5a", letterSpacing: "0.06em", textTransform: "uppercase" },
  btnGold: { background: "linear-gradient(135deg, #c9a84c, #e8c96a)", color: "#0a0a0a", fontWeight: 700, border: "none", borderRadius: 8, padding: "10px 18px", cursor: "pointer", fontSize: 13, letterSpacing: "0.02em", display: "flex", alignItems: "center" },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 },
  statCard: { background: "#161616", border: "1px solid #2a2a2a", borderRadius: 12, padding: "20px 20px 18px" },
  row: { display: "grid", gridTemplateColumns: "220px 1fr", gap: 16, marginBottom: 24 },
  filtersCard: { background: "#161616", border: "1px solid #2a2a2a", borderRadius: 12, padding: 20 },
  chartCard: { background: "#161616", border: "1px solid #2a2a2a", borderRadius: 12, padding: "20px 20px 16px" },
  tableCard: { background: "#161616", border: "1px solid #2a2a2a", borderRadius: 12, padding: "20px" },
  cardHeader: { fontSize: 13, fontWeight: 600, color: "#a0a0a0", letterSpacing: "0.02em", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" },
  label: { display: "block", fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", color: "#5a5a5a", textTransform: "uppercase", marginBottom: 6 },
  input: { width: "100%", background: "#1c1c1c", border: "1px solid #2a2a2a", color: "#e8e8e8", borderRadius: 8, padding: "9px 12px", fontSize: 13, outline: "none" },
  select: { width: "100%", background: "#1c1c1c", border: "1px solid #2a2a2a", color: "#e8e8e8", borderRadius: 8, padding: "9px 12px", fontSize: 13, outline: "none", cursor: "pointer" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", color: "#5a5a5a", textTransform: "uppercase", padding: "0 12px 12px", borderBottom: "1px solid #1e1e1e" },
  tr: { borderBottom: "1px solid #1a1a1a" },
  td: { padding: "12px 12px", fontSize: 13, color: "#e8e8e8", verticalAlign: "middle" },
  catBadge: { background: "#1c1c1c", border: "1px solid #2a2a2a", color: "#a0a0a0", fontSize: 11, fontWeight: 500, padding: "3px 8px", borderRadius: 20 },
  badgeIn: { background: "rgba(76,175,125,0.12)", color: "#4caf7d", fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 20 },
  badgeOut: { background: "rgba(224,82,82,0.12)", color: "#e05252", fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 20 },
  deleteBtn: { background: "none", border: "1px solid #2a2a2a", color: "#5a5a5a", cursor: "pointer", padding: "5px 7px", borderRadius: 6, display: "flex", alignItems: "center", transition: "all 0.2s" },
  modalOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16, backdropFilter: "blur(4px)" },
  modal: { width: "100%", maxWidth: 460, background: "#161616", border: "1px solid #2a2a2a", borderRadius: 16, padding: 28, position: "relative", overflow: "hidden" },
  goldLine: { position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, #c9a84c, transparent)" },
};
