import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://ocodx.store",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PasswordResetRequest {
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // FIX: always return 200 regardless of whether the email exists.
  // Returning an error when the email is not found allows attackers to
  // enumerate which emails are registered (user enumeration attack).
  const successResponse = new Response(
    JSON.stringify({
      success: true,
      message: "If this email is registered, a reset link has been sent.",
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    }
  );

  try {
    const { email }: PasswordResetRequest = await req.json();

    if (!email || typeof email !== "string" || !email.includes("@")) {
      // Return generic success — don't reveal validation details
      return successResponse;
    }

    const normalizedEmail = email.trim().toLowerCase();
    console.log("Processing password reset request");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Generate password reset token
    // FIX: if email doesn't exist, generateLink will error — we catch it silently
    // and still return 200 so the caller can't tell the difference.
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: normalizedEmail,
    });

    if (error) {
      // Silently swallow the error — do NOT expose it to the client
      console.error("Error generating reset link (not exposed to client):", error.message);
      return successResponse;
    }

    const resetLink = data.properties.action_link;

    console.log("Sending email to:", normalizedEmail);
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "OcodX <no-reply@ocodx.website>",
        to: [normalizedEmail],
        subject: "Reset Your OcodX Password",
        html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reset Your Password</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; background-color: #0a0a0a;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1a1a2e 0%, #0a0a0a 100%); border-radius: 16px; border: 1px solid #2a2a3e; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.5);">
                    <tr>
                      <td style="background: linear-gradient(135deg, #9b87f5 0%, #7E69AB 100%); padding: 40px 40px 30px; text-align: center;">
                        <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                          🔐 Password Reset Request
                        </h1>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 40px;">
                        <p style="margin: 0 0 20px; color: #e0e0e0; font-size: 16px; line-height: 1.6;">Hello,</p>
                        <p style="margin: 0 0 30px; color: #e0e0e0; font-size: 16px; line-height: 1.6;">
                          We received a request to reset your password for your <strong style="color: #9b87f5;">OcodX</strong> account. Click the button below to create a new password:
                        </p>
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td align="center" style="padding: 20px 0;">
                              <a href="${resetLink}" style="display: inline-block; background: linear-gradient(135deg, #9b87f5 0%, #7E69AB 100%); color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 16px 48px; border-radius: 8px;">
                                Reset Password
                              </a>
                            </td>
                          </tr>
                        </table>
                        <div style="background-color: rgba(155,135,245,0.1); border-left: 4px solid #9b87f5; padding: 15px; border-radius: 4px; margin: 30px 0;">
                          <p style="margin: 0; color: #e0e0e0; font-size: 14px; line-height: 1.6;">
                            <strong style="color: #9b87f5;">🛡️ Security Note:</strong> This link will expire in 1 hour for your security.
                          </p>
                        </div>
                        <p style="margin: 0; color: #a0a0a0; font-size: 14px; line-height: 1.6;">
                          If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td style="background-color: #0a0a0a; padding: 30px 40px; border-top: 1px solid #2a2a3e;">
                        <p style="margin: 0 0 10px; color: #606060; font-size: 13px; text-align: center;">
                          Best regards,<br>
                          <strong style="color: #9b87f5;">The OcodX Team</strong>
                        </p>
                        <p style="margin: 15px 0 0; color: #505050; font-size: 12px; text-align: center; line-height: 1.5;">
                          © ${new Date().getFullYear()} OcodX. All rights reserved.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
        `,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.text();
      console.error("Resend API error:", errorData);
      // Still return success — don't expose email sending failures
      return successResponse;
    }

    console.log("Password reset email sent successfully");
    return successResponse;

  } catch (error: any) {
    console.error("Error in send-password-reset function:", error);
    // FIX: always return 200 — never expose internal errors to the client
    return successResponse;
  }
};

serve(handler);
