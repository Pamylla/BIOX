# BIOX — Plano de Implementação Completo (Design → Código)

> **Para:** instância Claude no VS Code (implementação)
> **De:** instância Claude claude.ai (specs & decisões) + Pamy
> **Data:** 06 Jul 2026
> **Fonte de verdade visual:** `BIOX_App.html` (protótipo interativo, 12 telas)
> **Regra de ouro:** as decisões da seção 4 (ADRs) **não são rediscutidas** durante a implementação. Dúvidas de spec voltam para a Pamy, não viram improviso no código.

---

## 1. O que é este documento

Roadmap completo para transformar o protótipo de design do BIOX em produto funcional: frontend, backend, pipeline de ingestão, engines determinísticas, insights por LLM, LGPD, deploy e polimento de portfólio. Organizado em **11 fases (0–10)** com tarefas em checkbox e critérios de aceite. Trabalhe fase a fase, na ordem. Marque os checkboxes conforme avança.

---

## 2. Inventário do design (o que o protótipo contém)

### 2.1 Telas (12)

| # | Tela | Conteúdo principal |
|---|------|--------------------|
| 1 | **Login** | E-mail/senha + "Continue with Google" + criar conta + esqueci senha. Painel esquerdo escuro com 3 features (track biomarkers / deterministic scores / AI explanations) |
| 2 | **Dashboard** | Ring geral 84/100 "Good", stats (biomarkers tracked, need attention, snapshots), lista "Needs attention" (4 flags), grid de 6 score cards por sistema, "Latest insights" (2), "Recent activity" (4 eventos) |
| 3 | **Upload** | Dropzone (PDF até 20 MB, "parsed, never shared"), tabela "Recent uploads" (file, date, size, snapshot, status) |
| 4 | **Review** | Revisão humana da extração: preview do PDF à esquerda + tabela de valores extraídos (biomarker, value+unit, **confidence high/medium/low**, botão Edit). Header "12 values found across 6 panels · 3 to check". Ações: "Cancel & discard" / "Confirm & create snapshot" |
| 5 | **Timeline** | 3 abas: **Snapshots** (spine vertical com cards: nº, tag Latest/Baseline, data, lab, nº markers, score), **Compare** (tabela snapshot A vs B com deltas coloridos), **Trends** (cards com sparkline por biomarcador) |
| 6 | **Biomarkers** | Lista agrupada por 6 painéis, linha por marcador: status dot, nome, flag, valor+unidade, ref range, trend (▲▼— + delta) |
| 7 | **Biomarker Detail** | Valor grande + delta, **banda de referência com dot posicional**, gráfico de histórico (sparkline), tabela "Past readings", sidebar: related biomarkers, related score (ring), related AI insight, card "About" (disclaimer) |
| 8 | **Scores** | Hero com ring 84 + copy do composto, grid dos 6 sistemas, tag "Computed in code" |
| 9 | **Score Detail** | Ring + delta + blurb, card "How it's computed" ("Code, not AI") com biomarcadores de input clicáveis, "Score over time", sidebar: AI insight relacionado + card "Why deterministic?" |
| 10 | **Insights** | Banner "AI explains, it never diagnoses", cards de insight (título, pill status, summary, chips de marcadores, data). Badge "3" no sidebar |
| 11 | **Insight Detail** | Título, summary + parágrafo, card **"Grounded in"** (Your readings / Curated knowledge), sidebar: related biomarkers, related score, disclaimer "Educational only" |
| 12 | **Settings** | 3 abas: **Profile** (nome, email, DOB, sex at birth — com copy explicando uso p/ reference ranges), **Units & ranges** (mg/dL vs mmol/L, custom reference ranges toggle, flag borderline toggle, date format), **Data & privacy** (conta Google via Firebase, Export JSON, AI processing toggle, Delete account, Sign out) |

### 2.2 Sistema de status e semântica visual

- 3 estados: `good` (verde) / `watch` (âmbar) / `alert` (vermelho) + cor dedicada `ai` (roxo) para tudo que é LLM.
- Padrão consistente: **AI = roxo, sempre rotulado**; determinístico = tag "Computed in code". Essa separação visual é um pilar do produto — preservar religiosamente.
- Copy do settings define `watch` borderline como "within 5% of a threshold" (configurável).

### 2.3 Design tokens (extraídos do protótipo — usar verbatim)

```css
:root{
  --board:#E7E4DE; --ink:#15191C; --ink-2:#565D64; --ink-3:#8b9198;
  --line:rgba(21,25,28,.12); --line-2:rgba(21,25,28,.06);
  --surface:#fff; --surface-2:#F5F4EF;
  --brand:#0E7C6B; --brand-ink:#0A5A4F; --brand-soft:#E2F0ED;
  --ai:#5A4BDA; --ai-soft:#ECE9FB;
  --blue:#2F6FDB; --blue-soft:#E4EDFB;
  --good:#2E9E5B; --good-ink:#1f7a45; --good-soft:#E4F3EA;
  --watch:#C88A0E; --watch-ink:#8A5D05; --watch-soft:#F7EDD3;
  --alert:#D6453D; --alert-soft:#F8E5E3;
  --wire:#B7BCC0; --wire-2:#7C838A;
}
```

- **Fontes:** `IBM Plex Sans` (corpo), `Space Grotesk` (display — classe `.disp`), `IBM Plex Mono` (labels/kickers/números — classe `.mono`, kicker `.k` com letter-spacing .16em uppercase).
- **Superfícies:** cards brancos, borda `--line`, `border-radius: 16px`; pills `999px`; botões `10px`.
- **Layout:** sidebar 250px sticky, topbar 60px com `backdrop-filter: blur(10px)`, content `max-width: 1180px`, padding `30px 40px 90px`.
- **Rings SVG:** circunferência `C = 2πr`. r=26 → C=163.4; r=62 → C=389.6. `stroke-dashoffset = C × (1 − value/100)`, `transform: rotate(-90)`.
- **Variantes do protótipo:** densidade `comfortable|compact` e sidebar `light|dark` (`.sidedark`). Implementar como modificadores de tema (baixa prioridade, mas o CSS já existe).

