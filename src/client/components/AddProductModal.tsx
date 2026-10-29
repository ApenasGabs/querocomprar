import React, { useState } from 'react';
import { X, Plus, ShieldAlert, Sparkles } from 'lucide-react';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductCreated: (newProduct: any) => Promise<void>;
}

export const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  onClose,
  onProductCreated,
}) => {
  const [title, setTitle] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [category, setCategory] = useState('Eletrônicos');
  const [priority, setPriority] = useState('2');
  const [negativeKeywords, setNegativeKeywords] = useState('capa, case, pelicula, cabo, suporte, adaptador');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const priceNum = parseFloat(targetPrice.replace(',', '.'));
    if (isNaN(priceNum) || priceNum <= 0) {
      setError('Informe um preço alvo válido maior que zero.');
      return;
    }

    if (!title.trim()) {
      setError('Informe o nome do produto.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          category,
          targetPrice: priceNum,
          priority: parseInt(priority, 10),
          negativeKeywords: negativeKeywords.trim(),
        }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Falha ao salvar produto.');
      }

      const json = await res.json();
      await onProductCreated(json.product);
      onClose();
      // Reset form
      setTitle('');
      setTargetPrice('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Novo Item para Monitorar</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs bg-rose-50 text-rose-700 border border-rose-200 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Nome do Produto / Modelo Exato *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Teclado Keychron K3 V2, Sony WH-1000XM5, iPhone 15 128GB"
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Preço Alvo Desejado (R$) *
              </label>
              <input
                type="text"
                required
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                placeholder="Ex: 450.00"
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Categoria
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
              >
                <option value="Eletrônicos">Eletrônicos</option>
                <option value="Informática">Informática</option>
                <option value="Games">Games</option>
                <option value="Casa & Cozinha">Casa & Cozinha</option>
                <option value="Livros">Livros</option>
                <option value="Outros">Outros</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Grau de Prioridade Financeira
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { val: '1', label: 'P1 · Urgente', desc: 'Comprar imediatamente' },
                { val: '2', label: 'P2 · Média', desc: 'Planejado' },
                { val: '3', label: 'P3 · Desejo', desc: 'Longo prazo' },
              ].map((item) => (
                <button
                  type="button"
                  key={item.val}
                  onClick={() => setPriority(item.val)}
                  className={`p-2.5 rounded-lg border text-left text-xs transition-all ${
                    priority === item.val
                      ? 'border-emerald-500 bg-emerald-50/50 ring-1 ring-emerald-500 text-emerald-950'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                  }`}
                >
                  <p className="font-bold">{item.label}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{item.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                Filtro Anti-Falso-Positivo (Palavras Negativas)
              </span>
            </label>
            <input
              type="text"
              value={negativeKeywords}
              onChange={(e) => setNegativeKeywords(e.target.value)}
              placeholder="Ex: capa, case, cabo, pelicula, suporte, switch"
              className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-slate-600"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Separe por vírgulas. Impede que acessórios poluam o menor preço histórico.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg transition-colors shadow-sm disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{loading ? 'Salvando...' : 'Cadastrar Item'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
