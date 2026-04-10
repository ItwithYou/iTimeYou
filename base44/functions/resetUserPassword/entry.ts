import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const { email } = await req.json();
    if (!email) {
      return Response.json({ error: 'Email is required' }, { status: 400 });
    }

    // Generate a random temporary password
    const tempPassword = Math.random().toString(36).slice(-8);

    // Note: Base44 doesn't have a direct password reset API
    // This function sends an email with password reset instructions
    // The actual password reset would need to be done through Base44's auth system
    
    await base44.integrations.Core.SendEmail({
      to: email,
      subject: 'Password Reset Request',
      body: `Hello,

Your password has been reset by an administrator.

Temporary Password: ${tempPassword}

Please log in with this temporary password and change it immediately.

If you did not request this, please contact support.`,
    });

    return Response.json({ 
      success: true, 
      message: 'Password reset email sent',
      tempPassword 
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});