### 2.4 Dados mock embutidos (usar como seed/demo — seção 14)

- **20 biomarcadores** em 6 painéis: CBC (hemoglobin, hematocrit, rbc, wbc, platelets, ferritin), Glucose Metabolism (glucose, hba1c), Lipid Profile (tchol, ldl, hdl, trig), Renal & Hepatic (urea, creatinine, ast, alt), Inflammation (esr, crp), Thyroid (tsh, ft4).
- **6 scores:** Metabolic 79 (watch), Cardiovascular 72 (watch), Inflammation 94 (excellent), Hematologic 90 (good), Hepatic & Renal 91 (good), Thyroid 96 (excellent). Overall **84** (good).
- **4 snapshots:** 15 Mar 2025 (Hermes Pardini, baseline, score 80), 22 Aug 2025 (Fleury, 83), 09 Jan 2026 (Dasa, 81), 14 Jun 2026 (Fleury, latest, 84).
- **4 insights:** cholTrend (watch), inflammationLow (good), glucoseWatch (watch), thyroidOk (good) — cada um com markers[] e score relacionado.
- **12 valores na tela de review** com confidences: 8 high, 3 medium (HbA1c, LDL, Free T4), 1 low (CRP).
- ⚠️ Inconsistência do mock: dashboard diz "19 biomarkers tracked", mas a lista tem 20. **Na implementação, todos os counts são computados, nunca hardcoded.**

---

## 3. Mapeamento Design ↔ Domínio (glossário obrigatório)

A Ubiquitous Language do domínio (ADRs) **não muda**. A camada de apresentação usa vocabulário de UX. A tabela abaixo é o contrato entre as duas — API/código/DB falam domínio; UI fala UX.

| UI (copy nas telas) | Domínio (código/API/DB) | Nota |
|---|---|---|
| Snapshot | **Batch** | "Snapshot" é só label de apresentação. Endpoint = `/batches`, componente pode chamar `SnapshotCard`, mas o tipo é `Batch`. |
| Report / Upload | **ReportFile** + **Extraction** | O PDF é ReportFile; o processo/resultado do LLM é Extraction. |
| Review (tela) | Extraction em estado `needs_review` | Confirmar = transição `confirmed` → cria Batch. |
| Reading / value | **Measurement** | Nunca "Result" nem "Exam" (decisão de UL já tomada). |
| Reference range (banda) | Ranges **per-Measurement** (ADR-002) | A banda renderiza o range que veio do laudo daquela medição. |
| Score "Computed in code" | Score engine determinística, `formulaVersion` | Congelado na confirmação. |
| AI Insight | **Insight** (leaf read-only) | Nunca escreve de volta em Score/Measurement. |
| Recent activity | **ActivityEvent** | Log de eventos do pipeline. |
| Panel (CBC, Lipid...) | Agrupamento do catálogo | Mapeamento painel→score: CBC→hematologic, Glucose→metabolic, Lipid→cardiovascular, Renal&Hepatic→hepatorenal, Inflammation→inflammation, Thyroid→thyroid. |

---

## 4. Decisões já tomadas — NÃO rediscutir (ADRs + specs existentes)

1. **UL:** Extraction / Batch / Measurement (nunca "Exam"/"Result").
2. **ADR-002:** reference ranges são armazenados **por medição, vindos do laudo**. Nunca de um catálogo para fins de flag.
3. **Scores congelados na confirmação** do Batch, com `formulaVersion` e snapshot dos inputs.
4. **RAG cortado do MVP** — insights usam contexto curado no prompt.
5. **Insight é leaf read-only** — nunca escreve em Score.
6. **Extraction worker in-process no NestJS**, atrás de fila **pg-boss**.
7. **Deleção em dois níveis:** soft-delete operacional vs purge LGPD.
8. **`brazilian-number.ts`** já existe, testado (normalização de números BR na extração) — reutilizar, não reescrever.
9. **Refinamentos de schema já validados contra laudos reais:** `valueQualifier` (valores censurados, ex. `< 0.01`), reference ranges em **tiers**, `performingLab`, `valueLabel` (sorologia, ex. "Não reagente"), `highInclusive`/`lowInclusive`, `assayMethod` (distinto do método de extração).
10. **Arquitetura em 3 camadas:** Universal Layer → Clinical Profile → Protocol Engine. Protocolos **enriquecem interpretação sem alterar o flag objetivo**.

---

## 5. Conflitos e lacunas que o design revelou (com resolução)

Isto é o resultado da auditoria design × domínio. Cada item tem resolução proposta — Pamy bate o martelo.

**5.1 — Toggle "Custom reference ranges" (Settings › Units) conflita com ADR-002.**
O copy diz "Override population defaults with ranges from your own lab" — mas no BIOX os ranges JÁ vêm do laudo (ADR-002); não existem "population defaults" a sobrescrever.
→ **Resolução: cortar o toggle do MVP.** Pós-MVP, reenquadrar como **"Personal targets"** na camada Clinical Profile (metas pessoais/protocolo que enriquecem interpretação sem alterar o flag objetivo — exatamente o papel da 3ª camada).

**5.2 — Copy do card "About" no Biomarker Detail está errado para o nosso modelo.**
Diz "Reference ranges are population defaults for adults". Contradiz ADR-002.
→ **Resolução: trocar o copy** para: *"Reference ranges shown here come from your own lab report for each reading. BIOX flags values relative to those thresholds — for education only, not a diagnosis."*

**5.3 — Medições sem reference range precisam de um 4º estado.**
O design só tem good/watch/alert. Laudos reais têm medições sem range (e ADR-002 proíbe fallback de catálogo para flag).
→ **Resolução: adicionar status `none`** (neutro, dot cinza `--wire`, label "No reference provided"). Banda de referência oculta nesse caso.

**5.4 — Valores não numéricos (sorologia) e censurados não aparecem no design.**
`valueLabel` ("Non-reactive") e `valueQualifier` ("< 0.01") existem no schema validado.
→ **Resolução:** linha de biomarcador renderiza `valueLabel` quando presente (sem banda, sem sparkline de valor); qualifier é prefixo mono do valor (`< 0.01`), dot da banda oculto ou clampado na borda com o qualifier visível.

