/**
 * Modern, High-End HTML Email Templates for ForgeQA
 * Compatible with Gmail, Apple Mail, Outlook, and mobile clients.
 */

export function getPasswordResetEmailHtml(to, resetUrl) {
  const currentYear = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your ForgeQA Password</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td, a { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important; }
  </style>
  <![endif]-->
</head>
<body style="margin:0; padding:0; background-color:#f1f5f9; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing:antialiased; -moz-osx-font-smoothing:grayscale; color:#0f172a;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f1f5f9; padding:40px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:540px; background-color:#ffffff; border:1px solid #e2e8f0; border-radius:16px; overflow:hidden; box-shadow:0 10px 25px -5px rgba(15,23,42,0.05), 0 8px 10px -6px rgba(15,23,42,0.02);">
          
          <!-- Top Accent Gradient Bar -->
          <tr>
            <td height="5" style="background:linear-gradient(90deg, #2563eb 0%, #06b6d4 50%, #7c3aed 100%); font-size:0; line-height:0;">&nbsp;</td>
          </tr>

          <!-- Header / Brand -->
          <tr>
            <td style="padding:36px 36px 24px; text-align:left;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="vertical-align:middle; padding-right:12px;">
                    <div style="width:40px; height:40px; border-radius:10px; background:linear-gradient(135deg, #0f172a 0%, #1e293b 100%); text-align:center; line-height:40px; color:#38bdf8; font-weight:900; font-size:18px; font-family:'Segoe UI', sans-serif; display:inline-block; border:1px solid #334155;">
                      F
                    </div>
                  </td>
                  <td style="vertical-align:middle;">
                    <span style="font-size:20px; font-weight:800; color:#0f172a; letter-spacing:-0.5px;">Forge<span style="color:#0284c7;">QA</span></span>
                    <span style="display:block; font-size:10px; font-weight:600; color:#64748b; letter-spacing:1px; text-transform:uppercase;">Security Access Control</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 36px;">
              <div style="border-top:1px solid #f1f5f9; height:1px;"></div>
            </td>
          </tr>

          <!-- Main Body Content -->
          <tr>
            <td style="padding:28px 36px 36px; text-align:left;">
              <h1 style="margin:0 0 12px; font-size:22px; font-weight:700; color:#0f172a; letter-spacing:-0.3px; line-height:1.3;">
                Reset your password
              </h1>
              
              <p style="margin:0 0 20px; font-size:15px; line-height:1.6; color:#475569;">
                Hello,<br><br>
                We received a request to reset the password for your account associated with <strong style="color:#0f172a; word-break:break-all;">${to}</strong>.
              </p>

              <p style="margin:0 0 28px; font-size:15px; line-height:1.6; color:#475569;">
                To set a new password and reclaim access to your workspace, click the button below:
              </p>

              <!-- CTA Button -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0; width:100%;">
                <tr>
                  <td align="center">
                    <a href="${resetUrl}" target="_blank" style="display:block; text-align:center; background:linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color:#ffffff; font-size:15px; font-weight:600; text-decoration:none; padding:14px 28px; border-radius:10px; box-shadow:0 4px 12px rgba(37,99,235,0.25); border:1px solid #1d4ed8; letter-spacing:-0.2px;">
                      Reset Password &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card Footer -->
          <tr>
            <td style="background-color:#f8fafc; border-top:1px solid #e2e8f0; padding:20px 36px; text-align:center;">
              <p style="margin:0 0 6px; font-size:12px; color:#64748b;">
                Need assistance? Contact our support team at <a href="mailto:support@forgeqa.in" style="color:#2563eb; text-decoration:none; font-weight:500;">support@forgeqa.in</a>
              </p>
              <p style="margin:0; font-size:11px; color:#94a3b8;">
                &copy; ${currentYear} ForgeQA Inc. All rights reserved. • AI-Powered QA & Test Automation
              </p>
            </td>
          </tr>

        </table>
        
        <!-- Outer Subfooter -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:540px; margin-top:20px; text-align:center;">
          <tr>
            <td style="font-size:11px; color:#94a3b8; line-height:1.5;">
              This is a mandatory transactional security message regarding your ForgeQA account.<br>
              ForgeQA Inc., Automated Testing Cloud Infrastructure.
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function getProductKeyEmailHtml(to, productKey, customerName) {
  const currentYear = new Date().getFullYear();
  const baseUrl = process.env.APP_URL || 'http://127.0.0.1:5173';
  const completeUrl = `${baseUrl}/auth/complete-registration?email=${encodeURIComponent(to)}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your ForgeQA Product License Key</title>
</head>
<body style="margin:0; padding:0; background-color:#f1f5f9; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; color:#0f172a;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f1f5f9; padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:540px; background-color:#ffffff; border:1px solid #e2e8f0; border-radius:16px; overflow:hidden; box-shadow:0 10px 25px -5px rgba(15,23,42,0.05);">
          
          <tr>
            <td height="5" style="background:linear-gradient(90deg, #2563eb 0%, #06b6d4 50%, #7c3aed 100%);">&nbsp;</td>
          </tr>

          <tr>
            <td style="padding:36px 36px 20px;">
              <span style="font-size:20px; font-weight:800; color:#0f172a;">Forge<span style="color:#0284c7;">QA</span></span>
            </td>
          </tr>

          <tr>
            <td style="padding:10px 36px 36px;">
              <h1 style="margin:0 0 12px; font-size:22px; font-weight:700; color:#0f172a;">
                Your ForgeQA License Key
              </h1>
              <p style="margin:0 0 20px; font-size:15px; line-height:1.6; color:#475569;">
                Thank you for choosing ForgeQA${customerName ? ', ' + customerName : ''}! Your workspace activation key is ready:
              </p>

              <div style="background-color:#0f172a; border:2px dashed #38bdf8; border-radius:12px; padding:18px; text-align:center; font-family:ui-monospace, 'Courier New', monospace; font-size:22px; font-weight:800; letter-spacing:4px; color:#38bdf8; margin-bottom:28px;">
                ${productKey}
              </div>

              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%; margin-bottom:24px;">
                <tr>
                  <td align="center">
                    <a href="${completeUrl}" target="_blank" style="display:block; text-align:center; background:#2563eb; color:#ffffff; font-size:15px; font-weight:600; text-decoration:none; padding:14px 28px; border-radius:10px;">
                      Complete Account Setup &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="background-color:#f8fafc; border-top:1px solid #e2e8f0; padding:16px 36px; text-align:center; font-size:11px; color:#94a3b8;">
              &copy; ${currentYear} ForgeQA Inc. All rights reserved.
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
