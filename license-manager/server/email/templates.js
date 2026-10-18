function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => {
    const entities = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return entities[character];
  });
}

export function getVerificationEmailHtml({
  name,
  status,
  productKey,
  completeUrl,
  reason,
  supportEmail,
}) {
  const greeting = name ? `Hello ${escapeHtml(name)},` : 'Hello,';
  const approved = status === 'approved';
  const title = approved ? 'Welcome to ForgeQA' : 'ForgeQA Registration Update';

  const approvedContent = `
    <p style="margin:0 0 16px;">We're delighted to welcome you to ForgeQA! Your registration has been reviewed and approved by our team.</p>

    <h2 style="font-size:16px;color:#0f172a;margin:0 0 8px;">Your Product Key</h2>
    <div style="background:#f8fafc;border:2px dashed #2563eb;border-radius:10px;padding:20px;text-align:center;font-family:Consolas,'Courier New',monospace;font-size:22px;font-weight:700;letter-spacing:3px;color:#1e40af;margin:0 0 24px;">
      ${escapeHtml(productKey)}
    </div>

    <h2 style="font-size:16px;color:#0f172a;margin:0 0 10px;">Activation Steps</h2>
    <ol style="padding-left:20px;color:#475569;line-height:1.8;margin:0 0 24px;">
      <li>Click the <strong>Activate My Account</strong> button below to open the ForgeQA account setup page.</li>
      <li>Your email address and product key will be pre-filled automatically. If not, enter them manually using the values above.</li>
      <li>Create your password and complete the account setup form.</li>
      <li>Sign in to ForgeQA and start exploring all the features available on your plan.</li>
    </ol>

    <p style="text-align:center;margin:0 0 24px;">
      <a href="${escapeHtml(completeUrl)}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;font-weight:600;padding:14px 28px;border-radius:8px;font-size:15px;">
        Activate My Account &rarr;
      </a>
    </p>

    <p style="color:#64748b;font-size:13px;margin:0 0 8px;">
      If the button above doesn't work, copy and paste the link below into your browser:
    </p>
    <p style="margin:0;word-break:break-all;">
      <a href="${escapeHtml(completeUrl)}" style="color:#2563eb;font-size:12px;">${escapeHtml(completeUrl)}</a>
    </p>
  `;

  const rejectedContent = `
    <p>Thank you for your interest in ForgeQA. After carefully reviewing your registration request, we are unable to approve it at this time.</p>
    ${reason ? `<p><strong>Reason provided:</strong> ${escapeHtml(reason)}</p>` : ''}
    <p>If you believe this decision was made in error, or if you have additional information that may support your request, please contact our support team. Include the email address you used to register and any relevant details.</p>
  `;

  const content = approved ? approvedContent : rejectedContent;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:32px 16px;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#334155;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
    <!-- Header bar -->
    <tr><td style="height:5px;background:linear-gradient(90deg,#2563eb,#0ea5e9);"></td></tr>
    <!-- Logo row -->
    <tr>
      <td style="padding:28px 36px 12px;">
        <div style="font-size:22px;font-weight:800;color:#0f172a;letter-spacing:-0.5px;">
          Forge<span style="color:#2563eb;">QA</span>
        </div>
      </td>
    </tr>
    <!-- Body -->
    <tr>
      <td style="padding:8px 36px 36px;">
        <h1 style="font-size:24px;line-height:1.3;margin:0 0 16px;color:#0f172a;">${escapeHtml(title)}</h1>
        <p style="line-height:1.6;margin:0 0 20px;">${escapeHtml(greeting)}</p>
        <div style="font-size:15px;line-height:1.7;">${content}</div>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:28px 0 20px;">
        <p style="margin:0;font-size:13px;line-height:1.6;color:#64748b;">
          Need help? Our support team is here for you.<br>
          Email us at <a href="mailto:${escapeHtml(supportEmail)}" style="color:#2563eb;font-weight:600;">${escapeHtml(supportEmail)}</a> and we'll get back to you as soon as possible.
        </p>
      </td>
    </tr>
    <!-- Footer -->
    <tr>
      <td style="padding:16px 36px;background:#f8fafc;border-top:1px solid #e2e8f0;color:#94a3b8;font-size:11px;text-align:center;line-height:1.5;">
        &copy; ${new Date().getFullYear()} ForgeQA. All rights reserved.<br>
        You're receiving this email because you registered at ForgeQA.
      </td>
    </tr>
  </table>
</body>
</html>`;
}
