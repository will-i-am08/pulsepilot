// Supabase Edge Function: generate-event (AI-driven world news)
// Requires ANTHROPIC_API_KEY env var in Supabase Vault
// Cron weekly: cron.schedule('generate-event', '0 9 * * 1', $$ select net.http_post(...) $$)

Deno.serve(async (req) => {
  const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!anthropicKey) return new Response(JSON.stringify({ error: 'No ANTHROPIC_API_KEY' }), { status: 500 });

  const prompt = `Generate ONE Silicon Valley satirical news headline for next week. Return JSON {headline, effect, type: "trend"|"crisis"|"opportunity"|"market"}. Headline max 14 words.`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': anthropicKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 200,
      system: 'Reply with JSON only.',
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  const data = await res.json();
  const text = data.content?.[0]?.text || '{}';
  const parsed = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] || '{}');

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
  const supabase = createClient(supabaseUrl, serviceKey);
  await supabase.from('world_events').insert({ headline: parsed.headline, effect: parsed.effect, type: parsed.type });

  return new Response(JSON.stringify(parsed), { headers: { 'content-type': 'application/json' } });
});
