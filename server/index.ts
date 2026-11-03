import { serve } from "@hono/node-server";
import app from "./app.ts";
import { initScheduler } from "./services/scheduler.ts";

const PORT = Number(process.env.PORT) || 3001;

// Inicializa o agendador de scraping em segundo plano
initScheduler();

serve(
  {
    fetch: app.fetch,
    port: PORT,
  },
  (info) => {
    console.log(`🚀 [Quero Comprar] Servidor backend Hono ativo na porta ${info.port}`);
  }
);
