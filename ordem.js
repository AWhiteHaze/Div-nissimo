const { useState, useEffect, useMemo, useCallback } = React;

/* Componentes auxiliares */
function SummaryCard({ label, value, color = 'green', dark, icon = '📊', subtitle = '' }) {
  const colorClass = color === 'blue'
    ? 'text-blue-600 dark:text-blue-400'
    : color === 'red'
    ? 'text-red-600 dark:text-red-400'
    : color === 'gray'
    ? 'text-gray-600 dark:text-gray-400'
    : 'text-green-600 dark:text-green-400';

  return (
    <div className={`p-5 rounded-xl shadow-md card-hover animate-fade-in ${dark ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm text-gray-500 dark:text-gray-400">{label}</div>
        <span className="text-xl">{icon}</span>
      </div>
      <div className={`text-3xl font-bold ${colorClass}`}>{value}</div>
      {subtitle && <div className="text-xs text-gray-400 mt-2">{subtitle}</div>}
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

// Componente para badge de status
const StatusBadge = ({ status }) => {
  const getStatusColor = (status) => {
    switch(status) {
      case 'Em Produção': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'Concluída': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Aguardando': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      case 'Cancelada': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'Pausada': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };
  
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium smooth-transition ${getStatusColor(status)}`}>
      {status}
    </span>
  );
};

// Componente para badge de prioridade
const PriorityBadge = ({ priority }) => {
  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'Alta': return 'text-red-600 dark:text-red-400';
      case 'Normal': return 'text-blue-600 dark:text-blue-400';
      case 'Baixa': return 'text-gray-600 dark:text-gray-400';
      default: return 'text-gray-600';
    }
  };
  
  return (
    <span className={`text-sm font-medium ${getPriorityColor(priority)}`}>
      ⚡ {priority}
    </span>
  );
};

// Componente de linha da tabela de ordens
function OrderRow({ ordem, dark, onViewDetails, onPauseResume, onStart, onExport, onDelete, onUpdateStatus }) {
  const getProgressColor = (progress) => {
    if (progress === 100) return 'bg-gradient-to-r from-green-500 to-green-400';
    if (ordem.paused) return 'bg-gradient-to-r from-yellow-500 to-yellow-400';
    return 'bg-gradient-to-r from-blue-500 to-blue-400';
  };

  return (
    <tr className={`smooth-transition ${dark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} border-b dark:border-gray-700`}>
      <td className="p-4">
        <div className="font-semibold">{ordem.id}</div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{ordem.product}</div>
      </td>
      <td className="p-4">
        <StatusBadge status={ordem.status} />
      </td>
      <td className="p-4">
        <PriorityBadge priority={ordem.priority} />
      </td>
      <td className="p-4">
        <div className="text-sm">{ordem.quantity} un.</div>
        <div className="text-xs text-gray-500 dark:text-gray-400">Total</div>
      </td>
      <td className="p-4">
        <div className="text-sm font-medium text-green-600 dark:text-green-400">{ordem.produced} un.</div>
        <div className="text-xs text-gray-500 dark:text-gray-400">Produzido</div>
      </td>
      <td className="p-4">
        <div className="flex items-center gap-2">
          <div className="w-24 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
            <div
              className={`h-2 rounded-full smooth-transition ${getProgressColor(ordem.progress)}`}
              style={{ width: `${ordem.progress}%` }}
            ></div>
          </div>
          <span className="text-sm font-medium">{ordem.progress}%</span>
        </div>
      </td>
      <td className="p-4">
        <div className="text-sm">{ordem.operator}</div>
        <div className="text-xs text-gray-500 dark:text-gray-400">{ordem.machine}</div>
      </td>
      <td className="p-4">
        <div className="flex gap-1">
          <button
            onClick={() => onViewDetails(ordem)}
            className="p-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 smooth-transition"
            title="Ver detalhes"
          >
            👁️
          </button>
          
          {ordem.status === 'Em Produção' && (
            <button
              onClick={() => onPauseResume(ordem.id)}
              className="p-1.5 rounded-lg bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-300 dark:hover:bg-yellow-800 smooth-transition"
              title={ordem.paused ? 'Retomar produção' : 'Pausar produção'}
            >
              {ordem.paused ? '▶' : '⏸'}
            </button>
          )}

          {ordem.status === 'Aguardando' && (
            <button
              onClick={() => onStart(ordem.id)}
              className="p-1.5 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900 dark:text-green-300 dark:hover:bg-green-800 smooth-transition"
              title="Iniciar produção"
            >
              ▶
            </button>
          )}

          <button
            onClick={() => onExport(ordem)}
            className="p-1.5 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800 smooth-transition"
            title="Exportar ordem"
          >
            📥
          </button>

          <button
            onClick={() => onDelete(ordem.id)}
            className="p-1.5 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-800 smooth-transition"
            title="Excluir ordem"
          >
            🗑️
          </button>
        </div>
      </td>
    </tr>
  );
}