**5.5 — DOB / Sex at birth: o copy diz "used to pick reference ranges".**
Sob ADR-002 isso não vale para flags.
→ **Resolução:** manter os campos (alimentam Clinical Profile e contexto de insights), **ajustar o copy**: "Used as context for AI insights and future protocols" — ou similar. Nenhum range de catálogo entra no flag.

**5.6 — Overall Health score não tinha fórmula spec'ada.**
O copy diz "weighted by clinical relevance".
→ **Resolução (proposta v1, reproduz o 84 do design exatamente):**
`overall = 0.25·CV + 0.25·Metabolic + 0.15·Inflammation + 0.15·HepatoRenal + 0.10·Hematologic + 0.10·Thyroid`
Verificação: 0.25·72 + 0.25·79 + 0.15·94 + 0.15·91 + 0.10·90 + 0.10·96 = **84.1 → 84** ✓

**5.7 — Thresholds de status de score não estavam spec'ados.**
Dados do design: 96/94 = Excellent; 91/90/84 = Good; 79/72 = Watch.
→ **Resolução (v1):** `Excellent ≥ 92` · `Good 80–91` · `Watch 60–79` · `Alert < 60`.

**5.8 — "Snapshot 19 biomarkers" vs 20 na lista.** Counts sempre computados (já citado em 2.4).

**5.9 — Compare fixo (03 vs 04) e Trends com 4 cards fixos.**
→ **Resolução MVP:** Compare = seletor de A/B com default *latest vs anterior*; Trends = grid de todos os biomarcadores com ≥ 2 leituras (o componente Sparkline já existirá).

**5.10 — Busca no topbar ("Search biomarkers, insights…").**
→ **Resolução:** pós-MVP (command palette client-side). No MVP o campo pode abrir um filtro simples client-side ou ficar desabilitado com tooltip.

**5.11 — Badge "3" de insights no sidebar** implica read/unread.
→ **Resolução:** campo `readAt` no Insight; `PATCH /insights/:id/read` ao abrir. Baixo custo, entra no MVP.

---

## 6. Decisões pendentes — confirmar com a Pamy antes da Fase 0

Cada uma tem default recomendado. Se a resposta for "ok com os defaults", siga direto.

| # | Decisão | Default recomendado | Racional |
|---|---|---|---|
| D1 | Framework do web | **Vite + React 18 + TS (SPA)** + React Router | App atrás de auth, sem SEO; separação limpa SPA ↔ API NestJS mostra arquitetura full-stack melhor que um BFF Next para o portfólio. |
| D2 | Styling | **CSS Modules + tokens.css** (custom properties do protótipo) | O design já é CSS puro de alta qualidade; traduzir p/ Tailwind é retrabalho e perde fidelidade. Mostra craft de frontend sênior. |
| D3 | ORM | **Prisma** | Maturidade com NestJS, migrations sólidas, schema legível no repo (bom para portfólio). Alternativa aceitável: Drizzle. |
| D4 | Auth | **Firebase Auth** (Google + email/senha) + Firebase Admin no Nest (guard verifica ID token, provisiona User local) | O design assume isso ("Signed in with Google via Firebase"). Tira auth plumbing do caminho e mantém foco no domínio. |
| D5 | Storage de PDFs | Adapter: **disco local no dev / S3-compatível (Cloudflare R2) em prod** | Barato, simples, com interface trocável. |
| D6 | Charts | **SVG próprio** (Ring, Sparkline, RefBand) — zero lib de chart | O protótipo já é SVG hand-rolled; componentes próprios = paridade visual + demonstração de habilidade. |
| D7 | Deploy | Web → **Vercel** · API+worker → **Railway** (ou Fly.io) · Postgres → **Neon** · PDFs → **R2** | Free tiers suficientes p/ portfólio; pg-boss precisa da API viva (Railway/Fly, não serverless). |
| D8 | Monorepo | **pnpm workspaces**: `apps/web`, `apps/api`, `packages/shared` | Tipos e engines compartilhados (zod schemas, score engine, catálogo) sem duplicação. |
| D9 | Idioma do produto | **Inglês** (UI, código, README) | Portfólio internacional. Docs internos podem seguir em PT. |

---
## 7. Escopo: MVP vs pós-MVP

**Dentro do MVP** (tudo que o fluxo central exige):
Login (Google + email/senha via Firebase) · Dashboard completo · Upload → Extraction → Review → Confirm (pipeline inteiro) · Timeline (Snapshots + Compare com seletor + Trends básico) · Biomarkers + Detail · Scores + Detail (engine determinística congelada) · Insights + Detail (LLM com consent gate) · Settings (Profile, Privacy: export JSON, delete two-tier, AI toggle, sign out) · Estados vazio/loading/erro · Seed demo "Marina Alves" · Deploy público com conta demo.

**Fora do MVP** (backlog priorizado):
1. Personal targets (substituto correto do toggle de custom ranges — ver 5.1)
2. Conversão de unidades mg/dL ↔ mmol/L (exige tabela de fatores por analito + testes; exibir sempre como no laudo até lá)
3. Formato de data configurável (fixar `DD MMM YYYY`)
4. Busca global / command palette
5. Multi-página PDF viewer inline no Review (MVP: thumbnail 1ª página + link "Open PDF")
6. Troca de foto de avatar (MVP: iniciais)
7. Tema sidebar dark + densidade compact (CSS já pronto; ligar depois)
8. Activity feed persistente completo (MVP: eventos essenciais do pipeline já cobrem o design)

---

## 8. Arquitetura do repositório

