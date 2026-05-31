"use client";

import { useEffect, useMemo, useState } from "react";

type SentenceFeedback = {
  original: string;
  issue: string;
  suggestion: string;
  type: string;
};

type RewriteExample = {
  original: string;
  rewritten: string;
  explanation: string;
};

type NextAction = {
  action: string;
  priority: "high" | "medium" | "low";
};

type Report = {
  id: string;
  overallComment: string;
  trScore: number;
  ccScore: number;
  lrScore: number;
  graScore: number;
  estimatedBand: number;
  sentenceFeedback: SentenceFeedback[];
  rewriteExamples: RewriteExample[];
  nextActions: NextAction[];
};

type RagSources = {
  knowledgeChunks: Array<{
    id: string;
    topic: string;
    subtopic: string;
    stance: string;
    fullText: string;
    pointCount: number;
  }>;
  modelEssays: Array<{
    id: string;
    titleCn: string;
    question: string;
    essayText: string;
    bandScore: number;
    questionId: string | null;
  }>;
};

type SubmissionInfo = {
  questionText: string;
  essayText: string;
};

export default function ResultView({ submissionId }: { submissionId: string }) {
  const [status, setStatus] = useState<
    "loading" | "streaming" | "done" | "error" | "timeout"
  >("loading");
  const [error, setError] = useState("");
  const [report, setReport] = useState<Report | null>(null);
  const [ragSources, setRagSources] = useState<RagSources>({
    knowledgeChunks: [],
    modelEssays: [],
  });
  const [submissionInfo, setSubmissionInfo] = useState<SubmissionInfo | null>(
    null
  );
  const [regenerating, setRegenerating] = useState(false);

  async function fetchLatest() {
    const res = await fetch(`/api/submissions/${submissionId}`);
    if (!res.ok) return;
    const data = await res.json();
    if (data.ragSources) setRagSources(data.ragSources);
    setSubmissionInfo({
      questionText: data.questionText ?? "",
      essayText: data.essayText ?? "",
    });
    if (data.reports?.length > 0) {
      setReport(data.reports[0]);
      setStatus("done");
    }
  }

  async function startStreaming() {
    setStatus("streaming");
    setError("");
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 60000);

    try {
      const res = await fetch("/api/reports/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) throw new Error("批改失败，请重试");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value);
      }

      clearTimeout(timer);
      await fetchLatest();
    } catch (e) {
      clearTimeout(timer);
      if (e instanceof DOMException && e.name === "AbortError") {
        setStatus("timeout");
        setError("批改超时，请重试");
      } else {
        setStatus("error");
        setError("批改失败，请重试");
      }
    }
  }

  async function regenerate() {
    setRegenerating(true);
    setError("");
    try {
      const res = await fetch(`/api/reports/${submissionId}/regenerate`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("regenerate_failed");
      await fetchLatest();
    } catch {
      setError("批改失败，请重试");
    } finally {
      setRegenerating(false);
    }
  }

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/submissions/${submissionId}`);
      if (!res.ok) {
        setStatus("error");
        setError("未找到提交记录");
        return;
      }

      const data = await res.json();
      if (data.ragSources) setRagSources(data.ragSources);
      setSubmissionInfo({
        questionText: data.questionText ?? "",
        essayText: data.essayText ?? "",
      });

      if (data.reports?.length > 0) {
        setReport(data.reports[0]);
        setStatus("done");
      } else {
        await startStreaming();
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submissionId]);

  const sortedActions = useMemo(() => {
    if (!report) return [];
    const p = { high: 0, medium: 1, low: 2 };
    return [...(report.nextActions || [])].sort(
      (a, b) => p[a.priority] - p[b.priority]
    );
  }, [report]);

  return (
    <section className="space-y-5 enter-fade">
      <div className="card card-elevated p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl">批改结果</h1>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {status === "streaming"
                ? "批改中..."
                : status === "done"
                ? "批改完成"
                : "准备中..."}
            </p>
          </div>
          <button
            className="btn-secondary"
            onClick={regenerate}
            disabled={regenerating}
          >
            {regenerating ? "重新生成中..." : "重新生成"}
          </button>
        </div>
      </div>

      {error ? <p className="text-red-700">{error}</p> : null}

      <div className="card p-5 md:p-6">
        <h2 className="text-xl">题目</h2>
        <div className="mt-3 rounded-xl border border-[var(--line)] bg-white p-3 text-sm">
          <p className="whitespace-pre-wrap">
            {submissionInfo?.questionText || "暂无题目内容"}
          </p>
        </div>
      </div>

      <div className="card p-5 md:p-6">
        <h2 className="text-xl">用户原文</h2>
        <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap rounded-xl border border-[var(--line)] bg-white p-3 text-sm">
          {submissionInfo?.essayText || "暂无原文内容"}
        </pre>
      </div>

      <div className="card p-5 md:p-6">
        <h2 className="text-xl">总评</h2>
        <p className="mt-2 text-[var(--ink)]">
          {report?.overallComment || "批改完成后显示"}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-5">
        {[
          ["TR", report?.trScore],
          ["CC", report?.ccScore],
          ["LR", report?.lrScore],
          ["GRA", report?.graScore],
          ["估分", report?.estimatedBand],
        ].map(([k, v]) => (
          <div key={k} className="card p-4">
            <div className="text-xs uppercase tracking-widest text-[var(--muted)]">
              {k}
            </div>
            <div className="mt-1 text-3xl font-semibold">{v ?? "-"}</div>
          </div>
        ))}
      </div>

      <div className="card p-5 md:p-6">
        <h2 className="text-xl">逐句问题</h2>
        <div className="mt-3 space-y-3">
          {(report?.sentenceFeedback || []).map((item, i) => (
            <article
              key={i}
              className="rounded-xl border border-[var(--line)] bg-white p-3"
            >
              <p className="font-semibold text-[var(--accent-2)]">
                {item.original}
              </p>
              <p className="mt-1 text-sm text-[var(--muted)]">问题：{item.issue}</p>
              <p className="mt-1 text-sm">建议：{item.suggestion}</p>
            </article>
          ))}
          {report?.sentenceFeedback?.length ? null : (
            <p className="text-sm text-[var(--muted)]">暂无数据</p>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card p-5 md:p-6">
          <h2 className="text-xl">改写示例</h2>
          <div className="mt-3 space-y-2">
            {(report?.rewriteExamples || []).map((item, i) => (
              <div
                key={i}
                className="rounded-xl border border-[var(--line)] bg-white p-3 text-sm"
              >
                <p>
                  <span className="font-semibold">原句：</span>
                  {item.original}
                </p>
                <p className="mt-1">
                  <span className="font-semibold">改写：</span>
                  {item.rewritten}
                </p>
                <p className="mt-1 text-[var(--muted)]">
                  说明：{item.explanation}
                </p>
              </div>
            ))}
            {report?.rewriteExamples?.length ? null : (
              <p className="text-sm text-[var(--muted)]">暂无数据</p>
            )}
          </div>
        </div>

        <div className="card p-5 md:p-6">
          <h2 className="text-xl">行动建议</h2>
          <ol className="mt-3 space-y-2">
            {sortedActions.map((item, i) => (
              <li
                key={i}
                className="rounded-xl border border-[var(--line)] bg-white p-3 text-sm"
              >
                <span className="mr-2 tag">{item.priority}</span>
                {item.action}
              </li>
            ))}
          </ol>
        </div>

        <div className="card p-5 md:p-6">
          <h2 className="text-xl">范文参考</h2>
          <div className="mt-3 space-y-3">
            {ragSources.modelEssays.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">暂无</p>
            ) : (
              <article
                className="rounded-xl border border-[var(--line)] bg-white p-3 text-sm"
              >
                <div className="mb-2 flex items-center gap-2">
                  <span className="tag">Band {ragSources.modelEssays[0].bandScore}</span>
                  <span className="text-xs text-[var(--muted)]">
                    questionId: {ragSources.modelEssays[0].questionId ?? "null"}
                  </span>
                </div>
                <p className="font-semibold">{ragSources.modelEssays[0].titleCn}</p>
                <p className="mt-1 text-[var(--muted)]">{ragSources.modelEssays[0].question}</p>
                <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap rounded-lg bg-[#f9f3e9] p-2">
                  {ragSources.modelEssays[0].essayText}
                </pre>
              </article>
            )}
          </div>
        </div>
      </div>

      <div className="card p-5 md:p-6">
        <h2 className="text-xl">参考观点</h2>
        <div className="mt-3 space-y-3">
          {ragSources.knowledgeChunks.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">暂无</p>
          ) : (
            ragSources.knowledgeChunks.slice(0, 3).map((chunk) => (
              <article
                key={chunk.id}
                className="rounded-xl border border-[var(--line)] bg-white p-3 text-sm"
              >
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="tag">{chunk.topic}</span>
                  <span className="tag">{chunk.subtopic}</span>
                  <span className="tag">{chunk.stance}</span>
                  <span className="text-xs text-[var(--muted)]">
                    points: {chunk.pointCount}
                  </span>
                </div>
                <details>
                  <summary className="cursor-pointer text-[var(--accent-2)]">
                    查看观点内容（{chunk.id}）
                  </summary>
                  <pre className="mt-2 max-h-44 overflow-auto whitespace-pre-wrap rounded-lg bg-[#f9f3e9] p-2">
                    {chunk.fullText}
                  </pre>
                </details>
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
