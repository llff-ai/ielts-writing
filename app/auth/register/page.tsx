"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("两次输入的密码不一致");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      setLoading(false);
      setError(data.error || "注册失败");
      return;
    }

    await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    router.push("/submit");
    router.refresh();
  }

  return (
    <section className="mx-auto max-w-md enter-fade">
      <div className="card card-elevated p-6 md:p-7">
        <h1 className="text-3xl">创建账号</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">注册后即可开始免费体验写作批改功能。</p>
        <form className="mt-5 space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="label">邮箱</label>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">密码（至少 8 位）</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">确认密码</label>
            <input
              className="input"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
          <button className="btn-primary w-full" type="submit" disabled={loading}>
            {loading ? "注册中..." : "注册并进入"}
          </button>
        </form>
        <p className="mt-4 text-sm text-[var(--muted)]">
          已有账号？
          <Link href="/auth/login" className="ml-1 font-semibold text-[var(--accent-2)]">
            去登录
          </Link>
        </p>
      </div>
    </section>
  );
}
