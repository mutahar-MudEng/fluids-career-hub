-- Run ONCE in your own Supabase project's SQL Editor.
-- PostgreSQL migrations; no application data or credentials are embedded.
begin;
create table public.career_jobs (
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  id text not null check (id ~ '^[A-Za-z0-9_-]{1,100}$'),
  company text not null check (length(trim(company)) between 1 and 10000),
  role text not null check (length(trim(role)) between 1 and 10000),
  country text not null default '',
  city text not null default '',
  official_url text not null default '' check (official_url='' or official_url ~ '^https?://[^[:space:]]+$'),
  published_on date,
  applied_on date,
  application_status text not null default 'فرصة للمراجعة' check (application_status in ('فرصة للمراجعة','جاهز للتقديم','تم التقديم','قيد المراجعة','مقابلة','عرض وظيفي','مرفوض','منسحب','مغلق')),
  application_reference text not null default '',
  confirmation text not null default '',
  last_follow_up date,
  next_follow_up date,
  visa_sponsorship text not null default 'غير مؤكد',
  rotation text not null default 'غير مؤكد',
  housing text not null default 'غير مؤكد',
  tickets text not null default 'غير مؤكد',
  fit_score integer check (fit_score between 0 and 100),
  gaps text not null default '',
  requirements text not null default '',
  verification_status text not null default 'بحاجة إلى إعادة تحقق' check (verification_status in ('بحاجة إلى إعادة تحقق','مفتوح ومؤكد','مغلق','لم يُعثر على مصدر رسمي')),
  verified_on date,
  verification_notes text not null default '',
  follow_up_policy text not null default '7-10' check (follow_up_policy in ('5-7','7-10')),
  weekend text not null default '5,6' check (weekend in ('5,6','0,6')),
  reviewed_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id,id),
  constraint verified_source_required check (verification_status <> 'مفتوح ومؤكد' or (length(trim(official_url))>0 and verified_on is not null)),
  constraint valid_follow_up_date check (last_follow_up is null or (applied_on is not null and last_follow_up>=applied_on)),
  constraint bounded_field_sizes check (octet_length(row(company,role,country,city,official_url,application_reference,confirmation,visa_sponsorship,rotation,housing,tickets,gaps,requirements,verification_notes)::text)<=160000)
);
create index career_jobs_follow_up_idx on public.career_jobs(user_id,next_follow_up);
create function public.touch_career_job() returns trigger language plpgsql set search_path='' as $$
begin new.updated_at=now(); new.created_at=old.created_at; return new; end; $$;
create trigger career_jobs_updated before update on public.career_jobs for each row execute function public.touch_career_job();
alter table public.career_jobs enable row level security;
alter table public.career_jobs force row level security;
revoke all on table public.career_jobs from public,anon,authenticated;
grant select,insert,update,delete on table public.career_jobs to authenticated;
create policy own_jobs_select on public.career_jobs for select to authenticated using ((select auth.uid())=user_id);
create policy own_jobs_insert on public.career_jobs for insert to authenticated with check ((select auth.uid())=user_id);
create policy own_jobs_update on public.career_jobs for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy own_jobs_delete on public.career_jobs for delete to authenticated using ((select auth.uid())=user_id);
commit;
