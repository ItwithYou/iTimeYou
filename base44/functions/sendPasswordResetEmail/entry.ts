import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import { v4 as uuidv4 } from 'npm:uuid';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // No auth required - this is for password reset
    const { email } = await req.json();
    
    if (!email) {
      return Response.json({ error: 'Email is required' }, { status: 400 });
    }
    
    // Check if user exists
    const users = await base44.entities.User.list();
    const user = users.find(u => u.email === email);
    
    if (!user) {
      // Don't reveal if email exists or not for security
      return Response.json({ 
        success: true, 
        message: 'If an account exists with this email, you will receive a password reset link.' 
      });
    }
    
    // Generate a unique reset token
    const resetToken = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours
    
    // Store the reset token
    await base44.entities.PasswordReset.create({
      email,
      token: resetToken,
      expires_at: expiresAt,
      used: false
    });
    
    const resetUrl = `${req.headers.get('origin') || ''}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;
    
    // Send the reset email
    await base44.integrations.Core.SendEmail({
      to: email,
      subject: 'Password Reset Request - iTimeYou',
      body: `
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <h2 style="color: #1a7a68;">Password Reset Request</h2>
            <p>Hello,</p>
            <p>You requested to reset your password for iTimeYou. Click the link below to set a new password:</p>
            <p style="margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background-color: #1a7a68; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
                Reset Password
              </a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #1a7a68;">${resetUrl}</p>
            <p style="margin-top: 30px; font-size: 14px; color: #666;">
              This link will expire in 24 hours.<br>
              If you didn't request this password reset, please ignore this email.
            </p>
            <hr style="border: none; border-top: 1px solid #eee; margin-top: 30px;">
            <p style="font-size: 12px; color: #999;">© iTimeYou</p>
          </body>
        </html>
      `
    });
    
    return Response.json({ 
      success: true, 
      message: 'If an account exists with this email, you will receive a password reset link.' 
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});