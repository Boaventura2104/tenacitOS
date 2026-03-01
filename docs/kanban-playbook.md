# Kanban Playbook para a Startup Autônoma

Este documento transforma o plano descrito para o Mission Control em instruções acionáveis. O objetivo é usar o que já existe (tasks, Activity Feed, Notepad, card de agentes) e criar um fluxo de "kanban vivo" com threads, inscrições, referências a documentos e comportamento colaborativo dos agentes.

## 1. Colunas de Kanban com filtros
1. Abra `/tasks` e salve os seguintes filtros como bookmarks ou links rápidos:
   - **Backlog:** `?status=open&priority=low`
   - **Planejamento:** `?status=planned&priority=high`
   - **Em andamento:** `?status=in-progress`
   - **Revisão:** `?status=review`
   - **Entregue:** `?status=done`
2. Cada filtro representa uma coluna virtual. Ordene por prioridade/prazo para simular o movimento lateral.
3. Use o link `/tasks?watchers=@startup` para criar uma coluna extra com o que está sendo monitorado pela liderança.

## 2. Threads e menções
- Ao clicar numa task, utilize o painel lateral (ou o bloco de comentários) para registrar cada movimento. Formato sugerido:
  ```
  @<responsável> update: <descrição curta> ⚡️
  doc://<nome> *(aponta para Notepad ou memória relevante)*
  ```
- Sempre use `@humano` ou `@agent` para mencionar os stakeholders; o histórico exibirá as menções como threads.
- Se um agente precisa de ajuda humana, clique em "Watchers" e adicione `@Alysson`, `@Finanças`, etc. Isso garante que recebem notificações da thread.

## 3. Inscrições e documentação
1. Use o campo **Assignee** para atribuir o responsável principal (humano ou agente). O campo **Watchers** funciona como inscrição: quem estiver listado recebe updates toda vez que a task muda.
2. Para anexar docs, adicione no comentário: `doc://planilhas/financas` e registre a URL real no Notepad ou Memory.
3. Use o Notepad (card quick link) para criar checkpoints semanais e anexe-o na task com `doc://notepad/kanban-board`.

## 4. Hierarquia e agentes multitarefa
- Padronize tags `@startup/c-level`, `@startup/dev`, `@startup/ops` nos títulos e descrições.
- No card **Multi-Agent System**, atualize as cores e emojis para refletir papéis (cobrimos isso manualmente). Use o campo `description` de cada agent para indicar responsabilidades.
- Quando um agente movimenta uma task, faça um comentário `@humano Atualizei o item...` e use `type=command` para registrar o log no Activity Feed.

## 5. Agente Dev e evolução
- Crie uma task fixa “Mission Control Evolution” (status `in-progress`). Utilize subtasks (notas, PRs, docs) e registre cada entrega no Activity Feed.
- O agente responsável deve publicar updates em `/api/activities` com `type=message`. Esses posts viram parte da thread quando o card for aberto.

## 6. Governança e métricas
1. Adicione cards de OKR/sprint no painel principal com notas do Notepad.
2. Use o Activity Feed para monitorar o número de tasks movidas: filtre por `type=command` e `status=running` para ver o fluxo.
3. Atualize a Notepad entry com o resumo do dia e mencione `@Alysson` para enviar o relatório.

## 7. Resumo dos links úteis
- `/tasks?status=in-progress` → coluna “Em andamento”.
- `/tasks?status=review` → espaço de revisão/QA.
- `/tasks?watchers=@startup` → visão do board da liderança.
- `/activity?limit=20` → thread consolidada.
- `https://d9caae17224f-2.tail90261a.ts.net/login` → URL do dashboard + senha `J35oMlic7A5cFByfr5ysJSM3`.

Se quiser, posso automaticamente transformar essas instruções em tarefas dentro do Mission Control (Crie X tasks com descrições padronizadas, atualize tags de agentes, etc.). Quer que eu gere esse conjunto de tarefas de apoio ao kanban para os agentes seguirem?