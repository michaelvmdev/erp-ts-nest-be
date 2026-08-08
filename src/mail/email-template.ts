export interface EmailSummaryItem {
  label: string;
  value: string;
}

export interface EmailTemplateInput {
  greeting: string;
  paragraphs: string[];
  summaryItems?: EmailSummaryItem[];
  showLogo: boolean;
}

/** Content-ID del logo para incrustar en el HTML. Debe coincidir con el `cid` del adjunto. */
export const LOGO_CID = 'logo@erp-mv-dev';

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Genera el HTML de un correo transaccional con diseño de marca.
 *
 * Si `showLogo` es true, la imagen del encabezado usa `cid:logo@erp-mv-dev`;
 * quien llame a esta función debe adjuntar el logo con ese mismo CID.
 */
export function buildEmailHtml(input: EmailTemplateInput): string {
  const logoHtml = input.showLogo
    ? `<img src="cid:${LOGO_CID}" alt="Michael Dev S.A.C." width="140" style="display:block;max-width:140px;height:auto;">`
    : `<span style="color:#ffffff;font-size:18px;font-weight:bold;letter-spacing:.5px;">Michael Dev S.A.C.</span>`;

  const paragraphsHtml = input.paragraphs
    .map(
      (p) =>
        `<p style="margin:0 0 16px;font-size:15px;color:#1f2733;line-height:1.6;">${esc(p)}</p>`,
    )
    .join('');

  const summaryHtml = input.summaryItems?.length
    ? `<table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;border-left:3px solid #2f3a4a;background:#f5f6f8;">
        ${input.summaryItems
          .map(
            (item) => `<tr>
            <td style="padding:10px 16px;font-size:13px;color:#6b7280;">${esc(item.label)}</td>
            <td style="padding:10px 16px;font-size:13px;color:#1f2733;font-weight:bold;text-align:right;">${esc(item.value)}</td>
          </tr>`,
          )
          .join('')}
      </table>`
    : '';

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Michael Dev S.A.C.</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f6f8;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f6f8;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:8px;overflow:hidden;">
          <tr>
            <td align="center" bgcolor="#2f3a4a" style="padding:28px 32px;background-color:#2f3a4a;">
              ${logoHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 20px;font-size:15px;color:#1f2733;line-height:1.6;">${esc(input.greeting)}</p>
              ${paragraphsHtml}
              ${summaryHtml}
              <p style="margin:24px 0 0;font-size:14px;color:#6b7280;line-height:1.5;">Gracias por confiar en nosotros.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px;border-top:1px solid #d7dbe0;background:#f5f6f8;text-align:center;">
              <p style="margin:0;font-size:12px;color:#6b7280;">Michael Dev S.A.C. &middot; AppSales</p>
              <p style="margin:6px 0 0;font-size:11px;color:#9ca3af;">Correo generado autom&aacute;ticamente. Por favor no responder.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
