import { describe, it, expect, beforeAll } from "vitest";
import app from "../app.ts";

describe("Hono Backend API Contract (/workspace/querocomprar)", () => {
  it("GET /health retorna status ok e identificação do serviço", async () => {
    const res = await app.request("/health");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("ok");
    expect(body.service).toBe("querocomprar");
    expect(body.timestamp).toBeDefined();
  });

  it("GET /api/health retorna status ok", async () => {
    const res = await app.request("/api/health");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("ok");
  });

  it("GET /api/summary retorna estrutura de resumo da dashboard", async () => {
    const res = await app.request("/api/summary");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(typeof body.total_products).toBe("number");
    expect(typeof body.total_wishlist_value).toBe("number");
    expect(typeof body.total_target_value).toBe("number");
  });

  it("GET /api/alerts retorna lista de alertas exclusivos da dashboard", async () => {
    const res = await app.request("/api/alerts");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.alerts)).toBe(true);
    expect(typeof body.total).toBe("number");
  });

  it("POST /api/products valida campos obrigatórios", async () => {
    const res = await app.request("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "", target_price: -1 }),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  it("CRUD Completo de Produto via Hono API", async () => {
    // 1. Criar produto
    const createRes = await app.request("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Produto Teste Hono",
        target_price: 150.0,
        priority: 1,
        category: "Testes",
        notes: "Criado no teste automatizado",
      }),
    });
    expect(createRes.status).toBe(201);
    const created = await createRes.json();
    expect(created.id).toBeDefined();
    expect(created.name).toBe("Produto Teste Hono");

    const productId = created.id;

    // 2. Buscar produto por ID
    const getRes = await app.request(`/api/products/${productId}`);
    expect(getRes.status).toBe(200);
    const fetched = await getRes.json();
    expect(fetched.id).toBe(productId);
    expect(fetched.metrics).toBeDefined();

    // 3. Atualizar produto
    const updateRes = await app.request(`/api/products/${productId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Produto Teste Hono Atualizado",
        target_price: 140.0,
        priority: 2,
        category: "Testes",
        notes: "Atualizado via teste",
      }),
    });
    expect(updateRes.status).toBe(200);
    const updated = await updateRes.json();
    expect(updated.name).toBe("Produto Teste Hono Atualizado");
    expect(updated.target_price).toBe(140.0);

    // 4. Deletar produto
    const deleteRes = await app.request(`/api/products/${productId}`, {
      method: "DELETE",
    });
    expect(deleteRes.status).toBe(200);
    const deleteBody = await deleteRes.json();
    expect(deleteBody.success).toBe(true);

    // 5. Verificar que não existe mais
    const getDeletedRes = await app.request(`/api/products/${productId}`);
    expect(getDeletedRes.status).toBe(404);
  });
});