/* App principal */
function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedLine, setSelectedLine] = useState("Linha Pão de Queijo");
  const [dark, setDark] = useState(false);
  const [dbReady, setDbReady] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isLoading, setIsLoading] = useState(true);
  
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [priorityFilter, setPriorityFilter] = useState("Todos");
  const [searchTerm, setSearchTerm] = useState("");

  const [showDetailsModal, setShowDetailsModal] = useState(null);
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showUpdateStatusModal, setShowUpdateStatusModal] = useState(null);
  
  const [ordens, setOrdens] = useState([]);
  const [newOrder, setNewOrder] = useState({
    product: '',
    quantity: '',
    priority: 'Normal',
    deadline: '',
    operator: '',
    machine: 'Máquina 01',
    status: 'Aguardando'
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
          await loadOrdens();
          
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

  // Carregar ordens do banco de dados
  const loadOrdens = useCallback(async () => {
    try {
      setIsLoading(true);
      if (window.db) {
        const ordensFromDB = await window.db.getOrdens();
        // Ordenar por ID decrescente (mais recentes primeiro)
        ordensFromDB.sort((a, b) => {
          const idA = parseInt(a.id.split('-')[2]) || 0;
          const idB = parseInt(b.id.split('-')[2]) || 0;
          return idB - idA;
        });
        setOrdens(ordensFromDB);
        
        // Notificar dashboard sobre atualização
        if (window.db.emitDataChange) {
          window.db.emitDataChange('ordemUpdated', { count: ordensFromDB.length });
        }
      } else {
        // Dados de exemplo se o banco não estiver disponível
        const exemploOrdens = [
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
        ];
        setOrdens(exemploOrdens);
      }
    } catch (error) {
      console.error('Erro ao carregar ordens:', error);
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

  // Simula progresso automático das ordens em produção
  useEffect(() => {
    const interval = setInterval(async () => {
      setOrdens(prev => prev.map(ordem => {
        if (ordem.status === 'Em Produção' && !ordem.paused && ordem.progress < 100) {
          const increment = Math.floor(Math.random() * 3 + 1); // 1-3% de incremento
          const newProgress = Math.min(100, ordem.progress + increment);
          const newProduced = Math.round((newProgress / 100) * ordem.quantity);
          
          // Se completou, muda status
          if (newProgress >= 100) {
            const updatedOrdem = { 
              ...ordem, 
              produced: ordem.quantity, 
              progress: 100, 
              status: 'Concluída',
              paused: false 
            };
            
            // Salvar no banco
            if (window.db) {
              window.db.saveOrdem(updatedOrdem);
            }
            
            return updatedOrdem;
          }
          
          const updatedOrdem = { ...ordem, produced: newProduced, progress: newProgress };
          
          // Salvar no banco
          if (window.db) {
            window.db.saveOrdem(updatedOrdem);
          }
          
          return updatedOrdem;
        }
        return ordem;
      }));
    }, 10000); // Atualiza a cada 10 segundos
    
    return () => clearInterval(interval);
  }, []);

  // Filtrar ordens
  const filteredOrdens = useMemo(() => {
    return ordens.filter(o => {
      if (statusFilter !== "Todos" && o.status !== statusFilter) return false;
      if (priorityFilter !== "Todos" && o.priority !== priorityFilter) return false;
      if (searchTerm && 
          !o.id.toLowerCase().includes(searchTerm.toLowerCase()) && 
          !o.product.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !o.operator.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    });
  }, [ordens, statusFilter, priorityFilter, searchTerm]);

  // Estatísticas
  const stats = useMemo(() => {
    const total = filteredOrdens.length;
    const emProducao = filteredOrdens.filter(o => o.status === 'Em Produção').length;
    const concluidas = filteredOrdens.filter(o => o.status === 'Concluída').length;
    const aguardando = filteredOrdens.filter(o => o.status === 'Aguardando').length;
    const pausadas = filteredOrdens.filter(o => o.paused).length;
    const totalProduzido = filteredOrdens.reduce((sum, o) => sum + o.produced, 0);
    const totalQuantidade = filteredOrdens.reduce((sum, o) => sum + o.quantity, 0);
    const progressoMedio = total > 0 
      ? (filteredOrdens.reduce((sum, o) => sum + o.progress, 0) / total).toFixed(1)
      : 0;
    
    // Estatísticas por status
    const statusCounts = {};
    filteredOrdens.forEach(o => {
      statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
    });
    
    // Top operadores
    const operatorCounts = {};
    filteredOrdens.forEach(o => {
      if (o.operator) {
        operatorCounts[o.operator] = (operatorCounts[o.operator] || 0) + 1;
      }
    });
    const topOperators = Object.entries(operatorCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, count]) => ({ name, count }));
    
    // Distribuição por máquina
    const machineCounts = {};
    filteredOrdens.forEach(o => {
      if (o.machine) {
        machineCounts[o.machine] = (machineCounts[o.machine] || 0) + 1;
      }
    });
    
    return {
      total,
      emProducao,
      concluidas,
      aguardando,
      pausadas,
      totalProduzido,
      totalQuantidade,
      progressoMedio,
      statusCounts,
      topOperators,
      machineCounts
    };
  }, [filteredOrdens]);

  // Função para pausar/retomar ordem
  const handlePauseResume = useCallback(async (ordemId) => {
    try {
      const ordemIndex = ordens.findIndex(o => o.id === ordemId);
      if (ordemIndex === -1) return;
      
      const ordem = ordens[ordemIndex];
      const updatedOrdem = { ...ordem, paused: !ordem.paused };
      
      if (window.db) {
        await window.db.saveOrdem(updatedOrdem);
        await loadOrdens();
        
        // Notificar dashboard sobre atualização
        if (window.db.emitDataChange) {
          window.db.emitDataChange('ordemUpdated', updatedOrdem);
        }
      } else {
        setOrdens(prev => prev.map(o => o.id === ordemId ? updatedOrdem : o));
      }
      
      // Feedback visual
      showNotification(
        updatedOrdem.paused ? '⏸ Ordem pausada' : '▶ Ordem retomada',
        `Ordem ${ordemId} ${updatedOrdem.paused ? 'pausada' : 'retomada'} com sucesso!`,
        updatedOrdem.paused ? 'warning' : 'success'
      );
      
    } catch (error) {
      console.error('Erro ao pausar/retomar ordem:', error);
      showNotification('❌ Erro', 'Não foi possível alterar o status da ordem', 'error');
    }
  }, [ordens, loadOrdens]);

  // Função para iniciar ordem
  const handleStart = useCallback(async (ordemId) => {
    try {
      const ordemIndex = ordens.findIndex(o => o.id === ordemId);
      if (ordemIndex === -1) return;
      
      const now = new Date();
      const startDate = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      const updatedOrdem = { 
        ...ordens[ordemIndex], 
        status: 'Em Produção', 
        paused: false,
        startDate: startDate,
        progress: 0,
        produced: 0
      };
      
      if (window.db) {
        await window.db.saveOrdem(updatedOrdem);
        await loadOrdens();
        
        // Notificar dashboard sobre atualização
        if (window.db.emitDataChange) {
          window.db.emitDataChange('ordemUpdated', updatedOrdem);
        }
      } else {
        setOrdens(prev => prev.map(o => o.id === ordemId ? updatedOrdem : o));
      }
      
      showNotification('✅ Ordem iniciada', `Ordem ${ordemId} iniciada com sucesso!`, 'success');
      
    } catch (error) {
      console.error('Erro ao iniciar ordem:', error);
      showNotification('❌ Erro', 'Não foi possível iniciar a ordem', 'error');
    }
  }, [ordens, loadOrdens]);

  // Função para ver detalhes
  const handleViewDetails = useCallback((ordem) => {
    setShowDetailsModal(ordem);
  }, []);

  // Função para exportar ordem
  const handleExport = useCallback((ordem) => {
    const csvData = [
      ['ID', 'Produto', 'Quantidade', 'Produzido', 'Status', 'Prioridade', 'Progresso', 'Operador', 'Máquina', 'Data Início', 'Prazo', 'Pausada'],
      [
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
        ordem.deadline,
        ordem.paused ? 'Sim' : 'Não'
      ]
    ];
    
    const csv = csvData.map(row => row.join(';')).join('\n');
    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `ordem_${ordem.id}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    
    showNotification('📥 Ordem exportada', `Ordem ${ordem.id} exportada com sucesso!`, 'info');
  }, []);

  // Função para criar nova ordem
  const handleCreateNewOrder = useCallback(async () => {
    // Validar campos obrigatórios
    if (!newOrder.product.trim()) {
      showNotification('❌ Campo obrigatório', 'Por favor, informe o produto!', 'error');
      return;
    }
    
    if (!newOrder.quantity || newOrder.quantity <= 0) {
      showNotification('❌ Campo obrigatório', 'Por favor, informe uma quantidade válida!', 'error');
      return;
    }
    
    if (!newOrder.deadline) {
      showNotification('❌ Campo obrigatório', 'Por favor, informe o prazo!', 'error');
      return;
    }
    
    // Gerar novo ID
    let lastId = 89;
    if (ordens.length > 0) {
      const ids = ordens.map(o => {
        const match = o.id.match(/OP-\d{4}-(\d{3})/);
        return match ? parseInt(match[1]) : 0;
      });
      lastId = Math.max(...ids, 89);
    }
    const newId = `OP-2025-${String(lastId + 1).padStart(3, '0')}`;
    
    // Formatar data atual
    const now = new Date();
    const startDate = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    // Formatar data do prazo
    let formattedDeadline;
    try {
      const deadlineDate = new Date(newOrder.deadline);
      if (isNaN(deadlineDate.getTime())) {
        throw new Error('Data inválida');
      }
      formattedDeadline = `${deadlineDate.getDate().toString().padStart(2, '0')}/${(deadlineDate.getMonth() + 1).toString().padStart(2, '0')}/${deadlineDate.getFullYear()} ${deadlineDate.getHours().toString().padStart(2, '0')}:${deadlineDate.getMinutes().toString().padStart(2, '0')}`;
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      formattedDeadline = newOrder.deadline;
    }
    
    // Criar nova ordem
    const novaOrdem = {
      id: newId,
      product: newOrder.product,
      quantity: parseInt(newOrder.quantity),
      produced: 0,
      status: newOrder.status || 'Aguardando',
      priority: newOrder.priority,
      startDate: startDate,
      deadline: formattedDeadline,
      progress: 0,
      operator: newOrder.operator || 'Não definido',
      machine: newOrder.machine || 'Máquina 01',
      paused: false
    };
    
    try {
      // Salvar no banco de dados
      if (window.db) {
        await window.db.saveOrdem(novaOrdem);
        await loadOrdens();
        
        // Notificar dashboard sobre nova ordem
        if (window.db.emitDataChange) {
          window.db.emitDataChange('ordemUpdated', novaOrdem);
        }
      } else {
        // Fallback: salvar no estado local
        setOrdens(prev => [novaOrdem, ...prev]);
      }
      
      // Limpar formulário
      setNewOrder({
        product: '',
        quantity: '',
        priority: 'Normal',
        deadline: '',
        operator: '',
        machine: 'Máquina 01',
        status: 'Aguardando'
      });
      
      // Fechar modal
      setShowNewOrderModal(false);
      
      // Mostrar mensagem de sucesso
      showNotification(
        '✅ Nova ordem criada',
        `ID: ${newId}<br>Produto: ${novaOrdem.product}<br>Quantidade: ${novaOrdem.quantity} unidades<br>Status: ${novaOrdem.status}`,
        'success'
      );
      
    } catch (error) {
      console.error('Erro ao salvar nova ordem:', error);
      showNotification('❌ Erro', 'Não foi possível criar a nova ordem', 'error');
    }
  }, [newOrder, ordens, loadOrdens]);

  // Função para deletar ordem
  const handleDeleteOrder = useCallback(async (ordemId) => {
    if (!confirm(`Tem certeza que deseja excluir a ordem ${ordemId}? Esta ação não pode ser desfeita.`)) {
      return;
    }
    
    try {
      if (window.db) {
        await window.db.deleteOrdem(ordemId);
        await loadOrdens();
        
        // Notificar dashboard sobre exclusão
        if (window.db.emitDataChange) {
          window.db.emitDataChange('ordemUpdated', { deleted: ordemId });
        }
      } else {
        // Fallback: remover do estado local
        setOrdens(prev => prev.filter(o => o.id !== ordemId));
      }
      
      showNotification('🗑️ Ordem excluída', `Ordem ${ordemId} excluída com sucesso!`, 'warning');
      
    } catch (error) {
      console.error('Erro ao excluir ordem:', error);
      showNotification('❌ Erro', 'Não foi possível excluir a ordem', 'error');
    }
  }, [loadOrdens]);

  // Função para atualizar status da ordem
  const handleUpdateStatus = useCallback(async (ordemId, newStatus) => {
    try {
      const ordemIndex = ordens.findIndex(o => o.id === ordemId);
      if (ordemIndex === -1) return;
      
      const updatedOrdem = { ...ordens[ordemIndex], status: newStatus };
      
      // Se for marcada como concluída, garantir progresso 100%
      if (newStatus === 'Concluída') {
        updatedOrdem.progress = 100;
        updatedOrdem.produced = updatedOrdem.quantity;
        updatedOrdem.paused = false;
      }
      
      if (window.db) {
        await window.db.saveOrdem(updatedOrdem);
        await loadOrdens();
        
        // Notificar dashboard sobre atualização
        if (window.db.emitDataChange) {
          window.db.emitDataChange('ordemUpdated', updatedOrdem);
        }
      } else {
        setOrdens(prev => prev.map(o => o.id === ordemId ? updatedOrdem : o));
      }
      
      showNotification('✅ Status atualizado', `Ordem ${ordemId} atualizada para: ${newStatus}`, 'success');
      setShowUpdateStatusModal(null);
      
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      showNotification('❌ Erro', 'Não foi possível atualizar o status', 'error');
    }
  }, [ordens, loadOrdens]);

  // Função para gerar relatório
  const handleGenerateReport = useCallback(() => {
    if (ordens.length === 0) {
      showNotification('❌ Sem dados', 'Não há ordens para gerar relatório!', 'error');
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
      ['ID;Produto;Quantidade;Produzido;Status;Prioridade;Progresso;Operador;Máquina;Data Início;Prazo;Pausada']
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
        ordem.deadline,
        ordem.paused ? 'Sim' : 'Não'
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
    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio_ordens_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    
    showNotification('📊 Relatório gerado', 'Relatório exportado com sucesso!', 'success');
  }, [ordens]);

  // Função para mostrar notificações
  const showNotification = useCallback((title, message, type = 'info') => {
    const notification = document.createElement('div');
    const typeClasses = {
      success: dark ? 'bg-green-800 text-green-100' : 'bg-green-100 text-green-800',
      error: dark ? 'bg-red-800 text-red-100' : 'bg-red-100 text-red-800',
      warning: dark ? 'bg-yellow-800 text-yellow-100' : 'bg-yellow-100 text-yellow-800',
      info: dark ? 'bg-blue-800 text-blue-100' : 'bg-blue-100 text-blue-800'
    };
    
    notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg animate-fade-in z-50 ${typeClasses[type]}`;
    notification.innerHTML = `
      <div class="flex items-center gap-3">
        <span class="text-2xl">${type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️'}</span>
        <div>
          <div class="font-semibold">${title}</div>
          <div class="text-sm">${message}</div>
        </div>
      </div>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 5000);
  }, [dark]);

  // Função para limpar filtros
  const handleClearFilters = useCallback(() => {
    setStatusFilter('Todos');
    setPriorityFilter('Todos');
    setSearchTerm('');
    showNotification('🧹 Filtros limpos', 'Todos os filtros foram resetados', 'info');
  }, []);

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
                onClick={() => setShowStatsModal(true)}
              >
                📊 Estatísticas
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
            <SummaryCard 
              label="Total de Ordens" 
              value={stats.total} 
              color="green" 
              dark={dark}
              icon="📦"
              subtitle={`${stats.emProducao} em produção`}
            />
            <SummaryCard 
              label="Em Produção" 
              value={stats.emProducao} 
              color="blue" 
              dark={dark}
              icon="⚙️"
              subtitle={`${stats.pausadas} pausadas`}
            />
            <SummaryCard 
              label="Concluídas" 
              value={stats.concluidas} 
              color="green" 
              dark={dark}
              icon="✅"
              subtitle={`${Math.round((stats.concluidas / stats.total) * 100) || 0}% do total`}
            />
            <SummaryCard 
              label="Progresso Médio" 
              value={`${stats.progressoMedio}%`} 
              color="blue" 
              dark={dark}
              icon="📈"
              subtitle={`${stats.totalProduzido.toLocaleString()} de ${stats.totalQuantidade.toLocaleString()} un.`}
            />
          </section>

          <section className={`p-5 rounded-xl shadow-md mb-6 animate-fade-in ${dark ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Filtros</h3>
              <div className="flex gap-2">
                <button
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-lg shadow-md hover:shadow-lg smooth-transition hover:scale-105"
                  onClick={handleGenerateReport}
                >
                  📊 Relatório
                </button>
                <button
                  className="px-4 py-2 bg-gradient-to-r from-gray-600 to-gray-500 text-white rounded-lg shadow-md hover:shadow-lg smooth-transition hover:scale-105"
                  onClick={handleClearFilters}
                >
                  🧹 Limpar
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FilterSelect label="Status" value={statusFilter} onChange={setStatusFilter} options={["Todos","Em Produção","Concluída","Aguardando","Cancelada"]} dark={dark} />
              <FilterSelect label="Prioridade" value={priorityFilter} onChange={setPriorityFilter} options={["Todos","Alta","Normal","Baixa"]} dark={dark} />
              <FilterInput label="Buscar" placeholder="ID, produto ou operador" value={searchTerm} onChange={setSearchTerm} dark={dark} />
            </div>
          </section>

          {/* Tabela de ordens */}
          <section className={`rounded-xl shadow-md overflow-hidden animate-fade-in ${dark ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}>
            <div className="p-5 border-b dark:border-gray-700 flex justify-between items-center">
              <h3 className="font-semibold text-lg">Lista de Ordens</h3>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {isLoading ? 'Carregando...' : `${filteredOrdens.length} ordens encontradas`}
              </div>
            </div>
            
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                <div className="mt-4 text-gray-500 dark:text-gray-400">Carregando ordens...</div>
              </div>
            ) : filteredOrdens.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-6xl mb-4">📦</div>
                <div className="text-xl font-semibold mb-2">Nenhuma ordem encontrada</div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Ajuste os filtros ou crie uma nova ordem
                </div>
                <button
                  className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg shadow-md hover:shadow-lg smooth-transition"
                  onClick={() => setShowNewOrderModal(true)}
                >
                  + Criar Primeira Ordem
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className={`${dark ? 'bg-gray-900' : 'bg-gray-50'} border-b dark:border-gray-700`}>
                    <tr>
                      <th className="text-left p-4 text-sm font-medium text-gray-500 dark:text-gray-400">ID/Produto</th>
                      <th className="text-left p-4 text-sm font-medium text-gray-500 dark:text-gray-400">Status</th>
                      <th className="text-left p-4 text-sm font-medium text-gray-500 dark:text-gray-400">Prioridade</th>
                      <th className="text-left p-4 text-sm font-medium text-gray-500 dark:text-gray-400">Quantidade</th>
                      <th className="text-left p-4 text-sm font-medium text-gray-500 dark:text-gray-400">Produzido</th>
                      <th className="text-left p-4 text-sm font-medium text-gray-500 dark:text-gray-400">Progresso</th>
                      <th className="text-left p-4 text-sm font-medium text-gray-500 dark:text-gray-400">Operador/Máquina</th>
                      <th className="text-left p-4 text-sm font-medium text-gray-500 dark:text-gray-400">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrdens.map((ordem, idx) => (
                      <OrderRow 
                        key={ordem.id} 
                        ordem={ordem} 
                        dark={dark}
                        onViewDetails={handleViewDetails}
                        onPauseResume={handlePauseResume}
                        onStart={handleStart}
                        onExport={handleExport}
                        onDelete={handleDeleteOrder}
                        onUpdateStatus={handleUpdateStatus}
                      />
                    ))}
                  </tbody>
                </table>
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

      {/* Modal Detalhes da Ordem */}
      <Modal isOpen={showDetailsModal !== null} onClose={() => setShowDetailsModal(null)} title={`Detalhes da Ordem ${showDetailsModal?.id}`}>
        {showDetailsModal && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Produto</div>
                <div className="font-medium text-lg">{showDetailsModal.product}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Status</div>
                <div><StatusBadge status={showDetailsModal.status} /></div>
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Quantidade Total</div>
                <div className="font-medium">{showDetailsModal.quantity} unidades</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Produzido</div>
                <div className="font-medium text-green-600 dark:text-green-400">{showDetailsModal.produced} unidades</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Prioridade</div>
                <div><PriorityBadge priority={showDetailsModal.priority} /></div>
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
                <div className="text-sm text-gray500 dark:text-gray-400">Máquina</div>
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
              {showDetailsModal.paused && (
                <div className="col-span-2">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Status de Produção</div>
                  <div className="font-medium text-yellow-600 dark:text-yellow-400">⏸️ PAUSADA</div>
                </div>
              )}
            </div>
            
            <div className={`p-4 rounded-lg ${dark ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <div className="text-sm font-medium mb-2">Progresso Visual</div>
              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-4">
                <div className="bg-gradient-to-r from-blue-500 to-blue-400 h-4 rounded-full smooth-transition" style={{ width: `${showDetailsModal.progress}%` }}></div>
              </div>
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
                <span>0%</span>
                <span>{showDetailsModal.progress}%</span>
                <span>100%</span>
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
              <label className="block text-sm font-medium mb-2">Status</label>
              <select
                value={newOrder.status}
                onChange={(e) => setNewOrder({...newOrder, status: e.target.value})}
                className={`w-full p-2 rounded-lg border smooth-transition ${dark ? 'bg-gray-700 border-gray-600' : 'border-gray-300'}`}
              >
                <option value="Aguardando">Aguardando</option>
                <option value="Em Produção">Em Produção</option>
                <option value="Concluída">Concluída</option>
              </select>
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
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">Máquina</label>
              <select
                value={newOrder.machine}
                onChange={(e) => setNewOrder({...newOrder, machine: e.target.value})}
                className={`w-full p-2 rounded-lg border smooth-transition ${dark ? 'bg-gray-700 border-gray-600' : 'border-gray-300'}`}
              >
                <option value="Máquina 01">Máquina 01</option>
                <option value="Máquina 02">Máquina 02</option>
                <option value="Máquina 03">Máquina 03</option>
                <option value="Máquina 04">Máquina 04</option>
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

      {/* Modal Estatísticas */}
      <Modal isOpen={showStatsModal} onClose={() => setShowStatsModal(false)} title="Estatísticas das Ordens">
        <div className="space-y-6">
          {/* Resumo geral */}
          <div className={`p-4 rounded-lg ${dark ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <h4 className="font-semibold mb-3">Resumo Geral</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.total}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Total Ordens</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.emProducao}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Em Produção</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.concluidas}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Concluídas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.progressoMedio}%</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Progresso Médio</div>
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

          {/* Top operadores */}
          {stats.topOperators.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3">Top Operadores</h4>
              <div className="space-y-2">
                {stats.topOperators.map((operator, idx) => (
                  <div key={operator.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">#{idx + 1}</span>
                      <span className="font-medium">{operator.name}</span>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {operator.count} ordem(ns)
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Distribuição por máquina */}
          {Object.keys(stats.machineCounts).length > 0 && (
            <div>
              <h4 className="font-semibold mb-3">Distribuição por Máquina</h4>
              <div className="space-y-2">
                {Object.entries(stats.machineCounts).map(([machine, count]) => (
                  <div key={machine} className="flex items-center justify-between">
                    <div className="text-sm">{machine}</div>
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
          )}

          <div className="pt-4 border-t dark:border-gray-700">
            <button 
              className="w-full py-2 rounded-lg bg-gradient-to-r from-purple-600 to-purple-500 text-white hover:shadow-lg smooth-transition"
              onClick={handleGenerateReport}
            >
              📊 Exportar Relatório Completo
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Atualizar Status */}
      <Modal isOpen={showUpdateStatusModal !== null} onClose={() => setShowUpdateStatusModal(null)} title={`Atualizar Status - ${showUpdateStatusModal?.id}`}>
        {showUpdateStatusModal && (
          <div className="space-y-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Selecione o novo status para a ordem {showUpdateStatusModal.id}
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              {['Aguardando', 'Em Produção', 'Concluída', 'Cancelada'].map((status) => (
                <button
                  key={status}
                  className={`p-3 rounded-lg border smooth-transition ${
                    showUpdateStatusModal.status === status
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : 'border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700'
                  }`}
                  onClick={() => handleUpdateStatus(showUpdateStatusModal.id, status)}
                >
                  <StatusBadge status={status} />
                </button>
              ))}
            </div>
            
            <div className="flex gap-2 pt-4">
              <button
                className="flex-1 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 smooth-transition"
                onClick={() => setShowUpdateStatusModal(null)}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// Renderizar na página
const container = document.getElementById('root');
const root = ReactDOM.createRoot(container);
root.render(<App />);
