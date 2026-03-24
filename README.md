# 🚀 QueryBridge Core

[![Bun](https://img.shields.io/badge/Bun-%23000000.svg?style=for-the-badge&logo=bun&logoColor=white)](https://bun.sh)
[![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Google Sheets](https://img.shields.io/badge/Google%20Sheets-34A853?style=for-the-badge&logo=google-sheets&logoColor=white)](https://www.google.com/sheets/about/)

**QueryBridge Core** é um motor de sincronização de dados de alta performance projetado para conectar instâncias **PostgreSQL** diretamente ao **Google Sheets**. Ele transforma consultas SQL complexas em relatórios dinâmicos, formatados como Tabelas Nativas do Google, utilizando uma arquitetura escalável que suporta milhões de linhas através de **Streaming via Cursor**.

---

## 🛠️ Tecnologias e Stack

- **Runtime:** [Bun](https://bun.sh) (Foco em performance e baixa latência).
- **Linguagem:** TypeScript (Configuração de tipagem estrita).
- **ORM/Query Builder:** [Adonis Lucid](https://lucid.adonisjs.com/) (Integração robusta com PostgreSQL).
- **Integração Google:** Google Apps Script (Interface para Google Sheets API).
- **Linter & Formatter:** [Biome](https://biomejs.dev/) (Substituto ultra-rápido para ESLint/Prettier).
- **Utilitários:** Axios (HTTP) e Luxon (Gestão de Timezones).

---

## 🏗️ Arquitetura do Projeto

O projeto adota princípios de **Clean Code** e **SOLID**, com processamento sequencial e otimização de memória:

- `src/config/`: Centralização de variáveis de ambiente e logger estruturado.
- `src/core/contracts/`: Interfaces e tipos que garantem a segurança em todo o sistema.
- `src/modules/`:
  - `config-tabs/`: Carregamento e sanitização de dados da planilha de configuração.
  - `scheduler/`: Gerenciador de frequências (Mensal, Semanal, Diário, Horário).
  - `reports/`: O core do processamento, utilizando **Sequential Batching** para evitar estouro de memória.
- `src/providers/`: Clientes de integração externos (Google Bridge).
- `src/database.ts`: Implementação de **Streaming via Cursor SQL** para busca eficiente de grandes volumes de dados.

---

## 🚀 Pré-requisitos e Instalação

### Pré-requisitos
- [Bun](https://bun.sh) instalado.
- Banco de Dados PostgreSQL ativo.
- Uma Planilha de Destino no Google Sheets.
- Deploy do Google Apps Script (veja o código em [`./google-apps-script/Code.gs`](./google-apps-script/Code.gs)).

### Instalação e Configuração

1. **Clone o repositório:**
   ```bash
   git clone <repo-url>
   cd query-bridge-core
   ```

2. **Instale as dependências:**
   ```bash
   bun install
   ```

3. **Configure o ambiente (.env):**
   Crie um arquivo `.env` com as seguintes chaves:
   ```env
   DATABASE_URL=postgres://user:pass@host:5432/db
   SPREADSHEET_ID=seu_id_da_planilha
   APPS_SCRIPT_URL=url_do_web_app_gerado
   BRIDGE_SECRET=sua_chave_de_seguranca
   PORT=8080
   TZ=America/Sao_Paulo
   ```

4. **Inicialize a Estrutura:**
   Execute o setup para criar as abas necessárias na planilha do Google:
   ```bash
   bun run setup
   ```

---

## 🔌 Documentação da API

| Endpoint | Método | Descrição | Parâmetros |
| :--- | :--- | :--- | :--- |
| `/` | `GET` | Health Check do serviço. | N/A |
| `/run` | `GET` | Aciona o ciclo de sincronização. | `?force=true` (Ignora o agendamento) |
| `/setup` | `GET` | Inicializa as abas de configuração na planilha. | N/A |

### Exemplo de Sincronização Forçada
```bash
curl "http://localhost:8080/run?force=true"
```

---

## 📜 Padrões de Código

- **TypeScript Estrito:** Proibido o uso de `any`; todas as interfaces são detalhadas em `src/core/contracts/`.
- **Early Return:** Prática padrão para reduzir aninhamentos e aumentar legibilidade.
- **Service Layer:** Regras de negócio isoladas em módulos específicos.
- **Escalabilidade (Streaming):** Busca de dados limitada por lotes (`BATCH_SIZE`) via cursores SQL nativos.

---

## 💻 Scripts Disponíveis

| Comando | Descrição |
| :--- | :--- |
| `bun run dev` | Inicia o servidor com hot-reload (Modo Desenvolvimento). |
| `bun run setup` | Executa o script de inicialização da planilha. |
| `bun run start` | Inicia o motor em ambiente de produção. |
| `bun run lint` | Executa análise estática via Biome. |
| `bun run lint:fix` | Aplica correções automáticas de estilo e erros comuns. |
| `bun run typecheck` | Valida a integridade dos tipos TypeScript. |

---

## 🐳 Docker & Deploy

O projeto conta com um **Dockerfile** multi-stage otimizado para **Google Cloud Run**:

```bash
# Build & Local Run
docker build -t query-bridge-core .
docker run -p 8080:8080 --env-file .env query-bridge-core
```

---

## 🤝 Contribuição

1. Realize o Fork do projeto.
2. Crie sua branch (`git checkout -b feature/minha-feature`).
3. Siga os padrões de Código Limpo informados no `README`.
4. Envie o Pull Request detalhando sua implementação.

---
**Desenvolvido para máxima performance em sincronização SQL-to-Sheet.** 🚀
