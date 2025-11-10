import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PasswordResetRequest {
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email }: PasswordResetRequest = await req.json();

    if (!email) {
      throw new Error("Email is required");
    }

    console.log("Processing password reset request for:", email);

    // Initialize Supabase client with service role for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Generate password reset token
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: email,
    });

    if (error) {
      console.error("Error generating reset link:", error);
      throw error;
    }

    console.log("Reset link generated successfully");

    // Extract the token from the generated link
    const resetLink = data.properties.action_link;

    // Send custom branded email via Resend API
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "OCX Whisper <onboarding@resend.dev>",
        to: [email],
        subject: "Reset Your OCX Whisper Password",
        html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reset Your Password</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; background-color: #0a0a0a;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1a1a2e 0%, #0a0a0a 100%); border-radius: 16px; border: 1px solid #2a2a3e; overflow: hidden; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);">
                    
                    <!-- Header with gradient -->
                    <tr>
                      <td style="background: linear-gradient(135deg, #9b87f5 0%, #7E69AB 100%); padding: 40px 40px 30px; text-align: center;">
                        <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                          🔐 Password Reset Request
                        </h1>
                      </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                      <td style="padding: 40px;">
                        <p style="margin: 0 0 20px; color: #e0e0e0; font-size: 16px; line-height: 1.6;">
                          Hello,
                        </p>
                        <p style="margin: 0 0 30px; color: #e0e0e0; font-size: 16px; line-height: 1.6;">
                          We received a request to reset your password for your <strong style="color: #9b87f5;">OCX Whisper</strong> account. Click the button below to create a new password:
                        </p>
                        
                        <!-- CTA Button -->
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td align="center" style="padding: 20px 0;">
                              <a href="${resetLink}" style="display: inline-block; background: linear-gradient(135deg, #9b87f5 0%, #7E69AB 100%); color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 16px 48px; border-radius: 8px; box-shadow: 0 4px 15px rgba(155, 135, 245, 0.3);">
                                Reset Password
                              </a>
                            </td>
                          </tr>
                        </table>
                        
                        <p style="margin: 30px 0 20px; color: #a0a0a0; font-size: 14px; line-height: 1.6;">
                          Or copy and paste this link into your browser:
                        </p>
                        <p style="margin: 0 0 30px; color: #7E69AB; font-size: 13px; word-break: break-all; background-color: #1a1a2e; padding: 15px; border-radius: 8px; border: 1px solid #2a2a3e;">
                          ${resetLink}
                        </p>
                        
                        <!-- Security Notice -->
                        <div style="background-color: rgba(155, 135, 245, 0.1); border-left: 4px solid #9b87f5; padding: 15px; border-radius: 4px; margin: 30px 0;">
                          <p style="margin: 0; color: #e0e0e0; font-size: 14px; line-height: 1.6;">
                            <strong style="color: #9b87f5;">🛡️ Security Note:</strong> This link will expire in 1 hour for your security.
                          </p>
                        </div>
                        
                        <p style="margin: 0; color: #a0a0a0; font-size: 14px; line-height: 1.6;">
                          If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="background-color: #0a0a0a; padding: 30px 40px; border-top: 1px solid #2a2a3e;">
                        <p style="margin: 0 0 10px; color: #606060; font-size: 13px; text-align: center;">
                          Best regards,<br>
                          <strong style="color: #9b87f5;">The OCX Whisper Team</strong>
                        </p>
                        <p style="margin: 15px 0 0; color: #505050; font-size: 12px; text-align: center; line-height: 1.5;">
                          Secure messaging with neural encryption<br>
                          © ${new Date().getFullYear()} OCX Whisper. All rights reserved.
                        </p>
                      </td>
                    </tr>
                  </table>
                  
                  <!-- Email footer text -->
                  <p style="margin: 30px 0 0; color: #505050; font-size: 12px; text-align: center; line-height: 1.5;">
                    This is an automated message, please do not reply to this email.
                  </p>
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
      console.error("Error sending email:", errorData);
      throw new Error(`Failed to send email: ${errorData}`);
    }

    const emailData = await emailResponse.json();
    console.log("Password reset email sent successfully:", emailData);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Password reset email sent successfully" 
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-password-reset function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Failed to send password reset email",
        details: error.toString()
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
