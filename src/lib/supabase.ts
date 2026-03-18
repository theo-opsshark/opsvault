import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Folder = {
  id: string
  name: string
  parent_id: string | null
  created_at: string
  sort_order: number | null
}

export type VaultFile = {
  id: string
  name: string
  content: string
  folder_id: string | null
  author: string
  created_at: string
  updated_at: string
  sort_order: number | null
}
