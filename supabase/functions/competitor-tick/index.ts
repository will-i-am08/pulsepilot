// Supabase Edge Function: competitor-tick
// Deploy: supabase functions deploy competitor-tick --no-verify-jwt
// Cron: select cron.schedule('competitor-tick', '0 * * * *', $$ select net.http_post('https://your-project.supabase.co/functions/v1/competitor-tick') $$);

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, serviceKey);

  // Headline Sim: bump all competitors weekly — same logic as gameStore.ts:216
  const { data: companies } = await supabase.from('companies').select('*').eq('is_player', false);
  if (!companies) return new Response(JSON.stringify({ ok: true, updated: 0 }), { headers: { 'content-type': 'application/json' } });

  for (const c of companies) {
    const trendMult = c.aggression > 70 ? 1.015 : c.aggression < 30 ? 0.99 : 1;
    const newVal = Math.floor(c.valuation * (trendMult + (Math.random() - 0.5) * 0.02));
    await supabase.from('companies').update({ valuation: newVal }).eq('id', c.id);
  }

  return new Response(JSON.stringify({ ok: true, updated: companies.length }), { headers: { 'content-type': 'application/json' } });
});
