import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface VehicleLine {
  manufacturer?: string;
  model?: string;
  category?: string;
  subcategory?: string;
  year?: string;
  color?: string;
  quantity?: number;
  additions?: string[];
  rentType?: string[];
  description?: string;
}

interface Payload {
  to: string;
  fullName?: string;
  company?: string;
  phone?: string;
  region?: string;
  city?: string;
  quotationNumber?: string;
  vehicles?: VehicleLine[];
  description?: string;
}

function buildHtml(p: Payload): string {
  const vehicleRows = (p.vehicles || []).map((v, i) => `
    <tr>
      <td style="padding:8px;border:1px solid #e0e0e0">${i + 1}</td>
      <td style="padding:8px;border:1px solid #e0e0e0">${v.manufacturer || ''} ${v.model || ''}</td>
      <td style="padding:8px;border:1px solid #e0e0e0">${v.category || ''} / ${v.subcategory || ''}</td>
      <td style="padding:8px;border:1px solid #e0e0e0">${v.year || ''}</td>
      <td style="padding:8px;border:1px solid #e0e0e0">${v.color || ''}</td>
      <td style="padding:8px;border:1px solid #e0e0e0">${v.quantity || 1}</td>
      <td style="padding:8px;border:1px solid #e0e0e0">${(v.rentType || []).join(', ')}</td>
      <td style="padding:8px;border:1px solid #e0e0e0">${(v.additions || []).join(', ')}</td>
    </tr>
  `).join('');

  return `
    <div style="font-family:Arial,sans-serif;max-width:720px;margin:0 auto;color:#333">
      <div style="background:#1a6b3c;padding:20px;color:#fff">
        <h2 style="margin:0">BTC Lease Prototype System</h2>
        <p style="margin:4px 0 0 0">Quotation Request ${p.quotationNumber || ''}</p>
      </div>
      <div style="padding:20px;background:#f7f7f7">
        <h3>Customer Information</h3>
        <p><strong>Name:</strong> ${p.fullName || '-'}<br>
           <strong>Company:</strong> ${p.company || '-'}<br>
           <strong>Phone:</strong> ${p.phone || '-'}<br>
           <strong>Email:</strong> ${p.to}<br>
           <strong>Region / City:</strong> ${p.region || '-'} / ${p.city || '-'}</p>

        <h3>Requested Vehicles</h3>
        <table style="width:100%;border-collapse:collapse;font-size:13px">
          <thead style="background:#1a6b3c;color:#fff">
            <tr>
              <th style="padding:8px;border:1px solid #e0e0e0">#</th>
              <th style="padding:8px;border:1px solid #e0e0e0">Vehicle</th>
              <th style="padding:8px;border:1px solid #e0e0e0">Category</th>
              <th style="padding:8px;border:1px solid #e0e0e0">Year</th>
              <th style="padding:8px;border:1px solid #e0e0e0">Color</th>
              <th style="padding:8px;border:1px solid #e0e0e0">Qty</th>
              <th style="padding:8px;border:1px solid #e0e0e0">Rent Type</th>
              <th style="padding:8px;border:1px solid #e0e0e0">Additions</th>
            </tr>
          </thead>
          <tbody>${vehicleRows}</tbody>
        </table>

        ${p.description ? `<h3>Description</h3><p>${p.description}</p>` : ''}

        <p style="margin-top:24px;color:#666;font-size:12px">
          Thank you for choosing BTC Lease Prototype System. Our team will contact you shortly.
        </p>
      </div>
    </div>
  `;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const payload = (await req.json()) as Payload;

    if (!payload.to) {
      return new Response(JSON.stringify({ error: "Recipient email is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const html = buildHtml(payload);
    const subject = `Quotation Request ${payload.quotationNumber || ''} - BTC Lease Prototype System`;

    const resendKey = Deno.env.get("RESEND_API_KEY");
    let delivered = false;
    let providerMessage = "Simulated delivery (no RESEND_API_KEY configured)";

    if (resendKey) {
      const fromAddr = Deno.env.get("QUOTATION_FROM_EMAIL") || "onboarding@resend.dev";
      const resp = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromAddr,
          to: [payload.to],
          subject,
          html,
        }),
      });
      const body = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        return new Response(
          JSON.stringify({ error: "Email provider error", details: body }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      delivered = true;
      providerMessage = `Sent via Resend (id: ${body?.id || 'unknown'})`;
    } else {
      console.log("[send-quotation-email] SIMULATED send to", payload.to);
      console.log("[send-quotation-email] Subject:", subject);
    }

    return new Response(
      JSON.stringify({ success: true, delivered, message: providerMessage, to: payload.to }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message || "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
