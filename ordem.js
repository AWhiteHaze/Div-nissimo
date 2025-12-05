const { useState, useEffect, useMemo, useCallback } = React;

/* Componentes auxiliares */
function SummaryCard({ label, value, color = 'green', dark }) {
  const colorClass = color === 'blue'
    ? 'text-blue-600 dark:text-blue-400'
    : color === 'gray'
    ? 'text-gray-600 dark:text-gray-400'
    : 'text-green-600 dark:text-green-400';

  return (
    <div className={`p-5 rounded-xl shadow-md card-hover animate-fade-in ${dark ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}>
      <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">{label}</div>
      <div className={`text-3xl font-bold ${colorClass}`}>{value}</div>
      <div className="text-xs text-gray-400 mt-2">Período atual</div>
    </div>
  );
}

function FilterSelect({ label, value, onChange, options = [], dark }) {
  return (
    <div>
      <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full p-2 rounded-lg border smooth-transition ${dark ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300'}`}
      >
        {options.map(opt => <option key={opt}>{opt}</option>)}
      </select>
    </div>
  );
}

function FilterInput({ label, placeholder, value, onChange, dark }) {
  return (
    <div>
      <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">{label}</label>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full p-2 rounded-lg border smooth-transition ${dark ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-500' : 'bg-white border-gray-300 placeholder-gray-400'}`}
      />
    </div>
  );
}

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

