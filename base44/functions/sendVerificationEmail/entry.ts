import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { email, status, fullName } = body || {};

    if (!email || !status) {
      return Response.json({ error: 'Missing email or status' }, { status: 400 });
    }

    const isApproved = status === 'verified';
    const subject = isApproved ? 'Your account verification was approved' : 'Your account verification was rejected';
    const bodyHtml = isApproved
      ? `<p>Hello ${fullName || ''},</p><p>Your identity has been verified successfully. You can now use all features in the app.</p>`
      : `<p>Hello ${fullName || ''},</p><p>Your identity verification was rejected. Please resubmit with clearer documents.</p>`;

    await base44.integrations.Core.SendEmail({
      to: email,
      subject,
      body: bodyHtml,
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});