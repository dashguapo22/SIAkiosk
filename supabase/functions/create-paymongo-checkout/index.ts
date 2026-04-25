import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });

const toCentavos = (amount: number) => Math.round(Number(amount) * 100);

serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const paymongoSecretKey = Deno.env.get('PAYMONGO_SECRET_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!paymongoSecretKey || !supabaseUrl || !serviceRoleKey) {
      return json({ error: 'Missing server configuration' }, 500);
    }

    const { orderId, returnOrigin } = await request.json();

    if (!orderId || !returnOrigin) {
      return json({ error: 'orderId and returnOrigin are required' }, 400);
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const [{ data: order, error: orderError }, { data: items, error: itemsError }] = await Promise.all([
      supabase.from('orders').select('*').eq('id', orderId).single(),
      supabase.from('order_items').select('*').eq('order_id', orderId),
    ]);

    if (orderError || !order) {
      return json({ error: 'Order not found' }, 404);
    }

    if (itemsError || !items || items.length === 0) {
      return json({ error: 'Order items not found' }, 400);
    }

    if (order.payment_status === 'paid') {
      return json({ error: 'Order is already paid' }, 409);
    }

    const referenceNumber = `order_${order.order_number}_${order.id}`;
    const paymentMethodTypes = (Deno.env.get('PAYMONGO_PAYMENT_METHOD_TYPES') ?? 'gcash,card')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);

    const body = {
      data: {
        attributes: {
          cancel_url: `${returnOrigin}/payment-return?status=cancelled&order_id=${order.id}`,
          description: `Cafe Maestro Order #${order.order_number}`,
          line_items: items.map((item) => ({
            amount: toCentavos(Number(item.unit_price)),
            currency: 'PHP',
            description: `${item.size} / ${item.temperature}`,
            name: item.item_name,
            quantity: item.quantity,
          })),
          metadata: {
            order_id: order.id,
            order_number: String(order.order_number),
          },
          payment_method_types: paymentMethodTypes,
          reference_number: referenceNumber,
          send_email_receipt: true,
          show_description: true,
          show_line_items: true,
          success_url: `${returnOrigin}/payment-return?status=success&order_id=${order.id}`,
        },
      },
    };

    const paymongoResponse = await fetch('https://api.paymongo.com/v1/checkout_sessions', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${btoa(`${paymongoSecretKey}:`)}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const paymongoData = await paymongoResponse.json();

    if (!paymongoResponse.ok) {
      return json(
        {
          error: 'Failed to create PayMongo checkout session',
          details: paymongoData,
        },
        paymongoResponse.status,
      );
    }

    const sessionId = paymongoData?.data?.id as string | undefined;
    const checkoutUrl = paymongoData?.data?.attributes?.checkout_url as string | undefined;

    if (!sessionId || !checkoutUrl) {
      return json({ error: 'Invalid PayMongo checkout session response' }, 500);
    }

    const { error: updateError } = await supabase
      .from('orders')
      .update({
        payment_method: 'online',
        paymongo_checkout_session_id: sessionId,
        paymongo_reference_number: referenceNumber,
      })
      .eq('id', order.id);

    if (updateError) {
      return json({ error: 'Failed to store checkout session' }, 500);
    }

    return json({
      checkoutUrl,
      sessionId,
      referenceNumber,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return json({ error: message }, 500);
  }
});
