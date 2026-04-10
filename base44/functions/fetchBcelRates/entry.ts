import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Try fetching BCEL exchange rate page directly (server-side, no CORS)
    let usdBuy = null;
    let usdSell = null;

    try {
      const response = await fetch('https://www.bcel.com.la/api/exchange_rate/exchange_rate.php', {
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'Accept': 'application/json, text/html, */*',
        },
      });
      const text = await response.text();

      // Try JSON parse first (BCEL sometimes returns JSON)
      try {
        const data = JSON.parse(text);
        // Look for USD in the array
        const usdEntry = (data || []).find(
          (item) => item.currency === 'USD' || item.code === 'USD' || item.CurrencyCode === 'USD'
        );
        if (usdEntry) {
          usdBuy = Number(usdEntry.buy || usdEntry.Buy || usdEntry.buying) || null;
          usdSell = Number(usdEntry.sell || usdEntry.Sell || usdEntry.selling) || null;
        }
      } catch {
        // Not JSON, try HTML parsing
        const rowMatch = text.match(
          /<tr[^>]*>[\s\S]*?USD[\s\S]*?<td[^>]*>\s*([0-9,\.]+)\s*<\/td>[\s\S]*?<td[^>]*>\s*([0-9,\.]+)\s*<\/td>/i
        );
        if (rowMatch) {
          usdBuy = Number(rowMatch[1].replace(/,/g, ''));
          usdSell = Number(rowMatch[2].replace(/,/g, ''));
        }
      }
    } catch (fetchErr) {
      console.log('Direct BCEL fetch failed:', fetchErr.message);
    }

    // Fallback: use LLM with internet search to get current BCEL rate
    if (!usdBuy || !usdSell) {
      try {
        const llmResult = await base44.integrations.Core.InvokeLLM({
          prompt: 'What is the current BCEL (Banque pour le Commerce Extérieur Lao) exchange rate for USD to LAK today? Return the buy rate and sell rate as numbers only.',
          add_context_from_internet: true,
          response_json_schema: {
            type: 'object',
            properties: {
              usd_buy: { type: 'number', description: 'USD buy rate in LAK' },
              usd_sell: { type: 'number', description: 'USD sell rate in LAK' },
            },
            required: ['usd_buy', 'usd_sell'],
          },
        });
        if (llmResult?.usd_buy && llmResult?.usd_sell) {
          usdBuy = llmResult.usd_buy;
          usdSell = llmResult.usd_sell;
        }
      } catch (llmErr) {
        console.log('LLM fallback failed:', llmErr.message);
      }
    }

    if (!usdBuy || !usdSell) {
      return Response.json({
        success: false,
        error: 'Could not fetch rates',
        rates: null,
      });
    }

    return Response.json({
      success: true,
      rates: {
        usdBuy,
        usdSell,
        usdtBuy: usdBuy,
        usdtSell: usdSell,
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});