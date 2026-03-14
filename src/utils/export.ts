import { Verification, getConfidenceLabel } from '@/types/verification';

export function generateMarkdown(v: Verification): string {
  const lines: string[] = [
    `## Raport weryfikacji`,
    ``,
    `**Twierdzenie:** ${v.claim}`,
    ``,
    `**Kategoria:** ${v.category}`,
    `**Poziom pilności:** ${v.urgency}`,
    `**Data utworzenia:** ${new Date(v.createdAt).toLocaleString('pl-PL')}`,
    `**Ostatnia aktualizacja:** ${new Date(v.updatedAt).toLocaleString('pl-PL')}`,
    ``,
    `## Kroki weryfikacji`,
    ``,
  ];

  v.steps.forEach(step => {
    const check = step.checked ? 'x' : ' ';
    lines.push(`- [${check}] **${step.label}**`);
    if (step.notes) {
      lines.push(`  ${step.notes}`);
    }
  });

  lines.push(``, `## Werdykt`, ``, `**${v.verdict}**`);
  lines.push(``, `**Ocena pewności:** ${v.confidence}% (${getConfidenceLabel(v.confidence)})`);

  return lines.join('\n');
}

export async function copyMarkdown(v: Verification): Promise<void> {
  const md = generateMarkdown(v);
  await navigator.clipboard.writeText(md);
}

export async function exportPDF(v: Verification): Promise<void> {
  const html2pdf = (await import('html2pdf.js')).default;

  const container = document.createElement('div');
  container.style.fontFamily = 'Inter, sans-serif';
  container.style.color = '#111';
  container.style.padding = '24px';
  container.style.maxWidth = '800px';
  container.style.fontSize = '13px';
  container.style.lineHeight = '1.6';

  container.innerHTML = `
    <h1 style="font-size:20px;margin-bottom:4px;">Raport weryfikacji</h1>
    <p style="color:#666;font-size:12px;">Wygenerowano: ${new Date().toLocaleString('pl-PL')}</p>
    <hr style="border:none;border-top:1px solid #ddd;margin:12px 0;" />
    <p><strong>Twierdzenie:</strong> ${v.claim}</p>
    <p><strong>Kategoria:</strong> ${v.category} &nbsp;|&nbsp; <strong>Pilność:</strong> ${v.urgency}</p>
    <p><strong>Utworzono:</strong> ${new Date(v.createdAt).toLocaleString('pl-PL')} &nbsp;|&nbsp; <strong>Aktualizacja:</strong> ${new Date(v.updatedAt).toLocaleString('pl-PL')}</p>
    <hr style="border:none;border-top:1px solid #ddd;margin:12px 0;" />
    <h2 style="font-size:16px;">Kroki weryfikacji</h2>
    ${v.steps.map(s => `
      <div style="margin:8px 0;padding:8px;border:1px solid #eee;border-radius:2px;">
        <span style="font-size:14px;">${s.checked ? '☑' : '☐'} <strong>${s.label}</strong></span>
        ${s.notes ? `<p style="margin:4px 0 0 20px;color:#555;">${s.notes}</p>` : ''}
      </div>
    `).join('')}
    <hr style="border:none;border-top:1px solid #ddd;margin:12px 0;" />
    <p><strong>Werdykt:</strong> ${v.verdict}</p>
    <p><strong>Ocena pewności:</strong> ${v.confidence}% (${getConfidenceLabel(v.confidence)})</p>
  `;

  const firstWords = v.claim.split(/\s+/).slice(0, 3).join('-').replace(/[^\w\-ąęśźżćńółĄĘŚŹŻĆŃÓŁ]/g, '');
  const date = new Date().toISOString().slice(0, 10);
  const filename = `weryfikacja-${date}-${firstWords}.pdf`;

  await html2pdf().set({
    margin: 10,
    filename,
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
  }).from(container).save();
}
