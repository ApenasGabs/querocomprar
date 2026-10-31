import React, { useState, useEffect } from "react";
import { X, ShieldAlert, DollarSign, Tag, ListOrdered, Link, FileText } from "lucide-react";
import type { Product } from "../types/index.ts";

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (productData: any) => Promise<void>;
  productToEdit?: Product | null;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  onSave,
  productToEdit,
}) => {
  const [name, setName] = useState("");
  const [targetPrice, setTargetPrice] = useState("");
  const [priority, setPriority] = useState<number>(2);
  const [category, setCategory] = useState("Eletrônicos");
  const [negativeKeywords, setNegativeKeywords] = useState("");
  const [referenceUrl, setReferenceUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name);
      setTargetPrice(String(productToEdit.target_price));
      setPriority(productToEdit.priority);
      setCategory(productToEdit.category || "Eletrônicos");
      setNegativeKeywords(productToEdit.negative_keywords || "");
      setReferenceUrl(productToEdit.reference_url || "");
      setNotes(productToEdit.notes || "");
    } else {
      setName("");
      setTargetPrice("");
      setPriority(2);
      setCategory("Eletrônicos");
      setNegativeKeywords("capa, case, pelicula, suporte, cabo, chaveiro");
      setReferenceUrl("");
      setNotes("");
    }
    setError(null);
  }, [productToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const priceNum = parseFloat(targetPrice.replace(",", "."));
    if (!name.trim()) {
      setError("Informe o nome do produto.");
      return;
    }
    if (isNaN(priceNum) || priceNum <= 0) {
      setError("Informe um preço alvo válido maior que zero.");
      return;
    }

    try {
      setLoading(true);
      await onSave({
        name: name.trim(),
        target_price: priceNum,
        priority,
        category: category.trim(),
        negative_keywords: negativeKeywords.trim(),
        reference_url: referenceUrl.trim(),
        notes: notes.trim(),
      });
      onClose();
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-100">
            {productToEdit ? "Editar Desejo de Compra" : "Novo Desejo de Compra"}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-xs">
              {error}
            </div>
          )}

          {/* Nome */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Nome do Produto / Modelo Específico *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: PlayStation 5 Slim 1TB, Teclado Keychron K3 V2..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Preço Alvo & Categoria */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Preço Alvo que Você Quer Pagar (R$) *
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(e.target.value)}
                  placeholder="Ex: 3200,00"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Categoria
              </label>
              <div className="relative">
                <Tag className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Ex: Games, Informática..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Prioridade */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Grau de Prioridade na sua Wishlist
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPriority(1)}
                className={`py-2 px-3 text-xs font-medium rounded-lg border text-center transition ${
                  priority === 1
                    ? "bg-rose-500/20 border-rose-500/50 text-rose-300 font-bold"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                P1 • Urgente / Alta
              </button>
              <button
                type="button"
                onClick={() => setPriority(2)}
                className={`py-2 px-3 text-xs font-medium rounded-lg border text-center transition ${
                  priority === 2
                    ? "bg-amber-500/20 border-amber-500/50 text-amber-300 font-bold"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                P2 • Média
              </button>
              <button
                type="button"
                onClick={() => setPriority(3)}
                className={`py-2 px-3 text-xs font-medium rounded-lg border text-center transition ${
                  priority === 3
                    ? "bg-slate-800 border-slate-600 text-slate-200 font-bold"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                P3 • Longo Prazo
              </button>
            </div>
          </div>

          {/* Filtro Anti-Falso-Positivo (Palavras Negativas) */}
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <label className="text-xs font-semibold text-slate-300">
                Palavras-Chave Negativas (Filtro Anti-Acessórios)
              </label>
            </div>
            <input
              type="text"
              value={negativeKeywords}
              onChange={(e) => setNegativeKeywords(e.target.value)}
              placeholder="capa, case, pelicula, suporte, cabo, chaveiro"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Separadas por vírgula. Anúncios contendo essas palavras serão descartados para não poluir o histórico.
            </p>
          </div>

          {/* URL de Referência Opcional */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Link de Referência da Loja (Opcional)
            </label>
            <div className="relative">
              <Link className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="url"
                value={referenceUrl}
                onChange={(e) => setReferenceUrl(e.target.value)}
                placeholder="https://..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Anotações Pessoais (Opcional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Esperar a Black Friday ou comprar com cashback..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-lg text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20 transition disabled:opacity-50"
            >
              {loading ? "Salvando..." : productToEdit ? "Salvar Alterações" : "Cadastrar e Monitorar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
