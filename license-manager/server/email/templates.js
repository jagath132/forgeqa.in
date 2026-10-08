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
  const title = approved ? 'Welcome to ForgeQA' : 'ForgeQA registration update';
  const content = approved
    ? `<p>Good news — your ForgeQA registration has been approved. We’re glad to welcome you!</p>
       <p>Your product key is:</p>
       <div style="background:#f8fafc;border:1px dashed #94a3b8;border-radius:8px;padding:16px;text-align:center;font-family:Consolas,'Courier New',monospace;font-size:20px;font-weight:700;letter-spacing:2px;color:#0f172a;">${escapeHtml(productKey)}</div>
       <h2 style="font-size:16px;color:#0f172a;margin:24px 0 8px;">Activate your account</h2>
       <ol style="padding-left:20px;color:#475569;line-height:1.7;">
         <li>Click the button below to open the ForgeQA account setup page.</li>
         <li>Confirm your registration email and enter the product key above if it is not filled in automatically.</li>
         <li>Finish setting up your account, then sign in to ForgeQA.</li>
       </ol>
       <p style="text-align:center;margin:24px 0;"><a href="${escapeHtml(completeUrl)}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;font-weight:600;padding:12px 22px;border-radius:8px;">Activate your ForgeQA account</a></p>
       <p style="color:#64748b;font-size:13px;">If the button does not work, copy this address into your browser:<br><a href="${escapeHtml(completeUrl)}" style="color:#2563eb;word-break:break-all;">${escapeHtml(completeUrl)}</a></p>`
    : `<p>Thank you for your interest in ForgeQA. After reviewing your registration, we’re unable to approve the request at this time.</p>
       ${reason ? `<p><strong>Reason provided:</strong> ${escapeHtml(reason)}</p>` : ''}
       <p>If you have questions or believe this decision was made in error, contact our support team and include the email address you used to register.</p>`;

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${title}</title></head>
<body style="margin:0;padding:32px 16px;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#334155;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
    <tr><td style="height:4px;background:#2563eb;"></td></tr>
    <tr><td style="padding:28px 32px 8px;"><div style="font-size:20px;font-weight:750;color:#0f172a;">Forge<span style="color:#0284c7;">QA</span></div></td></tr>
    <tr><td style="padding:16px 32px 32px;">
      <h1 style="font-size:23px;line-height:1.3;margin:0 0 18px;color:#0f172a;">${title}</h1>
      <p style="line-height:1.6;">${greeting}</p>
      <div style="font-size:15px;line-height:1.65;">${content}</div>
      <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#64748b;">Need help? Contact <a href="mailto:${escapeHtml(supportEmail)}" style="color:#2563eb;">${escapeHtml(supportEmail)}</a>.</p>
    </td></tr>
    <tr><td style="padding:16px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;color:#94a3b8;font-size:11px;text-align:center;">&copy; ${new Date().getFullYear()} ForgeQA. All rights reserved.</td></tr>
  </table>
</body>
</html>`;
}
