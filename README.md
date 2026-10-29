# 🛒 Quero Comprar (`querocomprar`)

> Sistema local autônomo de monitoramento de preços, lista de desejos (wishlist) com prioridades e inteligência contra oscilações e falsos descontos no e-commerce.

Faz parte do ecossistema de ferramentas pessoais da família `quero*` (`querovagas`, `querocasa`, `querofiis`, `queroDados`).

## 🛠️ Stack Tecnológica
- **Frontend:** React + Vite + Tailwind CSS + Lucide React + Recharts
- **Backend:** Node.js + Fastify / Express (TypeScript)
- **Banco de Dados:** SQLite WAL (arquivo único local com Drizzle ORM)
- **Scraper Engine:** Coletor HTTP/API com fallback inteligente para Browserless remoto
- **Deploy:** Container Docker único para Homelab (ZimaOS / CasaOS)
