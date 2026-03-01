# SeedMoney — Agent Setup Compliance Prompt

> **Uso:** Cole este prompt como mensagem para o agente principal após o deploy.
> Ele executará todos os passos necessários para ativar o loop autônomo.

---

## PROMPT PARA O AGENTE PRINCIPAL

```
Você é o agente de setup do SeedMoneyOS. Seu objetivo é preparar o sistema autônomo SeedMoney para operar. Execute os passos abaixo em ordem, reportando o status de cada um.

=== CHECKLIST DE SETUP — SeedMoney Autonomous Startup ===

## PASSO 1 — Verificar e instalar dependências

Execute no diretório do projeto (tenacitOS):

  npm install

Confirme que `ts-node` foi instalado (deve aparecer em node_modules/.bin/ts-node).

## PASSO 2 — Inicializar arquivos de dados

  npm run data:init

Isso copia os `.example.json` → `.json` e aplica `chmod 600`.
Confirme que os seguintes arquivos existem em `data/`:
- org-config.json
- agent-system-prompts.json
- financial-goals.json
- tiktok-pipeline.json
- memos.json
- tasks.json

## PASSO 3 — Registrar os 4 agentes fundadores no OpenClaw

Execute cada comando e confirme que não retorna erro:

  openclaw agent create --id jobs    --name "Jobs"    --description "CEO da SeedMoney. Estratégia, decisões, alinhamento."
  openclaw agent create --id ogilvy  --name "Ogilvy"  --description "CMO da SeedMoney. TikTok, conteúdo, crescimento."
  openclaw agent create --id buffett --name "Buffett" --description "CFO da SeedMoney. Finanças, custos, ROI."
  openclaw agent create --id turing  --name "Turing"  --description "CTO da SeedMoney. Código, automações, APIs."

Se algum agente já existir (erro de duplicata), isso é OK — continue.

Verifique com: `openclaw agent list`

## PASSO 4 — Testar o loop autônomo (dry-run)

  npm run agent:dry-run -- --agent jobs

Confirme que o output inclui:
- "SeedMoney Autonomous Loop"
- "Agent: 🍎 Jobs (jobs)"
- Seções: CONTEXTO DO TURNO, ESTADO FINANCEIRO, SUAS TASKS PENDENTES
- "DRY RUN — Agent would execute with the prompt above."

## PASSO 5 — Verificar build de produção

  npm run build

Confirme que termina sem erros TypeScript.

## PASSO 6 — Criar os cron jobs no OpenClaw

  npm run agent:setup

Isso cria os 4 cron jobs intercalados:
- :00 — jobs (CEO)
- :15 — ogilvy (CMO)
- :30 — buffett (CFO)
- :45 — turing (CTO)

Verifique com: `openclaw cron list`

## PASSO 7 — Confirmar Mission Control rodando

Acesse http://localhost:3000 e verifique:
- [ ] Dashboard carrega normalmente
- [ ] /org — Mostra Jobs, Ogilvy, Buffett, Turing
- [ ] /goals — Meta $50 em 0%
- [ ] /tiktok — Pipeline com 3 ideias seed
- [ ] /kanban — 5 tasks iniciais
- [ ] /memos — Inbox vazio

=== REPORT FINAL ===

Ao concluir, crie um memo no sistema reportando o status:

  POST http://localhost:3000/api/memos
  {
    "from": "human:admin",
    "fromType": "human",
    "to": "jobs",
    "subject": "Sistema SeedMoney ONLINE",
    "content": "Setup completo. Todos os 4 agentes registrados. Cron jobs ativos. Build OK. Loop autônomo pronto para iniciar. Missão: chegar a $50 de receita o mais rápido possível.",
    "priority": "urgent",
    "actionRequired": true
  }

Sistema pronto. O loop autônomo iniciará automaticamente no próximo horário agendado.
SeedMoney — Autonomous TikTok Startup. Meta: $50. 🌱
```
