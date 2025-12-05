const { useState, useEffect, useMemo, memo, useCallback } = React;

// --- Optimized Pie Chart Component ---
const PieChart = memo(({ data = [], size = 180 }) => {
  if (!data || data.length === 0) return <div className="text-sm text-gray-500 dark:text-gray-400">Sem dados</div>;

  const radius = size / 2 - 5;
  const center = size / 2;
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  let currentAngle = 0;
  
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {data.map((item, index) => {
        const percentage = item.value / total;
        const angle = percentage * 360;
        const largeArcFlag = angle > 180 ? 1 : 0;
        
        const x1 = center + radius * Math.cos(currentAngle * Math.PI / 180);
        const y1 = center + radius * Math.sin(currentAngle * Math.PI / 180);
        
        const x2 = center + radius * Math.cos((currentAngle + angle) * Math.PI / 180);
        const y2 = center + radius * Math.sin((currentAngle + angle) * Math.PI / 180);
        
        const pathData = [
          `M ${center} ${center}`,
          `L ${x1} ${y1}`,
          `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
          'Z'
        ].join(' ');
        
        const segment = (
          <path
            key={index}
            d={pathData}
            fill={item.color}
            stroke="#fff"
            strokeWidth="1"
            className="smooth-transition"
          />
        );
        
        currentAngle += angle;
        return segment;
      })}
      
      {/* Centro do gráfico */}
      <circle cx={center} cy={center} r={radius * 0.3} fill="white" />
      <text 
        x={center} 
        y={center} 
        textAnchor="middle" 
        dominantBaseline="middle" 
        fontSize="14" 
        fontWeight="bold"
        fill="#374151"
      >
        {total}
      </text>
    </svg>
  );
});

// Modal para detalhes
const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 animate-fade-in" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-auto animate-slide-in" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-2xl font-bold">{title}</h2>
          <button onClick={onClose} className="text-2xl hover:text-red-500 smooth-transition">&times;</button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedLine, setSelectedLine] = useState("Linha Pão de Queijo");
  const [dark, setDark] = useState(false);
  const [dbReady, setDbReady] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const [typeFilter, setTypeFilter] = useState("Todos");
  const [severityFilter, setSeverityFilter] = useState("Todos");
  const [searchTerm, setSearchTerm] = useState("");

  const [showDetailsModal, setShowDetailsModal] = useState(null);
  const [showNewNCModal, setShowNewNCModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(null);

  const [naoConformidades, setNaoConformidades] = useState([
    { 
      id: 'NC-2025-045', 
      type: 'Dimensional', 
      description: 'Diâmetro fora da especificação', 
      severity: 'Média', 
      status: 'Aberta', 
      date: '06/10/2025 15:30', 
      lote: 'LT-1024', 
      responsible: 'João Silva',
      details: 'Produto com diâmetro de 45mm, fora da especificação de 40-42mm. Lote completo afetado.',
      actions: 'Realizar ajuste no equipamento de modelagem',
      createdBy: 'Sistema Automático'
    },
    { 
      id: 'NC-2025-044', 
      type: 'Visual', 
      description: 'Coloração irregular no produto', 
      severity: 'Baixa', 
      status: 'Em Análise', 
      date: '06/10/2025 12:15', 
      lote: 'LT-1023', 
      responsible: 'Maria Santos',
      details: 'Variação de cor observada em 15% dos produtos do lote.',
      actions: 'Aguardando análise do controle de qualidade',
      createdBy: 'Inspetor Carlos'
    },
    { 
      id: 'NC-2025-043', 
      type: 'Microbiológico', 
      description: 'Contagem elevada de coliformes', 
      severity: 'Alta', 
      status: 'Aberta', 
      date: '05/10/2025 18:45', 
      lote: 'LT-1021', 
      responsible: 'Carlos Oliveira',
      details: 'Contagem de coliformes em 50 UFC/g, acima do limite de 10 UFC/g.',
      actions: 'Isolar lote e realizar nova análise',
      createdBy: 'Laboratório'
    },
    { 
      id: 'NC-2025-042', 
      type: 'Embalagem', 
      description: 'Selo de segurança com defeito', 
      severity: 'Média', 
      status: 'Resolvida', 
      date: '05/10/2025 14:20', 
      lote: 'LT-1020', 
      responsible: 'Ana Paula',
      details: 'Selo de segurança não adere corretamente na embalagem.',
      actions: 'Substituída máquina seladora - problema resolvido',
      createdBy: 'Operador Linha 2'
    },
    { 
      id: 'NC-2025-041', 
      type: 'Peso', 
      description: 'Peso abaixo do especificado', 
      severity: 'Alta', 
      status: 'Em Análise', 
      date: '04/10/2025 16:00', 
      lote: 'LT-1019', 
      responsible: 'Roberto Costa',
      details: 'Peso médio de 48g, abaixo do especificado de 50g ±2g.',
      actions: 'Verificar dosadora e calibrar equipamento',
      createdBy: 'Sistema Automático'
    },
    { 
      id: 'NC-2025-040', 
      type: 'Textura', 
      description: 'Textura muito seca', 
      severity: 'Baixa', 
      status: 'Resolvida', 
      date: '04/10/2025 11:30', 
      lote: 'LT-1018', 
      responsible: 'Patricia Lima',
      details: 'Textura não atende padrão de maciez estabelecido.',
      actions: 'Ajuste na umidade da massa aplicado',
      createdBy: 'Controle Qualidade'
    },
  ]);

  const [inspections, setInspections] = useState([
    { id: 'INSP-089', lote: 'LT-1024', date: '06/10/2025 16:00', inspector: 'João Silva', approved: 980, rejected: 20, result: 'Aprovado com Ressalvas' },
    { id: 'INSP-088', lote: 'LT-1023', date: '06/10/2025 14:00', inspector: 'Maria Santos', approved: 1500, rejected: 0, result: 'Aprovado' },
    { id: 'INSP-087', lote: 'LT-1022', date: '06/10/2025 11:00', inspector: 'Carlos Oliveira', approved: 950, rejected: 50, result: 'Aprovado com Ressalvas' },
  ]);

  const [newNC, setNewNC] = useState({
    type: 'Dimensional',
    description: '',
    severity: 'Média',
    lote: '',
    details: ''
  });

  // Estado para dados de produção (para sincronizar com dashboard)
  const [productionData, setProductionData] = useState([]);

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
          
          // Carregar dados específicos da qualidade
          const savedNCs = await window.db.getNaoConformidades();
          const savedInspections = await window.db.getInspections();
          if (savedNCs.length > 0) setNaoConformidades(savedNCs);
          if (savedInspections.length > 0) setInspections(savedInspections);
          
          // Carregar dados de produção do dashboard para sincronizar gráficos
          const production = await window.db.getRecentProduction(24);
          if (production.length > 0) setProductionData(production);
          
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

  const filteredNC = useMemo(() => {
    return naoConformidades.filter(nc => {
      if (typeFilter !== "Todos" && nc.type !== typeFilter) return false;
      if (severityFilter !== "Todos" && nc.severity !== severityFilter) return false;
      if (searchTerm && !nc.id.toLowerCase().includes(searchTerm.toLowerCase()) && !nc.description.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    });
  }, [naoConformidades, typeFilter, severityFilter, searchTerm]);

  // Calcular total de produção aprovada e rejeitada baseado nos dados reais do dashboard
  const productionStats = useMemo(() => {
    const totalProduced = productionData.reduce((sum, p) => sum + (p.produced || 0), 0);
    
    // Simulação: assumindo que 5% da produção é rejeitada
    const approved = Math.round(totalProduced * 0.96);
    const rejected = totalProduced - approved;
    
    return {
      totalProduced,
      approved,
      rejected,
      approvalRate: totalProduced > 0 ? Math.round((approved / totalProduced) * 100) : 0
    };
  }, [productionData]);

  const stats = useMemo(() => {
    // Usar dados de produção reais para cálculo de taxa de aprovação
    const { approvalRate, approved, rejected } = productionStats;
    
    // Dados de inspeções para cálculos adicionais
    const totalInspected = inspections.reduce((sum, i) => sum + i.approved + i.rejected, 0);
    const inspectionApproved = inspections.reduce((sum, i) => sum + i.approved, 0);
    const inspectionRejected = inspections.reduce((sum, i) => sum + i.rejected, 0);

    return {
      totalNC: filteredNC.length,
      abertas: filteredNC.filter(nc => nc.status === 'Aberta').length,
      emAnalise: filteredNC.filter(nc => nc.status === 'Em Análise').length,
      resolvidas: filteredNC.filter(nc => nc.status === 'Resolvida').length,
      alta: filteredNC.filter(nc => nc.severity === 'Alta').length,
      // Usar dados combinados de produção e inspeções
      totalProduced: productionStats.totalProduced,
      totalApproved: approved, // Dados sincronizados com dashboard
      totalRejected: rejected, // Dados sincronizados com dashboard
      approvalRate, // Taxa sincronizada com dashboard
      // Dados adicionais das inspeções manuais
      totalInspected,
      inspectionApproved,
      inspectionRejected
    };
  }, [filteredNC, inspections, productionStats]);

  // Dados para o gráfico de pizza de qualidade - Sincronizado com dashboard
  const qualityData = useMemo(() => {
    const aprovado = stats.totalApproved || 0;
    const rejeitado = stats.totalRejected || 0;
    const total = aprovado + rejeitado;
    
    return [
      { 
        name: 'Aprovado', 
        value: aprovado, 
        color: '#10B981',
        porcentagem: total > 0 ? Math.round((aprovado / total) * 100) : 0
      },
      { 
        name: 'Rejeitado', 
        value: rejeitado, 
        color: '#EF4444',
        porcentagem: total > 0 ? Math.round((rejeitado / total) * 100) : 0
      }
    ];
  }, [stats.totalApproved, stats.totalRejected]);

  const getSeverityColor = (severity) => {
    switch(severity) {
      case 'Alta': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'Média': return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
      case 'Baixa': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Aberta': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'Em Análise': return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
      case 'Resolvida': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleViewDetails = useCallback((nc) => {
    setShowDetailsModal(nc);
  }, []);

  const handleResolveNC = useCallback((ncId) => {
    setShowResolveModal(ncId);
  }, []);

  const handleSaveResolve = useCallback(() => {
    if (showResolveModal) {
      setNaoConformidades(prev => prev.map(nc => 
        nc.id === showResolveModal 
          ? { ...nc, status: 'Resolvida', date: new Date().toLocaleString('pt-BR') }
          : nc
      ));
      setShowResolveModal(null);
      alert('Não-conformidade resolvida com sucesso!');
    }
  }, [showResolveModal]);

  const handleSaveNewNC = useCallback(() => {
    if (!newNC.description || !newNC.lote) {
      alert('Preencha todos os campos obrigatórios!');
      return;
    }

    const newId = `NC-2025-${String(naoConformidades.length + 46).padStart(3, '0')}`;
    
    const novaNC = {
      id: newId,
      type: newNC.type,
      description: newNC.description,
      severity: newNC.severity,
      status: 'Aberta',
      date: new Date().toLocaleString('pt-BR'),
      lote: newNC.lote,
      responsible: 'Pendente',
      details: newNC.details || 'Detalhes a serem preenchidos...',
      actions: 'Aguardando análise',
      createdBy: 'Usuário'
    };

    setNaoConformidades(prev => [novaNC, ...prev]);
    setShowNewNCModal(false);
    setNewNC({
      type: 'Dimensional',
      description: '',
      severity: 'Média',
      lote: '',
      details: ''
    });
    
    // Salvar no banco de dados
    if (window.db) {
      window.db.saveNaoConformidade(novaNC);
    }
    
    alert('Não-conformidade registrada com sucesso!');
  }, [newNC, naoConformidades]);

  const handleExportNC = useCallback((nc) => {
    const data = {
      ID: nc.id,
      Tipo: nc.type,
      Descricao: nc.description,
      Severidade: nc.severity,
      Status: nc.status,
      Data: nc.date,
      Lote: nc.lote,
      Responsavel: nc.responsible,
      Detalhes: nc.details,
      Acoes: nc.actions
    };
    
    const csv = Object.keys(data).map(key => `${key};${data[key]}`).join('\n');
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `nc_${nc.id}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }, []);

  const handleGenerateReport = useCallback(() => {
    const reportData = {
      periodo: new Date().toLocaleDateString('pt-BR'),
      totalNC: stats.totalNC,
      abertas: stats.abertas,
      resolvidas: stats.resolvidas,
      taxaAprovacao: stats.approvalRate + '%',
      producaoTotal: stats.totalProduced,
      aprovados: stats.totalApproved,
      rejeitados: stats.totalRejected,
      inspecoesRealizadas: inspections.length
    };
    
    const csv = Object.keys(reportData).map(key => `${key};${reportData[key]}`).join('\n');
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio_qualidade_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    
    alert('Relatório gerado com sucesso!');
  }, [stats, inspections]);

  const navigationItems = [
    { name: 'Dashboard', icon: '🏠', url: 'index.html' },
    { name: 'Coleta', icon: '📋', url: 'coleta.html' },
    { name: 'Ordens', icon: '📦', url: 'ordem.html' },
    { name: 'Qualidade', icon: '🔬', url: 'qualidade.html' },
    { name: 'Relatórios', icon: '📈', url: 'relatorios.html' },
    { name: 'Receitas', icon: '🧑‍🍳', url: 'Receitas.html' }
  ];

  return (
    <div className={`h-screen smooth-transition ${dark ? 'dark bg-gray-900 text-gray-100' : 'bg-gradient-to-br from-gray-50 to-gray-100 text-gray-900'}`}>
      <div className="flex h-full">
        <aside className={`flex flex-col smooth-transition ${sidebarOpen ? 'w-64' : 'w-16'} ${dark ? 'bg-gray-800 border-gray-700' : 'bg-white shadow-lg'} border-r`}>
          <div className="p-4 flex items-center justify-between border-b dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="rounded-lg w-10 h-10 flex items-center justify-center font-bold bg-gradient-to-br from-green-400 to-green-600 text-white shadow-lg">DV</div>
              {sidebarOpen && (
                <div className="animate-fade-in">
                  <div className="text-lg font-semibold">Diviníssimo</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Qualidade - Pão de Queijo</div>
                </div>
              )}
            </div>
            <button className={`p-2 rounded-lg smooth-transition ${dark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`} onClick={() => setSidebarOpen(s => !s)}>
              {sidebarOpen ? '⟨' : '⟩'}
            </button>
          </div>

          <nav className="flex-1 px-2 py-4 space-y-1">
            {navigationItems.map((item, idx) => (
              <button 
                key={item.name} 
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg smooth-transition ${
                  item.name === 'Qualidade' 
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
                  <button className={`px-3 py-1.5 rounded-lg border smooth-transition ${dark ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-50'}`} onClick={toggleDark}>
                    {dark ? '☀️ Light' : '🌙 Dark'}
                  </button>
                </div>
              </>
            )}
          </div>
        </aside>

        <main className="flex-1 p-6 overflow-auto">
          <header className="flex items-center justify-between mb-6 animate-fade-in">
            <div className="flex items-center gap-4">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent">Controle de Qualidade</h1>
              <div className="text-sm text-gray-500 dark:text-gray-400">{selectedLine}</div>
            </div>
            <div className="flex items-center gap-3">
              <div className={`flex items-center text-sm px-4 py-2 rounded-full smooth-transition ${isOnline ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                <span className={`w-2 h-2 rounded-full mr-2 ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                {isOnline ? 'Online' : 'Offline'}
              </div>
              <button 
                className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg shadow-md hover:shadow-lg smooth-transition hover:scale-105"
                onClick={() => setShowNewNCModal(true)}
              >
                + Nova NC
              </button>
              <button 
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg shadow-md hover:shadow-lg smooth-transition hover:scale-105"
                onClick={handleGenerateReport}
              >
                📊 Relatório
              </button>
            </div>
          </header>

          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className={`p-5 rounded-xl shadow-md card-hover animate-fade-in ${dark ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}>
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Taxa de Aprovação</div>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.approvalRate}%</div>
              <div className="text-xs text-gray-400 mt-2">
                {stats.totalApproved} de {stats.totalProduced || stats.totalApproved + stats.totalRejected} aprovados
              </div>
              <div className="text-xs text-green-500 dark:text-green-400 mt-1">
                📈 Sincronizado com Dashboard
              </div>
            </div>

            <div className={`p-5 rounded-xl shadow-md card-hover animate-fade-in ${dark ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}>
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">NCs Abertas</div>
              <div className="text-3xl font-bold text-red-600 dark:text-red-400">{stats.abertas}</div>
              <div className="text-xs text-gray-400 mt-2">Requerem ação imediata</div>
            </div>

            <div className={`p-5 rounded-xl shadow-md card-hover animate-fade-in ${dark ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}>
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Em Análise</div>
              <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">{stats.emAnalise}</div>
              <div className="text-xs text-gray-400 mt-2">Sendo investigadas</div>
            </div>

            <div className={`p-5 rounded-xl shadow-md card-hover animate-fade-in ${dark ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}>
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Resolvidas</div>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.resolvidas}</div>
              <div className="text-xs text-gray-400 mt-2">Ações corretivas aplicadas</div>
            </div>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <div className={`p-5 rounded-xl shadow-md animate-fade-in ${dark ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}>
              <h3 className="font-semibold mb-4 text-lg">Distribuição de Qualidade</h3>
              <div className="flex flex-col items-center justify-center">
                <PieChart data={qualityData} size={180} />
                <div className="mt-4 flex gap-6 text-sm">
                  {qualityData.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-sm" 
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <span className="font-medium">{item.name}</span>
                      <span className="text-gray-500 dark:text-gray-400">({item.porcentagem}%)</span>
                    </div>
                  ))}
                </div>
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  📊 Dados sincronizados com Dashboard de Produção
                </div>
              </div>
            </div>

            <div className={`p-5 rounded-xl shadow-md animate-fade-in ${dark ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}>
              <h3 className="font-semibold mb-4 text-lg">Últimas Inspeções</h3>
              <div className="space-y-3 max-h-80 overflow-auto">
                {inspections.map((insp) => (
                  <div key={insp.id} className={`p-4 rounded-lg border smooth-transition ${dark ? 'border-gray-700 hover:border-gray-600' : 'border-gray-200 hover:border-gray-300'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-medium">{insp.id}</div>
                      <div className={`px-2 py-1 rounded text-xs ${ insp.result === 'Aprovado' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' }`}>{insp.result}</div>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">Lote: {insp.lote}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">{insp.date} • {insp.inspector}</div>
                    <div className="flex gap-4 text-sm">
                      <div><span className="text-green-600 dark:text-green-400 font-medium">{insp.approved}</span> aprovados</div>
                      <div><span className="text-red-600 dark:text-red-400 font-medium">{insp.rejected}</span> rejeitados</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className={`p-5 rounded-xl shadow-md mb-6 animate-fade-in ${dark ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}>
            <h3 className="font-semibold mb-4 text-lg">Filtros de Não-Conformidades</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Tipo</label>
                <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className={`w-full p-2 rounded-lg border smooth-transition ${dark ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300'}`}>
                  <option>Todos</option>
                  <option>Dimensional</option>
                  <option>Visual</option>
                  <option>Microbiológico</option>
                  <option>Embalagem</option>
                  <option>Peso</option>
                  <option>Textura</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Severidade</label>
                <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)} className={`w-full p-2 rounded-lg border smooth-transition ${dark ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300'}`}>
                  <option>Todos</option>
                  <option>Alta</option>
                  <option>Média</option>
                  <option>Baixa</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Buscar</label>
                <input type="text" placeholder="ID ou descrição" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={`w-full p-2 rounded-lg border smooth-transition ${dark ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-500' : 'bg-white border-gray-300 placeholder-gray-400'}`} />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            {filteredNC.map((nc, idx) => (
              <div key={nc.id} className={`p-5 rounded-xl shadow-md card-hover animate-slide-in ${dark ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`} style={{ animationDelay: `${idx * 0.05}s` }}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="text-xl font-semibold">{nc.id}</div>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${getSeverityColor(nc.severity)}`}>{nc.severity}</div>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(nc.status)}`}>{nc.status}</div>
                    </div>
                    <div className="text-lg text-gray-700 dark:text-gray-300 mb-2">{nc.description}</div>
                    <div className="flex gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <div>📦 Lote: {nc.lote}</div>
                      <div>📅 {nc.date}</div>
                      <div>👤 {nc.responsible}</div>
                    </div>
                  </div>
                  <div className={`text-4xl ${ nc.type === 'Microbiológico' ? '🦠' : nc.type === 'Visual' ? '👁️' : nc.type === 'Dimensional' ? '📏' : nc.type === 'Peso' ? '⚖️' : nc.type === 'Embalagem' ? '📦' : '🔍' }`}></div>
                </div>

                <div className={`px-4 py-2 rounded-lg mb-4 ${dark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Tipo de Não-Conformidade</div>
                  <div className="font-medium">{nc.type}</div>
                </div>

                <div className="flex gap-2">
                  <button 
                    className={`flex-1 py-2 rounded-lg border smooth-transition ${dark ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-50'}`}
                    onClick={() => handleViewDetails(nc)}
                  >
                    Ver Detalhes
                  </button>
                  {nc.status !== 'Resolvida' && (
                    <button 
                      className="flex-1 py-2 rounded-lg bg-gradient-to-r from-green-600 to-green-500 text-white smooth-transition hover:shadow-lg hover:scale-105"
                      onClick={() => handleResolveNC(nc.id)}
                    >
                      ✓ Resolver
                    </button>
                  )}
                  <button 
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 text-white smooth-transition hover:shadow-lg hover:scale-105"
                    onClick={() => handleExportNC(nc)}
                  >
                    📊
                  </button>
                </div>
              </div>
            ))}
          </section>

          {filteredNC.length === 0 && (
            <div className={`p-12 rounded-xl text-center ${dark ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}>
              <div className="text-6xl mb-4">✅</div>
              <div className="text-xl font-semibold mb-2">Nenhuma não-conformidade encontrada</div>
              <div className="text-gray-500 dark:text-gray-400">Tudo está dentro dos padrões de qualidade.</div>
            </div>
          )}
        </main>
      </div>

      {/* Modal Nova NC */}
      <Modal isOpen={showNewNCModal} onClose={() => setShowNewNCModal(false)} title="Nova Não-Conformidade">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Tipo *</label>
            <select
              value={newNC.type}
              onChange={(e) => setNewNC({...newNC, type: e.target.value})}
              className={`w-full p-2 rounded-lg border smooth-transition ${dark ? 'bg-gray-700 border-gray-600' : 'border-gray-300'}`}
            >
              <option>Dimensional</option>
              <option>Visual</option>
              <option>Microbiológico</option>
              <option>Embalagem</option>
              <option>Peso</option>
              <option>Textura</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Descrição *</label>
            <input
              type="text"
              value={newNC.description}
              onChange={(e) => setNewNC({...newNC, description: e.target.value})}
              className={`w-full p-2 rounded-lg border smooth-transition ${dark ? 'bg-gray-700 border-gray-600' : 'border-gray-300'}`}
              placeholder="Descreva a não-conformidade..."
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Severidade *</label>
            <select
              value={newNC.severity}
              onChange={(e) => setNewNC({...newNC, severity: e.target.value})}
              className={`w-full p-2 rounded-lg border smooth-transition ${dark ? 'bg-gray-700 border-gray-600' : 'border-gray-300'}`}
            >
              <option>Baixa</option>
              <option>Média</option>
              <option>Alta</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Lote *</label>
            <input
              type="text"
              value={newNC.lote}
              onChange={(e) => setNewNC({...newNC, lote: e.target.value})}
              className={`w-full p-2 rounded-lg border smooth-transition ${dark ? 'bg-gray-700 border-gray-600' : 'border-gray-300'}`}
              placeholder="Ex: LT-1025"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Detalhes Adicionais</label>
            <textarea
              rows={3}
              value={newNC.details}
              onChange={(e) => setNewNC({...newNC, details: e.target.value})}
              className={`w-full p-2 rounded-lg border smooth-transition ${dark ? 'bg-gray-700 border-gray-600' : 'border-gray-300'}`}
              placeholder="Informações adicionais sobre a não-conformidade..."
            />
          </div>
          
          <div className="flex gap-3 pt-4">
            <button
              onClick={() => setShowNewNCModal(false)}
              className={`flex-1 py-2 rounded-lg border smooth-transition ${dark ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-50'}`}
            >
              Cancelar
            </button>
            <button
              onClick={handleSaveNewNC}
              className="flex-1 py-2 rounded-lg bg-gradient-to-r from-green-600 to-green-500 text-white hover:shadow-lg smooth-transition"
            >
              Salvar NC
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Detalhes NC */}
      <Modal isOpen={!!showDetailsModal} onClose={() => setShowDetailsModal(null)} title={`Detalhes - ${showDetailsModal?.id}`}>
        {showDetailsModal && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">ID</div>
                <div className="font-semibold">{showDetailsModal.id}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Status</div>
                <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(showDetailsModal.status)}`}>
                  {showDetailsModal.status}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Tipo</div>
                <div className="font-semibold">{showDetailsModal.type}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Severidade</div>
                <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getSeverityColor(showDetailsModal.severity)}`}>
                  {showDetailsModal.severity}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Lote</div>
                <div className="font-semibold">{showDetailsModal.lote}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Data</div>
                <div className="font-semibold">{showDetailsModal.date}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Responsável</div>
                <div className="font-semibold">{showDetailsModal.responsible}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Criado por</div>
                <div className="font-semibold">{showDetailsModal.createdBy}</div>
              </div>
            </div>
            
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Descrição</div>
              <div className={`p-3 rounded-lg ${dark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                {showDetailsModal.description}
              </div>
            </div>
            
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Detalhes</div>
              <div className={`p-3 rounded-lg ${dark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                {showDetailsModal.details}
              </div>
            </div>
            
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Ações</div>
              <div className={`p-3 rounded-lg ${dark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                {showDetailsModal.actions}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Resolver NC */}
      <Modal isOpen={!!showResolveModal} onClose={() => setShowResolveModal(null)} title="Resolver Não-Conformidade">
        <div className="space-y-4">
          <div className={`p-4 rounded-lg ${dark ? 'bg-amber-900/20 border border-amber-700' : 'bg-amber-50 border border-amber-200'}`}>
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <span>⚠️</span>
              <span className="font-medium">Confirmação necessária</span>
            </div>
            <p className="text-sm text-amber-700 dark:text-amber-300 mt-2">
              Tem certeza que deseja marcar esta não-conformidade como resolvida?
              Esta ação não pode ser desfeita.
            </p>
          </div>
          
          <div className="flex gap-3 pt-4">
            <button
              onClick={() => setShowResolveModal(null)}
              className={`flex-1 py-2 rounded-lg border smooth-transition ${dark ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-50'}`}
            >
              Cancelar
            </button>
            <button
              onClick={handleSaveResolve}
              className="flex-1 py-2 rounded-lg bg-gradient-to-r from-green-600 to-green-500 text-white hover:shadow-lg smooth-transition"
            >
              Confirmar Resolução
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// Renderizar na página
const container = document.getElementById('root');
const root = ReactDOM.createRoot(container);
root.render(<App />);