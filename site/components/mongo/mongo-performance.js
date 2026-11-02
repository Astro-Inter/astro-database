import { mongoPerformanceReport as report } from '../../data/mongo-performance.js';
import { escapeHtml as esc } from '../../utils.js';

const value = n => n === null || n === undefined ? '—' : Number(n).toLocaleString('pt-BR', { maximumFractionDigits: 3 });
const phaseNames = { baseline_repeat: 'Antes', selected: 'Depois', selected_repeat: 'Depois · repetição' };
const badge = (text, tone = 'neutral') => `<span class="mongo-result-badge is-${tone}">${esc(text)}</span>`;

function resultFor(workload) {
  const before = workload.phases.baseline_repeat.summary;
  const after = workload.phases.selected_repeat.summary;
  if (workload.id === 'ia_historico_par_sem_campo') return badge('Precisa ajuste', 'attention');
  if (workload.phases.selected_repeat.resultCount === 0) return badge('Amostra insuficiente', 'attention');
  if (after.totalDocsExamined < before.totalDocsExamined) {
    const reduction = 1 - after.totalDocsExamined / before.totalDocsExamined;
    return badge(reduction > 0.2 ? 'Leitura melhor' : 'Melhora pequena', 'positive');
  }
  if (!after.hasBlockingSort && after.totalDocsExamined === workload.phases.selected_repeat.resultCount) return badge('Já adequado', 'existing');
  return badge('Sem ganho novo');
}

