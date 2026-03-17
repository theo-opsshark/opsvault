# OpsVault Setup Guide

## Prerequisites
- Supabase project: `pxjwajevmuvsbygsmgjy`
- Vercel account (for deployment)

---

## Step 1: Create Database Tables

Go to **[Supabase Dashboard → SQL Editor](https://supabase.com/dashboard/project/pxjwajevmuvsbygsmgjy/sql/new)** and run:

```sql
-- Folders table
create table if not exists folders (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  parent_id uuid references folders(id) on delete cascade,
  created_at timestamptz default now()
);

-- Files table
create table if not exists files (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  content text default '',
  folder_id uuid references folders(id) on delete set null,
  author text default 'theo',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable Row Level Security (allow all for now — no auth required for file access)
alter table folders enable row level security;
alter table files enable row level security;

create policy "Allow all" on folders for all using (true) with check (true);
create policy "Allow all" on files for all using (true) with check (true);
```

Click **Run** ✓

---

## Step 2: Enable Google OAuth

1. Go to **[Supabase Dashboard → Authentication → Providers](https://supabase.com/dashboard/project/pxjwajevmuvsbygsmgjy/auth/providers)**
2. Find **Google** and enable it
3. Enter:
   - **Client ID:** `<your-client-id>`
   - **Client Secret:** `<your-client-secret>`
4. Copy the **Callback URL** shown (looks like: `https://pxjwajevmuvsbygsmgjy.supabase.co/auth/v1/callback`)
5. Go to **[Google Cloud Console → OAuth Credentials](https://console.cloud.google.com/apis/credentials)** for the OAuth client
6. Add the Supabase callback URL to **Authorized redirect URIs**
7. Save

---

## Step 3: Configure Allowed Redirect URLs

In **[Supabase → Auth → URL Configuration](https://supabase.com/dashboard/project/pxjwajevmuvsbygsmgjy/auth/url-configuration)**:

- **Site URL:** `https://your-vercel-domain.vercel.app`
- **Redirect URLs:** Add:
  - `https://your-vercel-domain.vercel.app/auth/callback`
  - `http://localhost:3000/auth/callback` (for local dev)

---

## Step 4: Deploy to Vercel

```bash
cd /path/to/opsvault
npx vercel --prod
```

Or connect the repo in the Vercel dashboard.

### Environment Variables (set in Vercel project settings):
```
NEXT_PUBLIC_SUPABASE_URL=https://pxjwajevmuvsbygsmgjy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4andhamV2bXV2c2J5Z3NtZ2p5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3NjA4MDMsImV4cCI6MjA4OTMzNjgwM30.WSV7UmU-KyY-GZ6u1-1tcqjABR4RmfGlPqVUcZWLLfA
```

---

## Step 5: Update Vercel URL in Supabase

After first deploy, update the Site URL in Supabase Auth settings to your actual Vercel domain.

---

## Local Development

```bash
cd opsvault
npm install
npm run dev
# → http://localhost:3000
```

---

## Access Control

- Only `@opsshark.com` Google accounts can sign in (enforced in middleware + auth callback)
- All signed-in users can read/write all files (no per-file permissions in MVP)

---

## App Features

- 📁 Nested folder tree with collapse/expand
- 📝 Markdown editor with auto-save (1.2s debounce)
- 👁️ Live markdown preview (react-markdown + syntax highlighting)
- ✏️ Right-click context menus (rename, delete, new file in folder)
- 🌙 Slick dark theme (Notion × Linear × Obsidian vibes)
- 👤 Google OAuth login (opsshark.com restricted)
- 📱 Collapsible sidebar