```
biox/
├── apps/
│   ├── web/                      # Vite + React + TS
│   │   ├── src/
│   │   │   ├── ui/               # design system (tokens.css, primitivos, ícones)
│   │   │   ├── features/         # por domínio: auth, dashboard, ingestion, timeline,
│   │   │   │                     #   biomarkers, scores, insights, settings
│   │   │   ├── api/              # ApiClient (interface) + HttpApiClient + MockApiClient
│   │   │   ├── app/              # router, layout (Sidebar, Topbar), providers
│   │   │   └── lib/              # formatters, hooks
│   │   └── index.html
│   └── api/                      # NestJS
│       ├── src/
│       │   ├── modules/
│       │   │   ├── auth/         # Firebase Admin guard + provisioning
│       │   │   ├── users/
│       │   │   ├── reports/      # upload + storage adapter
│       │   │   ├── extractions/  # worker pg-boss + review endpoints
│       │   │   ├── batches/
│       │   │   ├── measurements/
│       │   │   ├── scores/
│       │   │   ├── insights/
│       │   │   ├── catalog/
│       │   │   ├── activity/
│       │   │   └── privacy/      # export + deletion (LGPD)
│       │   ├── jobs/             # pg-boss registrations (extraction.run, insights.generate, privacy.purge)
│       │   └── llm/              # Anthropic client, prompts versionados
│       └── prisma/schema.prisma
├── packages/
│   └── shared/
│       ├── src/
│       │   ├── contracts/        # zod schemas dos endpoints (request/response) — fonte única de tipos
│       │   ├── extraction/       # extraction-schema (zod) + brazilian-number.ts (mover p/ cá)
│       │   ├── engines/
│       │   │   ├── flags/        # flag engine (pura)
│       │   │   └── scores/       # score engine v1 (pura) + registry de formulaVersion
│       │   ├── catalog/          # biomarker catalog (keys, painéis, aliases, plausibleMagnitude)
│       │   └── units/            # formatação; conversões ficam aqui pós-MVP
├── docs/                         # ADRs (EN), este plano, extraction-schema.md, 03-architecture.md
├── docker-compose.yml            # postgres local
├── .github/workflows/ci.yml
└── pnpm-workspace.yaml
```

**Princípio:** tudo que é determinístico e compartilhável (engines, schemas, catálogo) vive em `packages/shared` com **zero dependência de framework** — testável isolado, importável por web e api. É o coração do argumento "computed in code".

---

## 9. Modelo de dados (Prisma — esqueleto)

> Nomes/relations finais podem ser ajustados pelo VS Code, mas **campos marcados com ◆ vêm de decisões validadas contra laudos reais e são obrigatórios**.

```prisma
model User {
  id                String    @id @default(uuid())
  firebaseUid       String    @unique
  email             String    @unique
  name              String
  dateOfBirth       DateTime?
  sexAtBirth        SexAtBirth?
  aiProcessingConsent Boolean @default(true)
  flagBorderline    Boolean   @default(true)   // "watch dentro de 5% do threshold"
  createdAt         DateTime  @default(now())
  deletedAt         DateTime?                  // soft-delete operacional
  purgeScheduledAt  DateTime?                  // LGPD two-tier
  // relations: reports, batches, insights, activity, deletionRequests
}

model ReportFile {
  id           String   @id @default(uuid())
  userId       String
  storageKey   String
  filename     String
  sizeBytes    Int
  pageCount    Int?
  uploadedAt   DateTime @default(now())
  deletedAt    DateTime?
}

model Extraction {
  id            String           @id @default(uuid())
  reportFileId  String           @unique
  userId        String
  status        ExtractionStatus // processing | needs_review | confirmed | discarded | failed
  model         String           // ex. claude-sonnet-4-6
  promptVersion String           // ex. extractor-v1
  rawOutput     Json             // resposta bruta do LLM (auditoria)
  reportDate    DateTime?        // data de coleta detectada
  performingLab String?          // ◆
  error         String?
  createdAt     DateTime @default(now())
  confirmedAt   DateTime?
  items         ExtractionItem[]
}

model ExtractionItem {
  id             String  @id @default(uuid())
  extractionId   String
  rawLabel       String          // como apareceu no laudo
  biomarkerKey   String?         // resolvido contra o catálogo (null = não reconhecido)
  value          Decimal?
  valueQualifier String?         // ◆ "<", ">", "≤", "≥"
  valueLabel     String?         // ◆ sorologia: "Non-reactive"
  unit           String?
  refLow         Decimal?
  refHigh        Decimal?
  lowInclusive   Boolean?        // ◆
  highInclusive  Boolean?        // ◆
  refTiers       Json?           // ◆ ranges em camadas (ex. desejável/limítrofe/alto)
  refRaw         String?         // texto original do range no laudo
  assayMethod    String?         // ◆
  confidence     Confidence      // high | medium | low
  plausibility   Plausibility    // ok | out_of_magnitude — via plausibleMagnitude do catálogo
  editedByUser   Boolean @default(false)
}

model Batch {                    // UI: "Snapshot"
  id            String   @id @default(uuid())
  userId        String
  extractionId  String   @unique
  sequence      Int              // nº do snapshot p/ o usuário (01, 02…)
  collectedAt   DateTime         // data de coleta (do laudo)
  performingLab String?          // ◆
  tag           BatchTag?        // baseline | latest (latest é derivado, não persistido — ver nota)
  createdAt     DateTime @default(now())
  deletedAt     DateTime?
  measurements  Measurement[]
  scores        Score[]
}
// Nota: "Latest" é computado (maior collectedAt não deletado); "Baseline" = sequence 1.

model Measurement {
  id             String  @id @default(uuid())
  batchId        String
  biomarkerKey   String           // FK lógica ao catálogo compartilhado
  value          Decimal?
  valueQualifier String?          // ◆
  valueLabel     String?          // ◆
  unit           String
  refLow         Decimal?         // ◆ per-result (ADR-002)
  refHigh        Decimal?
  lowInclusive   Boolean?
  highInclusive  Boolean?
  refTiers       Json?
  assayMethod    String?
  status         FlagStatus       // good | watch | alert | none — congelado na confirmação
  flagLabel      String           // "In range", "Above target", "Upper range", "No reference provided"…
}

model Score {
  id             String   @id @default(uuid())
  batchId        String
  systemKey      String            // metabolic | cardiovascular | inflammation | hematologic | hepatorenal | thyroid | overall
  value          Int               // 0–100
  status         ScoreStatus       // excellent | good | watch | alert
  formulaVersion String            // ex. "scores-v1"
  inputsSnapshot Json              // ◆ medições usadas, congeladas
  frozenAt       DateTime @default(now())
  @@unique([batchId, systemKey])
}

model Insight {                    // leaf read-only
  id             String   @id @default(uuid())
  userId         String
  batchId        String
  title          String
  tone           FlagStatus        // good | watch | alert (pill do card)
  summary        String
  body           String
  markerKeys     String[]
  relatedScoreKey String?
  groundingMeta  Json              // o que entrou no prompt (batches, deltas, trechos curados)
  model          String
  promptVersion  String
  createdAt      DateTime @default(now())
  readAt         DateTime?
  deletedAt      DateTime?
}

model ActivityEvent {
  id        String   @id @default(uuid())
  userId    String
  type      String   // batch.created | insights.generated | flag.crossed | score.changed
  payload   Json
  createdAt DateTime @default(now())
}

model DeletionRequest {
  id          String   @id @default(uuid())
  userId      String
  requestedAt DateTime @default(now())
  purgeAfter  DateTime          // janela de arrependimento (ex. 7 dias)
  completedAt DateTime?
}
```

