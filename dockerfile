FROM oven/bun:slim

WORKDIR /app

# Variáveis de ambiente padrão
ENV NODE_ENV=production
ENV TZ=America/Sao_Paulo

# Instala o fuso horário para o sistema e dependências nativas para o driver 'pg'
RUN apt-get update && apt-get install -y tzdata libpq-dev && \
    ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Copia dependências para aproveitar o cache do Docker
COPY package.json bun.lock ./
RUN bun install --production

# Copia o restante do código
COPY . .

# Expõe a porta dinâmica (Google Cloud Run usa $PORT)
EXPOSE 8080

# Script de entrada para produção
CMD ["bun", "run", "start"]