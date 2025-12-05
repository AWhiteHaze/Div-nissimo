const { useState, useEffect, useMemo, useCallback } = React;

// Função de exportação melhorada
function exportToCSV(filename, rows) {
  if (!rows || rows.length === 0) return alert('Nada para exportar');
  
  const csv = [
    Object.keys(rows[0]).join(";"), 
    ...rows.map(r => Object.values(r).map(value => 
      value === null || value === undefined ? '' : String(value)
    ).join(";"))
  ].join("\n");
  
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

// Componente Modal
const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 animate-fade-in" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-auto animate-slide-in" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-2xl font-bold">{title}</h2>
          <button onClick={onClose} className="text-2xl hover:text-red-500 transition-colors">&times;</button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

// Aplicação principal
function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedLine, setSelectedLine] = useState("Linha Pão de Queijo");
  const [dark, setDark] = useState(false);
  const [dbReady, setDbReady] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // Filtros
  const [dateStart, setDateStart] = useState("2025-10-01");
  const [dateEnd, setDateEnd] = useState("2025-10-06");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [searchTerm, setSearchTerm] = useState("");

  // Dados de coletas combinados
  
  const [coletas, setColetas] = useState([
    { id: 1024, status: 'Concluída', datetime: '06/10/2025 16:53', produced: 63, material: 49.86, efficiency: 3.0, applicant: 'João Silva', observations: '' },
    { id: 1023, status: 'Concluída', datetime: '06/10/2025 14:20', produced: 58, material: 46.20, efficiency: 2.8, applicant: 'Maria Santos', observations: '' },
    { id: 1022, status: 'Processando', datetime: '06/10/2025 11:45', produced: 42, material: 33.60, efficiency: 2.5, applicant: 'Pedro Costa', observations: '' },
    { id: 1021, status: 'Concluída', datetime: '05/10/2025 18:30', produced: 71, material: 56.80, efficiency: 3.2, applicant: 'Ana Lima', observations: '' },
    { id: 1020, status: 'Concluída', datetime: '05/10/2025 15:10', produced: 65, material: 52.00, efficiency: 3.1, applicant: 'Carlos Souza', observations: '' },
    { id: 1019, status: 'Concluída', datetime: '05/10/2025 12:00', produced: 54, material: 43.20, efficiency: 2.9, applicant: 'Juliana Alves', observations: '' },
    { id: 1018, status: 'Concluída', datetime: '04/10/2025 17:45', produced: 68, material: 54.40, efficiency: 3.0, applicant: 'Roberto Dias', observations: '' },
    { id: 1017, status: 'Concluída', datetime: '04/10/2025 14:30', produced: 59, material: 47.20, efficiency: 2.7, applicant: 'Fernanda Rocha', observations: '' },
  ]);

  const [showNewModal, setShowNewModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(null);
  const [newColeta, setNewColeta] = useState({
    datetime: new Date().toISOString().slice(0, 16),
    produced: '',
    material: '',
    observations: '',
    applicant: ''
  });

  // Inicializar banco de dados e tema
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
        const line = await window.db.getConfig('selectedLine');
        const sidebar = await window.db.getConfig('sidebarOpen');
        
        if (darkMode !== null) setDark(darkMode);
        if (line !== null) setSelectedLine(line);
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
        setDbReady(true); // Continua mesmo com erro
      }
    };
    
    initDB();
  }, []);

  // Salvar configurações quando mudarem
  useEffect(() => {
    if (dbReady && window.db) {
      window.db.setConfig('dark', dark);
    }
  }, [dark, dbReady]);

  useEffect(() => {
    if (dbReady && window.db) {
      window.db.setConfig('selectedLine', selectedLine);
    }
  }, [selectedLine, dbReady]);

  useEffect(() => {
    if (dbReady && window.db) {
      window.db.setConfig('sidebarOpen', sidebarOpen);
    }
  }, [sidebarOpen, dbReady]);

  // Aplicar tema no HTML
  useEffect(() => {
    const html = document.documentElement;
    if (dark) {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  }, [dark]);

  // Função para alternar tema
  const toggleDark = () => {
    setDark(prev => !prev);
  };

  // Monitorar status online/offline
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

  // Filtro com tratamento de datas
  const filteredColetas = useMemo(() => {
    return coletas.filter(c => {
      if (statusFilter !== "Todos" && c.status !== statusFilter) return false;
      
      if (searchTerm && !c.id.toString().includes(searchTerm)) return false;
      
      try {
        const coletaDate = new Date(c.datetime.split(' ')[0].split('/').reverse().join('-'));
        const startDate = new Date(dateStart);
        const endDate = new Date(dateEnd);
        
        if (coletaDate < startDate || coletaDate > endDate) return false;
      } catch (error) {
        console.error('Erro ao processar data:', error);
        return true;
      }
      
      return true;
    });
  }, [coletas, statusFilter, searchTerm, dateStart, dateEnd]);

  const totalProduced = useMemo(() => 
    filteredColetas.reduce((sum, c) => sum + c.produced, 0),
    [filteredColetas]
  );

  const avgEfficiency = useMemo(() => {
    if (filteredColetas.length === 0) return 0;
    const sum = filteredColetas.reduce((sum, c) => sum + c.efficiency, 0);
    return (sum / filteredColetas.length).toFixed(1);
  }, [filteredColetas]);

  // Função para salvar coleta com validações
  const handleSaveColeta = useCallback(() => {
    const produced = parseFloat(newColeta.produced);
    const material = parseFloat(newColeta.material);
    
    if (isNaN(produced) || produced <= 0) {
      alert('Produzido deve ser um número maior que zero');
      return;
    }
    
    if (isNaN(material) || material <= 0) {
      alert('Matéria-prima deve ser um número maior que zero');
      return;
    }
    
    if (material > produced) {
      alert('Matéria-prima não pode ser maior que o produzido');
      return;
    }

    const efficiency = ((produced / material) * 100).toFixed(1);
    const temp = 85 + Math.random() * 6;
    
    
    const newId = coletas.length > 0 ? Math.max(...coletas.map(c => c.id)) + 1 : 1;
    
    const novaColeta = {
      id: newId,
      status: 'Concluída',
      datetime: new Date(newColeta.datetime).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      produced,
      material,
      applicant: newColeta.applicant || 'Não informado',
      efficiency: parseFloat(efficiency),
      observations: newColeta.observations || ''
    };

    setColetas(prev => [novaColeta, ...prev]);
    setShowNewModal(false);
    setNewColeta({
      datetime: new Date().toISOString().slice(0, 16),
      produced: '',
      material: '',
      observations: '',
      Solicitante: ""
    });
    alert('Coleta registrada com sucesso!');
  }, [newColeta, coletas]);

  // Função de exportação individual
  const handleExport = (coleta) => {
    const data = {
      ID: coleta.id,
      DataHora: coleta.datetime,
      Produzido: coleta.produced,
      MateriaPrima: coleta.material,
      Solicitante: coleta.applicant,
      Eficiencia: coleta.efficiency,
      Status: coleta.status,
      Observacoes: coleta.observations || ''
    };
    exportToCSV(`coleta_${coleta.id}.csv`, [data]);
  };

  // Função de exportação simples (do primeiro código)
  const handleExportSimple = (coleta) => {
    const csv = `ID;Data/Hora;Produzido;Materia-prima;Eficiencia\n${coleta.id};${coleta.datetime};${coleta.produced};${coleta.material};${coleta.efficiency}`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `coleta_${coleta.id}.csv`;
    link.click();
  };

  const navigationItems = [
    { name: 'Dashboard', icon: '🏠', url: 'index.html' },
    { name: 'Coleta', icon: '📋', url: 'coleta.html' },
    { name: 'Ordens', icon: '📦', url: 'ordem.html' },
    { name: 'Qualidade', icon: '🔬', url: 'qualidade.html' },
    { name: 'Relatórios', icon: '📈', url: 'relatorios.html' },
    { name: 'Receitas', icon: '🧑‍🍳', url: 'Receitas.html' }
  ];

  return (
    <div className={`h-screen flex flex-col smooth-transition ${dark ? 'dark bg-gray-900 text-gray-100' : 'bg-gradient-to-br from-gray-50 to-gray-100 text-gray-900'}`}>
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className={`flex flex-col smooth-transition ${sidebarOpen ? 'w-64' : 'w-16'} ${dark ? 'bg-gray-800 border-gray-700' : 'bg-white shadow-lg'} border-r`}>
          <div className="p-4 flex items-center justify-between border-b dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="rounded-lg w-10 h-10 flex items-center justify-center font-bold bg-gradient-to-br from-green-400 to-green-600 text-white shadow-lg">
                DV
              </div>
              {sidebarOpen && (
                <div className="animate-fade-in">
                  <div className="text-lg font-semibold">Diviníssimo</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Coleta - Pão de Queijo</div>
                </div>
              )}
            </div>
            <button 
              className="p-2 rounded-lg smooth-transition hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => setSidebarOpen(s => !s)}
              aria-label={sidebarOpen ? "Recolher sidebar" : "Expandir sidebar"}
            >
              {sidebarOpen ? '⟨' : '⟩'}
            </button>
          </div>

          <nav className="flex-1 px-2 py-4 space-y-1">
            {navigationItems.map((item, idx) => (
              <button 
                key={item.name} 
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg smooth-transition ${
                  item.name === 'Coleta' 
                    ? (dark ? 'bg-gray-700 text-green-400' : 'bg-green-50 text-green-600') 
                    : (dark ? 'hover:bg-gray-700' : 'hover:bg-gray-100')
                }`}
                onClick={() => {
                  if (item.url) window.location.href = item.url;
                }}
              >
                <span className="w-8 text-center text-xl">{item.icon}</span>
                {sidebarOpen && <span className="truncate">{item.name}</span>}
              </button>
            ))}
          </nav>

          <div className="p-4 border-t dark:border-gray-700">
            {sidebarOpen && (
              <>
               
                <div className="mt-4 flex items-center justify-between text-xs">
                  <div className="text-gray-500 dark:text-gray-400">Modo</div>
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

        {/* Conteúdo principal */}
        <main className="flex-1 p-6 overflow-auto">
          <header className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4 animate-fade-in">
            <div className="flex items-center gap-4">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent">
                Coletas
              </h1>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {selectedLine}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className={`flex items-center text-sm px-4 py-2 rounded-full smooth-transition ${isOnline ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                <span className={`w-2 h-2 rounded-full mr-2 ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                {isOnline ? 'Online' : 'Offline'}
              </div>
              <button 
                className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg shadow-md hover:shadow-lg smooth-transition hover:scale-105"
                onClick={() => setShowNewModal(true)}
              >
                + Nova Coleta
              </button>
            </div>
          </header>

          {/* Cards de resumo */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className={`p-5 rounded-xl shadow-md card-hover animate-fade-in ${dark ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}>
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Total de Coletas</div>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">{filteredColetas.length}</div>
              <div className="text-xs text-gray-400 mt-2">Período selecionado</div>
            </div>

            <div className={`p-5 rounded-xl shadow-md card-hover animate-fade-in ${dark ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}>
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Total Produzido</div>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{totalProduced} kg</div>
              <div className="text-xs text-gray-400 mt-2">Soma das coletas</div>
            </div>

            <div className={`p-5 rounded-xl shadow-md card-hover animate-fade-in ${dark ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}>
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Eficiência Média</div>
              <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">{avgEfficiency}%</div>
              <div className="text-xs text-gray-400 mt-2">Taxa de conversão</div>
            </div>

            <div className={`p-5 rounded-xl shadow-md card-hover animate-fade-in ${dark ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}>
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Concluídas</div>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {filteredColetas.filter(c => c.status === 'Concluída').length}
              </div>
              <div className="text-xs text-gray-400 mt-2">Coletas finalizadas</div>
            </div>
          </section>

          {/* Filtros */}
          <section className={`p-5 rounded-xl shadow-md mb-6 animate-fade-in ${dark ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}>
            <h3 className="font-semibold mb-4 text-lg">Filtros</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Data Início</label>
                <input 
                  type="date" 
                  value={dateStart}
                  onChange={(e) => setDateStart(e.target.value)}
                  className={`w-full p-2 rounded-lg border smooth-transition ${dark ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300'}`}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Data Fim</label>
                <input 
                  type="date" 
                  value={dateEnd}
                  onChange={(e) => setDateEnd(e.target.value)}
                  className={`w-full p-2 rounded-lg border smooth-transition ${dark ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300'}`}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Status</label>
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className={`w-full p-2 rounded-lg border smooth-transition ${dark ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300'}`}
                >
                  <option>Todos</option>
                  <option>Concluída</option>
                  <option>Processando</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Buscar ID</label>
                <input 
                  type="text" 
                  placeholder="Ex: 1024"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full p-2 rounded-lg border smooth-transition ${dark ? 'bg-gray-700 border-gray-600 placeholder-gray-500' : 'bg-white border-gray-300 placeholder-gray-400'}`}
                />
              </div>
            </div>
          </section>

          {/* Cartões das coletas */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredColetas.map((coleta, idx) => (
              <div 
                key={coleta.id}
                className={`p-5 rounded-xl shadow-md card-hover animate-slide-in ${dark ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}
                style={{ animationDelay: `${idx * 0.05}s` }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="text-lg font-semibold">Coleta #{coleta.id}</div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium smooth-transition ${
                    coleta.status === 'Concluída' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
                  }`}>
                    {coleta.status}
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Data/Hora:</span>
                    <span className="font-medium">{coleta.datetime}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Produzido:</span>
                    <span className="font-medium text-blue-600 dark:text-blue-400">{coleta.produced} kg</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Matéria-prima:</span>
                    <span className="font-medium">{coleta.material} kg</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Eficiência:</span>
                    <span className="font-medium text-green-600 dark:text-green-400">{coleta.efficiency}%</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Solicitante: </span>
                    <span className="font-semibold text-green-600 dark:text-green-400">{coleta.applicant}</span>
                  </div>
                   
                </div>

                <div className="flex gap-2 pt-4 border-t dark:border-gray-700">
                  <button 
                    className={`flex-1 py-2 rounded-lg border smooth-transition ${dark ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-50'}`}
                    onClick={() => setShowDetailsModal(coleta)}
                  >
                    Ver Detalhes
                  </button>
                  <button 
                    className="flex-1 py-2 rounded-lg bg-gradient-to-r from-green-600 to-green-500 text-white hover:shadow-lg hover:scale-105 smooth-transition"
                    onClick={() => handleExport(coleta)}
                  >
                    Exportar
                  </button>
                </div>
              </div>
            ))}
          </section>

          {/* Estado vazio */}
          {filteredColetas.length === 0 && (
            <div className={`p-12 rounded-xl text-center ${dark ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}>
              <div className="text-6xl mb-4">📋</div>
              <div className="text-xl font-semibold mb-2">Nenhuma coleta encontrada</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Ajuste os filtros para ver mais resultados</div>
            </div>
          )}

          {/* Rodapé */}
          <footer className={`mt-8 pt-6 border-t text-sm ${dark ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-500'}`}>
            <div className="flex justify-between items-center">
              <div>Protótipo v4 • Sistema de Coleta de Dados</div>
              <div className="text-xs">
                Última sincronização: {new Date().toLocaleString('pt-BR')}
              </div>
            </div>
          </footer>
        </main>
      </div>

      {/* Modal Nova Coleta */}
      <Modal isOpen={showNewModal} onClose={() => setShowNewModal(false)} title="Nova Coleta">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Data/Hora *</label>
            <input
              type="datetime-local"
              value={newColeta.datetime}
              onChange={(e) => setNewColeta({...newColeta, datetime: e.target.value})}
              className={`w-full p-2 rounded-lg border smooth-transition ${dark ? 'bg-gray-700 border-gray-600' : 'border-gray-300'}`}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Produzido (kg) *</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={newColeta.produced}
              onChange={(e) => setNewColeta({...newColeta, produced: e.target.value})}
              className={`w-full p-2 rounded-lg border smooth-transition ${dark ? 'bg-gray-700 border-gray-600' : 'border-gray-300'}`}
              placeholder="Ex: 50.5"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Matéria-prima (kg) *</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={newColeta.material}
              onChange={(e) => setNewColeta({...newColeta, material: e.target.value})}
              className={`w-full p-2 rounded-lg border smooth-transition ${dark ? 'bg-gray-700 border-gray-600' : 'border-gray-300'}`}
              placeholder="Ex: 40.2"
              required
            />
          </div>   
          <div>
            <label className="block text-sm font-medium mb-2">Solicitante</label>
            <textarea
              rows={1}
              value={newColeta.applicant}
              onChange={(e) => setNewColeta({...newColeta, applicant: e.target.value})}
              className={`w-full p-2 rounded-lg border smooth-transition ${dark ? 'bg-gray-700 border-gray-600' : 'border-gray-300'}`}
              placeholder="Nome do solicitante"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Observações</label>
            <textarea
              rows={3}
              value={newColeta.observations}
              onChange={(e) => setNewColeta({...newColeta, observations: e.target.value})}
              className={`w-full p-2 rounded-lg border smooth-transition ${dark ? 'bg-gray-700 border-gray-600' : 'border-gray-300'}`}
              placeholder="Observações opcionais..."
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              onClick={() => setShowNewModal(false)}
              className={`flex-1 py-2 rounded-lg border smooth-transition ${dark ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-50'}`}
            >
              Cancelar
            </button>
            <button
              onClick={handleSaveColeta}
              className="flex-1 py-2 rounded-lg bg-gradient-to-r from-green-600 to-green-500 text-white hover:shadow-lg smooth-transition"
            >
              Salvar Coleta
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Detalhes */}
      <Modal isOpen={!!showDetailsModal} onClose={() => setShowDetailsModal(null)} title={`Detalhes - Coleta #${showDetailsModal?.id}`}>
        {showDetailsModal && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Status</div>
                <div className="font-semibold">{showDetailsModal.status}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Data/Hora</div>
                <div className="font-semibold">{showDetailsModal.datetime}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Produzido</div>
                <div className="font-semibold text-blue-600 dark:text-blue-400">{showDetailsModal.produced} kg</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Matéria-prima</div>
                <div className="font-semibold">{showDetailsModal.material} kg</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Eficiência</div>
                <div className="font-semibold text-green-600 dark:text-green-400">{showDetailsModal.efficiency}%</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Solicitante</div>
                <div className="font-semibold text-green-600 dark:text-green-400">{showDetailsModal.applicant}</div>
              </div>
              
            </div>
            {showDetailsModal.observations && (
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Observações</div>
                <div className={`p-3 rounded-lg smooth-transition ${dark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  {showDetailsModal.observations}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

// Renderizar na página
const container = document.getElementById('root');
if (container) {
  if (ReactDOM.createRoot) {
    const root = ReactDOM.createRoot(container);
    root.render(<App />);
  } else {
    ReactDOM.render(<App />, container);
  }
} else {
  console.warn('Elemento #root não encontrado. Crie <div id="root"></div> no HTML.');
}