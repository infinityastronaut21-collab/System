'use client';

// SYSTEM — En-tête d'écran : « System » + icône burger (Doc 4 §6.1)

import { useEffect, useState } from 'react';
import { getSupabase } from '@/lib/supabase';
import Drawer from './Drawer';
import { IconBurger } from './Icons';

export default function AppHeader({ title = 'System' }: { title?: string }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [username, setUsername] = useState('Infinity');

  useEffect(() => {
    getSupabase()
      .from('profiles')
      .select('username')
      .maybeSingle()
      .then(({ data }) => {
        if (data?.username) setUsername(data.username);
      });
  }, []);

  return (
    <>
      <header className="sticky top-0 z-20 flex min-h-[56px] items-center justify-between border-b border-line bg-paper px-4">
        <h1 className="screen-title">{title}</h1>
        <button
          onClick={() => setDrawerOpen(true)}
          aria-label="Ouvrir le menu"
          className="flex min-h-[44px] min-w-[44px] items-center justify-center text-ink"
        >
          <IconBurger />
        </button>
      </header>
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} username={username} />
    </>
  );
}
