import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, paymongo-signature',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });

const timingSafeEqual = (left: string, right: string) => {
  if (left.length !== right.length) return false;

  let mismatch = 0;
  for (let i = 0; i < left.length; i += 1) {
    mismatch |= left.charCodeAt(i) ^ right.charCodeAt(i);
  }

  return mismatch === 0;
};

const hex = (buffer: ArrayBuffer) =>
  [...new Uint8Array(buffer)].map((value) => value.toString(16).padStart(2, '0')).join('');

const verifySignature = async (signatureHeader: string, rawBody: string, secret: string) => {
  const parts = Object.fromEntries(
    signatureHeader.split(',').map((part) => {
      const [key, value] = part.split('=');
      return [key, value];
    }),
  );

  const timestamp = parts.t;
  const providedSignature = parts.li || parts.te;

  if (!timestamp || !providedSignature) {
    return false;
  }

  const payload = `${timestamp}.${rawBody}`;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );

  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return timingSafeEqual(hex(signature), providedSignature);
};

serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const rawBody = await request.text();

  try {
    const paymongoWebhookSecret = Deno.env.get('PAYMONGO_WEBHOOK_SECRET');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!paymongoWebhookSecret || !supabaseUrl || !serviceRoleKey) {
      return json({ error: 'Missing server configuration' }, 500);
    }

    const signatureHeader = request.headers.get('Paymongo-Signature');
    if (!signatureHeader || !(await verifySignature(signatureHeader, rawBody, paymongoWebhookSecret))) {
      return json({ error: 'Invalid signature' }, 401);
    }

    const payload = JSON.parse(rawBody);
    const eventType = payload?.data?.attributes?.type as string | undefined;

    if (eventType !== 'checkout_session.payment.paid') {
      return json({ received: true });
    }

    const session = payload?.data?.attributes?.data;
    const sessionId = session?.id as string | undefined;
    const sessionAttributes = session?.attributes;
    const payment = sessionAttributes?.payments?.[0];
    const paymentIntent = sessionAttributes?.payment_intent;
    const paidAtUnix = payment?.attributes?.paid_at as number | undefined;
    const paidAt = paidAtUnix ? new Date(paidAtUnix * 1000).toISOString() : new Date().toISOString();

    if (!sessionId) {
      return json({ error: 'Missing checkout session id' }, 400);
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: matchedOrder, error: matchError } = await supabase
      .from('orders')
      .select('id')
      .eq('paymongo_checkout_session_id', sessionId)
      .maybeSingle();

    if (matchError || !matchedOrder) {
      return json({ error: 'Order not found for checkout session' }, 404);
    }

    const { error: updateError } = await supabase
      .from('orders')
      .update({
        paid_at: paidAt,
        payment_method: 'online',
        payment_status: 'paid',
        paymongo_payment_id: payment?.id ?? null,
        paymongo_payment_intent_id: paymentIntent?.id ?? null,
        status: 'in_progress',
      })
      .eq('id', matchedOrder.id);

    if (updateError) {
      return json({ error: 'Failed to update order' }, 500);
    }

    return json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return json({ error: message }, 500);
  }
});
