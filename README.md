# 🚀 QueryBridge Core

[![Bun](https://img.shields.io/badge/Bun-%23000000.svg?style=for-the-badge&logo=bun&logoColor=white)](https://bun.sh)
[![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Google Sheets](https://img.shields.io/badge/Google%20Sheets-34A853?style=for-the-badge&logo=google-sheets&logoColor=white)](https://www.google.com/sheets/about/)

**QueryBridge Core** é um motor de sincronização de dados de alto desempenho que conecta bancos de dados **PostgreSQL** diretamente ao **Google Sheets**. Ele permite transformar consultas SQL complexas em relatórios vivos, formatados como Tabelas Nativas do Google, com agendamento dinâmico e configuração simplificada via planilha.

---

## 🛠️ Tecnologias e Stack

- **Runtime:** [Bun](https://bun.sh) (Performance extrema e substituto do Node.js).
- **Linguagem:** TypeScript (Tipagem estrita e segurança).
- **Banco de Dados:** PostgreSQL via [Adonis Lucid (Knex)](https://lucid.adonisjs.com/).
- **Bridge:** Google Apps Script (Interface nativa com a API do Sheets) [Código disponível em `./google-apps-script/Code.gs`](./google-apps-script/Code.gs).
- **Utilitários:** Axios (HTTP), Luxon (Datas), Biome (Linting & Formatação).

---

## 🏗️ Arquitetura do Projeto

O projeto segue princípios de **Clean Code** e **SOLID**, organizado de forma modular para máxima escalabilidade:

- `src/config/`: Gerenciamento de Variáveis de Ambiente e Logging estruturado.
- `src/core/contracts/`: Interfaces e Contratos que definem a tipagem central do sistema.
- `src/modules/`:
  - `config-tabs/`: Carregamento dinâmico de configurações da planilha.
  - `scheduler/`: Lógica de controle de frequências (M1, M5, H1, D1).
  - `reports/`: Execução de SQL e processamento de dados.
- `src/providers/`: Clientes de integração (Google Bridge API).
- `src/engine.ts`: Orquestrador central do ciclo de sincronização.

---

## 🚀 Pré-requisitos e Instalação

### Pré-requisitos

- [Bun](https://bun.sh) instalado localmente.
- Instância do PostgreSQL acessível.
- Planilha no Google Sheets e uma URL de Web App do Google Apps Script (Siga as instruções dentro de [`./google-apps-script/Code.gs`](./google-apps-script/Code.gs)).

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

3. **Configure as Variáveis de Ambiente:**

   Crie um arquivo `.env` baseado no `.env.example`:

   ```env
   DATABASE_URL=postgres://user:pass@host:5432/db
   SPREADSHEET_ID=seu_id_da_planilha
   APPS_SCRIPT_URL=sua_url_do_google_script
   BRIDGE_SECRET=sua_chave_secreta
   PORT=8080
   TZ=America/Sao_Paulo
   ```

4. **Inicie o Setup da Planilha:**

   Este comando criará as abas e cabeçalhos necessários no Google Sheets.

   ```bash
   bun run setup
   ```

---

## 🔌 Documentação da API

| Endpoint | Método | Descrição | Parâmetros |
| :--- | :--- | :--- | :--- |
| `/` | `GET` | Health Check do serviço. | N/A |
| `/run` | `GET` | Aciona o ciclo de sincronização. | `?force=true` (opcional: ignora agendamento) |

### Exemplo de Request

```bash
curl "http://localhost:8080/run?force=true"
```

---

## 📜 Padrões de Código

Este projeto impõe diretrizes rigorosas para manter a qualidade:

- **TypeScript Estrito:** Zero uso de `any`.
- **Early Return:** Evita aninhamento complexo de `if/else`.
- **Service Layer:** As regras de negócio estão isoladas do servidor HTTP.
- **Imutabilidade:** Preferência por métodos funcionais (`map`, `filter`, `reduce`).

---

## 💻 Scripts Disponíveis

| Comando | Descrição |
| :--- | :--- |
| `bun run dev` | Inicia o servidor em modo desenvolvimento (com hot-reload). |
| `bun run start` | Inicia o servidor em modo produção (compilado). |
| `bun run setup` | Inicializa a estrutura da planilha no Google Sheets. |
| `bun run lint` | Executa o linter Biome para checagem de código. |
| `bun run lint:fix` | Corrige problemas automáticos de linting e formatação. |

---

## 🐳 Docker (Cloud Run Ready)

O projeto está pronto para deploy via Docker:

```bash
docker build -t query-bridge-core .
```

```bash
docker run -p 8080:8080 --env-file .env query-bridge-core
```

*O Dockerfile já inclui configuração nativa de Timezone para o horário de Brasília.*

---

## 🤝 Contribuição

1. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`).
2. Siga os padrões de commit e código do projeto.
3. Abra um Pull Request detalhando as mudanças.

---
**Desenvolvido com foco em performance e simplicidade.** 🚀