**Catálogo de biomarcadores** (`packages/shared/catalog`): não é tabela — é módulo TypeScript versionado no repo (portfólio: legível, revisável em PR). Campos por entrada: `key`, `displayName`, `panel`, `aliases[]` (labels PT dos laudos: "Colesterol total", "Glicose em jejum"…), `expectedUnits[]`, **`plausibleMagnitude {min,max}`** ◆ (pendência conhecida — ver seção 16), `kind: numeric|label`.

---

## 10. Contratos de API (v0 — zod em `packages/shared/contracts`)

Convenção: JSON, autenticação por `Authorization: Bearer <Firebase ID token>`, prefixo `/v1`. Erros no formato `{ error: { code, message } }`.

```
POST   /v1/auth/session                  troca token → provisiona/retorna User
GET    /v1/me                            perfil + settings
PATCH  /v1/me                            nome, dob, sexAtBirth, flagBorderline, aiProcessingConsent
POST   /v1/me/export                     gera bundle JSON completo (download)
DELETE /v1/me                            inicia deleção two-tier

POST   /v1/reports                       multipart PDF (≤ 20 MB, mimetype application/pdf)
                                         → cria ReportFile + enfileira extraction.run → { extractionId }
GET    /v1/reports                       tabela "Recent uploads"

GET    /v1/extractions/:id               status + items (+ meta: lab, data, counts p/ header do Review)
PATCH  /v1/extractions/:id/items/:itemId edita value/unit/qualifier/label/range/biomarkerKey
POST   /v1/extractions/:id/confirm       → { batchId }   (transacional — ver 12.3)
POST   /v1/extractions/:id/discard

GET    /v1/batches                       lista snapshots (sequence, data, lab, count, overallScore, tag)
GET    /v1/batches/:id                   measurements agrupadas por painel + flags
GET    /v1/batches/compare?a=&b=         linhas: biomarker, valor A, valor B, delta, tone

GET    /v1/biomarkers?batch=:id          catálogo + última leitura no contexto do batch selecionado
GET    /v1/biomarkers/:key/series        série completa p/ Detail (history + past readings)

GET    /v1/scores?batch=:id              6 sistemas + overall
GET    /v1/scores/:system?batch=:id      detalhe: value, status, delta, inputs (measurements), história, formulaVersion

GET    /v1/insights                      lista (+ unreadCount p/ badge)
GET    /v1/insights/:id
PATCH  /v1/insights/:id/read

GET    /v1/activity?limit=10
GET    /v1/health
```

**Contexto global de batch:** o seletor do topbar ("Snapshot 04 · 14 Jun 2026") define o batch em visualização. No web: query param `?batch=` + default latest. Dashboard, Biomarkers e Scores respeitam esse contexto.

---

## 11. Especificações das engines (puras, em `packages/shared/engines`)

### 11.1 Flag engine (Universal Layer)

```ts
type FlagInput = {
  value?: number; valueQualifier?: '<'|'>'|'≤'|'≥'; valueLabel?: string;
  refLow?: number; refHigh?: number;
  lowInclusive?: boolean; highInclusive?: boolean;   // default: inclusivo
  borderlinePct: number;                             // 0.05 default; 0 se toggle off
};
type FlagResult = { status: 'good'|'watch'|'alert'|'none'; label: string };
```

Regras (nesta ordem):
1. `valueLabel` presente e sem range numérico → `none`, label = valueLabel.
2. Sem range (`refLow` e `refHigh` ausentes) → `none`, "No reference provided".
3. Fora do range (respeitando inclusividade e qualifier — ex. `< 0.5` com refHigh 3.0 conta como dentro) → `alert`, label "Above target" / "Below range".
4. Dentro do range mas a `borderlinePct` do threshold mais próximo → `watch`, "Upper range" / "Lower range" / "Borderline" (ranges one-sided tipo `< 5.7`).
5. Caso contrário → `good`, "In range".

Testes: table-driven cobrindo qualifiers, one-sided (`< 200`, `> 40`), inclusividade, ausência de range, labels de sorologia, borderline on/off. **Os 20 biomarcadores do seed devem reproduzir exatamente os status do design.**

### 11.2 Score engine v1 (`formulaVersion: "scores-v1"`)

- Função pura por sistema: `(measurements) => { value: 0–100, missingInputs[] }`.
- Estratégia v1 (simples, auditável, suficiente p/ portfólio): cada input contribui com sub-score 0–100 pela distância ao range/target (100 dentro com folga, decaindo linearmente no borderline, penalidade proporcional ao excesso fora); média ponderada por sistema. Documentar a função no próprio arquivo (JSDoc) — isso É conteúdo de portfólio.
- **Composite (overall):** pesos da seção 5.6. Reproduz 84 do design.
- **Status:** thresholds da seção 5.7.
- Congelamento: na confirmação, gravar `Score` rows com `inputsSnapshot` + `formulaVersion`. Recomputações futuras só como nova versão (nunca sobrescrever v1 congelado).
- Testes de determinismo: mesma entrada ⇒ mesma saída, byte a byte; fixtures reproduzem 79/72/94/90/91/96/84.

