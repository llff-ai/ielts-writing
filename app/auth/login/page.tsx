"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const search = useSearchParams();
  const callbackUrl = search.get("callbackUrl") || "/submit";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl,
    });

    setLoading(false);
    if (res?.error) {
      setError("邮箱或密码错误");
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <section className="mx-auto max-w-md enter-fade">
      <div className="card card-elevated p-6 md:p-7">
        <h1 className="text-3xl">欢迎回来</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">登录后继续提交你的雅思写作并查看批改记录。</p>
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
            <label className="label">密码</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
          <button className="btn-primary w-full" type="submit" disabled={loading}>
            {loading ? "登录中..." : "登录"}
          </button>
        </form>
        <p className="mt-4 text-sm text-[var(--muted)]">
          还没有账号？
          <Link href="/auth/register" className="ml-1 font-semibold text-[var(--accent-2)]">
            去注册
          </Link>
        </p>
      </div>
    </section>
  );
}
