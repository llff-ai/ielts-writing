"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type Question = {
  id: string;
  themeCn: string;
  themeEn: string;
  questionText: string;
  questionType: string;
  keywords: string[];
};

type QuestionGroups = Record<string, Question[]>;

const THEME_ORDER = [
  "教育类",
  "政府类",
  "环境类",
  "犯罪类",
  "全球化",
  "科技类",
  "媒体类",
  "社会类",
];

function shortLabel(q: Question) {
  const preview = q.questionText.slice(0, 30).replace(/\s+/g, " ");
  return `${q.id} · ${preview}${q.questionText.length > 30 ? "..." : ""}`;
}

function getIdOrder(id: string): number {
  const match = id.match(/-(\d+)$/);
  if (!match) return Number.MAX_SAFE_INTEGER;
  return Number(match[1]);
}

export default function SubmitForm() {
  const router = useRouter();
  const [groups, setGroups] = useState<QuestionGroups>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedTheme, setExpandedTheme] = useState<string | null>(null);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [questionText, setQuestionText] = useState("");
  const [essayText, setEssayText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/questions");
        if (!res.ok) throw new Error("加载题目失败");
        const data = (await res.json()) as QuestionGroups;
        setGroups(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "加载失败");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const wordCount = useMemo(
    () => (essayText.trim() ? essayText.trim().split(/\s+/).length : 0),
    [essayText]
  );

  function chooseQuestion(q: Question) {
    setSelectedQuestionId(q.id);
    setQuestionText(q.questionText);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionText,
          essayText,
          questionId: selectedQuestionId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "提交失败");
      router.push(`/result/${data.submissionId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "提交失败");
      setSubmitting(false);
    }
  }

  return (
    <section className="space-y-5 enter-fade">
      <div className="card card-elevated p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl">提交作文</h1>
            <p className="mt-1 text-sm text-[var(--muted)]">
              先选题，再粘贴英文作文。你也可以清空题目框并自定义题目。
            </p>
          </div>
        </div>
      </div>

      <form className="space-y-5" onSubmit={onSubmit}>
        <div className="card p-5 md:p-6">
          <h2 className="text-xl">1. 选择题目</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            点击话题展开题目，仅显示简短标识，点选后自动填入完整英文题干。
          </p>

          <div className="mt-4 grid gap-2 md:grid-cols-2">
            {loading ? <p className="text-sm text-[var(--muted)]">加载题目中...</p> : null}
            {!loading
              ? THEME_ORDER.map((theme) => {
                  const list = [...(groups[theme] || [])].sort(
                    (a, b) => getIdOrder(a.id) - getIdOrder(b.id)
                  );
                  const active = expandedTheme === theme;
                  return (
                    <article key={theme} className="rounded-xl border border-[var(--line)] bg-white/70">
                      <button
                        type="button"
                        className="flex w-full items-center justify-between px-3 py-3 text-left transition hover:bg-[color:rgba(31,93,97,.05)]"
                        onClick={() => setExpandedTheme(active ? null : theme)}
                      >
                        <span className="font-semibold">{theme}</span>
                        <span className="text-xs text-[var(--muted)]">{list.length} 题</span>
                      </button>
                      {active ? (
                        <div className="max-h-52 overflow-auto border-t border-[var(--line)] p-2">
                          {list.map((q) => (
                            <button
                              key={q.id}
                              type="button"
                              onClick={() => chooseQuestion(q)}
                              className={`mb-1 block w-full rounded-lg px-2 py-2 text-left text-sm transition ${
                                selectedQuestionId === q.id
                                  ? "bg-[color:rgba(195,88,47,.14)] text-[var(--ink)]"
                                  : "hover:bg-[color:rgba(31,93,97,.08)]"
                              }`}
                            >
                              {shortLabel(q)}
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </article>
                  );
                })
              : null}
          </div>
        </div>

        <div className="card p-5 md:p-6">
          <h2 className="text-xl">2. 题目</h2>
          <div className="mt-3">
            <label className="label">题目输入框（可编辑）</label>
            <textarea
              className="min-h-28"
              value={questionText}
              onChange={(e) => {
                setQuestionText(e.target.value);
                if (selectedQuestionId) setSelectedQuestionId(null);
              }}
              placeholder="选择题目后会自动填入完整英文题目，也可手动输入自定义题目"
              required
            />
          </div>
        </div>

        <div className="card p-5 md:p-6">
          <h2 className="text-xl">3. 作文内容</h2>
          <div className="mt-3">
            <label className="label">英文作文文本</label>
            <textarea
              className="min-h-72"
              value={essayText}
              onChange={(e) => setEssayText(e.target.value)}
              placeholder="请粘贴你的英文作文"
              required
            />
          </div>
          <div className="mt-3 flex items-center justify-between text-sm">
            <span className="text-[var(--muted)]">当前字数：{wordCount}</span>
          </div>
        </div>

        {error ? <p className="text-red-700">{error}</p> : null}
        <button className="btn-primary" type="submit" disabled={submitting}>
          {submitting ? "提交中..." : "提交并开始批改"}
        </button>
      </form>
    </section>
  );
}