### 11.3 Pipeline de ingestão (o coração do produto)

```
POST /reports (PDF)
  → ReportFile salvo (storage adapter)
  → pg-boss publish "extraction.run" { extractionId }
worker extraction.run (in-process):
  1. baixa PDF do storage
  2. Anthropic API (documento + extractor prompt v1) — prompt/schema chegam da instância claude.ai (seção 16)
  3. valida saída contra zod extraction-schema (alinhado a docs/extraction-schema.md)
  4. normaliza números BR (brazilian-number.ts)
  5. resolve rawLabel → biomarkerKey via aliases do catálogo (não resolvido = item sem key, revisável)
  6. valida plausibleMagnitude → plausibility=out_of_magnitude rebaixa confidence p/ low
  7. grava Extraction(status=needs_review) + items
  8. falha de LLM/validação → status=failed + error (UI mostra retry)
Review (UI):
  - header: "N values found across M panels · K to check" (K = medium+low)
  - edição inline persiste via PATCH; item editado marca editedByUser
Confirm (transação única):
  a. cria Batch (sequence = próximo, collectedAt do laudo, performingLab)
  b. cria Measurements a partir dos items (ranges per-result — ADR-002)
  c. roda flag engine em cada measurement (congela status + flagLabel)
  d. roda score engine → Score rows congeladas (6 sistemas + overall)
  e. ActivityEvents: batch.created; flag.crossed (comparado ao batch anterior); score.changed (delta ≠ 0)
  f. se aiProcessingConsent: pg-boss publish "insights.generate" { batchId }
Discard: Extraction → discarded (soft).
```

### 11.4 Insights engine (LLM, leaf read-only)

- Job `insights.generate`: monta contexto = medições do batch + deltas vs. batch anterior + flags + **trechos curados por painel** (arquivos `docs/knowledge/*.md`, sem RAG — decisão tomada); chama Anthropic com **insight prompt v1** (chega da instância claude.ai); valida saída zod: `{ title, tone, summary, body, markerKeys[], relatedScoreKey }[]`; persiste como Insight rows.
- Guardrails no prompt E na validação: nunca diagnostica, nunca inventa números (só cita valores presentes no contexto), tom educacional, máx. 4 insights por batch.
- Consent gate: sem consentimento ⇒ job nem é publicado.
- `groundingMeta` grava o que entrou no prompt (auditabilidade — alimenta o card "Grounded in").

---

## 12. Plano passo a passo (Fases 0–10)

Tamanhos: **P** ≈ até 1 dia · **M** ≈ 2–4 dias · **G** ≈ 1 semana+ (ritmo solo, part-time).

### Fase 0 — Fundação do repositório [M]

- [x] pnpm workspaces (`apps/web`, `apps/api`, `packages/shared`) + TS strict em tudo (`noUncheckedIndexedAccess` incluso)
- [x] ESLint + Prettier compartilhados; husky + lint-staged
- [ ] `docker-compose.yml` com Postgres 16 local *(adiado — infra pulada por ora)*
- [ ] `apps/api`: NestJS bootstrap + `/v1/health` ✓ · Prisma + pg-boss *(adiado — infra pulada por ora)*
- [x] `apps/web`: Vite + React + Router bootstrap, página placeholder
- [x] `packages/shared`: build TS, importável pelos dois apps (teste de fumaça)
- [x] GitHub Actions: lint + typecheck + test + build em PR
- [ ] `.env.example` completo (seção 15) + README esqueleto
- [x] Migrar `brazilian-number.ts` (com testes) para `packages/shared/extraction`

**Aceite:** `pnpm i && pnpm dev` sobe web+api; CI verde; shared importado dos dois lados.

### Fase 1 — Design system [M]

- [ ] `tokens.css` com as custom properties da seção 2.3, verbatim
- [ ] Fontes self-hosted via `@fontsource` (IBM Plex Sans 400/500/600/700, IBM Plex Mono 400/500/600, Space Grotesk 500/600/700)
- [ ] Primitivos: `Button` (primary/ghost/lg), `Pill` (good/watch/alert/ai/blue/ink), `Card` (pad/pad-lg), `Table`, `Tabs`, `Toggle`, `Segmented`, `Field/Input`, `StatusDot` (incluindo `none` cinza), `Kicker (.k)`, `Link`, `Avatar`
- [ ] SVG: `Ring` (props value/size/status; util de dasharray da seção 2.3), `Sparkline` (points normalizados), `RefBand` (posição %, dot por status, oculta se `none`), `Icon` (extrair paths do protótipo p/ sprite/componente único)
- [ ] Rota `/playground` renderizando tudo lado a lado

**Aceite:** comparação visual playground × protótipo sem divergência perceptível; tudo tipado; zero estilo inline fora de casos posicionais.

### Fase 2 — Shell + 12 telas com mock [G]

- [ ] Layout: Sidebar (250px, sticky, grupos Overview/Analysis/Data, badge de insights), Topbar (60px blur, snapshot selector, busca desabilitada com tooltip "coming soon", botões Compare e Upload report), footer da sidebar com conta
- [ ] `ApiClient` (interface tipada pelos contracts) + `MockApiClient` com fixtures = seed Marina (seção 14). **Toda tela consome a interface — nunca fixtures direto**
- [ ] TanStack Query como camada de dados; roteamento com estados de URL (`?batch=`, abas de timeline/settings em rota ou searchParam)
- [ ] Telas: Login · Dashboard · Upload · Review · Timeline (3 abas) · Biomarkers · BiomarkerDetail · Scores · ScoreDetail · Insights · InsightDetail · Settings (3 abas)
- [ ] Estados: skeleton loading, vazio (usuário novo: dashboard vira CTA de upload), erro com retry
- [ ] Renderização de `valueLabel`/`valueQualifier`/status `none` (seção 5.3–5.4)
- [ ] Copy fixes das seções 5.2 e 5.5
- [ ] Acessibilidade: navegação por teclado nas listas clicáveis, `aria-label` nos ícones, contraste ok

