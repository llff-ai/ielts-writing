"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Item = {
  id: string;
  questionText: string;
  createdAt: string;
  reports: Array<{
    id: string;
    estimatedBand: number;
    createdAt: string;
  }>;
};

export default function HistoryList() {
  const [list, setList] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/submissions");
      if (res.ok) {
        const data = await res.json();
        setList(data);
      }
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return <p className="text-sm text-[var(--muted)]">加载中...</p>;
  }

  return (
    <section className="space-y-5 enter-fade">
      <div className="card card-elevated p-5 md:p-6">
        <h1 className="text-3xl">历史提交</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">按时间倒序展示你的作文批改记录。</p>
      </div>

      {list.length === 0 ? (
        <div className="card p-6 text-sm text-[var(--muted)]">暂无提交记录</div>
      ) : (
        <div className="grid gap-3">
          {list.map((item) => (
            <Link
              key={item.id}
              href={`/result/${item.id}`}
              className="card p-4 transition hover:-translate-y-0.5 hover:border-[var(--accent-2)]"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold">
                  {new Date(item.createdAt).toLocaleString("zh-CN")}
                </p>
                <span className="tag">最新估分：{item.reports[0]?.estimatedBand ?? "-"}</span>
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-[var(--muted)]">{item.questionText}</p>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
