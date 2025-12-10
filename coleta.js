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

// Componente para status
const StatusBadge = ({ status }) => {
  const getStatusColor = (status) => {
    switch(status) {
      case 'Concluída': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Processando': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'Pendente': return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
      case 'Cancelada': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };
  
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium smooth-transition ${getStatusColor(status)}`}>
      {status}
    </span>
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
  const [dateStart, setDateStart] = useState(() => {
    const today = new Date();
    today.setDate(today.getDate() - 7); // Últimos 7 dias por padrão
    return today.toISOString().split('T')[0];
  });
  const [dateEnd, setDateEnd] = useState(() => new Date().toISOString().split('T')[0]);
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [searchTerm, setSearchTerm] = useState("");

  // Dados de coletas - agora carregados do banco
  const [coletas, setColetas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [showNewModal, setShowNewModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(null);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [newColeta, setNewColeta] = useState({
    datetime: new Date().toISOString().slice(0, 16),
    produced: '',
    material: '',
    observations: '',
    applicant: '',
    status: 'Concluída'
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
        
        // Carregar coletas do banco de dados
        await loadColetas();
        
        setDbReady(true);
        
        // Cleanup
        return () => unsubscribe();
      } catch (error) {
        console.error('Erro ao inicializar banco de dados:', error);
        setDbReady(true);
      }
    };
    
    initDB();
  }, []);

  // Carregar coletas do banco de dados
  const loadColetas = useCallback(async () => {
    try {
      setIsLoading(true);
      if (window.db) {
        const coletasFromDB = await window.db.getColetas();
        // Ordenar por ID decrescente (mais recentes primeiro)
        coletasFromDB.sort((a, b) => b.id - a.id);
        setColetas(coletasFromDB);
        
        // Notificar dashboard sobre atualização
        if (window.db.emitDataChange) {
          window.db.emitDataChange('coletaUpdated', { count: coletasFromDB.length });
        }
      } else {
        // Dados de exemplo se o banco não estiver disponível
        const exemploColetas = [
          { id: 1024, status: 'Concluída', datetime: '06/10/2025 16:53', produced: 63, material: 49.86, efficiency: 3.0, applicant: 'João Silva', observations: '' },
          { id: 1023, status: 'Concluída', datetime: '06/10/2025 14:20', produced: 58, material: 46.20, efficiency: 2.8, applicant: 'Maria Santos', observations: '' },
          { id: 1022, status: 'Processando', datetime: '06/10/2025 11:45', produced: 42, material: 33.60, efficiency: 2.5, applicant: 'Pedro Costa', observations: '' },
        ];
        setColetas(exemploColetas);
      }
    } catch (error) {
      console.error('Erro ao carregar coletas:', error);
    } finally {
      setIsLoading(false);
    }
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

  // Estatísticas
  const stats = useMemo(() => {
    const total = filteredColetas.length;
    const totalProduced = filteredColetas.reduce((sum, c) => sum + (c.produced || 0), 0);
    const totalMaterial = filteredColetas.reduce((sum, c) => sum + (c.material || 0), 0);
    const avgEfficiency = total > 0 
      ? (filteredColetas.reduce((sum, c) => sum + (c.efficiency || 0), 0) / total).toFixed(1)
      : 0;
    
    // Estatísticas por status
    const statusCounts = {};
    filteredColetas.forEach(c => {
      statusCounts[c.status] = (statusCounts[c.status] || 0) + 1;
    });
    
    // Top solicitantes
    const applicantCounts = {};
    filteredColetas.forEach(c => {
      if (c.applicant) {
        applicantCounts[c.applicant] = (applicantCounts[c.applicant] || 0) + 1;
      }
    });
    const topApplicants = Object.entries(applicantCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, count]) => ({ name, count }));
    
    return {
      total,
      totalProduced,
      totalMaterial,
      avgEfficiency,
      statusCounts,
      topApplicants,
      efficiencyRange: total > 0 ? {
        min: Math.min(...filteredColetas.map(c => c.efficiency || 0)),
        max: Math.max(...filteredColetas.map(c => c.efficiency || 0)),
        avg: avgEfficiency
      } : { min: 0, max: 0, avg: 0 }
    };
  }, [filteredColetas]);

  // Função para salvar coleta com validações
  const handleSaveColeta = useCallback(async () => {
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
    
    // Gerar novo ID baseado no maior ID existente
    const newId = coletas.length > 0 ? Math.max(...coletas.map(c => c.id)) + 1 : 1;
    
    const novaColeta = {
      id: newId,
      status: newColeta.status || 'Concluída',
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

    try {
      // Salvar no banco de dados
      if (window.db) {
        await window.db.saveColeta(novaColeta);
        
        // Recarregar as coletas
        await loadColetas();
        
        // Notificar dashboard sobre nova coleta
        if (window.db.emitDataChange) {
          window.db.emitDataChange('coletaUpdated', novaColeta);
        }
      } else {
        // Fallback: salvar no estado local
        setColetas(prev => [novaColeta, ...prev]);
      }
      
      setShowNewModal(false);
      setNewColeta({
        datetime: new Date().toISOString().slice(0, 16),
        produced: '',
        material: '',
        observations: '',
        applicant: '',
        status: 'Concluída'
      });
      
      // Mostrar feedback visual
      const successAlert = document.createElement('div');
      successAlert.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg animate-fade-in z-50 ${
        dark ? 'bg-green-800 text-green-100' : 'bg-green-100 text-green-800'
      }`;
      successAlert.innerHTML = `
        <div class="flex items-center gap-3">
          <span class="text-2xl">✅</span>
          <div>
            <div class="font-semibold">Coleta registrada com sucesso!</div>
            <div class="text-sm">ID: ${newId} • Produzido: ${produced}kg</div>
          </div>
        </div>
      `;
      document.body.appendChild(successAlert);
      
      setTimeout(() => {
        successAlert.remove();
      }, 3000);
      
    } catch (error) {
      console.error('Erro ao salvar coleta:', error);
      alert('Erro ao salvar coleta. Verifique o console para mais detalhes.');
    }
  }, [newColeta, coletas, dark, loadColetas]);

  // Função para atualizar status da coleta
  const handleUpdateStatus = useCallback(async (coletaId, newStatus) => {
    try {
      const coletaIndex = coletas.findIndex(c => c.id === coletaId);
      if (coletaIndex === -1) return;
      
      const updatedColeta = { ...coletas[coletaIndex], status: newStatus };
      
      if (window.db) {
        await window.db.saveColeta(updatedColeta);
        await loadColetas();
        
        // Notificar dashboard sobre atualização
        if (window.db.emitDataChange) {
          window.db.emitDataChange('coletaUpdated', updatedColeta);
        }
      } else {
        // Fallback: atualizar no estado local
        setColetas(prev => prev.map(c => c.id === coletaId ? updatedColeta : c));
      }
      
      // Feedback visual
      alert(`Status da coleta #${coletaId} atualizado para: ${newStatus}`);
      
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      alert('Erro ao atualizar status da coleta.');
    }
  }, [coletas, loadColetas]);

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

  // Função de exportação em lote
  const handleExportBatch = useCallback(() => {
    if (filteredColetas.length === 0) {
      alert('Nenhuma coleta para exportar com os filtros atuais');
      return;
    }
    
    const data = filteredColetas.map(coleta => ({
      ID: coleta.id,
      DataHora: coleta.datetime,
      Produzido: coleta.produced,
      MateriaPrima: coleta.material,
      Solicitante: coleta.applicant,
      Eficiencia: coleta.efficiency,
      Status: coleta.status,
      Observacoes: coleta.observations || ''
    }));
    
    const dateRange = `${dateStart.replace(/-/g, '')}_${dateEnd.replace(/-/g, '')}`;
    exportToCSV(`coletas_${dateRange}.csv`, data);
    
    // Feedback visual
    alert(`Exportadas ${filteredColetas.length} coletas com sucesso!`);
  }, [filteredColetas, dateStart, dateEnd]);

  // Função para deletar coleta
  const handleDeleteColeta = useCallback(async (coletaId) => {
    if (!confirm(`Tem certeza que deseja excluir a coleta #${coletaId}? Esta ação não pode ser desfeita.`)) {
      return;
    }
    
    try {
      if (window.db) {
        await window.db.deleteColeta(coletaId);
        await loadColetas();
        
        // Notificar dashboard sobre exclusão
        if (window.db.emitDataChange) {
          window.db.emitDataChange('coletaUpdated', { deleted: coletaId });
        }
      } else {
        // Fallback: remover do estado local
        setColetas(prev => prev.filter(c => c.id !== coletaId));
      }
      
      // Feedback visual
      const deletedAlert = document.createElement('div');
      deletedAlert.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg animate-fade-in z-50 ${
        dark ? 'bg-red-800 text-red-100' : 'bg-red-100 text-red-800'
      }`;
      deletedAlert.innerHTML = `
        <div class="flex items-center gap-3">
          <span class="text-2xl">🗑️</span>
          <div>
            <div class="font-semibold">Coleta excluída</div>
            <div class="text-sm">ID: ${coletaId} foi removido</div>
          </div>
        </div>
      `;
      document.body.appendChild(deletedAlert);
      
      setTimeout(() => {
        deletedAlert.remove();
      }, 3000);
      
    } catch (error) {
      console.error('Erro ao excluir coleta:', error);
      alert('Erro ao excluir coleta. Verifique o console para mais detalhes.');
    }
  }, [dark, loadColetas]);

  // Botão de ações rápidas para cada coleta
  const QuickActions = ({ coleta }) => (
    <div className="flex gap-1">
      <button 
        onClick={() => handleUpdateStatus(coleta.id, 'Concluída')}
        className="p-1.5 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900 dark:text-green-300 dark:hover:bg-green-800 smooth-transition"
        title="Marcar como concluída"
      >
        ✓
      </button>
      <button 
        onClick={() => handleUpdateStatus(coleta.id, 'Processando')}
        className="p-1.5 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800 smooth-transition"
        title="Marcar como processando"
      >
        ⏳
      </button>
      <button 
        onClick={() => setShowDetailsModal(coleta)}
        className="p-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 smooth-transition"
        title="Ver detalhes"
      >
        👁️
      </button>
      <button 
        onClick={() => handleExport(coleta)}
        className="p-1.5 rounded-lg bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900 dark:text-amber-300 dark:hover:bg-amber-800 smooth-transition"
        title="Exportar"
      >
        📥
      </button>
      <button 
        onClick={() => handleDeleteColeta(coleta.id)}
        className="p-1.5 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-800 smooth-transition"
        title="Excluir"
      >
        🗑️
      </button>
    </div>
  );

  const navigationItems = [
    { name: 'Dashboard', icon: '🏠', url: 'index.html' },
    { name: 'Coleta', icon: '📋', url: 'coleta.html' },
    { name: 'Ordens', icon: '📦', url: 'ordem.html' },
    { name: 'Qualidade', icon: '🔬', url: 'qualidade.html' },
    { name: 'Fornecedores', icon: '🏭', url: 'fornecedores.html' },
    { name: 'Relatórios', icon: '📈', url: 'relatorios.html' },
    { name: 'Receitas', icon: '🧑‍🍳', url: 'receitas.html' }
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
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg shadow-md hover:shadow-lg smooth-transition hover:scale-105"
                onClick={() => setShowStatsModal(true)}
              >
                📊 Estatísticas
              </button>
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
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-gray-500 dark:text-gray-400">Total de Coletas</div>
                <span className="text-xl">📋</span>
              </div>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.total}</div>
              <div className="text-xs text-gray-400 mt-2">Período selecionado</div>
            </div>

            <div className={`p-5 rounded-xl shadow-md card-hover animate-fade-in ${dark ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-gray-500 dark:text-gray-400">Total Produzido</div>
                <span className="text-xl">⚖️</span>
              </div>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.totalProduced.toFixed(1)} kg</div>
              <div className="text-xs text-gray-400 mt-2">Soma das coletas</div>
            </div>

            <div className={`p-5 rounded-xl shadow-md card-hover animate-fade-in ${dark ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-gray-500 dark:text-gray-400">Eficiência Média</div>
                <span className="text-xl">📈</span>
              </div>
              <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">{stats.avgEfficiency}%</div>
              <div className="text-xs text-gray-400 mt-2">Taxa de conversão</div>
            </div>

            <div className={`p-5 rounded-xl shadow-md card-hover animate-fade-in ${dark ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-gray-500 dark:text-gray-400">Concluídas</div>
                <span className="text-xl">✅</span>
              </div>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {stats.statusCounts['Concluída'] || 0}
              </div>
              <div className="text-xs text-gray-400 mt-2">Coletas finalizadas</div>
            </div>
          </section>

          {/* Filtros */}
          <section className={`p-5 rounded-xl shadow-md mb-6 animate-fade-in ${dark ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Filtros</h3>
              <div className="flex gap-2">
                <button 
                  className="px-3 py-1 text-sm rounded-lg bg-gradient-to-r from-amber-600 to-amber-500 text-white hover:shadow-md smooth-transition"
                  onClick={handleExportBatch}
                  disabled={filteredColetas.length === 0}
                >
                  Exportar ({filteredColetas.length})
                </button>
                <button 
                  className="px-3 py-1 text-sm rounded-lg bg-gradient-to-r from-gray-600 to-gray-500 text-white hover:shadow-md smooth-transition"
                  onClick={() => {
                    setDateStart(new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0]);
                    setDateEnd(new Date().toISOString().split('T')[0]);
                    setStatusFilter('Todos');
                    setSearchTerm('');
                  }}
                >
                  Limpar Filtros
                </button>
              </div>
            </div>
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
                  <option>Pendente</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Buscar ID/Solicitante</label>
                <input 
                  type="text" 
                  placeholder="Ex: 1024 ou João"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full p-2 rounded-lg border smooth-transition ${dark ? 'bg-gray-700 border-gray-600 placeholder-gray-500' : 'bg-white border-gray-300 placeholder-gray-400'}`}
                />
              </div>
            </div>
          </section>

          {/* Tabela de coletas (modo lista) */}
          <section className={`rounded-xl shadow-md overflow-hidden animate-fade-in ${dark ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}>
            <div className="p-5 border-b dark:border-gray-700 flex justify-between items-center">
              <h3 className="font-semibold text-lg">Registros de Coleta</h3>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {isLoading ? 'Carregando...' : `${filteredColetas.length} registros encontrados`}
              </div>
            </div>
            
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                <div className="mt-4 text-gray-500 dark:text-gray-400">Carregando coletas...</div>
              </div>
            ) : filteredColetas.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-6xl mb-4">📋</div>
                <div className="text-xl font-semibold mb-2">Nenhuma coleta encontrada</div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Ajuste os filtros ou crie uma nova coleta
                </div>
                <button 
                  className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg shadow-md hover:shadow-lg smooth-transition"
                  onClick={() => setShowNewModal(true)}
                >
                  + Criar Primeira Coleta
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className={`${dark ? 'bg-gray-900' : 'bg-gray-50'} border-b dark:border-gray-700`}>
                    <tr>
                      <th className="text-left p-4 text-sm font-medium text-gray-500 dark:text-gray-400">ID</th>
                      <th className="text-left p-4 text-sm font-medium text-gray-500 dark:text-gray-400">Data/Hora</th>
                      <th className="text-left p-4 text-sm font-medium text-gray-500 dark:text-gray-400">Status</th>
                      <th className="text-left p-4 text-sm font-medium text-gray-500 dark:text-gray-400">Produzido</th>
                      <th className="text-left p-4 text-sm font-medium text-gray-500 dark:text-gray-400">Matéria-prima</th>
                      <th className="text-left p-4 text-sm font-medium text-gray-500 dark:text-gray-400">Eficiência</th>
                      <th className="text-left p-4 text-sm font-medium text-gray-500 dark:text-gray-400">Solicitante</th>
                      <th className="text-left p-4 text-sm font-medium text-gray-500 dark:text-gray-400">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredColetas.map((coleta, idx) => (
                      <tr 
                        key={coleta.id} 
                        className={`smooth-transition ${dark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} border-b dark:border-gray-700`}
                        style={{ animationDelay: `${idx * 0.05}s` }}
                      >
                        <td className="p-4 font-semibold">#{coleta.id}</td>
                        <td className="p-4">{coleta.datetime}</td>
                        <td className="p-4"><StatusBadge status={coleta.status} /></td>
                        <td className="p-4 font-medium text-blue-600 dark:text-blue-400">{coleta.produced} kg</td>
                        <td className="p-4">{coleta.material} kg</td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className={`font-medium ${
                              coleta.efficiency >= 90 ? 'text-green-600 dark:text-green-400' :
                              coleta.efficiency >= 75 ? 'text-amber-600 dark:text-amber-400' :
                              'text-red-600 dark:text-red-400'
                            }`}>
                              {coleta.efficiency}%
                            </span>
                            {coleta.efficiency >= 90 && <span className="text-xs">⭐</span>}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="font-medium text-green-600 dark:text-green-400">{coleta.applicant}</div>
                        </td>
                        <td className="p-4">
                          <QuickActions coleta={coleta} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <label className="block text-sm font-medium mb-2">Status</label>
              <select
                value={newColeta.status}
                onChange={(e) => setNewColeta({...newColeta, status: e.target.value})}
                className={`w-full p-2 rounded-lg border smooth-transition ${dark ? 'bg-gray-700 border-gray-600' : 'border-gray-300'}`}
              >
                <option value="Concluída">Concluída</option>
                <option value="Processando">Processando</option>
                <option value="Pendente">Pendente</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Solicitante</label>
            <input
              type="text"
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
          
          <div className="pt-4 border-t dark:border-gray-700">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              Eficiência calculada: {newColeta.produced && newColeta.material 
                ? ((parseFloat(newColeta.produced) / parseFloat(newColeta.material)) * 100).toFixed(1) + '%'
                : '0%'}
            </div>
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
                <div className="font-semibold"><StatusBadge status={showDetailsModal.status} /></div>
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
                <div className={`font-semibold ${
                  showDetailsModal.efficiency >= 90 ? 'text-green-600 dark:text-green-400' :
                  showDetailsModal.efficiency >= 75 ? 'text-amber-600 dark:text-amber-400' :
                  'text-red-600 dark:text-red-400'
                }`}>
                  {showDetailsModal.efficiency}%
                </div>
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
            
            <div className="flex gap-2 pt-4 border-t dark:border-gray-700">
              <button 
                className="flex-1 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:shadow-lg smooth-transition"
                onClick={() => handleExport(showDetailsModal)}
              >
                📥 Exportar Coleta
              </button>
              <button 
                className="flex-1 py-2 rounded-lg border smooth-transition ${dark ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-50'}"
                onClick={() => setShowDetailsModal(null)}
              >
                Fechar
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Estatísticas */}
      <Modal isOpen={showStatsModal} onClose={() => setShowStatsModal(false)} title="Estatísticas das Coletas">
        <div className="space-y-6">
          {/* Resumo geral */}
          <div className={`p-4 rounded-lg ${dark ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <h4 className="font-semibold mb-3">Resumo Geral</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.total}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Total Coletas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.totalProduced.toFixed(1)}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">kg Produzidos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.avgEfficiency}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">% Eficiência</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.totalMaterial.toFixed(1)}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">kg Matéria-prima</div>
              </div>
            </div>
          </div>

          {/* Distribuição por status */}
          <div>
            <h4 className="font-semibold mb-3">Distribuição por Status</h4>
            <div className="space-y-2">
              {Object.entries(stats.statusCounts).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={status} />
                    <span className="text-sm">{status}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-medium">{count}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      ({Math.round((count / stats.total) * 100)}%)
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Faixa de eficiência */}
          <div>
            <h4 className="font-semibold mb-3">Faixa de Eficiência</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Mínima:</span>
                <span className="font-medium">{stats.efficiencyRange.min}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Média:</span>
                <span className="font-medium text-amber-600 dark:text-amber-400">{stats.efficiencyRange.avg}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Máxima:</span>
                <span className="font-medium">{stats.efficiencyRange.max}%</span>
              </div>
            </div>
          </div>

          {/* Top solicitantes */}
          {stats.topApplicants.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3">Top Solicitantes</h4>
              <div className="space-y-2">
                {stats.topApplicants.map((applicant, idx) => (
                  <div key={applicant.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">#{idx + 1}</span>
                      <span className="font-medium">{applicant.name}</span>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {applicant.count} coleta(s)
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-4 border-t dark:border-gray-700">
            <button 
              className="w-full py-2 rounded-lg bg-gradient-to-r from-green-600 to-green-500 text-white hover:shadow-lg smooth-transition"
              onClick={handleExportBatch}
              disabled={filteredColetas.length === 0}
            >
              📊 Exportar Todas as Estatísticas
            </button>
          </div>
        </div>
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