**Aceite:** paridade visual com o protótipo tela a tela; fluxo navegável de ponta a ponta em mock; axe sem violações críticas.

### Fase 3 — Backend núcleo [G]

- [ ] Prisma schema (seção 9) + migration inicial
- [ ] Módulo auth: guard Firebase Admin (verifica ID token), decorator `@CurrentUser`, provisionamento em `POST /v1/auth/session`
- [ ] Módulo users: `GET/PATCH /v1/me`
- [ ] `packages/shared/catalog`: 20 biomarcadores do design com aliases PT + `plausibleMagnitude` (valores chegam da instância claude.ai — placeholder com TODO até lá)
- [ ] Storage adapter (interface + impl disco local; impl S3/R2 atrás da mesma interface)
- [ ] Login real no web: Firebase JS SDK → token → session → rotas protegidas → sign out

**Aceite:** login Google e email/senha funcionando de ponta a ponta; `/v1/me` retorna perfil; migrations idempotentes.

### Fase 4 — Pipeline de ingestão [G]

- [ ] `POST /v1/reports`: multipart, validação (pdf, ≤ 20 MB), grava storage + ReportFile, publica `extraction.run`
- [ ] Worker conforme 11.3 (Anthropic + validação zod + brazilian-number + resolução de aliases + plausibleMagnitude)
- [ ] Endpoints de review: GET extraction, PATCH item, confirm (transação completa 11.3), discard
- [ ] UI Review ligada à API real: polling/refetch do status `processing → needs_review`, edição inline, contadores do header computados
- [ ] UI Upload: dropzone real (input file + drag), progress, tabela de recentes via API
- [ ] **Golden files:** 3+ laudos reais anonimizados (Fleury, Dasa, Hermes Pardini) em `apps/api/test/fixtures` + teste e2e do worker validando extração contra resultado esperado
- [ ] Retry manual em `failed`

**Aceite:** subir um PDF real → revisar → confirmar → snapshot aparece na Timeline com measurements e flags corretos; golden files verdes; item low-confidence destacado.

### Fase 5 — Score engine [M]

- [ ] Implementar 11.2 em `packages/shared/engines/scores` (funções puras + registry `scores-v1`)
- [ ] Integrar no confirm (congelamento com `inputsSnapshot`)
- [ ] `GET /v1/scores` + `GET /v1/scores/:system` (inclui história cross-batch p/ "Score over time")
- [ ] UI Scores/ScoreDetail na API real; "Input biomarkers" clicáveis navegam ao BiomarkerDetail
- [ ] Testes: determinismo, fixtures do design (79/72/94/90/91/96/84), inputs faltantes (sistema com dados parciais reporta `missingInputs` e a UI indica)

**Aceite:** confirmar o seed Marina reproduz exatamente os números do design; recomputação nunca altera scores congelados.

### Fase 6 — Insights [M]

- [ ] `docs/knowledge/`: 6 arquivos curados (um por painel) — conteúdo educacional curto que alimenta o prompt (rascunho inicial chega da instância claude.ai)
- [ ] Job `insights.generate` conforme 11.4 (prompt v1 + validação zod + guardrails + groundingMeta)
- [ ] Endpoints insights (list/detail/read) + badge unread no sidebar
- [ ] UI Insights/InsightDetail na API real; card "Grounded in" alimentado por groundingMeta
- [ ] Consent gate testado (toggle off ⇒ zero jobs)

**Aceite:** confirmar o seed gera 3–4 insights coerentes citando apenas valores reais do contexto; toggle respeitado; disclaimer presente em toda superfície de insight.

### Fase 7 — Settings & LGPD [M]

- [ ] Profile: editar nome/DOB/sexAtBirth (copy corrigido — 5.5)
- [ ] Units & ranges: apenas "Flag borderline values" (toggle liga/desliga `borderlinePct` — flags de batches FUTUROS; congelados não mudam) — custom ranges cortado (5.1), unidades/data fixos no MVP
- [ ] Privacy: Export (bundle JSON: user, reports meta, extractions, batches, measurements, scores, insights, activity) · Delete account (DeletionRequest + soft-delete imediato + job `privacy.purge` após janela: apaga rows + objetos no storage) · AI toggle · Sign out
- [ ] Teste de completude do export (toda tabela do usuário representada)
- [ ] Teste do purge (storage + DB vazios após job)

**Aceite:** export baixa JSON válido e completo; delete torna a conta inacessível na hora e purge é verificável; toggles persistem.

### Fase 8 — Integração final & realidade de dados [M]

- [ ] Remover `MockApiClient` do bundle de produção (mantém para testes/Storybook de tela)
- [ ] Snapshot selector do topbar funcional (contexto global `?batch=`)
- [ ] Timeline Compare com seletor A/B (default latest vs anterior); Trends com todos os biomarcadores ≥ 2 leituras
- [ ] Dashboard: counts computados, "Needs attention" = measurements alert+watch do batch em contexto, activity via API
- [ ] Fluxo primeiro-uso: conta nova sem dados → onboarding CTA upload → primeiro snapshot popula tudo
- [ ] Revisão de copy EN completa (produto 100% inglês)

**Aceite:** usuário novo real completa o ciclo inteiro sem tocar em mock; nenhum número hardcoded restante.

### Fase 9 — Qualidade [M]

- [ ] Unit: engines (flags + scores) com cobertura ≥ 95% de branches; brazilian-number já coberto
- [ ] API e2e (supertest): auth, upload→confirm, export, delete
- [ ] Playwright: happy path completo (login demo → upload fixture → review → confirm → dashboard → insight)
- [ ] Error boundaries no web; logging estruturado (pino) na api; rate limit no upload; validação de mimetype real (magic bytes, não só extensão)
- [ ] Lighthouse: a11y ≥ 95, performance ≥ 90 no dashboard

