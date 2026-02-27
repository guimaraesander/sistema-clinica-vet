# Clínica Vet - Sistema de Gestão (PDV, Estoque e Relatórios)

Sistema em desenvolvimento para gestão de clínica veterinária, com foco inicial em:

* **Vendas / Caixa (PDV)**
* **Controle de Estoque**
* **Relatórios**

## Status do Projeto

🚧 Em desenvolvimento (MVP em construção)

## Stack (atual)

### Backend

* **Node.js**
* **Express**
* **Prisma ORM**
* **PostgreSQL**

### Frontend

* **React**
* **Vite**

## Funcionalidades já implementadas (backend)

### Saúde da API

* `GET /api/health`

### Produtos

* `GET /api/products`
* `GET /api/products?search=...`

### Caixa (PDV)

* `POST /api/caixa/open` → abre caixa
* `GET /api/caixa/current` → consulta caixa aberto atual
* `POST /api/caixa/close` → fecha caixa

### Debug (temporário para testes)

* `GET /api/debug/users` → lista usuários de teste (para obter IDs)

### Tratamento de erros

* Respostas de erro padronizadas em **JSON**

## Regras de negócio já validadas

* Não permite abrir dois caixas ao mesmo tempo
* Exige `usuarioId` para abrir caixa
* Exige `usuarioFechamentoId` para fechar caixa
* Valida usuário existente e ativo
* Retorna erros com status HTTP apropriado (400 / 404 / 409)

## Banco de dados e seed

O projeto utiliza PostgreSQL com Prisma.

Já existe seed inicial com:

* Usuário administrador
* Usuário de caixa
* Produtos de teste
* Estoque inicial

## Como rodar o projeto (desenvolvimento)

### 1) Pré-requisitos

* Node.js (recomendado: **v20**)
* PostgreSQL
* npm

### 2) Instalar dependências

Na raiz do projeto:

```bash
npm install
```

Se necessário, instalar também por pasta:

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 3) Configurar variáveis de ambiente

Criar o arquivo `backend/.env` com base em `backend/.env.example`.

Exemplo (ajuste conforme seu ambiente):

```env
PORT=3001
DATABASE_URL="postgresql://postgres:SUA_SENHA@localhost:5432/clinica_vet?schema=public"
JWT_SECRET="uma_chave_grande_e_segura_aqui"
JWT_EXPIRES_IN="7d"
FRONTEND_URL="http://localhost:5173"
```

### 4) Rodar o backend

```bash
npm run dev:backend
```

### 5) Rodar o frontend

```bash
npm run dev:frontend
```

### 6) Rodar backend + frontend juntos

```bash
npm run dev
```

## Endpoints de teste (Thunder Client / Postman)

### Healthcheck

* `GET http://localhost:3001/api/health`

### Produtos

* `GET http://localhost:3001/api/products`
* `GET http://localhost:3001/api/products?search=ração`

### Caixa

* `POST http://localhost:3001/api/caixa/open`
* `GET http://localhost:3001/api/caixa/current`
* `POST http://localhost:3001/api/caixa/close`

## Próximos passos (roadmap)

* [ ] Módulo de vendas (PDV) - criação de venda
* [ ] Baixa automática de estoque por venda
* [ ] Registro de pagamentos (PIX / Transferência / etc.)
* [ ] Relatórios de vendas e caixa
* [ ] Padronização de nomes de arquivos (camelCase)
* [ ] Busca sem acento (`racao` encontrar `Ração`)
* [ ] Remover rota debug temporária (`/api/debug/users`) antes de produção

## Observações

* O projeto foi iniciado a partir de uma base reaproveitada e está sendo adaptado para o domínio de clínica veterinária.
* A padronização final dos nomes de arquivos será feita em etapa de refatoração, após estabilizar o MVP.

## Autor

**Anderson Guimarães Almino**