export function mongoPerformanceView() {
  const chat = report.workloads.find(w => w.id === 'java_chat_primeira_pagina');
  const before = chat.phases.baseline_repeat.summary.totalDocsExamined;
  const after = chat.phases.selected_repeat.summary.totalDocsExamined;
  const reduction = Math.round((1 - after / before) * 100);
  const retained = report.validation.originalIndexCount;
  const summaryRows = [
    ['Chat · páginas de mensagens', badge('Leitura melhor', 'positive'), `${value(before)} → ${value(after)} documentos lidos para entregar as mesmas 10 mensagens.`, 'Índice aplicado.'],
    ['Chat · última mensagem por conversa', badge('Melhora pequena', 'positive'), '111 → 107 documentos lidos. A ordenação extra foi removida.', 'Aproveita o mesmo índice.'],
    ['IA · sessões e notificações', badge('Já adequado', 'existing'), 'Os índices existentes já atendem essas consultas.', 'Mantidos, sem índice novo.'],
    ['Conversas e formulários', badge('Não compensou'), 'As coleções têm só 4 e 8 documentos; o ganho foi pequeno.', 'Candidatos retirados.'],
    ['Catálogo de NRs', badge('Sem ganho novo'), 'A leitura continuou em 38 documentos.', 'Candidato retirado.'],
    ['IA · recuperação de resumos', badge('Amostra insuficiente', 'attention'), 'Nenhum resumo passou pelos critérios da consulta.', 'Sem conclusão de ganho.'],
    ['IA · histórico de mensagens', badge('Precisa ajuste', 'attention'), 'A busca espera um campo que não existe nas mensagens atuais.', 'Alinhar a consulta ao modelo de conversas.']
  ];
  const rows = report.workloads.map(w => {
    const a = w.phases.baseline_repeat, b = w.phases.selected_repeat;
    return `<tr><td>${esc(w.title)}</td><td>${resultFor(w)}</td><td>${value(a.summary.totalDocsExamined)} → ${value(b.summary.totalDocsExamined)}</td><td>${value(b.resultCount)}</td><td>${value(a.medianServerMs)} → ${value(b.medianServerMs)}</td></tr>`;
  }).join('');
  return `<div class="performance-report mongo-results"><header class="page-head"><div><p class="eyebrow">MongoDB · API Java e IA</p><h1>Análise de índices</h1><p>O que melhorou, o que ficou como estava e o que precisa de ajuste.</p></div></header>
    <nav class="tabs" aria-label="Seções do MongoDB"><a class="tab" href="#/mongo">Collections</a><a class="tab" href="#/mongo-model">Modelagem</a><a class="tab" href="#/mongo-decisions">Decisões de modelagem</a><a class="tab active" href="#/mongo-performance" aria-current="page">Análise de índices</a></nav>
    <section class="card mongo-result-overview" aria-labelledby="mongo-main-result">
      <div class="mongo-reading-result">${badge('Resultado confirmado · leitura', 'positive')}<h2 id="mongo-main-result">O chat passou a ler menos dados.</h2><p class="mongo-reading-number">${value(before)} <span>→</span> ${value(after)}</p><p>documentos lidos para retornar as mesmas <strong>10 mensagens</strong>.</p>
        <div class="mongo-read-comparison" aria-label="Comparação de documentos lidos"><div class="mongo-read-row"><span>Antes</span><div class="mongo-read-track"><i class="is-before" style="width:100%"></i></div><strong>${value(before)}</strong></div><div class="mongo-read-row"><span>Depois</span><div class="mongo-read-track"><i class="is-after" style="width:${after / before * 100}%"></i></div><strong>${value(after)}</strong></div></div>
        <p class="mongo-reading-gain"><strong>${value(reduction)}% menos documentos lidos.</strong> A ordenação extra também foi removida.</p>
      </div>
      <div class="mongo-outcome-notes"><article>${badge('IA · já adequado', 'existing')}<h3>Sessões e notificações</h3><p>Já tinham índices úteis. Nenhum novo foi necessário nessas consultas.</p></article><article>${badge('Tempo total · não comprovado', 'attention')}<h3>Isso deixou a API mais rápida?</h3><p>Os testes confirmaram menos trabalho no banco. Ainda não comprovaram queda no tempo total de resposta da API ou da IA.</p></article></div>
    </section>
    <section class="card"><h2>Resultado por área</h2><p>Os rótulos abaixo mostram o efeito nos testes e a decisão tomada.</p><div class="table-wrap mongo-summary-table"><table><thead><tr><th>Área</th><th>Resultado</th><th>O que vimos</th><th>Decisão</th></tr></thead><tbody>${summaryRows.map(row => `<tr><td><strong>${esc(row[0])}</strong></td><td>${row[1]}</td><td>${esc(row[2])}</td><td>${esc(row[3])}</td></tr>`).join('')}</tbody></table></div></section>
    <section class="card"><div class="card-head"><h2>Índice criado no MongoDB</h2>${badge('1 índice novo', 'positive')}</div><p><code>idx_mensagens_conversa_data_id</code>, na coleção de mensagens. Ele localiza a conversa e entrega as mensagens na ordem usada pela API.</p><p>Ocupa <strong>${value(report.validation.sizeBytes / 1024)} KiB</strong>. Os <strong>${value(retained)} índices anteriores</strong> foram preservados. Os outros três candidatos foram retirados.</p><p>Comando usado para criar o índice:</p><pre class="code code-shell"><code>${esc(report.createIndex)}</code></pre></section>
    <section class="card"><h2>Ponto de atenção na IA</h2><p>O histórico busca <code>destinatario_id</code>, mas as 111 mensagens atuais usam <code>conversa_id</code>. Por isso, essa busca não encontrou mensagens. Um índice não corrige essa diferença: a consulta precisa ser alinhada ao modelo, mantendo o controle de acesso.</p></section>
    <details class="card mongo-technical"><summary>Ver as 16 consultas e os resultados completos</summary><p>“Lidos” são os documentos examinados pelo banco; “retornados” são os que a consulta entregou. O tempo mostrado é o do explain, em milissegundos.</p><div class="table-wrap"><table><thead><tr><th>Consulta</th><th>Resultado</th><th>Lidos · antes → depois</th><th>Retornados</th><th>Tempo · antes → depois</th></tr></thead><tbody>${rows}</tbody></table></div>
      ${report.workloads.map(w => `<details><summary>${esc(w.title)}</summary><p>${esc(w.source)}</p>${w.note ? `<p>${esc(w.note)}</p>` : ''}<pre class="code code-shell"><code>${esc(JSON.stringify(w.command,null,2))}</code></pre><div class="table-wrap"><table><thead><tr><th>Fase</th><th>Tempo mediano · ms</th><th>p95 · ms</th><th>Ida e volta · ms</th><th>Retornados</th></tr></thead><tbody>${Object.entries(w.phases).map(([phase,p]) => `<tr><td>${esc(phaseNames[phase] || phase)}</td><td>${value(p.medianServerMs)}</td><td>${value(p.p95ServerMs)}</td><td>${value(p.medianRoundtripMs)}</td><td>${value(p.resultCount)}</td></tr>`).join('')}</tbody></table></div><p>Conteúdo dos resultados nas três fases: ${w.resultsEqual ? 'igual' : 'diferente'}. A ordem também foi conferida nas consultas com ordenação determinística.</p><details><summary>Plano de execução · antes</summary><pre class="code code-shell"><code>${esc(JSON.stringify(w.beforePlan,null,2))}</code></pre></details><details><summary>Plano de execução · depois</summary><pre class="code code-shell"><code>${esc(JSON.stringify(w.afterPlan,null,2))}</code></pre></details></details>`).join('')}
    </details>
    <details class="card mongo-technical"><summary>Entender as decisões de cada coleção</summary>${report.decisions.map(d => `<article><h3>${esc(d.collection)} · ${esc(d.status)}</h3><p>${esc(d.reason)}</p></article>`).join('')}</details>
    <details class="card mongo-technical"><summary>Como testamos, limites e arquivos</summary><p>Foram 16 consultas, com dois aquecimentos e 11 medições por fase, usando dados reais. Comparamos os resultados antes e depois. Nenhum documento foi alterado.</p><p>A base é pequena e os tempos do servidor ficaram, em geral, em 0 ou 1 ms. O valor 0 está abaixo da resolução da medição; não significa execução instantânea. O tempo de ida e volta inclui rede e driver. Não medimos o tempo completo da API, da geração da IA ou o custo de escrita.</p><details><summary>Ver método detalhado</summary><p>${esc(report.method)}</p><p>${esc(report.limitations)}</p></details><p>MongoDB ${esc(report.version)} · base ${esc(report.database)} · coleta ${esc(report.measuredAt)}.</p><p>Scripts de aplicação e reversão: <code>mongo/indexes</code>. Reprodução: <code>python mongo/analysis/performance/replay.py --env-file CAMINHO_DA_ENV</code>.</p></details></div>`;
}
