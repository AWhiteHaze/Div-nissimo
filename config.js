const { useState, useEffect, useCallback } = React;

function Config() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedLine, setSelectedLine] = useState("Linha Pão de Queijo");
  const [dark, setDark] = useState(false);
  const [dbReady, setDbReady] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  const [notificacoes, setNotificacoes] = useState(true);
  const [autoAtualizar, setAutoAtualizar] = useState(false);
  const [idioma, setIdioma] = useState("pt-BR");
  const [temaCor, setTemaCor] = useState("verde");
  const [intervaloAtualizacao, setIntervaloAtualizacao] = useState(30);
  const [modoOffline, setModoOffline] = useState(true);
  const [backupAutomatico, setBackupAutomatico] = useState(true);
  const [exportarDados, setExportarDados] = useState(false);
  const [limparDados, setLimparDados] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [actionType, setActionType] = useState("");

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
          const notifications = await window.db.getConfig('notificacoes');
          const autoUpdate = await window.db.getConfig('autoAtualizar');
          const language = await window.db.getConfig('idioma');
          const themeColor = await window.db.getConfig('temaCor');
          const updateInterval = await window.db.getConfig('intervaloAtualizacao');
          const offlineMode = await window.db.getConfig('modoOffline');
          const autoBackup = await window.db.getConfig('backupAutomatico');
          
          if (darkMode !== null) setDark(darkMode);
          if (line !== null) setSelectedLine(line);
          if (sidebar !== null) setSidebarOpen(sidebar);
          if (notifications !== null) setNotificacoes(notifications);
          if (autoUpdate !== null) setAutoAtualizar(autoUpdate);
          if (language !== null) setIdioma(language);
          if (themeColor !== null) setTemaCor(themeColor);
          if (updateInterval !== null) setIntervaloAtualizacao(updateInterval);
          if (offlineMode !== null) setModoOffline(offlineMode);
          if (autoBackup !== null) setBackupAutomatico(autoBackup);
          
          // Escutar mudanças de tema de outras páginas
          const unsubscribe = window.db.onConfigChange('dark', (newValue) => {
            console.log('Tema mudou para:', newValue ? 'escuro' : 'claro');
            setDark(newValue);
          });
          
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

  // Aplicar configurações de tema e cores
  useEffect(() => {
    // Aplicar tema escuro/claro
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Aplicar cor do tema
    const root = document.documentElement;
    const colors = {
      verde: { primary: '#16a34a', secondary: '#22c55e', gradient: 'from-green-600 to-green-500' },
      azul: { primary: '#1d4ed8', secondary: '#3b82f6', gradient: 'from-blue-600 to-blue-500' },
      roxo: { primary: '#6d28d9', secondary: '#8b5cf6', gradient: 'from-purple-600 to-purple-500' },
      laranja: { primary: '#ea580c', secondary: '#f97316', gradient: 'from-orange-600 to-orange-500' }
    };

    const colorConfig = colors[temaCor] || colors.verde;
    
    // Aplicar variáveis CSS
    root.style.setProperty('--color-primary', colorConfig.primary);
    root.style.setProperty('--color-secondary', colorConfig.secondary);
    
    // Atualizar classes dinamicamente
    document.querySelectorAll('.theme-gradient').forEach(el => {
      el.className = el.className.replace(/from-\w+-\d+ to-\w+-\d+/, colorConfig.gradient);
    });

  }, [dark, temaCor]);

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

  useEffect(() => {
    if (dbReady && window.db) {
      window.db.setConfig('notificacoes', notificacoes);
    }
  }, [notificacoes, dbReady]);

  useEffect(() => {
    if (dbReady && window.db) {
      window.db.setConfig('autoAtualizar', autoAtualizar);
    }
  }, [autoAtualizar, dbReady]);

  useEffect(() => {
    if (dbReady && window.db) {
      window.db.setConfig('idioma', idioma);
    }
  }, [idioma, dbReady]);

  useEffect(() => {
    if (dbReady && window.db) {
      window.db.setConfig('temaCor', temaCor);
    }
  }, [temaCor, dbReady]);

  useEffect(() => {
    if (dbReady && window.db) {
      window.db.setConfig('intervaloAtualizacao', intervaloAtualizacao);
    }
  }, [intervaloAtualizacao, dbReady]);

  useEffect(() => {
    if (dbReady && window.db) {
      window.db.setConfig('modoOffline', modoOffline);
    }
  }, [modoOffline, dbReady]);

  useEffect(() => {
    if (dbReady && window.db) {
      window.db.setConfig('backupAutomatico', backupAutomatico);
    }
  }, [backupAutomatico, dbReady]);

  // Função para alternar tema
  const toggleDark = () => {
    setDark(prev => !prev);
  };

  // Função para salvar todas as configurações
  const salvarConfiguracoes = useCallback(async () => {
    if (dbReady && window.db) {
      try {
        // Todas as configurações já são salvas automaticamente pelos useEffects
        await window.db.addAuditLog('Usuário', 'Configurações atualizadas');
        
        // Aplicar configurações em tempo real
        aplicarConfiguracoes();
        
        alert('Configurações salvas com sucesso! As alterações foram aplicadas em todo o sistema.');
      } catch (error) {
        console.error('Erro ao salvar configurações:', error);
        alert('Erro ao salvar configurações.');
      }
    } else {
      alert('Configurações salvas (modo offline)');
    }
  }, [dbReady]);

  const aplicarConfiguracoes = () => {
    // Aplicar idioma
    const textos = {
      'pt-BR': { titulo: 'Configurações Salvas', mensagem: 'Configurações aplicadas com sucesso!' },
      'en-US': { titulo: 'Settings Saved', mensagem: 'Settings applied successfully!' },
      'es-ES': { titulo: 'Configuraciones Guardadas', mensagem: '¡Configuraciones aplicadas con éxito!' }
    };
    
    const texto = textos[idioma] || textos['pt-BR'];
    
    // Aplicar notificações
    if (notificacoes) {
      console.log('Sistema de notificações ativado');
    } else {
      console.log('Sistema de notificações desativado');
    }
    
    // Aplicar auto-atualização
    if (autoAtualizar) {
      console.log(`Auto-atualização configurada para ${intervaloAtualizacao} segundos`);
    }
  };

  const handleExportData = useCallback(async () => {
    if (window.db) {
      try {
        const allData = await window.db.exportAllData();
        const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `backup_divinissimo_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
        
        await window.db.addAuditLog('Sistema', 'Backup de dados exportado');
        alert('Dados exportados com sucesso!');
      } catch (error) {
        console.error('Erro ao exportar dados:', error);
        alert('Erro ao exportar dados.');
      }
    }
  }, []);

  const handleClearData = useCallback(async () => {
    if (window.db) {
      try {
        await window.db.clearAllData();
        await window.db.initializeDefaultData();
        
        await window.db.addAuditLog('Sistema', 'Todos os dados foram limpos');
        alert('Dados limpos com sucesso! O sistema foi reinicializado.');
        
        // Recarregar a página para aplicar as mudanças
        setTimeout(() => window.location.reload(), 2000);
      } catch (error) {
        console.error('Erro ao limpar dados:', error);
        alert('Erro ao limpar dados.');
      }
    }
  }, []);

  const handleConfirmAction = (type) => {
    setActionType(type);
    setShowConfirmModal(true);
  };

  const executeAction = () => {
    switch (actionType) {
      case 'export':
        handleExportData();
        break;
      case 'clear':
        handleClearData();
        break;
      default:
        break;
    }
    setShowConfirmModal(false);
  };

  const getGradientClass = () => {
    const gradients = {
      verde: 'from-green-600 to-green-500',
      azul: 'from-blue-600 to-blue-500',
      roxo: 'from-purple-600 to-purple-500',
      laranja: 'from-orange-600 to-orange-500'
    };
    return gradients[temaCor] || gradients.verde;
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

  const navigationItems = [
    { name: 'Dashboard', icon: '🏠', url: 'index.html' },
    { name: 'Coleta', icon: '📋', url: 'coleta.html' },
    { name: 'Ordens', icon: '📦', url: 'ordem.html' },
    { name: 'Qualidade', icon: '🔬', url: 'qualidade.html' },
    { name: 'Relatórios', icon: '📈', url: 'relatorios.html' },
    { name: 'Config', icon: '⚙️', url: 'config.html' }
  ];

  return (
    <div className={`h-screen flex smooth-transition ${dark ? 'dark bg-gray-900 text-gray-100' : 'bg-gradient-to-br from-gray-50 to-gray-100 text-gray-900'}`}>
      
      <aside className={`flex flex-col smooth-transition ${sidebarOpen ? 'w-64' : 'w-16'} ${dark ? 'bg-gray-800 border-gray-700' : 'bg-white shadow-lg'} border-r`}>
        <div className="p-4 flex items-center justify-between border-b dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className={`rounded-lg w-10 h-10 flex items-center justify-center font-bold bg-gradient-to-br ${getGradientClass()} text-white shadow-lg`}>
              DV
            </div>
            {sidebarOpen && (
              <div className="animate-fade-in">
                <div className="text-lg font-semibold">Diviníssimo</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Configurações</div>
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
                item.name === 'Config' 
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
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Linha</div>
              <select 
                className={`w-full p-2 rounded-lg border smooth-transition ${dark ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300'}`}
                value={selectedLine} 
                onChange={(e) => setSelectedLine(e.target.value)}
              >
                <option>Linha Pão de Queijo</option>
                <option>Linha Snacks</option>
              </select>
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
            <h1 className={`text-3xl font-bold bg-gradient-to-r ${getGradientClass()} bg-clip-text text-transparent`}>
              Configurações
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
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Configurações Gerais */}
          <section className={`rounded-xl shadow-md p-6 animate-fade-in ${dark ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span>⚙️</span> Configurações Gerais
            </h2>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">Notificações</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Receber alertas de produção e qualidade</p>
                </div>
                <label className="inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={notificacoes} 
                    onChange={() => setNotificacoes(n => !n)} 
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-green-400 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500 relative"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">Atualização Automática</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Verificar novos dados automaticamente</p>
                </div>
                <label className="inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={autoAtualizar} 
                    onChange={() => setAutoAtualizar(a => !a)} 
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:ring-2 peer-focus:ring-green-400 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500 relative"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">Modo Offline</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Funcionamento sem conexão à internet</p>
                </div>
                <label className="inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={modoOffline} 
                    onChange={() => setModoOffline(m => !m)} 
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:ring-2 peer-focus:ring-green-400 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500 relative"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">Backup Automático</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Salvar dados automaticamente</p>
                </div>
                <label className="inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={backupAutomatico} 
                    onChange={() => setBackupAutomatico(b => !b)} 
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:ring-2 peer-focus:ring-green-400 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500 relative"></div>
                </label>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">Intervalo de Atualização</h3>
                <div className="flex items-center gap-4">
                  <input 
                    type="range" 
                    min="10" 
                    max="120" 
                    step="10"
                    value={intervaloAtualizacao}
                    onChange={(e) => setIntervaloAtualizacao(parseInt(e.target.value))}
                    className="w-full"
                  />
                  <span className="text-sm font-medium">{intervaloAtualizacao}s</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Tempo entre verificações automáticas de dados
                </p>
              </div>
            </div>
          </section>

          {/* Aparência e Idioma */}
          <section className={`rounded-xl shadow-md p-6 animate-fade-in ${dark ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span>🎨</span> Aparência e Idioma
            </h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Idioma</h3>
                <select
                  value={idioma}
                  onChange={(e) => setIdioma(e.target.value)}
                  className={`w-full p-3 border rounded-lg smooth-transition ${dark ? 'bg-gray-700 border-gray-600 text-gray-100' : 'border-gray-300'}`}
                >
                  <option value="pt-BR">🇧🇷 Português (Brasil)</option>
                  <option value="en-US">🇺🇸 English (US)</option>
                  <option value="es-ES">🇪🇸 Español</option>
                </select>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">Cor do Tema</h3>
                <div className="flex gap-4">
                  {['verde', 'azul', 'roxo', 'laranja'].map(cor => (
                    <button
                      key={cor}
                      onClick={() => setTemaCor(cor)}
                      className={`w-12 h-12 rounded-full border-2 smooth-transition ${
                        temaCor === cor ? 'border-black dark:border-white scale-110' : 'border-transparent'
                      }`}
                      style={{
                        background: {
                          verde: 'linear-gradient(135deg, #22c55e, #16a34a)',
                          azul: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                          roxo: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
                          laranja: 'linear-gradient(135deg, #f97316, #ea580c)',
                        }[cor],
                      }}
                      title={cor.charAt(0).toUpperCase() + cor.slice(1)}
                    />
                  ))}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Cor principal utilizada em todo o sistema
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">Tema Escuro</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Interface em modo escuro</p>
                </div>
                <label className="inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={dark} 
                    onChange={toggleDark} 
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:ring-2 peer-focus:ring-green-400 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500 relative"></div>
                </label>
              </div>
            </div>
          </section>

          {/* Gerenciamento de Dados */}
          <section className={`rounded-xl shadow-md p-6 animate-fade-in ${dark ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span>💾</span> Gerenciamento de Dados
            </h2>
            
            <div className="space-y-4">
              <button 
                className={`w-full p-4 text-left rounded-lg border smooth-transition ${
                  dark ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => handleConfirmAction('export')}
              >
                <div className="font-medium">Exportar Dados</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Fazer backup de todos os dados do sistema
                </div>
              </button>

              <button 
                className={`w-full p-4 text-left rounded-lg border smooth-transition ${
                  dark ? 'border-red-600 hover:bg-red-900/20' : 'border-red-300 hover:bg-red-50'
                }`}
                onClick={() => handleConfirmAction('clear')}
              >
                <div className="font-medium text-red-600 dark:text-red-400">Limpar Todos os Dados</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Remove todos os dados e reinicia o sistema
                </div>
              </button>
            </div>
          </section>

          {/* Informações do Sistema */}
          <section className={`rounded-xl shadow-md p-6 animate-fade-in ${dark ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span>ℹ️</span> Informações do Sistema
            </h2>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Versão:</span>
                <span className="font-medium">v4.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Última Atualização:</span>
                <span className="font-medium">{new Date().toLocaleDateString('pt-BR')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Status:</span>
                <span className={`font-medium ${isOnline ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Banco de Dados:</span>
                <span className="font-medium">{dbReady ? 'Conectado' : 'Desconectado'}</span>
              </div>
            </div>
          </section>
        </div>

        {/* Botão Salvar */}
        <div className="mt-6 text-center">
          <button 
            className={`px-8 py-3 bg-gradient-to-r ${getGradientClass()} text-white rounded-lg shadow-md hover:shadow-lg smooth-transition hover:scale-105 font-semibold`}
            onClick={salvarConfiguracoes}
          >
            💾 Salvar Todas as Configurações
          </button>
        </div>

        <footer className={`mt-8 pt-6 border-t text-sm ${dark ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-500'}`}>
          <div className="flex justify-between items-center">
            <div>Protótipo v4 • Sistema de Configurações Avançado</div>
            <div className="text-xs">Última atualização: {new Date().toLocaleString('pt-BR')}</div>
          </div>
        </footer>
      </main>

      {/* Modal de Confirmação */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 animate-fade-in">
          <div className={`rounded-xl shadow-2xl max-w-md w-full mx-4 p-6 animate-slide-in ${
            dark ? 'bg-gray-800 border border-gray-700' : 'bg-white'
          }`}>
            <h3 className="text-xl font-semibold mb-4">
              {actionType === 'export' ? 'Exportar Dados' : 'Limpar Dados'}
            </h3>
            
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {actionType === 'export' 
                ? 'Tem certeza que deseja exportar todos os dados do sistema? Um arquivo de backup será baixado.'
                : 'ATENÇÃO: Esta ação irá remover TODOS os dados do sistema e não pode ser desfeita. Tem certeza?'
              }
            </p>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirmModal(false)}
                className={`px-4 py-2 rounded-lg border smooth-transition ${
                  dark ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                Cancelar
              </button>
              <button
                onClick={executeAction}
                className={`px-4 py-2 rounded-lg text-white smooth-transition ${
                  actionType === 'export' 
                    ? `bg-gradient-to-r ${getGradientClass()} hover:shadow-lg`
                    : 'bg-gradient-to-r from-red-600 to-red-500 hover:shadow-lg'
                }`}
              >
                {actionType === 'export' ? 'Exportar' : 'Limpar Tudo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Renderizar na página
const container = document.getElementById('root');
if (container) {
  if (ReactDOM.createRoot) {
    const root = ReactDOM.createRoot(container);
    root.render(<Config />);
  } else {
    ReactDOM.render(<Config />, container);
  }
} else {
  console.warn('Elemento #root não encontrado. Crie <div id="root"></div> no HTML.');
}