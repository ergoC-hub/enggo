// EngGo — Gemini API 프록시 (Supabase Edge Function)
// 역할: Gemini API 키를 서버에만 보관하고, 로그인한 사용자의 요청만 대신 호출해 줌.
//       1인당 일일 호출 한도를 적용해 무료 등급 한도를 보호함.

import { createClient } from "npm:@supabase/supabase-js@2";

const DAILY_LIMIT_PER_USER = 40; // 1인 일일 호출 한도
const ALLOWED_MODELS = ["gemini-2.5-flash-lite", "gemini-2.5-flash"];

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") {
    return json({ error: { message: "POST only" } }, 405);
  }

  // 1) 로그인 확인 — 사용자 JWT가 있어야만 호출 가능
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } },
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return json({ error: { message: "로그인이 필요해요" } }, 401);

  // 2) 일일 사용량 확인 (setup.sql의 increment_ai_usage 함수 사용)
  const today = new Date().toISOString().slice(0, 10);
  const { data: count, error: usageErr } = await supabase.rpc("increment_ai_usage", {
    p_user: user.id,
    p_date: today,
  });
  if (usageErr) return json({ error: { message: usageErr.message } }, 500);
  if (count > DAILY_LIMIT_PER_USER) {
    return json({ error: { message: "오늘 사용량을 모두 썼어요" } }, 429);
  }

  // 3) Gemini 호출 (키는 서버 환경변수에만 존재)
  const { model, contents, generationConfig } = await req.json();
  const m = ALLOWED_MODELS.includes(model) ? model : ALLOWED_MODELS[0];
  const r = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": Deno.env.get("GEMINI_API_KEY")!,
      },
      body: JSON.stringify({
        contents,
        generationConfig: {
          maxOutputTokens: Math.min(generationConfig?.maxOutputTokens ?? 800, 1000),
          temperature: generationConfig?.temperature ?? 0.7,
        },
      }),
    },
  );
  return new Response(await r.text(), {
    status: r.status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}