**Aceite:** CI roda tudo; suíte verde reprodutível.

### Fase 10 — Deploy & portfólio [M]

- [ ] Neon (Postgres) + Railway/Fly (api+worker) + Vercel (web) + R2 (PDFs); domínios + CORS + HTTPS
- [ ] Secrets conforme seção 15; Firebase authorized domains
- [ ] Conta demo `demo@biox.app` com seed Marina (script `pnpm seed:demo`) — botão "View demo" na tela de login
- [ ] README de portfólio: pitch, arquitetura (diagrama + link p/ 03-architecture.md), decisões (índice de ADRs EN), screenshots/GIF, stack, "why deterministic scores", instruções de rodar local
- [ ] Sentry (opcional) + uptime check
- [ ] Tag `v1.0.0`

**Aceite:** URL pública funcional; recrutador entra na demo em 2 cliques; README conta a história técnica sozinho.

---

## 13. Variáveis de ambiente (checklist)

```
# api
DATABASE_URL=
ANTHROPIC_API_KEY=            # só no servidor, nunca no web
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=        # service account (Admin SDK)
FIREBASE_PRIVATE_KEY=
STORAGE_DRIVER=local|s3
S3_ENDPOINT= S3_BUCKET= S3_ACCESS_KEY_ID= S3_SECRET_ACCESS_KEY=
APP_ORIGIN=                   # CORS
PURGE_GRACE_DAYS=7

# web (públicas)
VITE_API_URL=
VITE_FIREBASE_API_KEY= VITE_FIREBASE_AUTH_DOMAIN= VITE_FIREBASE_PROJECT_ID=
```

---

## 14. Seed demo "Marina Alves" (paridade com o design)

Script `pnpm seed:demo` cria, **passando pelo pipeline real** (não INSERT direto — o seed confirma extractions sintéticas, garantindo que engines rodem):

- User: Marina Alves, `demo@biox.app`, DOB 12 May 1991, sexAtBirth female
- 4 batches (datas/labs da seção 2.4) com as 20 medições — valores do snapshot 04 são os do protótipo (Hemoglobin 14.6 g/dL 13.5–17.5 · Glucose 97 70–99 · HbA1c 5.6 <5.7 · TChol 214 <200 · LDL 141 <130 · HDL 54 >40 · Trig 148 <150 · Urea 33 15–45 · Creatinine 0.94 0.7–1.3 · AST 27 <40 · ALT 30 <41 · ESR 11 <15 · CRP 0.9 <3.0 · TSH 2.3 0.4–4.0 · FT4 1.2 0.9–1.7 · Hematocrit 43.2 41–53 · RBC 4.92 4.5–5.9 · WBC 6.9 4.0–11.0 · Platelets 248 150–450 · Ferritin 176 30–400); snapshots anteriores derivados dos deltas da tabela Compare do protótipo
- Resultado esperado: flags e scores idênticos ao design (2 alert, 3 watch; scores 79/72/94/90/91/96; overall 84) — **o seed é, na prática, um teste de integração vivo**
- 4 insights gerados de verdade pelo job (ou fixture estática se quiser demo sem custo de LLM — decisão de custo p/ Pamy)

---

## 15. Riscos e armadilhas (avaliação honesta)

1. **Variabilidade de layout dos PDFs entre labs** é o maior risco técnico do produto. Mitigação: golden files desde a Fase 4, confidence honesto, e o Review humano como porta obrigatória — nunca auto-confirmar.
2. **Alucinação na extração** (valor/unidade inventados). Mitigação: schema zod estrito, whitelist de unidades por biomarcador, `plausibleMagnitude`, qualifiers preservados, raw output auditável.
3. **Conversão de unidades** é minada de erros clínicos (fator por analito, não global) — por isso ficou fora do MVP. Exibir como no laudo.
4. **Drift de semântica de score**: qualquer mexida na fórmula sem bump de `formulaVersion` quebra a promessa central do produto. O registry + testes de determinismo existem para isso.
5. **LGPD**: purge tem que apagar storage + DB + qualquer derivado. O teste da Fase 7 não é opcional. Nunca logar valores de medições em logs de produção.
6. **Segredos**: `ANTHROPIC_API_KEY` e service account do Firebase jamais no cliente ou no repo. O PII scan do repo já foi feito uma vez — manter o padrão.
7. **Responsabilidade médica**: os disclaimers do design ("educational only", "AI explains, never diagnoses") não são decorativos — preservar em toda superfície nova.
8. **Scope creep solo-dev**: o corte do MVP (seção 7) é o guard-rail. Feature nova entra no backlog, não na fase corrente.

---

## 16. Divisão de trabalho (quem entrega o quê)

**Instância claude.ai (com a Pamy) — insumos que o VS Code deve AGUARDAR (não improvisar):**
- [ ] Extractor prompt v1 + extraction-schema.md alinhado (pendência conhecida da Fase 5 do roadmap de docs)
- [ ] Insight prompt v1 + rascunho dos 6 arquivos de knowledge curado
- [ ] Catálogo com `plausibleMagnitude` preenchido (pendência conhecida)
- [ ] ADRs 001–006 traduzidos p/ EN (para o docs/ público)
- [ ] Confirmação das decisões D1–D9 e das resoluções da seção 5

**Instância VS Code — tudo o resto**, fase a fase, com PRs pequenos por fase e checkboxes atualizados neste arquivo (commitar o plano em `docs/implementation-plan.md`).

---

## 17. Definition of Done do MVP

- [ ] Usuário novo: cadastro → upload de PDF real → review → confirm → dashboard/timeline/biomarkers/scores/insights populados
- [ ] Scores reproduzíveis e congelados (`formulaVersion`), badge "Computed in code" verdadeiro
- [ ] Insights só com consentimento, sempre rotulados, groundingMeta auditável
- [ ] Export JSON completo + deleção two-tier verificada
- [ ] Seed demo reproduz o protótipo pixel-perto e número-exato
- [ ] CI verde (unit + e2e + Playwright), deploy público com conta demo
- [ ] README de portfólio publicado
