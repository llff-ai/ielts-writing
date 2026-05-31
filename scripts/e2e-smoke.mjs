const BASE_URL = process.env.E2E_BASE_URL || "http://localhost:3000";

const cookieJar = new Map();

function storeSetCookies(res) {
  const setCookies =
    typeof res.headers.getSetCookie === "function"
      ? res.headers.getSetCookie()
      : [];

  for (const item of setCookies) {
    const [pair] = item.split(";");
    const idx = pair.indexOf("=");
    if (idx > 0) {
      const key = pair.slice(0, idx).trim();
      const value = pair.slice(idx + 1).trim();
      cookieJar.set(key, value);
    }
  }
}

function cookieHeader() {
  return Array.from(cookieJar.entries())
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
}

async function http(path, init = {}) {
  const headers = new Headers(init.headers || {});
  const cookie = cookieHeader();
  if (cookie) headers.set("cookie", cookie);

  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers,
    redirect: "manual",
  });

  storeSetCookies(res);
  return res;
}

function assert(ok, msg) {
  if (!ok) throw new Error(msg);
}

function randomEmail() {
  const seed = `${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
  return `e2e_${seed}@example.com`;
}

async function main() {
  const email = randomEmail();
  const password = "TestPassw0rd!";
  console.log("E2E start:", { base: BASE_URL, email });

  const registerRes = await http("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  assert(registerRes.status === 201, `register failed: ${registerRes.status}`);

  const csrfRes = await http("/api/auth/csrf");
  assert(csrfRes.ok, `csrf failed: ${csrfRes.status}`);
  const csrfData = await csrfRes.json();
  assert(csrfData.csrfToken, "csrf token missing");

  const loginBody = new URLSearchParams({
    csrfToken: csrfData.csrfToken,
    email,
    password,
    callbackUrl: `${BASE_URL}/submit`,
    json: "true",
  });

  const loginRes = await http("/api/auth/callback/credentials", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: loginBody.toString(),
  });
  assert(
    loginRes.status === 200 || loginRes.status === 302,
    `login failed: ${loginRes.status}`
  );

  const questionsRes = await http("/api/questions");
  assert(questionsRes.ok, `questions failed: ${questionsRes.status}`);
  const grouped = await questionsRes.json();
  const firstGroupKey = Object.keys(grouped)[0];
  assert(firstGroupKey, "no question group");
  const firstQuestion = grouped[firstGroupKey][0];
  assert(firstQuestion?.id, "no question found");

  const submissionRes = await http("/api/submissions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      taskType: "Task2",
      questionText: firstQuestion.questionText,
      essayText:
        "Some people think governments should invest more in education. I agree because education improves productivity, reduces inequality, and supports social stability.",
      questionId: firstQuestion.id,
    }),
  });
  assert(submissionRes.status === 201, `submission failed: ${submissionRes.status}`);
  const { submissionId } = await submissionRes.json();
  assert(submissionId, "submissionId missing");
  console.log("submission created:", submissionId);

  const streamRes = await http("/api/reports/stream", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ submissionId }),
  });
  assert(streamRes.ok, `stream failed: ${streamRes.status}`);
  const streamText = await streamRes.text();
  assert(streamText.length > 20, "stream response too short");
  console.log("stream length:", streamText.length);

  const detailRes = await http(`/api/submissions/${submissionId}`);
  assert(detailRes.ok, `submission detail failed: ${detailRes.status}`);
  const detailData = await detailRes.json();
  assert(
    Array.isArray(detailData.reports) && detailData.reports.length >= 1,
    "report not saved"
  );

  const regenRes = await http(`/api/reports/${submissionId}/regenerate`, {
    method: "POST",
  });
  assert(regenRes.status === 201, `regenerate failed: ${regenRes.status}`);

  const historyRes = await http("/api/submissions");
  assert(historyRes.ok, `history failed: ${historyRes.status}`);
  const historyData = await historyRes.json();
  assert(Array.isArray(historyData) && historyData.length > 0, "history empty");

  console.log("E2E smoke passed.");
}

main().catch((err) => {
  console.error("E2E smoke failed:", err.message);
  process.exit(1);
});
