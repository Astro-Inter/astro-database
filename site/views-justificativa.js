import { escapeHtml } from './utils.js';
import { pageHead } from './views.js';

function inline(text) {
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\((https:\/\/github\.com\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
}

export function justificativaView() {
  queueMicrotask(async () => {
    const target = document.getElementById('justificativa-content');
    if (!target) return;
    try {
      const response = await fetch('./relatorio-justificativa.md');
      if (!response.ok) throw new Error('Relatório indisponível');
      const markdown = await response.text();
      if (!target.isConnected) return;
      target.innerHTML = markdown.split(/\r?\n\s*\r?\n/).map(block => {
        const heading = block.match(/^(#{1,2})\s+(.+)$/);
        if (heading) return heading[1].length === 1 ? '' : `<h2>${inline(heading[2])}</h2>`;
        return `<p>${inline(block.replace(/\r?\n/g, ' '))}</p>`;
      }).join('');
    } catch {
      if (target.isConnected) target.textContent = 'Não foi possível carregar o relatório. Tente novamente.';
    }
  });
  return `${pageHead('Relatório de justificativa', 'Decisões, evidências e validações pendentes da entrega de Modelagem de Dados.', 'PostgreSQL · Projeto Interdisciplinar 2026')}<section class="card" id="justificativa-content" aria-live="polite">Carregando relatório…</section>`;
}