function OrderCard({ ordem, idx, dark, getStatusColor, getPriorityColor, onPauseResume, onStart, onViewDetails, onExport }) {
  return (
    <div
      className={`p-5 rounded-xl shadow-md card-hover animate-slide-in ${dark ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}
      style={{ animationDelay: `${idx * 0.05}s` }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="text-xl font-semibold">{ordem.id}</div>
            <div className={`px-3 py-1 rounded-full text-xs font-medium smooth-transition ${getStatusColor(ordem.status)}`}>
              {ordem.status}
            </div>
            <div className={`text-sm font-medium ${getPriorityColor(ordem.priority)}`}>
              ⚡ {ordem.priority}
            </div>
            {ordem.paused && (
              <div className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                ⏸️ PAUSADA
              </div>
            )}
          </div>
          <div className="text-lg text-gray-700 dark:text-gray-300 mb-1">{ordem.product}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Início: {ordem.startDate} • Prazo: {ordem.deadline}
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{ordem.produced}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">de {ordem.quantity} un.</div>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-500 dark:text-gray-400">Progresso</span>
          <span className="font-medium">{ordem.progress}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
          <div
            className={`h-3 rounded-full smooth-transition ${
              ordem.progress === 100 
                ? 'bg-gradient-to-r from-green-500 to-green-400'
                : ordem.paused 
                ? 'bg-gradient-to-r from-yellow-500 to-yellow-400'
                : 'bg-gradient-to-r from-blue-500 to-blue-400'
            }`}
            style={{ width: `${ordem.progress}%` }}
          ></div>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          className={`flex-1 py-2 rounded-lg border smooth-transition ${dark ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-50'}`}
          onClick={() => onViewDetails(ordem)}
        >
          Ver Detalhes
        </button>

        {ordem.status === 'Em Produção' && (
          <button
            className={`flex-1 py-2 rounded-lg smooth-transition ${
              ordem.paused 
                ? 'bg-gradient-to-r from-green-600 to-green-500' 
                : 'bg-gradient-to-r from-amber-600 to-amber-500'
            } text-white hover:shadow-lg hover:scale-105`}
            onClick={() => onPauseResume(ordem.id)}
          >
            {ordem.paused ? '▶ Retomar' : '⏸ Pausar'}
          </button>
        )}

        {ordem.status === 'Aguardando' && (
          <button
            className="flex-1 py-2 rounded-lg bg-gradient-to-r from-green-600 to-green-500 text-white smooth-transition hover:shadow-lg hover:scale-105"
            onClick={() => onStart(ordem.id)}
          >
            ▶ Iniciar
          </button>
        )}

        <button
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 text-white smooth-transition hover:shadow-lg hover:scale-105"
          onClick={() => onExport(ordem)}
        >
          📥 Exportar
        </button>
      </div>
    </div>
  );
}

/* App principal */
function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedLine, setSelectedLine] = useState("Linha Pão de Queijo");
  const [dark, setDark] = useState(false);
  const [dbReady, setDbReady] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [priorityFilter, setPriorityFilter] = useState("Todos");
  const [searchTerm, setSearchTerm] = useState("");

  const [showDetailsModal, setShowDetailsModal] = useState(null);
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [ordens, setOrdens] = useState([
    { 
      id: 'OP-2025-089', 
      product: 'Pão de Queijo Tradicional', 
      quantity: 2000, 
      produced: 1450, 
      status: 'Em Produção', 
      priority: 'Alta', 
      startDate: '06/10/2025 08:00', 
      deadline: '06/10/2025 18:00', 
      progress: 72, 
      operator: 'João Silva', 
      machine: 'Máquina 01', 
      paused: false 
    },
    { 
      id: 'OP-2025-088', 
      product: 'Pão de Queijo Integral', 
      quantity: 1500, 
      produced: 1500, 
      status: 'Concluída', 
      priority: 'Normal', 
      startDate: '05/10/2025 14:00', 
      deadline: '06/10/2025 08:00', 
      progress: 100, 
      operator: 'Maria Santos', 
      machine: 'Máquina 02' 
    },
    { 
      id: 'OP-2025-087', 
      product: 'Pão de Queijo Orgânico', 
      quantity: 1000, 
      produced: 0, 
      status: 'Aguardando', 
      priority: 'Baixa', 
      startDate: '07/10/2025 08:00', 
      deadline: '07/10/2025 16:00', 
      progress: 0, 
      operator: 'Carlos Oliveira', 
      machine: 'Máquina 01' 
    },
    { 
      id: 'OP-2025-086', 
      product: 'Pão de Queijo Tradicional', 
      quantity: 2500, 
      produced: 2500, 
      status: 'Concluída', 
      priority: 'Alta', 
      startDate: '05/10/2025 08:00', 
      deadline: '05/10/2025 18:00', 
      progress: 100, 
      operator: 'Ana Paula', 
      machine: 'Máquina 03' 
    },
    { 
      id: 'OP-2025-085', 
      product: 'Pão de Queijo Recheado', 
      quantity: 1800, 
      produced: 920, 
      status: 'Em Produção', 
      priority: 'Normal', 
      startDate: '06/10/2025 10:00', 
      deadline: '06/10/2025 20:00', 
      progress: 51, 
      operator: 'Roberto Costa', 
      machine: 'Máquina 02', 
      paused: false 
    },
  ]);

  const [newOrder, setNewOrder] = useState({
    product: '',
    quantity: '',
    priority: 'Normal',
    deadline: '',
    operator: '',
    machine: 'Máquina 01'
  });

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
          
          // Carregar ordens do banco de dados
          const savedOrdens = await window.db.getOrdens();
          if (savedOrdens && savedOrdens.length > 0) {
            setOrdens(savedOrdens);
          }
          
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

  // Salvar ordens no banco de dados quando mudarem
  useEffect(() => {
    if (dbReady && window.db && ordens.length > 0) {
      const saveOrdens = async () => {
        try {
          for (const ordem of ordens) {
            await window.db.saveOrdem(ordem);
          }
        } catch (error) {
          console.error('Erro ao salvar ordens:', error);
        }
      };
      saveOrdens();
    }
  }, [ordens, dbReady]);

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

  // Simula progresso automático das ordens em produção
  useEffect(() => {
    const interval = setInterval(() => {
      setOrdens(prev => prev.map(ordem => {
        if (ordem.status === 'Em Produção' && !ordem.paused && ordem.progress < 100) {
          const newProduced = Math.min(ordem.quantity, ordem.produced + Math.floor(Math.random() * 15 + 5));
          const newProgress = Math.round((newProduced / ordem.quantity) * 100);
          
          // Se completou, muda status
          if (newProgress >= 100) {
            return { ...ordem, produced: ordem.quantity, progress: 100, status: 'Concluída' };
          }
          
          return { ...ordem, produced: newProduced, progress: newProgress };
        }
        return ordem;
      }));
    }, 8000); // Atualiza a cada 8 segundos
    
    return () => clearInterval(interval);
  }, []);

  const filteredOrdens = useMemo(() => {
    return ordens.filter(o => {
      if (statusFilter !== "Todos" && o.status !== statusFilter) return false;
      if (priorityFilter !== "Todos" && o.priority !== priorityFilter) return false;
      if (searchTerm && !o.id.toLowerCase().includes(searchTerm.toLowerCase()) && !o.product.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    });
  }, [ordens, statusFilter, priorityFilter, searchTerm]);

  const stats = useMemo(() => ({
    total: filteredOrdens.length,
    emProducao: filteredOrdens.filter(o => o.status === 'Em Produção').length,
    concluidas: filteredOrdens.filter(o => o.status === 'Concluída').length,
    aguardando: filteredOrdens.filter(o => o.status === 'Aguardando').length,
  }), [filteredOrdens]);

  const handlePauseResume = useCallback((ordemId) => {
    setOrdens(prev => prev.map(o => {
      if (o.id === ordemId && o.status === 'Em Produção') {
        return { ...o, paused: !o.paused };
      }
      return o;
    }));
  }, []);

  const handleStart = useCallback((ordemId) => {
    setOrdens(prev => prev.map(o => {
      if (o.id === ordemId && o.status === 'Aguardando') {
        return { ...o, status: 'Em Produção', paused: false };
      }
      return o;
    }));
    alert(`Ordem ${ordemId} iniciada!`);
  }, []);

  const handleViewDetails = useCallback((ordem) => {
    setShowDetailsModal(ordem);
  }, []);

  const handleExport = useCallback((ordem) => {
    // Criar CSV com os dados da ordem
    const csvData = [
      ['ID', 'Produto', 'Quantidade', 'Produzido', 'Status', 'Prioridade', 'Progresso', 'Operador', 'Máquina', 'Data Início', 'Prazo'],
      [ordem.id, ordem.product, ordem.quantity, ordem.produced, ordem.status, ordem.priority, `${ordem.progress}%`, ordem.operator, ordem.machine, ordem.startDate, ordem.deadline]
    ];
    
    const csv = csvData.map(row => row.join(';')).join('\n');
    
    // Criar e baixar o arquivo
    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `ordem_${ordem.id}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    
    alert(`Ordem ${ordem.id} exportada com sucesso!`);
  }, []);

  // Substitua a função handleCreateNewOrder por esta versão corrigida:

const handleCreateNewOrder = useCallback(() => {
  // Validar campos obrigatórios
  if (!newOrder.product.trim()) {
    alert('Por favor, informe o produto!');
    return;
  }
  
  if (!newOrder.quantity || newOrder.quantity <= 0) {
    alert('Por favor, informe uma quantidade válida!');
    return;
  }
  
  if (!newOrder.deadline) {
    alert('Por favor, informe o prazo!');
    return;
  }
  
  // Gerar novo ID
  const lastId = ordens.length > 0 ? 
    Math.max(...ordens.map(o => parseInt(o.id.split('-')[2]) || 0)) : 89;
  const newId = `OP-2025-${String(lastId + 1).padStart(3, '0')}`;
  
  // Formatar data atual
  const now = new Date();
  const startDate = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  
  // Formatar data do prazo (corrigido)
  let formattedDeadline;
  try {
    const deadlineDate = new Date(newOrder.deadline);
    if (isNaN(deadlineDate.getTime())) {
      throw new Error('Data inválida');
    }
    formattedDeadline = `${deadlineDate.getDate().toString().padStart(2, '0')}/${(deadlineDate.getMonth() + 1).toString().padStart(2, '0')}/${deadlineDate.getFullYear()} ${deadlineDate.getHours().toString().padStart(2, '0')}:${deadlineDate.getMinutes().toString().padStart(2, '0')}`;
  } catch (error) {
    console.error('Erro ao formatar data:', error);
    formattedDeadline = newOrder.deadline; // Usar o valor original se não conseguir formatar
  }
  
  // Criar nova ordem
  const novaOrdem = {
    id: newId,
    product: newOrder.product,
    quantity: parseInt(newOrder.quantity),
    produced: 0,
    status: 'Aguardando',
    priority: newOrder.priority,
    startDate: startDate,
    deadline: formattedDeadline,
    progress: 0,
    operator: newOrder.operator || 'Não definido',
    machine: newOrder.machine || 'Máquina 01',
    paused: false
  };
  
  // Adicionar à lista
  setOrdens(prev => [...prev, novaOrdem]);
  
  // Salvar no banco de dados
  if (dbReady && window.db) {
    try {
      window.db.saveOrdem(novaOrdem);
    } catch (error) {
      console.error('Erro ao salvar no banco:', error);
    }
  }
  
  // Limpar formulário
  setNewOrder({
    product: '',
    quantity: '',
    priority: 'Normal',
    deadline: '',
    operator: '',
    machine: 'Máquina 01'
  });
  
  // Fechar modal
  setShowNewOrderModal(false);
  
  // Mostrar mensagem de sucesso
  setTimeout(() => {
    alert(`✅ Nova ordem criada com sucesso!\n\nID: ${newId}\nProduto: ${novaOrdem.product}\nQuantidade: ${novaOrdem.quantity} unidades\nStatus: ${novaOrdem.status}`);
  }, 100);


    
    // Limpar formulário e fechar modal
    setNewOrder({
      product: '',
      quantity: '',
      priority: 'Normal',
      deadline: '',
      operator: '',
      machine: 'Máquina 01'
    });
    setShowNewOrderModal(false);
    
    alert(`Nova ordem ${newId} criada com sucesso!`);
  }, [newOrder, ordens, dbReady]);

  const handleGenerateReport = useCallback(() => {
    if (ordens.length === 0) {
      alert('Não há ordens para gerar relatório!');
      return;
    }
    
    // Criar relatório detalhado
    const reportData = [
      ['RELATÓRIO DE ORDENS DE PRODUÇÃO'],
      [`Data de geração: ${new Date().toLocaleString('pt-BR')}`],
      [`Total de ordens: ${ordens.length}`],
      [`Em produção: ${ordens.filter(o => o.status === 'Em Produção').length}`],
      [`Concluídas: ${ordens.filter(o => o.status === 'Concluída').length}`],
      [`Aguardando: ${ordens.filter(o => o.status === 'Aguardando').length}`],
      [''],
      ['DETALHES DAS ORDENS'],
      ['ID;Produto;Quantidade;Produzido;Status;Prioridade;Progresso;Operador;Máquina;Data Início;Prazo']
    ];
    
    // Adicionar cada ordem ao relatório
    ordens.forEach(ordem => {
      reportData.push([
        ordem.id,
        ordem.product,
        ordem.quantity,
        ordem.produced,
        ordem.status,
        ordem.priority,
        `${ordem.progress}%`,
        ordem.operator,
        ordem.machine,
        ordem.startDate,
        ordem.deadline
      ].join(';'));
    });
    
    // Adicionar resumo
    reportData.push('');
    reportData.push('RESUMO POR STATUS');
    reportData.push('Status;Quantidade;Percentual');
    
    const statusGroups = {};
    ordens.forEach(ordem => {
      statusGroups[ordem.status] = (statusGroups[ordem.status] || 0) + 1;
    });
    
    Object.entries(statusGroups).forEach(([status, count]) => {
      const percentual = ((count / ordens.length) * 100).toFixed(1);
      reportData.push(`${status};${count};${percentual}%`);
    });
    
    const csv = reportData.join('\n');
    
    // Criar e baixar o arquivo
    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio_ordens_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    
    alert('Relatório gerado com sucesso!');
  }, [ordens]);

  const getStatusColor = (status) => {
    switch(status) {
      case 'Em Produção': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'Concluída': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Aguardando': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'Alta': return 'text-red-600 dark:text-red-400';
      case 'Normal': return 'text-blue-600 dark:text-blue-400';
      case 'Baixa': return 'text-gray-600 dark:text-gray-400';
      default: return 'text-gray-600';
    }
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
    <div className={`h-screen smooth-transition ${dark ? 'dark bg-gray-900 text-gray-100' : 'bg-gradient-to-br from-gray-50 to-gray-100 text-gray-900'}`}>
      <div className="flex h-full">
        <aside className={`flex flex-col smooth-transition ${sidebarOpen ? 'w-64' : 'w-16'} ${dark ? 'bg-gray-800 border-gray-700' : 'bg-white shadow-lg'} border-r`}>
          <div className="p-4 flex items-center justify-between border-b dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="rounded-lg w-10 h-10 flex items-center justify-center font-bold bg-gradient-to-br from-green-400 to-green-600 text-white shadow-lg">DV</div>
              {sidebarOpen && (
                <div className="animate-fade-in">
                  <div className="text-lg font-semibold">Diviníssimo</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Ordens - Pão de Queijo</div>
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
            {navigationItems.map((item, idx) => (
              <button 
                key={item.name}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg smooth-transition ${
                  item.name === 'Ordens'
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

        <main className="flex-1 p-6 overflow-auto">
          <header className="flex items-center justify-between mb-6 animate-fade-in">
            <div className="flex items-center gap-4">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent">Ordens de Produção</h1>
              <div className="text-sm text-gray-500 dark:text-gray-400">{selectedLine}</div>
            </div>
            <div className="flex items-center gap-3">
              <div className={`flex items-center text-sm px-4 py-2 rounded-full smooth-transition ${isOnline ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                <span className={`w-2 h-2 rounded-full mr-2 ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                {isOnline ? 'Online' : 'Offline'}
              </div>
              <button
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg shadow-md hover:shadow-lg smooth-transition hover:scale-105"
                onClick={() => handleGenerateReport()}
              >
                📊 Relatório
              </button>
              <button
                className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg shadow-md hover:shadow-lg smooth-transition hover:scale-105"
                onClick={() => setShowNewOrderModal(true)}
              >
                + Nova Ordem
              </button>
            </div>
          </header>

          <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <SummaryCard label="Total de Ordens" value={stats.total} color="green" dark={dark} />
            <SummaryCard label="Em Produção" value={stats.emProducao} color="blue" dark={dark} />
            <SummaryCard label="Concluídas" value={stats.concluidas} color="green" dark={dark} />
            <SummaryCard label="Aguardando" value={stats.aguardando} color="gray" dark={dark} />
          </section>

          <section className={`p-5 rounded-xl shadow-md mb-6 animate-fade-in ${dark ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}>
            <h3 className="font-semibold mb-4 text-lg">Filtros</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FilterSelect label="Status" value={statusFilter} onChange={setStatusFilter} options={["Todos","Em Produção","Concluída","Aguardando"]} dark={dark} />
              <FilterSelect label="Prioridade" value={priorityFilter} onChange={setPriorityFilter} options={["Todos","Alta","Normal","Baixa"]} dark={dark} />
              <FilterInput label="Buscar" placeholder="ID ou produto" value={searchTerm} onChange={setSearchTerm} dark={dark} />
            </div>
          </section>

          <section className="space-y-4">
            {filteredOrdens.map((ordem, idx) => (
              <OrderCard 
                key={ordem.id} 
                ordem={ordem} 
                idx={idx} 
                dark={dark} 
                getStatusColor={getStatusColor} 
                getPriorityColor={getPriorityColor}
                onPauseResume={handlePauseResume}
                onStart={handleStart}
                onViewDetails={handleViewDetails}
                onExport={handleExport}
              />
            ))}
            {filteredOrdens.length === 0 && (
              <div className={`p-12 rounded-xl text-center ${dark ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}>
                <div className="text-6xl mb-4">📋</div>
                <div className="text-xl font-semibold mb-2">Nenhuma ordem encontrada</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Ajuste os filtros para ver mais resultados</div>
              </div>
            )}
          </section>

          <footer className={`mt-8 pt-6 border-t text-sm ${dark ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-500'}`}>
            <div className="flex justify-between items-center">
              <div>Protótipo v4 • Sistema de Ordens de Produção</div>
              <div className="text-xs">Última sincronização: {new Date().toLocaleString('pt-BR')}</div>
            </div>
          </footer>
        </main>
      </div>

      {/* Modal Detalhes */}
      <Modal isOpen={showDetailsModal !== null} onClose={() => setShowDetailsModal(null)} title={`Detalhes da Ordem ${showDetailsModal?.id}`}>
        {showDetailsModal && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Produto</div>
                <div className="font-medium text-lg">{showDetailsModal.product}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Status</div>
                <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(showDetailsModal.status)}`}>
                  {showDetailsModal.status}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Quantidade</div>
                <div className="font-medium">{showDetailsModal.quantity} unidades</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Produzido</div>
                <div className="font-medium text-green-600 dark:text-green-400">{showDetailsModal.produced} unidades</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Prioridade</div>
                <div className={`font-medium ${getPriorityColor(showDetailsModal.priority)}`}>{showDetailsModal.priority}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Progresso</div>
                <div className="font-medium">{showDetailsModal.progress}%</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Operador</div>
                <div className="font-medium">{showDetailsModal.operator}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Máquina</div>
                <div className="font-medium">{showDetailsModal.machine}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Início</div>
                <div className="font-medium">{showDetailsModal.startDate}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Prazo</div>
                <div className="font-medium">{showDetailsModal.deadline}</div>
              </div>
            </div>
            
            <div className={`p-4 rounded-lg ${dark ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <div className="text-sm font-medium mb-2">Progresso Visual</div>
              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-4">
                <div className="bg-gradient-to-r from-blue-500 to-blue-400 h-4 rounded-full smooth-transition" style={{ width: `${showDetailsModal.progress}%` }}></div>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <button 
                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:shadow-lg smooth-transition"
                onClick={() => {
                  handleExport(showDetailsModal);
                  setShowDetailsModal(null);
                }}
              >
                📥 Exportar Ordem
              </button>
              <button 
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 smooth-transition" 
                onClick={() => setShowDetailsModal(null)}
              >
                Fechar
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Nova Ordem */}
      <Modal isOpen={showNewOrderModal} onClose={() => setShowNewOrderModal(false)} title="Nova Ordem de Produção">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Produto *</label>
              <input
                type="text"
                value={newOrder.product}
                onChange={(e) => setNewOrder({...newOrder, product: e.target.value})}
                className={`w-full p-2 rounded-lg border smooth-transition ${dark ? 'bg-gray-700 border-gray-600' : 'border-gray-300'}`}
                placeholder="Ex: Pão de Queijo Tradicional"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Quantidade *</label>
              <input
                type="number"
                min="1"
                value={newOrder.quantity}
                onChange={(e) => setNewOrder({...newOrder, quantity: e.target.value})}
                className={`w-full p-2 rounded-lg border smooth-transition ${dark ? 'bg-gray-700 border-gray-600' : 'border-gray-300'}`}
                placeholder="Ex: 1000"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Prioridade</label>
              <select
                value={newOrder.priority}
                onChange={(e) => setNewOrder({...newOrder, priority: e.target.value})}
                className={`w-full p-2 rounded-lg border smooth-transition ${dark ? 'bg-gray-700 border-gray-600' : 'border-gray-300'}`}
              >
                <option value="Baixa">Baixa</option>
                <option value="Normal">Normal</option>
                <option value="Alta">Alta</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Prazo *</label>
              <input
                type="datetime-local"
                value={newOrder.deadline}
                onChange={(e) => setNewOrder({...newOrder, deadline: e.target.value})}
                className={`w-full p-2 rounded-lg border smooth-transition ${dark ? 'bg-gray-700 border-gray-600' : 'border-gray-300'}`}
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Operador</label>
              <input
                type="text"
                value={newOrder.operator}
                onChange={(e) => setNewOrder({...newOrder, operator: e.target.value})}
                className={`w-full p-2 rounded-lg border smooth-transition ${dark ? 'bg-gray-700 border-gray-600' : 'border-gray-300'}`}
                placeholder="Ex: João Silva"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Máquina</label>
              <select
                value={newOrder.machine}
                onChange={(e) => setNewOrder({...newOrder, machine: e.target.value})}
                className={`w-full p-2 rounded-lg border smooth-transition ${dark ? 'bg-gray-700 border-gray-600' : 'border-gray-300'}`}
              >
                <option value="Máquina 01">Máquina 01</option>
                <option value="Máquina 02">Máquina 02</option>
                <option value="Máquina 03">Máquina 03</option>
              </select>
            </div>
          </div>
          
          <div className="flex gap-3 pt-4">
            <button
              onClick={() => setShowNewOrderModal(false)}
              className={`flex-1 py-2 rounded-lg border smooth-transition ${dark ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-50'}`}
            >
              Cancelar
            </button>
            <button
              onClick={handleCreateNewOrder}
              className="flex-1 py-2 rounded-lg bg-gradient-to-r from-green-600 to-green-500 text-white hover:shadow-lg smooth-transition"
            >
              Criar Ordem
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