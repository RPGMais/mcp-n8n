# MCP vs. API direta – Quando usar cada um

---

## Listar (e outras ações) via MCP

**O que acontece:** No chat do Cursor você pede, por exemplo, *"Lista os workflows do n8n"*. A IA usa a **tool MCP** (ex.: `n8n_list_workflows`). O servidor MCP recebe a chamada, chama a API do n8n e devolve o resultado; o Cursor mostra a resposta no chat.

**Vantagens:**

- Não precisa saber URL, endpoint nem API key.
- Tudo no fluxo de **conversa** (linguagem natural).
- A IA pode **combinar** várias ações (listar, depois executar um workflow, etc.).
- Configuração concentrada no Cursor (`.cursor/mcp.json`).

**Requisitos:**

- Cursor com MCP n8n configurado e **conectado**.
- Workspace que usa o `mcp.json` onde o n8n está definido.

**Ideal para:** Usar o n8n **a partir do chat do Cursor** no dia a dia (listar, executar, inspecionar, criar/editar workflows com ajuda da IA).

---

## Listar (e outras ações) via API direta

**O que acontece:** Você (ou um script/sistema) faz um **HTTP request** ao n8n, por exemplo:

- `GET http://localhost:5678/api/v1/workflows`
- Header: `X-N8N-API-KEY: <sua-chave>`

**Vantagens:**

- Pode ser feito de **qualquer lugar**: terminal (`curl`), script (Node, Python), outro serviço, Postman.
- Não depende do Cursor nem do MCP.
- Integra com **CI/CD**, backends, outros IDEs.
- Único requisito: ter a URL base do n8n e a API key.

**Ideal para:** Automações, scripts, pipelines e qualquer aplicação que não seja o chat do Cursor.

---

## Comparação rápida

| Aspecto | Via MCP | Via API direta |
|--------|---------|-----------------|
| Onde | Chat do Cursor | Qualquer cliente HTTP |
| Quem chama a API | Servidor MCP (em nome da IA) | Você ou seu script/sistema |
| Configuração | Cursor + MCP n8n | URL + API key do n8n |
| Uso | Linguagem natural | Chamada explícita ao endpoint |
| Automação externa | Não | Sim |

---

## Recomendação para o que estamos fazendo

Para **usar o n8n a partir do chat do Cursor** (listar workflows, executar, criar, editar, etc.), a abordagem recomendada é **usar o MCP**.

Para **integrar o n8n em scripts, pipelines ou outros sistemas**, use a **API direta** do n8n (REST em `/api/v1/`).

O MCP é uma camada de conveniência no Cursor que, por dentro, usa a mesma API do n8n; a diferença está em **onde** e **como** a chamada é feita (conversa + IA vs. request HTTP direto).
