const { useState, useEffect, useRef, useMemo, useCallback, memo } = React;

// === CONSTANTES ===
const RECEITAS_PREDEFINIDAS = [
  {
    id: 1,
    nome: "Pão de Queijo Tradicional",
    descricao: "Receita clássica mineira com queijo meia cura",
    rendimento: "50 unidades",
    tempoPreparo: "45 minutos",
    ingredientes: [
      { nome: "Polvilho doce", quantidade: 500, unidade: "g" },
      { nome: "Polvilho azedo", quantidade: 500, unidade: "g" },
      { nome: "Leite integral", quantidade: 400, unidade: "ml" },
      { nome: "Óleo", quantidade: 200, unidade: "ml" },
      { nome: "Queijo meia cura", quantidade: 400, unidade: "g" },
      { nome: "Ovos", quantidade: 4, unidade: "unidades" },
      { nome: "Sal", quantidade: 10, unidade: "g" }
    ],
    instrucoes: [
      "Ferver leite com óleo e sal",
      "Despejar sobre os polvilhos e misturar",
      "Adicionar queijo ralado e ovos um a um",
      "Amassar até obter massa homogênea",
      "Modelar bolinhas e assar a 200°C por 25 minutos"
    ],
    dataCriacao: "2024-01-15",
    criadoPor: "Chef Maria"
  },
  {
    id: 2,
    nome: "Pão de Queijo Light",
    descricao: "Versão mais saudável com redução de gordura",
    rendimento: "40 unidades",
    tempoPreparo: "40 minutos",
    ingredientes: [
      { nome: "Polvilho doce", quantidade: 600, unidade: "g" },
      { nome: "Polvilho azedo", quantidade: 400, unidade: "g" },
      { nome: "Leite desnatado", quantidade: 350, unidade: "ml" },
      { nome: "Óleo de coco", quantidade: 100, unidade: "ml" },
      { nome: "Queijo minas light", quantidade: 300, unidade: "g" },
      { nome: "Claras", quantidade: 6, unidade: "unidades" },
      { nome: "Sal light", quantidade: 8, unidade: "g" },
      { nome: "Ervas finas", quantidade: 5, unidade: "g" }
    ],
    instrucoes: [
      "Aquecer leite com óleo de coco",
      "Misturar com polvilhos até esfriar",
      "Adicionar queijo ralado e claras",
      "Incorporar ervas finas",
      "Formar bolinhas e assar a 180°C por 30 minutos"
    ],
    dataCriacao: "2024-02-20",
    criadoPor: "Nutricionista Carla"
  }
];

// === COMPONENTES ===
const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-2xl font-bold">{title}</h2>
          <button onClick={onClose} className="text-2xl hover:text-red-500">&times;</button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

