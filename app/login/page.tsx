"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
      else router.replace("/dashboard");
    } else {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { data: { name } },
      });
      if (error) setError(error.message);
      else setSuccess("Cadastro realizado! Verifique seu e-mail para confirmar a conta.");
    }
    setLoading(false);
  };

  return (
    <div style={styles.page}>
      {/* Background decoration */}
      <div style={styles.bgDeco} />

      <div style={styles.container} className="animate-fade">
        {/* Logo */}
        <div style={styles.logoWrap}>
          <div style={styles.logoIcon}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#0a0a0a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span style={styles.logoText}>FinPro</span>
        </div>

        <div style={styles.tagline}>Gestão financeira inteligente</div>

        {/* Card */}
        <div style={styles.card}>
          <div style={styles.goldLine} />

          <h2 style={styles.title}>
            {mode === "login" ? "Bem-vindo de volta" : "Criar conta"}
          </h2>
          <p style={styles.subtitle}>
            {mode === "login" ? "Acesse sua conta para continuar" : "Comece a controlar suas finanças"}
          </p>

          {error && <div style={styles.errorBox}>{error}</div>}
          {success && <div style={styles.successBox}>{success}</div>}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {mode === "signup" && (
              <div>
                <label style={styles.label}>Nome da empresa</label>
                <input
                  style={styles.input}
                  type="text"
                  placeholder="Minha Empresa Ltda"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>
            )}
            <div>
              <label style={styles.label}>E-mail</label>
              <input
                style={styles.input}
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label style={styles.label}>Senha</label>
              <input
                style={styles.input}
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <button type="submit" disabled={loading} style={styles.btnGold}>
              {loading ? "Aguarde..." : mode === "login" ? "Entrar" : "Criar conta"}
            </button>
          </form>

          <div style={styles.switchWrap}>
            <span style={{ color: "#5a5a5a", fontSize: 13 }}>
              {mode === "login" ? "Não tem conta?" : "Já tem conta?"}
            </span>
            <button
              onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); setSuccess(""); }}
              style={styles.switchBtn}
            >
              {mode === "login" ? "Criar conta" : "Fazer login"}
            </button>
          </div>
        </div>

        <p style={{ color: "#2a2a2a", fontSize: 11, marginTop: 32, letterSpacing: "0.05em" }}>
          © 2025 FINPRO — TODOS OS DIREITOS RESERVADOS
        </p>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#0a0a0a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    position: "relative",
    overflow: "hidden",
  },
  bgDeco: {
    position: "absolute",
    top: -200,
    right: -200,
    width: 600,
    height: 600,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(201,168,76,0.04) 0%, transparent 70%)",
    pointerEvents: "none",
  },
  container: {
    width: "100%",
    maxWidth: 420,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  logoWrap: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  logoIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    background: "linear-gradient(135deg, #c9a84c, #e8c96a)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    fontSize: 24,
    fontWeight: 700,
    color: "#e8e8e8",
    letterSpacing: "-0.02em",
  },
  tagline: {
    fontSize: 12,
    color: "#5a5a5a",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    marginBottom: 32,
  },
  card: {
    width: "100%",
    background: "#161616",
    border: "1px solid #2a2a2a",
    borderRadius: 16,
    padding: 32,
    position: "relative",
    overflow: "hidden",
  },
  goldLine: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    background: "linear-gradient(90deg, #c9a84c, transparent)",
  },
  title: {
    fontSize: 20,
    fontWeight: 600,
    color: "#e8e8e8",
    margin: "0 0 4px",
  },
  subtitle: {
    fontSize: 13,
    color: "#5a5a5a",
    margin: "0 0 24px",
  },
  label: {
    display: "block",
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.08em",
    color: "#5a5a5a",
    textTransform: "uppercase",
    marginBottom: 6,
  },
  input: {
    width: "100%",
    background: "#1c1c1c",
    border: "1px solid #2a2a2a",
    color: "#e8e8e8",
    borderRadius: 8,
    padding: "10px 14px",
    fontSize: 14,
    outline: "none",
    transition: "border-color 0.2s",
  },
  btnGold: {
    background: "linear-gradient(135deg, #c9a84c, #e8c96a)",
    color: "#0a0a0a",
    fontWeight: 700,
    border: "none",
    borderRadius: 8,
    padding: "12px 20px",
    cursor: "pointer",
    fontSize: 14,
    letterSpacing: "0.02em",
    marginTop: 4,
    transition: "opacity 0.2s",
  },
  switchWrap: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 20,
  },
  switchBtn: {
    background: "none",
    border: "none",
    color: "#c9a84c",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
    padding: 0,
  },
  errorBox: {
    background: "rgba(224,82,82,0.1)",
    border: "1px solid rgba(224,82,82,0.3)",
    color: "#e05252",
    borderRadius: 8,
    padding: "10px 14px",
    fontSize: 13,
    marginBottom: 4,
  },
  successBox: {
    background: "rgba(76,175,125,0.1)",
    border: "1px solid rgba(76,175,125,0.3)",
    color: "#4caf7d",
    borderRadius: 8,
    padding: "10px 14px",
    fontSize: 13,
    marginBottom: 4,
  },
};
