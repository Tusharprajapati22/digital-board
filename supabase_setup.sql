-- 1) Table
create table if not exists "Digitalboard" (
  id bigint generated always as identity primary key,
  subject text not null,
  title text not null,
  file_url text not null,
  file_name text,
  file_type text,
  view_password text,
  created_at timestamptz not null default now()
);

-- 2) Storage bucket (public) + allow browser uploads with the anon key
insert into storage.buckets (id, name, public) values ('Digitalboard','Digitalboard', true)
on conflict (id) do update set public = true;

create policy "Public read Digitalboard" on storage.objects
  for select using (bucket_id = 'Digitalboard');
create policy "Anon upload Digitalboard" on storage.objects
  for insert to anon with check (bucket_id = 'Digitalboard');
