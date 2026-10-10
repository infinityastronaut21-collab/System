// SYSTEM — Garantit l'existence du profil (FK profiles requis par
// activities/projects/super_projects). Sans effet si la ligne existe.

import { getSupabase } from './supabase';

export async function ensureProfile(): Promise<void> {
  const supabase = getSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  const { data } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();
  if (!data) {
    // Échoue silencieusement si la policy d'insert n'est pas encore appliquée
    // (dans ce cas, exécuter supabase/fix_profiles.sql une fois suffit).
    await supabase.from('profiles').insert({ id: user.id, username: 'Infinity' });
  }
}