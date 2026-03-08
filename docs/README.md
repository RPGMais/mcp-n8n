# n8n + MCP no Cursor

**Última atualização:** 2026-02-05

Documentação do que foi feito para conectar o **Cursor** ao **n8n** via um servidor **MCP (Model Context Protocol)** customizado, permitindo listar, criar, editar e executar workflows a partir do chat.

---

## O que foi feito

1. **Servidor MCP customizado** em `/data/mcp/mcp-n8n/` que expõe 7 ferramentas (tools) para a API REST do n8n.
2. **Configuração do Cursor** em `/data/.cursor/mcp.json` para usar esse servidor (transporte stdio, comando `npx tsx`).
3. **Compatibilidade com Node 16**: cliente HTTP usando módulos nativos `http`/`https` (sem depender de `fetch`).
4. **Ajustes de validação**: retorno com `structuredContent` e schema que aceita `nextCursor: null`.

---

## Estrutura da documentação

| Arquivo | Conteúdo |
|---------|----------|
| [README.md](README.md) | Este arquivo – visão geral e índice. |
| [SETUP.md](SETUP.md) | Instalação, variáveis de ambiente e configuração no Cursor. |
| [TOOLS.md](TOOLS.md) | As 7 tools expostas (listar, obter, criar, atualizar, excluir, executar, status execução). |
| [TROUBLESHOOTING.md](TROUBLESHOOTING.md) | Problemas comuns e soluções (fetch, nextCursor, MCP desconectado). |
| [MCP_VS_API.md](MCP_VS_API.md) | Quando usar MCP no Cursor vs. chamar a API do n8n direto. |

---

## Localização no projeto

- **Código do MCP:** `/data/mcp/mcp-n8n/`  
  - `src/index.ts` – servidor MCP e registro das tools  
  - `src/n8n-client.ts` – cliente HTTP da API n8n  
- **Configuração Cursor:** `/data/.cursor/mcp.json`  
- **Documentação:** `/data/docs/mcp/n8n-mcp/` (esta pasta)

---

## Uso rápido

Com o MCP n8n conectado no Cursor, no chat você pode pedir por exemplo:

- *"Lista os workflows do n8n"*
- *"Executa o workflow X no n8n"*
- *"Mostra os detalhes do workflow Y"*
- *"Cria um workflow no n8n com..."*

Para este fluxo (usar n8n a partir do chat), **recomenda-se usar o MCP**. Para scripts, CI/CD ou outros sistemas, use a [API direta do n8n](MCP_VS_API.md).
