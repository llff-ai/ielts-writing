import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "雅思写作批改网站",
  description: "面向中国雅思考生的 AI 写作批改网站",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <html lang="zh-CN">
      <body>
        <div className="site-shell">
          <header className="sticky top-0 z-20 border-b border-[var(--line)] bg-[color:rgba(244,239,230,.9)] backdrop-blur">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
              <Link
                href="/"
                className="text-xl font-semibold tracking-wide text-[var(--accent-2)]"
              >
                雅思写作批改
              </Link>
              <nav className="flex items-center gap-2 text-sm md:gap-4">
                {session?.user ? (
                  <>
                    <Link
                      href="/submit"
                      className="rounded-md px-2 py-1 text-[var(--muted)] transition hover:bg-white hover:text-[var(--accent-2)]"
                    >
                      提交作文
                    </Link>
                    <Link
                      href="/history"
                      className="rounded-md px-2 py-1 text-[var(--muted)] transition hover:bg-white hover:text-[var(--accent-2)]"
                    >
                      历史记录
                    </Link>
                    <form action="/api/auth/signout" method="post">
                      <button className="btn-secondary" type="submit">
                        退出登录
                      </button>
                    </form>
                  </>
                ) : (
                  <>
                    <Link
                      href="/auth/login"
                      className="rounded-md px-2 py-1 text-[var(--muted)] transition hover:bg-white hover:text-[var(--accent-2)]"
                    >
                      登录
                    </Link>
                    <Link href="/auth/register" className="btn-primary">
                      注册
                    </Link>
                  </>
                )}
              </nav>
            </div>
          </header>
          <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
