import { env } from './env.js';
import { fmtWhen, fmtDuration, escapeHtml as h } from './format.js';

function layout({ title, intro, rows, button, footer }) {
  const rowsHtml = rows
    .map(
      ([k, v]) => `
      <tr>
        <td style="padding:10px 0;color:#8b90a5;font-size:14px;width:120px;vertical-align:top">${h(k)}</td>
        <td style="padding:10px 0;color:#f2f3f7;font-size:15px;font-weight:600">${h(v)}</td>
      </tr>`,
    )
    .join('');

  return `<!doctype html>
<html lang="it"><body style="margin:0;background:#07080c;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#07080c;padding:32px 16px">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#10121a;border:1px solid #23263a;border-radius:20px;overflow:hidden">
        <tr><td style="height:4px;background:linear-gradient(90deg,#4f7cff,#9b5cff,#22d3ee)"></td></tr>
        <tr><td style="padding:32px 32px 8px">
          <div style="font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:#7aa2ff;font-weight:700">${h(env.admin.name)}</div>
          <h1 style="margin:10px 0 0;font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:30px;line-height:1.15;color:#ffffff">${h(title)}</h1>
          <p style="margin:14px 0 0;color:#b9bdd0;font-size:15px;line-height:1.6">${intro}</p>
        </td></tr>
        <tr><td style="padding:12px 32px">
          <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #23263a;border-bottom:1px solid #23263a">${rowsHtml}</table>
        </td></tr>
        ${
          button
            ? `<tr><td style="padding:20px 32px 8px">
          <a href="${h(button.href)}" style="display:inline-block;background:linear-gradient(90deg,#4f7cff,#9b5cff);color:#fff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 26px;border-radius:12px">${h(button.label)}</a>
          <div style="margin-top:10px;color:#6f7489;font-size:12px;word-break:break-all">${h(button.href)}</div>
        </td></tr>`
            : ''
        }
        <tr><td style="padding:20px 32px 32px;color:#8b90a5;font-size:13px;line-height:1.6">${footer}</td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

export function confirmedEmail(b) {
  const when = fmtWhen(b.start);
  const subject = `✅ Lezione confermata – ${b.subject}, ${when}`;
  const rows = [
    ['Materia', b.subject],
    ['Quando', when],
    ['Durata', fmtDuration(b.duration)],
    ['Studente', b.name],
    ['Codice', b.id],
  ];
  const html = layout({
    title: 'La lezione è confermata',
    intro: `Ciao ${h(b.name)}, ci vediamo online su Google Meet. Trovi l'evento anche nel tuo Google Calendar (controlla l'invito che ti è arrivato).`,
    rows,
    button: b.meetLink ? { href: b.meetLink, label: '🎥 Entra su Google Meet' } : null,
    footer: `Prepara pure quaderno, esercizi o domande: partiamo da lì.<br>Per spostare o annullare rispondi a questa email o scrivimi su WhatsApp.<br><br>— ${h(env.admin.name)}`,
  });
  const text = [
    `Ciao ${b.name}, la lezione è confermata!`,
    '',
    ...rows.map(([k, v]) => `${k}: ${v}`),
    '',
    `Google Meet: ${b.meetLink}`,
    '',
    'Per spostare o annullare rispondi a questa email o scrivimi su WhatsApp.',
    `— ${env.admin.name}`,
  ].join('\n');
  return { subject, html, text };
}

export function rejectedEmail(b) {
  const when = fmtWhen(b.start);
  const link = `${env.publicUrl}/#prenota`;
  const subject = `Lezione di ${b.subject} – ${when}: orario non disponibile`;
  const html = layout({
    title: 'Questo orario non va, scegline un altro',
    intro: `Ciao ${h(b.name)}, purtroppo non riesco a fare la lezione di <b>${h(b.subject)}</b> di <b>${h(when)}</b>. Mi dispiace! Puoi scegliere un altro orario libero dal sito.`,
    rows: [['Codice', b.id]],
    button: { href: link, label: 'Scegli un altro orario' },
    footer: `— ${h(env.admin.name)}`,
  });
  const text = `Ciao ${b.name}, purtroppo non riesco a fare la lezione di ${b.subject} di ${when}.\nPuoi scegliere un altro orario qui: ${link}\n\n— ${env.admin.name}`;
  return { subject, html, text };
}
