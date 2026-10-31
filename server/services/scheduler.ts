import cron from "node-cron";
import { ScraperService } from "./scraper.ts";

export function initScheduler() {
  // Executa todo dia às 08:00 e às 20:00 (duas vezes ao dia)
  // Cron: '0 8,20 * * *'
  const scheduleRule = process.env.SCRAPER_CRON || "0 8,20 * * *";

  cron.schedule(scheduleRule, async () => {
    console.log(`[Scheduler] Iniciando rotina automática diária de scraping de preços... (${new Date().toISOString()})`);
    try {
      const result = await ScraperService.scrapeAllActiveProducts();
      console.log(`[Scheduler] Varredura concluída com sucesso: ${result.totalOffers} novas ofertas para ${result.totalProducts} produtos.`);
    } catch (err) {
      console.error("[Scheduler] Erro ao executar rotina de scraping:", err);
    }
  });

  console.log(`[Scheduler] Agendador automático ativado com a regra: "${scheduleRule}"`);
}
