-- Donostia Run · ejecutar una vez en SQL Editor de tu proyecto de Supabase.
-- Sin datos personales ni claves. Cada usuario accede solo a sus filas.
begin;
create table if not exists public.training_logs (
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id text not null check (session_id ~ '^20[0-9]{2}-[0-9]{2}-[0-9]{2}-(easy|quality|long|race|strength|padel|rest|mobility)$'),
  status text not null check (status in ('planned','done','partial','skipped')),
  km numeric check (km between 0 and 100),
  minutes numeric check (minutes between 0 and 1000),
  rpe integer check (rpe between 1 and 10),
  notes text not null default '' check (length(notes) <= 2000),
  client_updated_at timestamptz not null,
  updated_at timestamptz not null default now(),
  primary key (user_id,session_id)
);
alter table public.training_logs enable row level security;
revoke all on public.training_logs from anon;
grant select,insert,update on public.training_logs to authenticated;
drop policy if exists own_logs_read on public.training_logs;
create policy own_logs_read on public.training_logs for select to authenticated using ((select auth.uid())=user_id);
drop policy if exists own_logs_insert on public.training_logs;
create policy own_logs_insert on public.training_logs for insert to authenticated with check ((select auth.uid())=user_id);
drop policy if exists own_logs_update on public.training_logs;
create policy own_logs_update on public.training_logs for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);

-- La modificación más reciente por sesión gana. Evita que una cola offline
-- antigua reemplace un registro más reciente de otro dispositivo.
create or replace function public.save_training_log(
 p_session_id text,p_status text,p_km numeric,p_minutes numeric,
 p_rpe integer,p_notes text,p_client_updated_at timestamptz
) returns setof public.training_logs
language plpgsql security invoker set search_path = '' as $$
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 if p_client_updated_at is null or p_client_updated_at > now()+interval '1 minute' then
   raise exception 'Invalid timestamp';
 end if;
 insert into public.training_logs(user_id,session_id,status,km,minutes,rpe,notes,client_updated_at)
 values(auth.uid(),p_session_id,p_status,p_km,p_minutes,p_rpe,coalesce(p_notes,''),p_client_updated_at)
 on conflict (user_id,session_id) do update set
 status=excluded.status,km=excluded.km,minutes=excluded.minutes,rpe=excluded.rpe,
 notes=excluded.notes,client_updated_at=excluded.client_updated_at,updated_at=now()
 where excluded.client_updated_at > public.training_logs.client_updated_at;
 return query select * from public.training_logs
 where user_id=auth.uid() and session_id=p_session_id;
end;
$$;
revoke all on function public.save_training_log(text,text,numeric,numeric,integer,text,timestamptz) from public,anon;
grant execute on function public.save_training_log(text,text,numeric,numeric,integer,text,timestamptz) to authenticated;

-- Realtime es opcional: la app también consulta al enfocarse y cada 30 s.
do $$ begin
 if exists(select 1 from pg_publication where pubname='supabase_realtime')
 and not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='training_logs') then
 alter publication supabase_realtime add table public.training_logs;
 end if;
end $$;
commit;
