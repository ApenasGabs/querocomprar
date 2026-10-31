import app from "./app.ts";
import { initScheduler } from "./services/scheduler.ts";

const PORT = Number(process.env.PORT) || 3001;

// Inicializa o agendador diário de scraping
initScheduler();

app.listen(PORT, () => {
  console.log(`🚀 [Quero Comprar] Servidor backend ativo na porta ${PORT}`);
});
