"use client";
// ============================================================
//  CLIENT SUPABASE — Espace membre (joueurs & staff)
//  ------------------------------------------------------------
//  Deux variables d'environnement à poser dans Vercel :
//    NEXT_PUBLIC_SUPABASE_URL       (ex : https://xxxx.supabase.co)
//    NEXT_PUBLIC_SUPABASE_ANON_KEY  (la clé "anon public" — publique
//                                    par nature, protégée par RLS)
//  Sans ces variables → l'espace affiche « en préparation », le reste
//  du site n'est pas affecté.
// ============================================================
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// ⚠️ Références DIRECTES obligatoires : Next.js n'inline `process.env.NEXT_PUBLIC_*`
// dans le bundle client que sous cette forme exacte (pas de fallback dynamique).
const URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
const ANON = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();

export const SUPABASE_ENABLED = !!(URL && ANON);

let _client: SupabaseClient | null = null;
export function getSupabase(): SupabaseClient | null {
  if (!SUPABASE_ENABLED) return null;
  if (!_client) {
    _client = createClient(URL, ANON, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    });
  }
  return _client;
}
