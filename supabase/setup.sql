-- EngGo — Supabase 설정 SQL
-- Supabase 대시보드 → SQL Editor 에 붙여넣고 실행하세요.

-- ─────────────────────────────────────────────
-- 1. AI 사용량 기록 테이블 (프록시의 일일 한도 체크용)
-- ─────────────────────────────────────────────
create table if not exists public.ai_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  usage_date date not null,
  cnt int not null default 0,
  primary key (user_id, usage_date)
);

alter table public.ai_usage enable row level security;
-- 클라이언트가 직접 조작 못 하게 정책 없음 (Edge Function의 security definer 함수만 사용)

-- 호출 횟수를 1 올리고 현재 횟수를 돌려주는 함수
create or replace function public.increment_ai_usage(p_user uuid, p_date date)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cnt int;
begin
  insert into public.ai_usage (user_id, usage_date, cnt)
  values (p_user, p_date, 1)
  on conflict (user_id, usage_date)
  do update set cnt = ai_usage.cnt + 1
  returning cnt into v_cnt;
  return v_cnt;
end;
$$;

-- 로그인 사용자만 실행 가능
revoke all on function public.increment_ai_usage(uuid, date) from public;
grant execute on function public.increment_ai_usage(uuid, date) to authenticated;

-- ─────────────────────────────────────────────
-- 2. 기존 테이블 RLS 정책 (본인 데이터만 쓰기 가능하도록)
--    ※ 현재는 anon 키로 아무 user_id나 기록할 수 있는 상태라
--      랭킹/XP 조작이 가능합니다. 아래 정책으로 막아주세요.
-- ─────────────────────────────────────────────
alter table public.users enable row level security;
alter table public.xp_log enable row level security;
alter table public.wrong_notes enable row level security;

-- users: 누구나 닉네임 조회(랭킹용), 본인 행만 생성/수정
drop policy if exists "users_select" on public.users;
create policy "users_select" on public.users for select using (true);
drop policy if exists "users_insert_own" on public.users;
create policy "users_insert_own" on public.users for insert with check (auth.uid() = id);
drop policy if exists "users_update_own" on public.users;
create policy "users_update_own" on public.users for update using (auth.uid() = id);

-- xp_log: 본인 것만 읽기/쓰기
drop policy if exists "xp_select_own" on public.xp_log;
create policy "xp_select_own" on public.xp_log for select using (auth.uid() = user_id);
drop policy if exists "xp_insert_own" on public.xp_log;
create policy "xp_insert_own" on public.xp_log for insert with check (auth.uid() = user_id);

-- wrong_notes: 본인 것만 읽기/쓰기
drop policy if exists "wn_select_own" on public.wrong_notes;
create policy "wn_select_own" on public.wrong_notes for select using (auth.uid() = user_id);
drop policy if exists "wn_insert_own" on public.wrong_notes;
create policy "wn_insert_own" on public.wrong_notes for insert with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- 3. (중요) 키 유출 경로 제거
--    app_config 테이블에 저장했던 Gemini 키는 누구나 읽을 수 있었습니다.
--    해당 키는 반드시 폐기(구글 콘솔에서 삭제)하고, 테이블 행도 지우세요.
-- ─────────────────────────────────────────────
delete from public.app_config where key = 'gemini_api_key';
-- 테이블 자체가 더 이상 필요 없다면:
-- drop table public.app_config;