const CardReceita = memo(({ receita, onEdit, onDelete, onExport }) => {
  const [expandida, setExpandida] = useState(false);

  return (
    <div className={`p-5 rounded-xl shadow-md smooth-transition ${
      expandida 
        ? 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900' 
        : 'bg-white dark:bg-gray-800'
    } border ${expandida ? 'border-blue-300 dark:border-blue-700' : 'border-gray-200 dark:border-gray-700'}`}>
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{receita.nome}</h3>
          <p className="text-gray-600 dark:text-gray-400 mt-1">{receita.descricao}</p>
          
          <div className="flex flex-wrap gap-3 mt-3">
            <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-sm">
              🕒 {receita.tempoPreparo}
            </span>
            <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-full text-sm">
              📊 {receita.rendimento}
            </span>
            <span className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 rounded-full text-sm">
              👨‍🍳 {receita.criadoPor}
            </span>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setExpandida(!expandida)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            title={expandida ? "Recolher" : "Expandir"}
          >
            {expandida ? "▲" : "▼"}
          </button>
          {onExport && (
            <button
              onClick={() => onExport(receita)}
              className="p-2 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30"
              title="Exportar"
            >
              📥
            </button>
          )}
          {onEdit && (
            <button
              onClick={() => onEdit(receita)}
              className="p-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30"
              title="Editar"
            >
              ✏️
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(receita.id)}
              className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30"
              title="Excluir"
            >
              🗑️
            </button>
          )}
        </div>
      </div>
      
      {expandida && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3 text-gray-700 dark:text-gray-300">📋 Ingredientes</h4>
              <div className="space-y-2">
                {receita.ingredientes.map((ing, idx) => (
                  <div key={idx} className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                    <span className="text-gray-700 dark:text-gray-300">{ing.nome}</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {ing.quantidade} {ing.unidade}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3 text-gray-700 dark:text-gray-300">👨‍🍳 Instruções</h4>
              <ol className="space-y-2 list-decimal list-inside">
                {receita.instrucoes.map((inst, idx) => (
                  <li key={idx} className="text-gray-700 dark:text-gray-300 py-1 pl-2">
                    {inst}
                  </li>
                ))}
              </ol>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex justify-between">
              <span>Criada em: {receita.dataCriacao}</span>
              <span>ID: #{receita.id.toString().padStart(3, '0')}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

// === MAIN APP ===
function AppReceitas() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dark, setDark] = useState(false);
  const [dbReady, setDbReady] = useState(false);
  const [receitas, setReceitas] = useState(RECEITAS_PREDEFINIDAS);
  const [filtro, setFiltro] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [receitaEditando, setReceitaEditando] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  const [novaReceitaForm, setNovaReceitaForm] = useState({
    nome: '',
    descricao: '',
    rendimento: '30 unidades',
    tempoPreparo: '40 minutos',
    ingredientes: [{ nome: '', quantidade: '', unidade: 'g' }],
    instrucoes: [''],
    criadoPor: 'Operador'
  });

  // Debug do status do database (IGUAL AO INDEX.JS)
  useEffect(() => {
    console.log('Database status:', {
      dbReady,
      dbExists: typeof window.db !== 'undefined',
      dbInstance: window.db
    });
  }, [dbReady]);

  // Inicializar banco de dados e tema (IGUAL AO INDEX.JS)
  useEffect(() => {
    const initDB = async () => {
      try {
        // Aguardar o database estar disponível
        if (typeof window.db === 'undefined') {
          console.log('Aguardando database carregar...');
          await new Promise(resolve => {
            const checkDB = setInterval(() => {
              if (typeof window.db !== 'undefined') {
                clearInterval(checkDB);
                resolve();
              }
            }, 100);
          });
        }

        await window.db.init();
        await window.db.initializeDefaultData();
        
        // Carregar configurações
        const darkMode = await window.db.getConfig('dark');
        const sidebar = await window.db.getConfig('sidebarOpen');
        
        if (darkMode !== null) setDark(darkMode);
        if (sidebar !== null) setSidebarOpen(sidebar);
        
        // Escutar mudanças de tema de outras páginas
        const unsubscribe = window.db.onConfigChange('dark', (newValue) => {
          console.log('Tema mudou para:', newValue ? 'escuro' : 'claro');
          setDark(newValue);
        });
        
        setDbReady(true);
        
        // Cleanup
        return () => unsubscribe();
      } catch (error) {
        console.error('Erro ao inicializar banco de dados:', error);
        // Fallback: continuar sem database
        setDbReady(true);
      }
    };
    
    initDB();
  }, []);

  // Salvar configurações quando mudarem (IGUAL AO INDEX.JS)
  useEffect(() => {
    if (dbReady && window.db) {
      window.db.setConfig('dark', dark);
    }
  }, [dark, dbReady]);

  useEffect(() => {
    if (dbReady && window.db) {
      window.db.setConfig('sidebarOpen', sidebarOpen);
    }
  }, [sidebarOpen, dbReady]);

  // Aplicar tema no HTML (IGUAL AO INDEX.JS)
  useEffect(() => {
    const applyTheme = async () => {
      if (dbReady && window.db) {
        // Escutar mudanças de configuração de outras páginas
        const unsubscribe = window.db.onConfigChange('dark', (newValue) => {
          setDark(newValue);
        });
        
        if (dark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        
        return () => unsubscribe();
      }
    };
    
    applyTheme();
  }, [dark, dbReady]);

  // Função para alternar tema (EXATAMENTE IGUAL AO INDEX.JS)
  const toggleDark = () => {
    setDark(prev => !prev);
  };

  // Monitorar conexão (IGUAL AO INDEX.JS)
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Funções de gerenciamento de receitas
  const adicionarReceita = (novaReceita) => {
    setReceitas(prev => [novaReceita, ...prev]);
    alert(`Receita "${novaReceita.nome}" adicionada com sucesso!`);
    setNovaReceitaForm({
      nome: '',
      descricao: '',
      rendimento: '30 unidades',
      tempoPreparo: '40 minutos',
      ingredientes: [{ nome: '', quantidade: '', unidade: 'g' }],
      instrucoes: [''],
      criadoPor: 'Operador'
    });
  };

  const editarReceita = (receita) => {
    setReceitaEditando(receita);
    setModalAberto(true);
  };

  const salvarEdicao = (receitaAtualizada) => {
    setReceitas(prev => prev.map(r => 
      r.id === receitaAtualizada.id ? receitaAtualizada : r
    ));
    setReceitaEditando(null);
    setModalAberto(false);
    alert(`Receita "${receitaAtualizada.nome}" atualizada!`);
  };

  const excluirReceita = (id) => {
    const receita = receitas.find(r => r.id === id);
    if (receita && confirm('Tem certeza que deseja excluir esta receita?')) {
      setReceitas(prev => prev.filter(r => r.id !== id));
      alert('Receita excluída!');
    }
  };

  const exportarReceita = (receita) => {
    const conteudo = `
RECEITA: ${receita.nome}
===============================
📝 Descrição: ${receita.descricao}
🕒 Tempo: ${receita.tempoPreparo}
📊 Rendimento: ${receita.rendimento}
👨‍🍳 Criado por: ${receita.criadoPor}
📅 Data: ${receita.dataCriacao}

📋 INGREDIENTES:
${receita.ingredientes.map(ing => `  • ${ing.nome}: ${ing.quantidade} ${ing.unidade}`).join('\n')}

👨‍🍳 INSTRUÇÕES:
${receita.instrucoes.map((inst, idx) => `  ${idx + 1}. ${inst}`).join('\n')}

---
Exportado do Sistema Diviníssimo - Pão de Queijo
    `.trim();

    const blob = new Blob([conteudo], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receita-${receita.nome.toLowerCase().replace(/\s+/g, '-')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    
    alert(`Receita "${receita.nome}" exportada com sucesso!`);
  };

  // Funções do formulário
  const adicionarIngrediente = () => {
    setNovaReceitaForm(prev => ({
      ...prev,
      ingredientes: [...prev.ingredientes, { nome: '', quantidade: '', unidade: 'g' }]
    }));
  };

  const removerIngrediente = (index) => {
    if (novaReceitaForm.ingredientes.length > 1) {
      setNovaReceitaForm(prev => ({
        ...prev,
        ingredientes: prev.ingredientes.filter((_, i) => i !== index)
      }));
    }
  };

  const adicionarInstrucao = () => {
    setNovaReceitaForm(prev => ({
      ...prev,
      instrucoes: [...prev.instrucoes, '']
    }));
  };

  const removerInstrucao = (index) => {
    if (novaReceitaForm.instrucoes.length > 1) {
      setNovaReceitaForm(prev => ({
        ...prev,
        instrucoes: prev.instrucoes.filter((_, i) => i !== index)
      }));
    }
  };

  const salvarNovaReceita = () => {
    const novaReceita = {
      id: Date.now(),
      ...novaReceitaForm,
      dataCriacao: new Date().toISOString().split('T')[0],
      ingredientes: novaReceitaForm.ingredientes.filter(ing => ing.nome.trim() !== ''),
      instrucoes: novaReceitaForm.instrucoes.filter(inst => inst.trim() !== '')
    };
    
    adicionarReceita(novaReceita);
    setModalAberto(false);
  };

  const receitasFiltradas = useMemo(() => {
    if (!filtro.trim()) return receitas;
    const termo = filtro.toLowerCase();
    return receitas.filter(r => 
      r.nome.toLowerCase().includes(termo) ||
      r.descricao.toLowerCase().includes(termo) ||
      r.criadoPor.toLowerCase().includes(termo) ||
      r.ingredientes.some(ing => ing.nome.toLowerCase().includes(termo))
    );
  }, [receitas, filtro]);

  const estatisticas = useMemo(() => ({
    total: receitas.length,
    totalIngredientes: receitas.reduce((total, r) => total + r.ingredientes.length, 0),
    tempoMedio: receitas.reduce((total, r) => {
      const minutos = parseInt(r.tempoPreparo) || 0;
      return total + minutos;
    }, 0) / receitas.length || 0
  }), [receitas]);

  return (
    <div className={`h-screen smooth-transition ${dark ? 'dark bg-gray-900 text-gray-100' : 'bg-gradient-to-br from-gray-50 to-gray-100 text-gray-900'}`}>
      <div className="flex h-full">
        {/* Sidebar (IGUAL AO INDEX.JS) */}
        <aside className={`flex flex-col smooth-transition ${sidebarOpen ? 'w-64' : 'w-16'} ${dark ? 'bg-gray-800 border-gray-700' : 'bg-white shadow-lg'} border-r`}>
          <div className="p-4 flex items-center justify-between border-b dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="rounded-lg w-10 h-10 flex items-center justify-center font-bold bg-gradient-to-br from-green-400 to-green-600 text-white shadow-lg">
                DV
              </div>
              {sidebarOpen && (
                <div className="animate-fade-in">
                  <div className="text-lg font-semibold">Diviníssimo</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Receitas - Pão de Queijo</div>
                </div>
              )}
            </div>
            <button 
              className={`p-2 rounded-lg smooth-transition ${dark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              onClick={() => setSidebarOpen(s => !s)}
            >
              {sidebarOpen ? '⟨' : '⟩'}
            </button>
          </div>
          
          <nav className="flex-1 px-2 py-4 space-y-1">
            {['Dashboard', 'Coleta', 'Ordens', 'Qualidade', 'Relatórios', 'Receitas'].map((item, idx) => (
              <button 
                key={item} 
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg smooth-transition ${
                  item === 'Receitas' 
                    ? (dark ? 'bg-gray-700 text-green-400' : 'bg-green-50 text-green-600') 
                    : (dark ? 'hover:bg-gray-700' : 'hover:bg-gray-100')
                }`}
                onClick={() => {
                  if (item === 'Dashboard') window.location.href = 'index.html';
                  if (item === 'Coleta') window.location.href = 'coleta.html';
                  if (item === 'Ordens') window.location.href = 'ordem.html';
                  if (item === 'Qualidade') window.location.href = 'qualidade.html';
                  if (item === 'Relatórios') window.location.href = 'relatorios.html';
                  if (item === 'Receitas') window.location.href = 'receitas.html';
                }}
              >
                <span className="w-8 text-center text-xl">
                  {['🏠', '📋', '📦', '🔬', '📈', '🧑‍🍳'][idx]}
                </span>
                {sidebarOpen && <span className="truncate">{item}</span>}
              </button>
            ))}
          </nav>

          <div className="p-4 border-t dark:border-gray-700">
            {sidebarOpen && (
              <>
                <div className="mt-4 flex items-center justify-between text-xs">
                  <div className="text-gray-500 dark:text-gray-400">Modo</div>
                  {/* BOTÃO DE ALTERAR TEMA EXATAMENTE IGUAL AO INDEX.JS */}
                  <button 
                    className={`px-3 py-1.5 rounded-lg border smooth-transition ${dark ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-50'}`}
                    onClick={toggleDark}
                  >
                    {dark ? '☀️ Light' : '🌙 Dark'}
                  </button>
                </div>
              </>
            )}
          </div>
        </aside>

        {/* Conteúdo Principal */}
        <main className="flex-1 p-6 overflow-auto">
          <header className="flex items-center justify-between mb-6 animate-fade-in">
            <div className="flex items-center gap-4">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent">
                📚 Banco de Receitas
              </h1>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {receitas.length} receitas cadastradas
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Status Online/Offline (IGUAL AO INDEX.JS) */}
              <div className={`flex items-center text-sm px-4 py-2 rounded-full smooth-transition ${isOnline ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                <span className={`status-dot ${isOnline ? 'online' : 'offline'}`}></span>
                {isOnline ? 'Online' : 'Offline'}
              </div>
              
              <button 
                className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg shadow-md hover:shadow-lg smooth-transition hover:scale-105 flex items-center gap-2"
                onClick={() => setModalAberto(true)}
              >
                <span className="text-xl">+</span> Nova Receita
              </button>
            </div>
          </header>

          {/* Estatísticas */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className={`p-5 rounded-xl shadow-md card-hover animate-fade-in ${dark ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}>
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Total de Receitas</div>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">{estatisticas.total}</div>
              <div className="text-xs text-gray-400 mt-2">2 predefinidas + {Math.max(0, estatisticas.total - 2)} customizadas</div>
            </div>

            <div className={`p-5 rounded-xl shadow-md card-hover animate-fade-in ${dark ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}>
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Ingredientes Únicos</div>
              <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">{estatisticas.totalIngredientes}</div>
              <div className="text-xs text-gray-400 mt-2">Total em todas as receitas</div>
            </div>

            <div className={`p-5 rounded-xl shadow-md card-hover animate-fade-in ${dark ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}>
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Tempo Médio</div>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {Math.round(estatisticas.tempoMedio)} min
              </div>
              <div className="text-xs text-gray-400 mt-2">Por preparação</div>
            </div>
          </section>

          {/* Filtro e Busca */}
          <section className={`mb-6 p-4 rounded-xl ${dark ? 'bg-gray-800 border border-gray-700' : 'bg-white shadow-md'}`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold mb-1">Buscar Receitas</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Filtre por nome, ingrediente ou criador
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="relative flex-1 md:w-64">
                  <input
                    type="text"
                    placeholder="🔍 Buscar receita..."
                    className={`w-full p-2 pl-10 rounded-lg border smooth-transition ${
                      dark ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300'
                    }`}
                    value={filtro}
                    onChange={(e) => setFiltro(e.target.value)}
                  />
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    🔍
                  </span>
                </div>
                
                <button
                  onClick={() => setFiltro('')}
                  className="px-4 py-2 rounded-lg border hover:bg-gray-100 dark:hover:bg-gray-700 smooth-transition"
                >
                  Limpar
                </button>
              </div>
            </div>
          </section>

          {/* Lista de Receitas */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                📋 Todas as Receitas
                <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                  ({receitasFiltradas.length} {receitasFiltradas.length === 1 ? 'encontrada' : 'encontradas'})
                </span>
              </h2>
              
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Ordenar por: 
                <select 
                  className="ml-2 p-1 rounded border dark:bg-gray-700 dark:border-gray-600"
                  onChange={(e) => {
                    const ordem = e.target.value;
                    setReceitas(prev => [...prev].sort((a, b) => {
                      if (ordem === 'nome') return a.nome.localeCompare(b.nome);
                      if (ordem === 'data') return new Date(b.dataCriacao) - new Date(a.dataCriacao);
                      if (ordem === 'tempo') {
                        const tempoA = parseInt(a.tempoPreparo) || 0;
                        const tempoB = parseInt(b.tempoPreparo) || 0;
                        return tempoA - tempoB;
                      }
                      return 0;
                    }));
                  }}
                >
                  <option value="nome">Nome (A-Z)</option>
                  <option value="data">Data (mais recente)</option>
                  <option value="tempo">Tempo (menor)</option>
                </select>
              </div>
            </div>

            {receitasFiltradas.length === 0 ? (
              <div className={`p-8 text-center rounded-xl ${dark ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
                <div className="text-5xl mb-4">📝</div>
                <h3 className="text-xl font-semibold mb-2">Nenhuma receita encontrada</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  {filtro ? 'Tente ajustar sua busca' : 'Adicione sua primeira receita!'}
                </p>
                <button
                  onClick={() => {
                    setFiltro('');
                    setModalAberto(true);
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg shadow-md hover:shadow-lg"
                >
                  + Criar Primeira Receita
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {receitasFiltradas.map(receita => (
                  <CardReceita
                    key={receita.id}
                    receita={receita}
                    onEdit={editarReceita}
                    onDelete={excluirReceita}
                    onExport={exportarReceita}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Dicas */}
          {receitas.length > 0 && (
            <section className={`mt-8 p-4 rounded-xl ${dark ? 'bg-blue-900/20 border border-blue-700' : 'bg-blue-50 border border-blue-200'}`}>
              <div className="flex items-start gap-3">
                <div className="text-2xl">💡</div>
                <div>
                  <h4 className="font-semibold mb-1">Dicas de Uso</h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                    <li>• Clique em <strong>Expandir</strong> para ver detalhes completos da receita</li>
                    <li>• Use o <strong>botão de exportar</strong> para salvar receitas em formato texto</li>
                    <li>• Você pode editar ingredientes diretamente na lista expandida</li>
                    <li>• As receitas são automaticamente salvas no navegador</li>
                    <li>• O tema (claro/escuro) é sincronizado com outras páginas do sistema</li>
                  </ul>
                </div>
              </div>
            </section>
          )}
        </main>
      </div>

      {/* Modal de Nova Receita */}
      <Modal isOpen={modalAberto} onClose={() => setModalAberto(false)} title="➕ Nova Receita">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nome da Receita *</label>
              <input
                type="text"
                className={`w-full p-2 rounded-lg border ${dark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                value={novaReceitaForm.nome}
                onChange={(e) => setNovaReceitaForm(prev => ({ ...prev, nome: e.target.value }))}
                placeholder="Ex: Pão de Queijo Especial"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Criado por</label>
              <input
                type="text"
                className={`w-full p-2 rounded-lg border ${dark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                value={novaReceitaForm.criadoPor}
                onChange={(e) => setNovaReceitaForm(prev => ({ ...prev, criadoPor: e.target.value }))}
                placeholder="Seu nome"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Descrição</label>
            <textarea
              className={`w-full p-2 rounded-lg border ${dark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
              rows="2"
              value={novaReceitaForm.descricao}
              onChange={(e) => setNovaReceitaForm(prev => ({ ...prev, descricao: e.target.value }))}
              placeholder="Descreva esta receita..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Tempo de Preparo</label>
              <input
                type="text"
                className={`w-full p-2 rounded-lg border ${dark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                value={novaReceitaForm.tempoPreparo}
                onChange={(e) => setNovaReceitaForm(prev => ({ ...prev, tempoPreparo: e.target.value }))}
                placeholder="Ex: 45 minutos"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Rendimento</label>
              <input
                type="text"
                className={`w-full p-2 rounded-lg border ${dark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                value={novaReceitaForm.rendimento}
                onChange={(e) => setNovaReceitaForm(prev => ({ ...prev, rendimento: e.target.value }))}
                placeholder="Ex: 50 unidades"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="block text-sm font-medium">Ingredientes *</label>
              <button
                type="button"
                onClick={adicionarIngrediente}
                className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
              >
                + Adicionar
              </button>
            </div>
            
            <div className={`space-y-3 max-h-60 overflow-y-auto p-2 border rounded-lg ${dark ? 'border-gray-700' : 'border-gray-300'}`}>
              {novaReceitaForm.ingredientes.map((ing, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-5">
                    <input
                      type="text"
                      className={`w-full p-2 rounded border text-sm ${dark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                      value={ing.nome}
                      onChange={(e) => {
                        const novosIngredientes = [...novaReceitaForm.ingredientes];
                        novosIngredientes[index].nome = e.target.value;
                        setNovaReceitaForm(prev => ({ ...prev, ingredientes: novosIngredientes }));
                      }}
                      placeholder="Nome do ingrediente"
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      type="number"
                      className={`w-full p-2 rounded border text-sm ${dark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                      value={ing.quantidade}
                      onChange={(e) => {
                        const novosIngredientes = [...novaReceitaForm.ingredientes];
                        novosIngredientes[index].quantidade = e.target.value;
                        setNovaReceitaForm(prev => ({ ...prev, ingredientes: novosIngredientes }));
                      }}
                      placeholder="Quantidade"
                    />
                  </div>
                  <div className="col-span-3">
                    <select
                      className={`w-full p-2 rounded border text-sm ${dark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                      value={ing.unidade}
                      onChange={(e) => {
                        const novosIngredientes = [...novaReceitaForm.ingredientes];
                        novosIngredientes[index].unidade = e.target.value;
                        setNovaReceitaForm(prev => ({ ...prev, ingredientes: novosIngredientes }));
                      }}
                    >
                      <option value="g">g (gramas)</option>
                      <option value="kg">kg (quilogramas)</option>
                      <option value="ml">ml (mililitros)</option>
                      <option value="L">L (litros)</option>
                      <option value="unidades">unidades</option>
                      <option value="colheres">colheres</option>
                      <option value="xícaras">xícaras</option>
                    </select>
                  </div>
                  <div className="col-span-1">
                    {novaReceitaForm.ingredientes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removerIngrediente(index)}
                        className="p-2 text-red-500 hover:text-red-700"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="block text-sm font-medium">Instruções de Preparo</label>
              <button
                type="button"
                onClick={adicionarInstrucao}
                className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
              >
                + Adicionar
              </button>
            </div>
            
            <div className={`space-y-2 max-h-60 overflow-y-auto p-2 border rounded-lg ${dark ? 'border-gray-700' : 'border-gray-300'}`}>
              {novaReceitaForm.instrucoes.map((inst, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <span className="mt-2 text-sm font-medium text-gray-500">{index + 1}.</span>
                  <textarea
                    className={`flex-1 p-2 rounded border text-sm ${dark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                    rows="2"
                    value={inst}
                    onChange={(e) => {
                      const novasInstrucoes = [...novaReceitaForm.instrucoes];
                      novasInstrucoes[index] = e.target.value;
                      setNovaReceitaForm(prev => ({ ...prev, instrucoes: novasInstrucoes }));
                    }}
                    placeholder="Descreva o passo..."
                  />
                  {novaReceitaForm.instrucoes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removerInstrucao(index)}
                      className="mt-2 p-2 text-red-500 hover:text-red-700"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="p-6 border-t dark:border-gray-700 flex justify-end gap-3">
          <button
            onClick={() => setModalAberto(false)}
            className="px-4 py-2 rounded-lg border hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Cancelar
          </button>
          <button
            onClick={salvarNovaReceita}
            className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg shadow-md hover:shadow-lg"
            disabled={!novaReceitaForm.nome.trim()}
          >
            Salvar Receita
          </button>
        </div>
      </Modal>
    </div>
  );
}

ReactDOM.render(<AppReceitas />, document.getElementById('root'));