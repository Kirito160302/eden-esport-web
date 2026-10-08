-- ============================================================
--  ESPACE ÉQUIPE — PHASE 1 : passage aux 7 équipes
--  À lancer une fois dans Supabase → SQL Editor.
--  Les 7 équipes sont définies dans le code (clés/slugs) ; ici on
--  reclasse simplement les données existantes vers les nouvelles clés.
--  Les anciennes valeurs génériques (« Valorant », « League of Legends »)
--  sont mises par défaut sur l'équipe « Pro » ; le staff répartit ensuite
--  les membres vers Rising / Académie / Two depuis l'onglet Équipe.
-- ============================================================

update public.profiles      set team = 'valorant-pro' where lower(coalesce(team,'')) in ('valorant','valo','val');
update public.profiles      set team = 'lol-pro'      where lower(coalesce(team,'')) in ('league of legends','lol','league');

update public.sessions      set team = 'valorant-pro' where lower(coalesce(team,'')) in ('valorant','valo','val');
update public.sessions      set team = 'lol-pro'      where lower(coalesce(team,'')) in ('league of legends','lol','league');

update public.announcements set team = 'valorant-pro' where lower(coalesce(team,'')) in ('valorant','valo','val');
update public.announcements set team = 'lol-pro'      where lower(coalesce(team,'')) in ('league of legends','lol','league');

-- Vérif : répartition des membres par équipe
-- select team, count(*) from public.profiles group by team order by team;
