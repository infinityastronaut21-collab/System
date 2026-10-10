-- SYSTEM — Répare les profils manquants.
-- Le trigger handle_new_user ne couvre que les inscriptions POSTÉRIEURES au
-- schéma : tout utilisateur existant n'a pas de ligne dans profiles, et tous
-- ses INSERT dans activities/projects/super_projects échouent (FK).
insert into public.profiles (id, username)
select id, 'Infinity' from auth.users
on conflict (id) do nothing;