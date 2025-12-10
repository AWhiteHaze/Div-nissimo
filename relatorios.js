const { useState, useEffect, useMemo } = React;

function Relatorios() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedLine, setSelectedLine] = useState("Linha Pão de Queijo");
  const [dark, setDark] = useState(false);
  const [dbReady, setDbReady] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [reportTypeFilter, setReportTypeFilter] = useState("Todos");
  const [dateFilter, setDateFilter] = useState("Todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [showNewReportModal, setShowNewReportModal] = useState(false);
  const [newReport, setNewReport] = useState({
    nome: "",
    tipo: "Produção",
    descricao: ""
  });

  const [relatorios, setRelatorios] = useState([
    { 
      id: "REL-2025-001", 
      nome: "Produção Diária", 
      data: "07/10/2025", 
      tipo: "Produção", 
      status: "Concluído",
      descricao: "Relatório detalhado da produção do dia, incluindo eficiência e métricas de qualidade.",
      tamanho: "2.4 MB",
      geradoPor: "Sistema Automático",
      dados: {
        totalProduzido: 2450,
        eficiencia: 94.2,
        tempoProducao: 8.5,
        paradas: 2
      }
    },
    { 
      id: "REL-2025-002", 
      nome: "Relatório de Qualidade", 
      data: "06/10/2025", 
      tipo: "Qualidade", 
      status: "Concluído",
      descricao: "Análise completa de qualidade dos produtos fabricados.",
      tamanho: "1.8 MB",
      geradoPor: "Controle de Qualidade",
      dados: {
        taxaAprovacao: 98.5,
        ncsAbertas: 3,
        ncsResolvidas: 12,
        inspecoes: 45
      }
    },
    { 
      id: "REL-2025-003", 
      nome: "Consumo Energético", 
      data: "05/10/2025", 
      tipo: "Energia", 
      status: "Em análise",
      descricao: "Relatório de consumo energético e eficiência das máquinas.",
      tamanho: "3.1 MB",
      geradoPor: "Engenharia",
      dados: {
        consumoTotal: 2450,
        custoEnergia: 1250.80,
        eficienciaEnergetica: 87.3,
        picoConsumo: "14:30"
      }
    },
    { 
      id: "REL-2025-004", 
      nome: "Eficiência das Linhas", 
      data: "04/10/2025", 
      tipo: "Performance", 
      status: "Concluído",
      descricao: "Análise de performance e eficiência de todas as linhas de produção.",
      tamanho: "4.2 MB",
      geradoPor: "Otimização",
      dados: {
        eficienciaMedia: 92.1,
        linhaMaisEficiente: "Linha 02",
        tempoMedioSetup: 25.3,
        oee: 85.7
      }
    },
    { 
      id: "REL-2025-005", 
      nome: "Manutenção Preventiva", 
      data: "03/10/2025", 
      tipo: "Manutenção", 
      status: "Concluído",
      descricao: "Relatório de manutenções preventivas realizadas no período.",
      tamanho: "2.1 MB",
      geradoPor: "Manutenção",
      dados: {
        manutencoesRealizadas: 8,
        tempoMedioReparo: 2.5,
        custoTotal: 3200.50,
        disponibilidade: 99.2
      }
    },
    { 
      id: "REL-2025-006", 
      nome: "Análise de Matéria-Prima", 
      data: "02/10/2025", 
      tipo: "Qualidade", 
      status: "Pendente",
      descricao: "Relatório de qualidade e consumo de matéria-prima.",
      tamanho: "1.5 MB",
      geradoPor: "Almoxarifado",
      dados: {
        consumoTotal: 1850,
        desperdicio: 2.3,
        custoMateriaPrima: 8450.75,
        fornecedores: 3
      }
    }
  ]);

  // Inicializar banco de dados e tema
  useEffect(() => {
    const initDB = async () => {
      try {
        if (window.db) {
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
          
          // Carregar relatórios salvos
          const savedReports = await window.db.getRelatorios();
          if (savedReports.length > 0) setRelatorios(savedReports);
          
          setDbReady(true);
          
          // Cleanup
          return () => unsubscribe();
        }
        setDbReady(true);
      } catch (error) {
        console.error('Erro ao inicializar banco de dados:', error);
        setDbReady(true);
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
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [dark]);

  // Função para alternar tema
  const toggleDark = () => {
    setDark(prev => !prev);
  };

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

  // Fechar sidebar automaticamente em telas menores
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    handleResize(); // Executar na montagem
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const filteredRelatorios = useMemo(() => {
    return relatorios.filter(rel => {
      if (reportTypeFilter !== "Todos" && rel.tipo !== reportTypeFilter) return false;
      if (searchTerm && !rel.nome.toLowerCase().includes(searchTerm.toLowerCase()) && !rel.descricao.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    });
  }, [relatorios, reportTypeFilter, searchTerm]);

  const stats = useMemo(() => ({
    total: relatorios.length,
    concluidos: relatorios.filter(r => r.status === 'Concluído').length,
    emAnalise: relatorios.filter(r => r.status === 'Em análise').length,
    pendentes: relatorios.filter(r => r.status === 'Pendente').length,
    tamanhoTotal: relatorios.reduce((sum, r) => sum + parseFloat(r.tamanho), 0).toFixed(1)
  }), [relatorios]);

  const handleExportReport = (relatorio) => {
    const data = {
      ID: relatorio.id,
      Nome: relatorio.nome,
      Tipo: relatorio.tipo,
      Data: relatorio.data,
      Status: relatorio.status,
      Descricao: relatorio.descricao,
      Tamanho: relatorio.tamanho,
      GeradoPor: relatorio.geradoPor,
      ...relatorio.dados
    };
    
    const csv = Object.keys(data).map(key => `${key};${data[key]}`).join('\n');
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${relatorio.id}_${relatorio.nome.replace(/\s+/g, '_')}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const handleExportAll = () => {
    const allData = relatorios.map(rel => ({
      ID: rel.id,
      Nome: rel.nome,
      Tipo: rel.tipo,
      Data: rel.data,
      Status: rel.status,
      Descricao: rel.descricao,
      Tamanho: rel.tamanho,
      GeradoPor: rel.geradoPor
    }));
    
    const csv = [
      Object.keys(allData[0]).join(";"),
      ...allData.map(r => Object.values(r).join(";"))
    ].join("\n");
    
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `relatorios_completos_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    
    alert('Todos os relatórios exportados com sucesso!');
  };

  const handleSaveNewReport = () => {
    if (!newReport.nome.trim()) {
      alert('Por favor, informe um nome para o relatório!');
      return;
    }

    const novoRelatorio = {
      id: `REL-2025-${String(relatorios.length + 7).padStart(3, '0')}`,
      nome: newReport.nome,
      data: new Date().toLocaleDateString('pt-BR'),
      tipo: newReport.tipo,
      status: "Concluído",
      descricao: newReport.descricao || "Relatório personalizado gerado pelo usuário.",
      tamanho: "1.2 MB",
      geradoPor: "Usuário",
      dados: {
        periodo: "Personalizado",
        metricasIncluidas: newReport.tipo,
        dadosColetados: stats.total,
        timestamp: new Date().toISOString(),
        observacoes: newReport.descricao || "Sem observações adicionais."
      }
    };

    setRelatorios(prev => [novoRelatorio, ...prev]);
    setShowNewReportModal(false);
    setNewReport({
      nome: "",
      tipo: "Produção",
      descricao: ""
    });
    
    // Salvar no banco de dados
    if (window.db) {
      window.db.saveRelatorio(novoRelatorio);
    }
    
    alert('Relatório personalizado gerado com sucesso!');
  };

  const handleViewReport = (relatorio) => {
    const details = `
📊 RELATÓRIO DETALHADO

ID: ${relatorio.id}
Nome: ${relatorio.nome}
Tipo: ${relatorio.tipo}
Data: ${relatorio.data}
Status: ${relatorio.status}
Descrição: ${relatorio.descricao}
Tamanho: ${relatorio.tamanho}
Gerado por: ${relatorio.geradoPor}

DADOS PRINCIPAIS:
${Object.entries(relatorio.dados).map(([key, value]) => `• ${key}: ${value}`).join('\n')}

--- FIM DO RELATÓRIO ---
    `.trim();

    alert(details);
  };

  const handleDeleteReport = (relatorioId) => {
    if (confirm('Tem certeza que deseja excluir este relatório?')) {
      setRelatorios(prev => prev.filter(r => r.id !== relatorioId));
      
      // Remover do banco de dados
      if (window.db) {
        window.db.deleteRelatorio(relatorioId);
      }
      
      alert('Relatório excluído com sucesso!');
    }
  };

  const navigationItems = [
    { name: 'Dashboard', icon: '🏠', url: 'index.html' },
    { name: 'Coleta', icon: '📋', url: 'coleta.html' },
    { name: 'Ordens', icon: '📦', url: 'ordem.html' },
    { name: 'Qualidade', icon: '🔬', url: 'qualidade.html' },
    { name: 'Fornecedores', icon: '🏭', url: 'fornecedores.html' },
    { name: 'Relatórios', icon: '📈', url: 'relatorios.html' },
    { name: 'Receitas', icon: '🧑‍🍳', url: 'Receitas.html' }
  ];
  
  // Modal para novo relatório
  const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 animate-fade-in" onClick={onClose}>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full mx-4 max-h-[90vh] overflow-auto animate-slide-in" onClick={e => e.stopPropagation()}>
          <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center">
            <h2 className="text-2xl font-bold">{title}</h2>
            <button 
              type="button"
              onClick={onClose} 
              className="text-2xl hover:text-red-500 smooth-transition"
            >
              &times;
            </button>
          </div>
          <div className="p-6">
            {children}
          </div>
        </div>
      </div>
    );
  };

  // Prevenir comportamento padrão do formulário
  const handleFormSubmit = (e) => {
    e.preventDefault();
    return false;
  };

  return (
    <div 
      className={`h-screen flex smooth-transition ${dark ? 'dark bg-gray-900 text-gray-100' : 'bg-gradient-to-br from-gray-50 to-gray-100 text-gray-900'}`}
      onKeyDown={(e) => {
        // Prevenir comportamento padrão da tecla Enter
        if (e.key === 'Enter' && e.target.type !== 'textarea') {
          e.preventDefault();
        }
      }}
    >
      {/* Sidebar */}
      <aside className={`flex flex-col smooth-transition ${sidebarOpen ? 'w-64' : 'w-16'} ${dark ? 'bg-gray-800 border-gray-700' : 'bg-white shadow-lg'} border-r z-40`}>
        <div className="p-4 flex items-center justify-between border-b dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="rounded-lg w-10 h-10 flex items-center justify-center font-bold bg-gradient-to-br from-green-400 to-green-600 text-white shadow-lg">
              DV
            </div>
            {sidebarOpen && (
              <div className="animate-fade-in">
                <div className="text-lg font-semibold">Diviníssimo</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Relatórios</div>
              </div>
            )}
          </div>
          <button 
            type="button"
            className={`p-2 rounded-lg smooth-transition ${dark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            onClick={() => setSidebarOpen(s => !s)}
          >
            {sidebarOpen ? '‹' : '›'}
          </button>
        </div>

        {/* Navegação lateral */}
        <nav className="flex-1 px-2 py-4 space-y-1">
          {navigationItems.map((item, idx) => (
            <button 
              key={item.name} 
              type="button"
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg smooth-transition ${
                item.name === 'Relatórios' 
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

        {/* Configurações */}
        <div className="p-4 border-t dark:border-gray-700">
          {sidebarOpen && (
            <>
              <div className="mt-4 flex items-center justify-between text-xs">
                <div className="text-gray-500 dark:text-gray-400">Modo</div>
                <button 
                  type="button"
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

      {/* Overlay para mobile quando sidebar está aberta */}
      {sidebarOpen && window.innerWidth < 768 && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Conteúdo principal - AGRUPAR EM UM DIV */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <header className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4 animate-fade-in">
            <div className="flex items-center gap-4">
              <button 
                type="button"
                className="md:hidden p-2 rounded-lg bg-gray-200 dark:bg-gray-700"
                onClick={() => setSidebarOpen(true)}
              >
                ☰
              </button>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent">
                  Relatórios
                </h1>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedLine}
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className={`flex items-center text-sm px-4 py-2 rounded-full smooth-transition ${isOnline ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                <span className={`w-2 h-2 rounded-full mr-2 ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                {isOnline ? 'Online' : 'Offline'}
              </div>
              <div className="flex gap-2">
                <button 
                  type="button"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg shadow-md hover:shadow-lg smooth-transition hover:scale-105 text-sm"
                  onClick={() => setShowNewReportModal(true)}
                >
                  📋 Novo
                </button>
                <button 
                  type="button"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg shadow-md hover:shadow-lg smooth-transition hover:scale-105 text-sm"
                  onClick={handleExportAll}
                >
                  📊 Exportar
                </button>
              </div>
            </div>
          </header>

          {/* Cards de Estatísticas - Layout responsivo */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
            <div className={`p-4 md:p-5 rounded-xl shadow-md card-hover animate-fade-in ${dark ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}>
              <div className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mb-2">Total</div>
              <div className="text-xl md:text-3xl font-bold text-green-600 dark:text-green-400">{stats.total}</div>
              <div className="text-xs text-gray-400 mt-1">Relatórios</div>
            </div>

            <div className={`p-4 md:p-5 rounded-xl shadow-md card-hover animate-fade-in ${dark ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}>
              <div className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mb-2">Concluídos</div>
              <div className="text-xl md:text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.concluidos}</div>
              <div className="text-xs text-gray-400 mt-1">Prontos</div>
            </div>

            <div className={`p-4 md:p-5 rounded-xl shadow-md card-hover animate-fade-in ${dark ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}>
              <div className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mb-2">Em Análise</div>
              <div className="text-xl md:text-3xl font-bold text-amber-600 dark:text-amber-400">{stats.emAnalise}</div>
              <div className="text-xs text-gray-400 mt-1">Processando</div>
            </div>

            <div className={`p-4 md:p-5 rounded-xl shadow-md card-hover animate-fade-in ${dark ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}>
              <div className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mb-2">Tamanho</div>
              <div className="text-xl md:text-3xl font-bold text-purple-600 dark:text-purple-400">{stats.tamanhoTotal} MB</div>
              <div className="text-xs text-gray-400 mt-1">Armazenamento</div>
            </div>
          </section>

          {/* Filtros - Layout responsivo */}
          <section className={`p-4 md:p-5 rounded-xl shadow-md mb-6 animate-fade-in ${dark ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}>
            <h3 className="font-semibold mb-4 text-lg">Filtros</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Tipo de Relatório</label>
                <select 
                  value={reportTypeFilter} 
                  onChange={(e) => setReportTypeFilter(e.target.value)}
                  className={`w-full p-2 rounded-lg border smooth-transition text-sm ${dark ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300'}`}
                >
                  <option>Todos</option>
                  <option>Produção</option>
                  <option>Qualidade</option>
                  <option>Energia</option>
                  <option>Performance</option>
                  <option>Manutenção</option>
                  <option>Personalizado</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Período</label>
                <select 
                  value={dateFilter} 
                  onChange={(e) => setDateFilter(e.target.value)}
                  className={`w-full p-2 rounded-lg border smooth-transition text-sm ${dark ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300'}`}
                >
                  <option>Todos</option>
                  <option>Últimos 7 dias</option>
                  <option>Último mês</option>
                  <option>Último trimestre</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Buscar</label>
                <input 
                  type="text" 
                  placeholder="Nome ou descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full p-2 rounded-lg border smooth-transition text-sm ${dark ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-500' : 'bg-white border-gray-300 placeholder-gray-400'}`}
                />
              </div>
            </div>
          </section>

          {/* Tabela de relatórios - Layout responsivo */}
          <section className={`rounded-xl shadow-md p-4 md:p-5 animate-fade-in ${dark ? 'bg-gray-800 border border-gray-700' : 'bg-white'} overflow-x-auto`}>
            <div className="min-w-full">
              <table className="w-full text-sm">
                <thead>
                  <tr className={`${dark ? 'border-gray-700' : 'border-gray-200'} border-b`}>
                    <th className="text-left py-2 px-2 md:px-3">Nome</th>
                    <th className="text-left py-2 px-2 md:px-3 hidden sm:table-cell">Tipo</th>
                    <th className="text-left py-2 px-2 md:px-3 hidden md:table-cell">Data</th>
                    <th className="text-left py-2 px-2 md:px-3">Status</th>
                    <th className="text-right py-2 px-2 md:px-3">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRelatorios.map((r, i) => (
                    <tr key={r.id} className={`smooth-transition hover:bg-gray-50 dark:hover:bg-gray-700 animate-slide-in`} style={{ animationDelay: `${i * 0.05}s` }}>
                      <td className="py-3 px-2 md:px-3 font-medium">
                        <div>
                          <div className="font-semibold text-sm md:text-base">{r.nome}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 hidden md:block">{r.descricao}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 md:hidden">
                            <span className={`px-2 py-1 rounded text-xs ${r.tipo === 'Produção' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                              {r.tipo}
                            </span>
                            • {r.data}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-2 md:px-3 hidden sm:table-cell">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          r.tipo === 'Produção' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                          r.tipo === 'Qualidade' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                          r.tipo === 'Energia' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                          r.tipo === 'Performance' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                          'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                        }`}>
                          {r.tipo}
                        </span>
                      </td>
                      <td className="py-3 px-2 md:px-3 hidden md:table-cell">{r.data}</td>
                      <td className="py-3 px-2 md:px-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          r.status === 'Concluído'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                            : r.status === 'Em análise'
                            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                            : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="py-3 px-2 md:px-3 text-right">
                        <div className="flex gap-1 md:gap-2 justify-end">
                          <button 
                            type="button"
                            className="px-2 py-1 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 text-white text-xs smooth-transition hover:scale-105"
                            onClick={() => handleViewReport(r)}
                            title="Visualizar"
                          >
                            👁️
                          </button>
                          <button 
                            type="button"
                            className="px-2 py-1 rounded-lg bg-gradient-to-r from-green-600 to-green-500 text-white text-xs smooth-transition hover:scale-105"
                            onClick={() => handleExportReport(r)}
                            title="Exportar"
                          >
                            📥
                          </button>
                          <button 
                            type="button"
                            className="px-2 py-1 rounded-lg bg-gradient-to-r from-red-600 to-red-500 text-white text-xs smooth-transition hover:scale-105"
                            onClick={() => handleDeleteReport(r.id)}
                            title="Excluir"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredRelatorios.length === 0 && (
              <div className="text-center py-8 md:py-12">
                <div className="text-4xl md:text-6xl mb-4">📊</div>
                <div className="text-lg md:text-xl font-semibold mb-2">Nenhum relatório encontrado</div>
                <div className="text-gray-500 dark:text-gray-400 text-sm">Ajuste os filtros ou gere um novo relatório.</div>
              </div>
            )}
          </section>

          {/* Rodapé */}
          <footer className={`mt-6 md:mt-8 pt-4 md:pt-6 border-t text-xs md:text-sm ${dark ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-500'}`}>
            <div className="flex flex-col md:flex-row justify-between items-center gap-2">
              <div>Protótipo v4 • Módulo de Relatórios Avançado</div>
              <div className="text-xs">Última atualização: {new Date().toLocaleString('pt-BR')}</div>
            </div>
          </footer>
        </main>
      </div>

      {/* Modal para novo relatório - USANDO FORM COM onSubmit */}
      <Modal isOpen={showNewReportModal} onClose={() => setShowNewReportModal(false)} title="Novo Relatório Personalizado">
        <form onSubmit={handleFormSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Nome do Relatório *</label>
              <input
                type="text"
                value={newReport.nome}
                onChange={(e) => setNewReport({...newReport, nome: e.target.value})}
                className={`w-full p-2 rounded-lg border smooth-transition text-sm ${dark ? 'bg-gray-700 border-gray-600' : 'border-gray-300'}`}
                placeholder="Ex: Análise de Performance Mensal"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Tipo de Relatório</label>
              <select
                value={newReport.tipo}
                onChange={(e) => setNewReport({...newReport, tipo: e.target.value})}
                className={`w-full p-2 rounded-lg border smooth-transition text-sm ${dark ? 'bg-gray-700 border-gray-600' : 'border-gray-300'}`}
              >
                <option>Produção</option>
                <option>Qualidade</option>
                <option>Energia</option>
                <option>Performance</option>
                <option>Manutenção</option>
                <option>Personalizado</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Descrição (Opcional)</label>
              <textarea
                rows={3}
                value={newReport.descricao}
                onChange={(e) => setNewReport({...newReport, descricao: e.target.value})}
                className={`w-full p-2 rounded-lg border smooth-transition text-sm ${dark ? 'bg-gray-700 border-gray-600' : 'border-gray-300'}`}
                placeholder="Descreva o propósito deste relatório..."
              />
            </div>
            
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setShowNewReportModal(false)}
                className={`flex-1 py-2 rounded-lg border smooth-transition text-sm ${dark ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-50'}`}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveNewReport}
                className="flex-1 py-2 rounded-lg bg-gradient-to-r from-green-600 to-green-500 text-white hover:shadow-lg smooth-transition text-sm"
              >
                Gerar Relatório
              </button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// Renderizar na página
const container = document.getElementById('root');
const root = ReactDOM.createRoot(container);
root.render(<Relatorios />);