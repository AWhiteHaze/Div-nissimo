const { useState, useEffect, useRef, useMemo, useCallback, memo } = React;

// === CONSTANTES DE CONFIGURAÇÃO ===
const TEMP_BASE = 85;
const TEMP_MIN = 75;
const TEMP_MAX = 95;
const TEMP_IDEAL_MIN = 80;
const TEMP_IDEAL_MAX = 92;
const PRODUCTION_RATE_BASE = 0.5;
const MATERIAL_REFILL = 50;
const MATERIAL_MIN_ALERT = 5;

// === HELPER FUNCTIONS ===
const nowTime = () => new Date().toLocaleTimeString('pt-BR');

function randomAround(base, variance) {
  return +(base + (Math.random() * variance * 2 - variance)).toFixed(2);
}

function exportToCSV(filename, rows) {
  if (!rows || rows.length === 0) return alert('Nada para exportar');
  const csv = [Object.keys(rows[0]).join(";"), ...rows.map(r => Object.values(r).join(";"))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

// === SPARKLINE CHART ===
const Sparkline = memo(({ data = [], keys = ['temperature'], height = 120 }) => {
  if (!data || data.length === 0) return <div className="text-sm text-gray-500 dark:text-gray-400">Sem dados</div>;
  
  const padding = 8;
  const w = 600;
  const h = height;
  const innerW = w - padding * 2;
  const innerH = h - padding * 2;

  const { paths } = useMemo(() => {
    const values = data.flatMap(d => keys.map(k => Number(d[k] ?? 0)));
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    const scaleY = v => {
      if (max === min) return padding + innerH / 2;
      return padding + innerH - ((v - min) / (max - min)) * innerH;
    };
    
    const paths = keys.map(k => {
      const points = data.map((d, i) => {
        const x = padding + (i / (data.length - 1 || 1)) * innerW;
        const y = scaleY(Number(d[k] ?? 0));
        return `${x},${y}`;
      }).join(' ');
      return points;
    });
    
    return { paths };
  }, [data, keys, innerW, innerH]);

  const colors = ['#ef4444', '#f59e0b', '#3b82f6'];

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} className="rounded">
      <defs>
        {keys.map((k, idx) => (
          <linearGradient key={k} id={`gradient-${idx}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={colors[idx]} stopOpacity="0.3" />
            <stop offset="100%" stopColor={colors[idx]} stopOpacity="0" />
          </linearGradient>
        ))}
      </defs>
      <rect x="0" y="0" width={w} height={h} fill="transparent" />
      {paths.map((path, idx) => (
        <g key={idx}>
          <polyline 
            points={path} 
            fill="none" 
            stroke={colors[idx]} 
            strokeWidth={2.5} 
            strokeLinejoin="round" 
            strokeLinecap="round"
            style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
          />
        </g>
      ))}
    </svg>
  );
});

// === PIE CHART ===
const PieChart = memo(({ data = [], size = 190 }) => {
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

// === MODAL COMPONENT ===
const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
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

// === MAIN APP ===
function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedLine, setSelectedLine] = useState("Linha Pão de Queijo");
  const [query, setQuery] = useState("");
  const [dark, setDark] = useState(false);
  const [dbReady, setDbReady] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // Estatísticas dos módulos (AGORA COM DADOS REAIS)
  const [coletaStats, setColetaStats] = useState({ 
    totalColetas: 0, 
    totalProduzido: 0,
    eficienciaMedia: 0,
    ultimaAtualizacao: ''
  });
  const [ordensStats, setOrdensStats] = useState({ 
    totalOrdens: 0, 
    emProducao: 0, 
    concluidas: 0,
    aguardando: 0,
    ultimaAtualizacao: ''
  });
  const [relatoriosStats, setRelatoriosStats] = useState({ 
    totalRelatorios: 0, 
    concluidos: 0,
    emAnalise: 0,
    ultimaAtualizacao: ''
  });
  
  const [productionRate, setProductionRate] = useState(1.0);
  const [sensors, setSensors] = useState({
    time: nowTime(),
    temperature: TEMP_BASE,
    humidity: 35,
    power: 1200,
    materialKg: 50,
    vibration: 0.8
  });
  
  const [sensorHistory, setSensorHistory] = useState([]);
  const [productionData, setProductionData] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [auditLog, setAuditLog] = useState([]);
  const [maintenanceNeeded, setMaintenanceNeeded] = useState(false);
  
  const [showAlertDetails, setShowAlertDetails] = useState(null);
  
  const offlineQueueRef = useRef([]);
  const lastAlertRef = useRef({});
  const lastStatsUpdateRef = useRef(Date.now());

  // === FUNÇÕES DE CARREGAMENTO DE ESTATÍSTICAS ===
  const loadAllStats = useCallback(async () => {
    try {
      if (!window.db) {
        console.warn('Banco de dados não disponível');
        return;
      }

      const updateTime = new Date().toLocaleTimeString('pt-BR');
      
      // Carregar estatísticas de COLETAS
      try {
        const coletas = await window.db.getColetas();
        const totalProduzido = coletas.reduce((sum, c) => sum + (c.produced || 0), 0);
        const eficienciaMedia = coletas.length > 0 
          ? coletas.reduce((sum, c) => sum + (c.efficiency || 0), 0) / coletas.length 
          : 0;
        
        setColetaStats({
          totalColetas: coletas.length,
          totalProduzido: parseFloat(totalProduzido.toFixed(2)),
          eficienciaMedia: parseFloat(eficienciaMedia.toFixed(1)),
          ultimaAtualizacao: updateTime
        });
        
        console.log('Coletas carregadas:', coletas.length, 'total:', totalProduzido);
      } catch (error) {
        console.error('Erro ao carregar coletas:', error);
        setColetaStats(prev => ({
          ...prev,
          ultimaAtualizacao: `Erro: ${updateTime}`
        }));
      }

      // Carregar estatísticas de ORDENS
      try {
        const ordens = await window.db.getOrdens();
        const emProducao = ordens.filter(o => o.status === 'Em Produção').length;
        const concluidas = ordens.filter(o => o.status === 'Concluída').length;
        const aguardando = ordens.filter(o => o.status === 'Aguardando').length;
        
        setOrdensStats({
          totalOrdens: ordens.length,
          emProducao,
          concluidas,
          aguardando,
          ultimaAtualizacao: updateTime
        });
        
        console.log('Ordens carregadas:', ordens.length, 'em produção:', emProducao);
      } catch (error) {
        console.error('Erro ao carregar ordens:', error);
        setOrdensStats(prev => ({
          ...prev,
          ultimaAtualizacao: `Erro: ${updateTime}`
        }));
      }

      // Carregar estatísticas de RELATÓRIOS
      try {
        const relatorios = await window.db.getRelatorios();
        const concluidos = relatorios.filter(r => r.status === 'Concluído').length;
        const emAnalise = relatorios.filter(r => r.status === 'Em análise').length;
        
        setRelatoriosStats({
          totalRelatorios: relatorios.length,
          concluidos,
          emAnalise,
          ultimaAtualizacao: updateTime
        });
        
        console.log('Relatórios carregados:', relatorios.length, 'concluídos:', concluidos);
      } catch (error) {
        console.error('Erro ao carregar relatórios:', error);
        setRelatoriosStats(prev => ({
          ...prev,
          ultimaAtualizacao: `Erro: ${updateTime}`
        }));
      }

      // Registrar auditoria
      await setAudit('Dashboard', 'Estatísticas atualizadas');
      lastStatsUpdateRef.current = Date.now();
      
    } catch (error) {
      console.error('Erro geral ao carregar estatísticas:', error);
    }
  }, []);

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
        
        // Carregar dados históricos
        const sensors = await window.db.getRecentSensorReadings(60);
        if (sensors.length > 0) setSensorHistory(sensors);
        
        const prod = await window.db.getRecentProduction(24);
        if (prod.length > 0) setProductionData(prod);
        
        const logs = await window.db.getRecentAuditLogs(200);
        if (logs.length > 0) setAuditLog(logs);
        
        const alertsData = await window.db.getRecentAlerts(10);
        if (alertsData.length > 0) setAlerts(alertsData);
        
        // Carregar estatísticas iniciais
        await loadAllStats();
        
        setDbReady(true);
        
        // Cleanup
        return () => unsubscribe();
      } catch (error) {
        console.error('Erro ao inicializar banco de dados:', error);
        setDbReady(true);
      }
    };
    
    initDB();
  }, [loadAllStats]);

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

  // Atualizar estatísticas automaticamente
  useEffect(() => {
    if (!dbReady) return;

    // Atualizar a cada 30 segundos
    const interval = setInterval(() => {
      loadAllStats();
    }, 30000);

    return () => clearInterval(interval);
  }, [dbReady, loadAllStats]);

  // Escutar eventos de mudança de dados (se disponível)
  useEffect(() => {
    if (!dbReady || !window.db) return;

    // Tentar usar sistema de eventos se disponível
    if (window.db.onDataChange) {
      const unsubscribeColeta = window.db.onDataChange('coletaUpdated', () => {
        console.log('Coleta atualizada - recarregando estatísticas');
        loadAllStats();
      });

      const unsubscribeOrdem = window.db.onDataChange('ordemUpdated', () => {
        console.log('Ordem atualizada - recarregando estatísticas');
        loadAllStats();
      });

      const unsubscribeRelatorio = window.db.onDataChange('relatorioUpdated', () => {
        console.log('Relatório atualizado - recarregando estatísticas');
        loadAllStats();
      });

      return () => {
        if (unsubscribeColeta) unsubscribeColeta();
        if (unsubscribeOrdem) unsubscribeOrdem();
        if (unsubscribeRelatorio) unsubscribeRelatorio();
      };
    }
  }, [dbReady, loadAllStats]);

  useEffect(() => {
    if (isOnline && offlineQueueRef.current.length > 0) {
      const queued = [...offlineQueueRef.current];
      offlineQueueRef.current = [];
      queued.forEach(item => {
        setAudit('SyncService', `Sincronizado: ${item.type} (${item.payload?.time ?? ''})`);
      });
    }
  }, [isOnline]);

  const setAudit = useCallback(async (user, action) => {
    const auditEntry = { time: new Date().toISOString(), user, action };
    
    try {
      if (dbReady && window.db) {
        await window.db.addAuditLog(user, action);
        const logs = await window.db.getRecentAuditLogs(200);
        setAuditLog(logs);
      } else {
        // Fallback para estado local
        setAuditLog(prev => [auditEntry, ...prev].slice(0, 200));
      }
      
      if (!navigator.onLine) {
        offlineQueueRef.current.push({ type: 'audit', payload: auditEntry });
      }
    } catch (error) {
      console.error('Erro ao salvar auditoria:', error);
      // Fallback para estado local
      setAuditLog(prev => [auditEntry, ...prev].slice(0, 200));
    }
  }, [dbReady]);

  const pushAlert = useCallback(async (level, message) => {
    const now = Date.now();
    const alertKey = `${level}-${message}`;
    
    if (lastAlertRef.current[alertKey] && (now - lastAlertRef.current[alertKey]) < 30000) {
      return;
    }
    
    lastAlertRef.current[alertKey] = now;
    
    const alertEntry = { id: now, level, message, time: nowTime() };
    
    try {
      if (dbReady && window.db) {
        await window.db.addAlert(level, message);
        const alertsData = await window.db.getRecentAlerts(10);
        setAlerts(alertsData);
      } else {
        // Fallback para estado local
        setAlerts(a => [alertEntry, ...a].slice(0, 10));
      }
      
      await setAudit('Sistema', `Alerta: ${message}`);
    } catch (error) {
      console.error('Erro ao salvar alerta:', error);
      // Fallback para estado local
      setAlerts(a => [alertEntry, ...a].slice(0, 10));
    }
  }, [setAudit, dbReady]);

  // Simulação de sensores
  useEffect(() => {
    const id = setInterval(async () => {
      setSensors(prev => {
        const produced = PRODUCTION_RATE_BASE * productionRate;
        const materialConsumed = produced * 0.02;
        
        let newMaterial = Math.max(0, prev.materialKg - materialConsumed);
        
        if (newMaterial < 2) {
          newMaterial = MATERIAL_REFILL;
          pushAlert('info', `Matéria-prima reabastecida: ${MATERIAL_REFILL}kg`);
        }
        
        const targetTemp = TEMP_BASE + (productionRate - 1) * 8;
        const tempVariance = 3;
        let newTemp = prev.temperature + (targetTemp - prev.temperature) * 0.3 + randomAround(0, tempVariance);
        newTemp = Math.max(TEMP_MIN, Math.min(TEMP_MAX, newTemp));
        
        const targetVibration = 0.8 + (productionRate - 1) * 0.5;
        let newVibration = prev.vibration + (targetVibration - prev.vibration) * 0.2 + randomAround(0, 0.3);
        newVibration = Math.max(0.5, Math.min(4, newVibration));
        
        const targetPower = 1200 + (productionRate - 1) * 300;
        const newPower = randomAround(targetPower, 150);
        
        const newReading = {
          time: nowTime(),
          temperature: +newTemp.toFixed(2),
          humidity: randomAround(35, 4),
          power: +newPower.toFixed(0),
          materialKg: +newMaterial.toFixed(2),
          vibration: +newVibration.toFixed(2)
        };
        
        // Atualizar histórico de sensores
        if (dbReady && window.db) {
          (async () => {
            try {
              await window.db.addSensorReading(newReading);
              const sensors = await window.db.getRecentSensorReadings(60);
              setSensorHistory(sensors);
              
              const producedUnits = Math.round(produced * 20);
              await window.db.addProductionData({ time: newReading.time, produced: producedUnits });
              const prod = await window.db.getRecentProduction(24);
              setProductionData(prod);
            } catch (error) {
              console.error('Erro ao salvar no banco:', error);
              // Fallback para estado local
              setSensorHistory(h => [...h.slice(-59), newReading]);
              const producedUnits = Math.round(produced * 20);
              setProductionData(p => [...p.slice(-23), { time: newReading.time, produced: producedUnits }]);
            }
          })();
        } else {
          // Estado local quando database não está disponível
          setSensorHistory(h => [...h.slice(-59), newReading]);
          const producedUnits = Math.round(produced * 20);
          setProductionData(p => [...p.slice(-23), { time: newReading.time, produced: producedUnits }]);
        }
        
        setAudit("SensorGateway", `Leitura: T:${newReading.temperature}°C V:${newReading.vibration}g M:${newReading.materialKg}kg`);
        
        if (newReading.temperature >= TEMP_IDEAL_MAX) {
          pushAlert('critical', `Temperatura acima do ideal: ${newReading.temperature}°C`);
        } else if (newReading.temperature <= TEMP_IDEAL_MIN) {
          pushAlert('warning', `Temperatura abaixo do ideal: ${newReading.temperature}°C`);
        }
        
        if (newReading.vibration > 3.0) {
          pushAlert('critical', `Vibração elevada: ${newReading.vibration}g – possível falha`);
        } else if (newReading.vibration > 2.0) {
          pushAlert('warning', `Vibração aumentada: ${newReading.vibration}g`);
        }
        
        if (newReading.materialKg < MATERIAL_MIN_ALERT) {
          pushAlert('warning', `Matéria-prima baixa: ${newReading.materialKg}kg – reabastecer em breve`);
        }
        
        const recentVibrations = [...sensorHistory.slice(-9).map(s => s.vibration), newReading.vibration];
        const avgVibration = recentVibrations.reduce((a, b) => a + b, 0) / recentVibrations.length;
        setMaintenanceNeeded(avgVibration > 1.8);
        
        return newReading;
      });
    }, 5000);
    
    return () => clearInterval(id);
  }, [productionRate, sensorHistory, pushAlert, setAudit, dbReady]);

  const totalProduced = useMemo(() => 
    productionData.reduce((s, p) => s + (p.produced || 0), 0), 
    [productionData]
  );

  const efficiency = useMemo(() => 
    Math.round((totalProduced / 2000) * 100), 
    [totalProduced]
  );

  const filteredAudit = useMemo(() => {
    if (!query) return auditLog;
    const q = query.toLowerCase();
    return auditLog.filter(a => (a.user + ' ' + a.action + ' ' + a.time).toLowerCase().includes(q));
  }, [auditLog, query]);

  const qualityData = useMemo(() => {
    const aprovado = 480;
    const rejeitado = 20;
    const total = aprovado + rejeitado;
    return [
      { name: 'Aprovado', value: aprovado, color: '#10B981', porcentagem: Math.round((aprovado / total) * 100) },
      { name: 'Rejeitado', value: rejeitado, color: '#EF4444', porcentagem: Math.round((rejeitado / total) * 100) }
    ];
  }, []);

  const clearAlerts = useCallback(async () => {
    try {
      if (dbReady && window.db) {
        await window.db.clearAlerts();
        setAlerts([]);
      } else {
        setAlerts([]);
      }
      await setAudit('Operador', 'Limpeza de alertas');
    } catch (error) {
      console.error('Erro ao limpar alertas:', error);
      setAlerts([]);
    }
  }, [setAudit, dbReady]);

  const exportAuditCSV = useCallback(() => {
    if (auditLog.length === 0) return alert('Sem registros para exportar');
    exportToCSV('audit_log.csv', auditLog.map(a => ({ time: a.time, user: a.user, action: a.action })));
    setAudit('Operador', 'Exportou auditoria (CSV)');
  }, [auditLog, setAudit]);

  const forceSyncOffline = useCallback(() => {
    if (offlineQueueRef.current.length === 0) return alert('Fila offline vazia');
    const items = [...offlineQueueRef.current];
    offlineQueueRef.current = [];
    items.forEach(it => setAudit('SyncManual', `Sincronizado manual: ${it.type} ${it.payload?.time ?? ''}`));
    alert(`${items.length} item(s) sincronizados (simulado).`);
  }, [setAudit]);

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
              <div className="rounded-lg w-10 h-10 flex items-center justify-center font-bold bg-gradient-to-br from-green-400 to-green-600 text-white shadow-lg">
                DV
              </div>
              {sidebarOpen && (
                <div className="animate-fade-in">
                  <div className="text-lg font-semibold">Diviníssimo</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Dashboard</div>
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
            {navigationItems.map((item) => (
              <button 
                key={item.name} 
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg smooth-transition ${
                  item.name === 'Dashboard' 
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
              <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent">
                Dashboard de Produção
              </h1>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {selectedLine} • {sensors.time}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button 
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg shadow-md hover:shadow-lg smooth-transition hover:scale-105"
                onClick={loadAllStats}
                title="Atualizar dados dos módulos"
              >
                🔄 Atualizar
              </button>
              <div className={`flex items-center text-sm px-4 py-2 rounded-full smooth-transition ${isOnline ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                <span className={`w-2 h-2 rounded-full mr-2 ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                {isOnline ? 'Online' : 'Offline'}
              </div>
            </div>
          </header>

          {/* Controle de Velocidade de Produção */}
          <section className={`mb-6 p-4 rounded-xl ${dark ? 'bg-gray-800 border border-gray-700' : 'bg-white shadow-md'}`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold mb-1">Velocidade de Produção</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Controle a taxa de produção (afeta temperatura e consumo)</p>
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setProductionRate(r => Math.max(0.5, r - 0.25))}
                  className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  - Lento
                </button>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 w-20 text-center">
                  {productionRate.toFixed(2)}x
                </div>
                <button 
                  onClick={() => setProductionRate(r => Math.min(2, r + 0.25))}
                  className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  + Rápido
                </button>
              </div>
            </div>
          </section>

          {/* Cartões de Estatísticas dos Módulos - DADOS REAIS */}
          <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {/* Coletas - Dados reais */}
            <div className={`p-5 rounded-xl shadow-md card-hover animate-fade-in ${dark ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm text-gray-500 dark:text-gray-400">Coletas</div>
                <span className="text-xl">📋</span>
              </div>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{coletaStats.totalColetas}</div>
              <div className="text-xs text-gray-400 mt-1">Total de coletas</div>
              <div className="mt-2 space-y-1">
                <div className="text-sm text-green-600 dark:text-green-400">
                  {coletaStats.totalProduzido.toFixed(1)} kg produzidos
                </div>
                <div className="text-sm text-amber-600 dark:text-amber-400">
                  {coletaStats.eficienciaMedia}% eficiência
                </div>
                <div className="text-xs text-gray-400 mt-2">
                  Atualizado: {coletaStats.ultimaAtualizacao || 'Nunca'}
                </div>
              </div>
            </div>

            {/* Ordens - Dados reais */}
            <div className={`p-5 rounded-xl shadow-md card-hover animate-fade-in ${dark ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`} style={{ animationDelay: '0.1s' }}>
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm text-gray-500 dark:text-gray-400">Ordens</div>
                <span className="text-xl">📦</span>
              </div>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">{ordensStats.totalOrdens}</div>
              <div className="text-xs text-gray-400 mt-1">Total de ordens</div>
              <div className="mt-2 space-y-2">
                <div className="flex gap-2">
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded">
                    {ordensStats.emProducao} produção
                  </span>
                  <span className="text-xs px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded">
                    {ordensStats.concluidas} concluídas
                  </span>
                </div>
                <div className="text-xs text-gray-400">
                  Atualizado: {ordensStats.ultimaAtualizacao || 'Nunca'}
                </div>
              </div>
            </div>

            {/* Relatórios - Dados reais */}
            <div className={`p-5 rounded-xl shadow-md card-hover animate-fade-in ${dark ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`} style={{ animationDelay: '0.2s' }}>
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm text-gray-500 dark:text-gray-400">Relatórios</div>
                <span className="text-xl">📈</span>
              </div>
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{relatoriosStats.totalRelatorios}</div>
              <div className="text-xs text-gray-400 mt-1">Relatórios gerados</div>
              <div className="mt-2 space-y-1">
                <div className="text-sm text-amber-600 dark:text-amber-400">
                  {relatoriosStats.concluidos} concluídos
                </div>
                <div className="text-sm text-blue-600 dark:text-blue-400">
                  {relatoriosStats.emAnalise} em análise
                </div>
                <div className="text-xs text-gray-400 mt-2">
                  Atualizado: {relatoriosStats.ultimaAtualizacao || 'Nunca'}
                </div>
              </div>
            </div>

            {/* Eficiência Geral */}
            <div className={`p-5 rounded-xl shadow-md card-hover animate-fade-in ${dark ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`} style={{ animationDelay: '0.3s' }}>
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm text-gray-500 dark:text-gray-400">Eficiência Geral</div>
                <span className="text-xl">⚡</span>
              </div>
              <div className={`text-3xl font-bold ${efficiency >= 90 ? 'text-green-600 dark:text-green-400' : efficiency >= 75 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
                {efficiency}%
              </div>
              <div className="text-xs text-gray-400 mt-1">Baseado na produção</div>
              <div className="mt-2">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full smooth-transition ${efficiency >= 90 ? 'bg-gradient-to-r from-green-500 to-green-400' : efficiency >= 75 ? 'bg-gradient-to-r from-amber-500 to-amber-400' : 'bg-gradient-to-r from-red-500 to-red-400'}`}
                    style={{ width: `${Math.min(efficiency, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            {/* Qualidade */}
            <div className={`p-5 rounded-xl shadow-md animate-fade-in ${dark ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}>
              <h3 className="font-semibold mb-4 text-lg">Qualidade (última hora)</h3>
              <div className="flex items-center justify-center mb-4">
                <PieChart data={qualityData} size={190} />
              </div>
              <div className="grid grid-cols-2 gap-4 text-center">
                {qualityData.map(item => (
                  <div key={item.name} className="p-3 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800">
                    <div className="text-2xl font-bold" style={{ color: item.color }}>{item.porcentagem}%</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{item.name}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Alertas */}
            <div className={`p-5 rounded-xl shadow-md animate-fade-in ${dark ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">Alertas</h3>
                <div className="flex items-center gap-2">
                  <button 
                    className="text-xs px-3 py-1 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:shadow-md smooth-transition"
                    onClick={() => setShowAlertDetails(true)}
                  >
                    Ver Todos
                  </button>
                  <button 
                    className="text-xs px-3 py-1 rounded-full bg-gradient-to-r from-red-500 to-red-600 text-white hover:shadow-md smooth-transition"
                    onClick={clearAlerts}
                  >
                    Limpar
                  </button>
                </div>
              </div>
              <div className="space-y-3">
                {alerts.length === 0 ? (
                  <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                    Nenhum alerta recente
                  </div>
                ) : (
                  alerts.map(alert => (
                    <div 
                      key={alert.id} 
                      className={`p-3 rounded-lg border-l-4 smooth-transition ${
                        alert.level === 'critical' 
                          ? 'bg-red-50 dark:bg-red-900/20 border-red-500' 
                          : alert.level === 'warning'
                          ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-500'
                          : 'bg-blue-50 dark:bg-blue-900/20 border-blue-500'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">{alert.message}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{alert.time}</div>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          alert.level === 'critical' 
                            ? 'bg-red-500 text-white' 
                            : alert.level === 'warning'
                            ? 'bg-amber-500 text-white'
                            : 'bg-blue-500 text-white'
                        }`}>
                          {alert.level === 'critical' ? 'Crítico' : alert.level === 'warning' ? 'Aviso' : 'Info'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>

          <section className="mb-6">
            {/* Registro de Auditoria */}
            <div className={`p-5 rounded-xl shadow-md animate-fade-in ${dark ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">Registro de Auditoria</h3>
                <div className="flex items-center gap-2">
                  <input 
                    type="text" 
                    placeholder="Buscar..." 
                    className={`px-3 py-1 rounded-lg border text-sm smooth-transition ${
                      dark ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300'
                    }`}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                  <button 
                    className="text-xs px-3 py-1 rounded-full bg-gradient-to-r from-green-500 to-green-600 text-white hover:shadow-md smooth-transition"
                    onClick={exportAuditCSV}
                  >
                    Exportar
                  </button>
                </div>
              </div>
              <div className="max-h-80 overflow-auto">
                {filteredAudit.length === 0 ? (
                  <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                    {query ? 'Nenhum resultado encontrado' : 'Nenhum registro de auditoria'}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredAudit.map((entry, idx) => (
                      <div 
                        key={idx} 
                        className={`p-3 rounded-lg smooth-transition ${
                          dark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">{entry.action}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {entry.user} • {entry.time}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Modo Offline */}
          {!isOnline && (
            <div className={`p-4 rounded-xl mb-6 border-2 border-dashed ${
              dark ? 'bg-amber-900/20 border-amber-700' : 'bg-amber-50 border-amber-200'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">📡</div>
                  <div>
                    <div className="font-semibold">Modo Offline</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {offlineQueueRef.current.length} ação(ões) pendente(s) de sincronização
                    </div>
                  </div>
                </div>
                <button 
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg shadow-md hover:shadow-lg smooth-transition"
                  onClick={forceSyncOffline}
                >
                  Sincronizar Agora
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modal de Detalhes de Alertas */}
      <Modal isOpen={showAlertDetails} onClose={() => setShowAlertDetails(false)} title="Histórico de Alertas">
        <div className="space-y-3">
          {alerts.length === 0 ? (
            <div className="text-center py-4 text-gray-500 dark:text-gray-400">
              Nenhum alerta registrado
            </div>
          ) : (
            alerts.map(alert => (
              <div 
                key={alert.id} 
                className={`p-3 rounded-lg border-l-4 ${
                  alert.level === 'critical' 
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-500' 
                    : alert.level === 'warning'
                    ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-500'
                    : 'bg-blue-50 dark:bg-blue-900/20 border-blue-500'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">{alert.message}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{alert.time}</div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    alert.level === 'critical' 
                      ? 'bg-red-500 text-white' 
                      : alert.level === 'warning'
                      ? 'bg-amber-500 text-white'
                      : 'bg-blue-500 text-white'
                  }`}>
                    {alert.level === 'critical' ? 'Crítico' : alert.level === 'warning' ? 'Aviso' : 'Info'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));
