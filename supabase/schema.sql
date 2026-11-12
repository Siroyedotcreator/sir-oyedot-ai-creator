-- Sir Oyedot AI Creator CMS • Run only in its dedicated Supabase project.
-- Admin authorisation is determined by auth.users UUID, not editable user_metadata.
begin;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.site_settings (
  id integer primary key default 1 check (id = 1),
  announcement text not null default '',
  whatsapp_number text not null default '2347066461764',
  contact_email text not null default '',
  updated_at timestamptz not null default now(),
  constraint valid_whatsapp check (whatsapp_number = '' or whatsapp_number ~ '^[1-9][0-9]{7,14}$')
);

create table if not exists public.video_items (
  id bigint generated always as identity primary key,
  platform text not null check(platform in ('tiktok','youtube')),
  title text not null check(length(title) between 1 and 160),
  url text not null check(url ~ '^https://'),
  poster_url text not null default '' check(poster_url = '' or poster_url ~ '^https://'),
  sort_order integer not null default 100,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_items (
  id bigint generated always as identity primary key,
  slug text not null unique check(slug ~ '^[a-z0-9-]+$'),
  label text not null default '',
  title text not null check(length(title) between 1 and 180),
  summary text not null default '',
  note text not null default '',
  link_url text not null default '' check(link_url = '' or link_url ~ '^https://'),
  link_label text not null default 'Watch the work',
  art_text text not null default '',
  art_style text not null default 'history' check(art_style in ('history','wildlife','commercial')),
  sort_order integer not null default 100,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;
alter table public.site_settings enable row level security;
alter table public.video_items enable row level security;
alter table public.project_items enable row level security;

-- Browser/API access is deliberately limited to the four CMS tables.
revoke all on public.admin_users from anon, authenticated;
revoke all on public.site_settings from anon, authenticated;
revoke all on public.video_items from anon, authenticated;
revoke all on public.project_items from anon, authenticated;
grant select on public.admin_users to authenticated;
grant select on public.site_settings to anon, authenticated;
grant update on public.site_settings to authenticated;
grant select on public.video_items, public.project_items to anon, authenticated;
grant insert, update, delete on public.video_items, public.project_items to authenticated;
grant usage, select on sequence public.video_items_id_seq to authenticated;
grant usage, select on sequence public.project_items_id_seq to authenticated;

drop policy if exists "admins read own record" on public.admin_users;
create policy "admins read own record" on public.admin_users for select to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "public reads settings" on public.site_settings;
create policy "public reads settings" on public.site_settings for select to anon, authenticated using (true);
drop policy if exists "admins update settings" on public.site_settings;
create policy "admins update settings" on public.site_settings for update to authenticated
using (exists(select 1 from public.admin_users a where a.user_id = (select auth.uid())))
with check (id = 1 and exists(select 1 from public.admin_users a where a.user_id = (select auth.uid())));

drop policy if exists "public reads published videos or admins read all" on public.video_items;
drop policy if exists "everyone reads published videos" on public.video_items;
create policy "everyone reads published videos" on public.video_items for select to anon, authenticated using (published);
drop policy if exists "admins read all videos" on public.video_items;
create policy "admins read all videos" on public.video_items for select to authenticated
using (exists(select 1 from public.admin_users a where a.user_id = (select auth.uid())));
drop policy if exists "admins insert videos" on public.video_items;
create policy "admins insert videos" on public.video_items for insert to authenticated
with check (exists(select 1 from public.admin_users a where a.user_id = (select auth.uid())));
drop policy if exists "admins update videos" on public.video_items;
create policy "admins update videos" on public.video_items for update to authenticated
using (exists(select 1 from public.admin_users a where a.user_id = (select auth.uid())))
with check (exists(select 1 from public.admin_users a where a.user_id = (select auth.uid())));
drop policy if exists "admins delete videos" on public.video_items;
create policy "admins delete videos" on public.video_items for delete to authenticated
using (exists(select 1 from public.admin_users a where a.user_id = (select auth.uid())));

drop policy if exists "public reads published projects or admins read all" on public.project_items;
drop policy if exists "everyone reads published projects" on public.project_items;
create policy "everyone reads published projects" on public.project_items for select to anon, authenticated using (published);
drop policy if exists "admins read all projects" on public.project_items;
create policy "admins read all projects" on public.project_items for select to authenticated
using (exists(select 1 from public.admin_users a where a.user_id = (select auth.uid())));
drop policy if exists "admins insert projects" on public.project_items;
create policy "admins insert projects" on public.project_items for insert to authenticated
with check (exists(select 1 from public.admin_users a where a.user_id = (select auth.uid())));
drop policy if exists "admins update projects" on public.project_items;
create policy "admins update projects" on public.project_items for update to authenticated
using (exists(select 1 from public.admin_users a where a.user_id = (select auth.uid())))
with check (exists(select 1 from public.admin_users a where a.user_id = (select auth.uid())));
drop policy if exists "admins delete projects" on public.project_items;
create policy "admins delete projects" on public.project_items for delete to authenticated
using (exists(select 1 from public.admin_users a where a.user_id = (select auth.uid())));

insert into public.site_settings(id,announcement,whatsapp_number,contact_email)
values (1, '', '2347066461764','')
on conflict (id) do nothing;

insert into public.video_items(platform,title,url,sort_order,published)
select seed.platform,seed.title,seed.url,seed.sort_order,true
from (values
 ('tiktok','TikTok video 01','https://vt.tiktok.com/ZSpHVS4vu/',10),
 ('tiktok','TikTok video 02','https://vt.tiktok.com/ZSpHV5UvT/',20),
 ('tiktok','TikTok video 03','https://vt.tiktok.com/ZSpHVy2nY/',30),
 ('tiktok','TikTok video 04','https://www.tiktok.com/@siroyedotaicreator/video/7697542340881157398',40),
 ('youtube','YouTube Short 01','https://www.youtube.com/shorts/fnJ_W3EyECg',50),
 ('youtube','YouTube Short 02','https://www.youtube.com/shorts/wGtDsP1L7aE',60)
) as seed(platform,title,url,sort_order)
where not exists(select 1 from public.video_items);

insert into public.project_items(slug,label,title,summary,note,link_url,link_label,art_text,art_style,sort_order)
values
('ile-ife','HISTORICAL STORYTELLING · SERIES','Ilé Ifẹ̀: The Dawn of a Kingdom','An AI-assisted historical storytelling series inspired by Yoruba culture and the origins of Ilé Ifẹ̀. The project uses cinematic scenes, consistent characters and episodic narration to bring cultural stories to screen.','Historical dramatization and visual storytelling; AI visuals should not be mistaken for archival footage.','https://www.youtube.com/@SirOyedotAIcreator','Explore on YouTube','ILÉ'||chr(10)||'IFẸ̀','history',10),
('wildlife','WILDLIFE · AI CINEMATIC VIDEO','Wildlife documentary storytelling','AI-generated wildlife sequences built around nature, movement and dramatic animal encounters. Projects include story concepts involving wolves, grizzly bears, cheetahs and gazelles.','AI-created visual stories rather than authentic documentary recordings of real animals.','https://www.tiktok.com/@siroyedot_001','Watch creator videos','THE'||chr(10)||'WILD.','wildlife',20),
('commercial','SHORT-FORM · CREATIVE ADVERTISING','AI-powered creative advertisements','Concept-led video advertising with focused scripts, realistic scenes and deliberate pacing. Each project begins with a message worth communicating, then uses AI-supported production to make it visual.','','https://vt.tiktok.com/ZSb5G4UHU/','Watch a video sample','AI'||chr(10)||'ADS.','commercial',30)
on conflict (slug) do nothing;
commit;

-- BOOTSTRAP ADMIN ONLY AFTER creating YOUR verified Supabase Auth user:
-- Replace the UUID below with YOUR auth.users.id, then run separately:
-- insert into public.admin_users(user_id) values ('YOUR_AUTH_USER_UUID') on conflict do nothing;
