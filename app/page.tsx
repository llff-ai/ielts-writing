import Link from "next/link";
import { auth } from "@/lib/auth";

export default async function HomePage() {
  const session = await auth();
  const href = session?.user ? "/submit" : "/auth/login";

  return (
    <section className="enter-fade space-y-6">
      <div className="card card-elevated relative overflow-hidden p-8 md:p-10">
        <div className="absolute -right-24 -top-20 h-56 w-56 rounded-full bg-[color:rgba(31,93,97,.13)] blur-3xl" />
        <div className="absolute -bottom-24 left-12 h-52 w-52 rounded-full bg-[color:rgba(195,88,47,.16)] blur-3xl" />
        <div className="relative max-w-3xl space-y-4">
          <span className="tag">MVP 内测版</span>
          <h1 className="text-3xl leading-tight md:text-5xl">
            用结构化反馈，缩短你从 6 分到 7 分的写作路径
          </h1>
          <p className="text-base text-[var(--muted)] md:text-lg">
            选题、粘贴英文作文、等待 20 到 40 秒，即可得到四项分数、句级问题、改写示例与三条行动建议。
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link className="btn-primary" href={href}>
              开始批改
            </Link>
            <Link
              href="/history"
              className="btn-secondary"
            >
              查看历史记录
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          ["结构化评分", "TR / CC / LR / GRA 四项评分 + 综合估分"],
          ["句级修订", "逐句指出问题并给出可直接替换的建议句"],
          ["行动优先级", "输出 3 条可执行计划，按 high/medium/low 排序"],
        ].map(([title, desc], i) => (
          <article key={title} className="card enter-fade p-5" style={{ animationDelay: `${i * 100}ms` }}>
            <h2 className="text-xl">{title}</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">{desc}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
