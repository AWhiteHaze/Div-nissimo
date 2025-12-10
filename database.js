// database.js - Sistema de Banco de Dados com IndexedDB e Sincronização Global

const DB_NAME = 'DivinissimoDB';
const DB_VERSION = 2; // Incrementado para nova estrutura

class DivinissimoDatabase {
  constructor() {
    this.db = null;
    this.listeners = new Map(); // Para eventos de mudança
    this.dataListeners = new Map(); // Para eventos de dados específicos
  }

  // Inicializar banco de dados
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        this.setupStorageListener();
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        const oldVersion = event.oldVersion;

        // Store para configurações do usuário
        if (!db.objectStoreNames.contains('config')) {
          const configStore = db.createObjectStore('config', { keyPath: 'id' });
          configStore.createIndex('key', 'key', { unique: true });
        }

        // Store para leituras de sensores
        if (!db.objectStoreNames.contains('sensors')) {
          const sensorStore = db.createObjectStore('sensors', { keyPath: 'id', autoIncrement: true });
          sensorStore.createIndex('time', 'time', { unique: false });
          sensorStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Store para dados de produção
        if (!db.objectStoreNames.contains('production')) {
          const prodStore = db.createObjectStore('production', { keyPath: 'id', autoIncrement: true });
          prodStore.createIndex('time', 'time', { unique: false });
          prodStore.createIndex('date', 'date', { unique: false });
        }

        // Store para log de auditoria
        if (!db.objectStoreNames.contains('audit')) {
          const auditStore = db.createObjectStore('audit', { keyPath: 'id', autoIncrement: true });
          auditStore.createIndex('timestamp', 'timestamp', { unique: false });
          auditStore.createIndex('user', 'user', { unique: false });
        }

        // Store para alertas
        if (!db.objectStoreNames.contains('alerts')) {
          const alertStore = db.createObjectStore('alerts', { keyPath: 'id', autoIncrement: true });
          alertStore.createIndex('timestamp', 'timestamp', { unique: false });
          alertStore.createIndex('level', 'level', { unique: false });
        }

        // Store para fila offline
        if (!db.objectStoreNames.contains('offlineQueue')) {
          const queueStore = db.createObjectStore('offlineQueue', { keyPath: 'id', autoIncrement: true });
          queueStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Store para não-conformidades
        if (!db.objectStoreNames.contains('naoConformidades')) {
          const ncStore = db.createObjectStore('naoConformidades', { keyPath: 'id' });
          ncStore.createIndex('status', 'status', { unique: false });
          ncStore.createIndex('severity', 'severity', { unique: false });
          ncStore.createIndex('date', 'date', { unique: false });
          ncStore.createIndex('type', 'type', { unique: false });
        }

        // Store para inspeções
        if (!db.objectStoreNames.contains('inspections')) {
          const inspStore = db.createObjectStore('inspections', { keyPath: 'id' });
          inspStore.createIndex('date', 'date', { unique: false });
          inspStore.createIndex('lote', 'lote', { unique: false });
        }

        // Store para ordens de produção
        if (!db.objectStoreNames.contains('ordens')) {
          const ordensStore = db.createObjectStore('ordens', { keyPath: 'id' });
          ordensStore.createIndex('status', 'status', { unique: false });
          ordensStore.createIndex('priority', 'priority', { unique: false });
        }

        // Store para coletas
        if (!db.objectStoreNames.contains('coletas')) {
          const coletasStore = db.createObjectStore('coletas', { keyPath: 'id', autoIncrement: true });
          coletasStore.createIndex('datetime', 'datetime', { unique: false });
          coletasStore.createIndex('status', 'status', { unique: false });
        }

        // Store para relatórios
        if (!db.objectStoreNames.contains('relatorios')) {
          const relStore = db.createObjectStore('relatorios', { keyPath: 'id', autoIncrement: true });
          relStore.createIndex('data', 'data', { unique: false });
          relStore.createIndex('tipo', 'tipo', { unique: false });
        }

        // Store para estatísticas do dashboard (NOVO)
        if (!db.objectStoreNames.contains('dashboardStats')) {
          const statsStore = db.createObjectStore('dashboardStats', { keyPath: 'id' });
          statsStore.createIndex('key', 'key', { unique: true });
        }

        // Store para histórico de qualidade (NOVO)
        if (!db.objectStoreNames.contains('qualityHistory')) {
          const historyStore = db.createObjectStore('qualityHistory', { keyPath: 'id' });
          historyStore.createIndex('date', 'date', { unique: true });
        }

        // Store para métricas diárias (NOVO)
        if (!db.objectStoreNames.contains('dailyMetrics')) {
          const metricsStore = db.createObjectStore('dailyMetrics', { keyPath: 'id' });
          metricsStore.createIndex('date', 'date', { unique: true });
        }

        // Se estiver atualizando de versão 1, migrar dados
        if (oldVersion === 1) {
          this.migrateFromV1(db, event);
        }
      };
    });
  }

  // Migrar dados da versão 1 para 2
  migrateFromV1(db, event) {
    console.log('Migrando dados da versão 1 para 2');
    
    // Aqui você pode adicionar lógica de migração se necessário
    // Por enquanto, apenas criamos as novas stores
  }

  // Configurar listener para sincronização entre abas/páginas
  setupStorageListener() {
    // Usar BroadcastChannel para comunicação entre abas
    try {
      this.broadcastChannel = new BroadcastChannel('divinissimo_sync');
      
      this.broadcastChannel.addEventListener('message', (event) => {
        const { type, key, value, dataType } = event.data;
        
        if (type === 'config_changed') {
          // Notificar listeners locais de configuração
          if (this.listeners.has(key)) {
            this.listeners.get(key).forEach(callback => callback(value));
          }
        } else if (type === 'data_changed') {
          // Notificar listeners locais de dados
          if (this.dataListeners.has(dataType)) {
            this.dataListeners.get(dataType).forEach(callback => callback(value));
          }
        }
      });
    } catch (e) {
      console.warn('BroadcastChannel não suportado, usando fallback:', e);
    }
  }

  // Registrar listener para mudanças de configuração
  onConfigChange(key, callback) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key).add(callback);
    
    // Retornar função para remover o listener
    return () => {
      const callbacks = this.listeners.get(key);
      if (callbacks) {
        callbacks.delete(callback);
      }
    };
  }

  // Registrar listener para mudanças de dados
  onDataChange(dataType, callback) {
    if (!this.dataListeners.has(dataType)) {
      this.dataListeners.set(dataType, new Set());
    }
    this.dataListeners.get(dataType).add(callback);
    
    // Retornar função para remover o listener
    return () => {
      const callbacks = this.dataListeners.get(dataType);
      if (callbacks) {
        callbacks.delete(callback);
      }
    };
  }

  // Remover listener de dados
  removeDataChangeListener(dataType, callback) {
    const callbacks = this.dataListeners.get(dataType);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  // Notificar mudanças de dados para outras abas
  notifyDataChange(dataType, data) {
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({
        type: 'data_changed',
        dataType,
        value: data
      });
    }
  }

  // Métodos genéricos para CRUD
  async add(storeName, data) {
    const tx = this.db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    return new Promise((resolve, reject) => {
      const request = store.add(data);
      request.onsuccess = () => {
        this.notifyDataChange(storeName, data);
        resolve(request.result);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async put(storeName, data) {
    const tx = this.db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    return new Promise((resolve, reject) => {
      const request = store.put(data);
      request.onsuccess = () => {
        this.notifyDataChange(storeName, data);
        resolve(request.result);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async get(storeName, id) {
    const tx = this.db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAll(storeName) {
    const tx = this.db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async delete(storeName, id) {
    const tx = this.db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => {
        this.notifyDataChange(storeName, { id, deleted: true });
        resolve(request.result);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async clear(storeName) {
    const tx = this.db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => {
        this.notifyDataChange(storeName, { cleared: true });
        resolve(request.result);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Métodos específicos para Configurações
  async getConfig(key) {
    const configs = await this.getAll('config');
    const config = configs.find(c => c.key === key);
    return config ? config.value : null;
  }

  async setConfig(key, value) {
    const configs = await this.getAll('config');
    const existing = configs.find(c => c.key === key);
    
    let result;
    if (existing) {
      result = await this.put('config', { id: existing.id, key, value });
    } else {
      result = await this.add('config', { id: Date.now(), key, value });
    }
    
    // Notificar outras abas/páginas sobre a mudança
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({
        type: 'config_changed',
        key,
        value
      });
    }
    
    return result;
  }

  // Métodos específicos para Sensores
  async addSensorReading(reading) {
    return this.add('sensors', {
      ...reading,
      timestamp: Date.now()
    });
  }

  async getRecentSensorReadings(limit = 60) {
    const all = await this.getAll('sensors');
    return all.slice(-limit);
  }

  async cleanOldSensorReadings(keepLast = 1000) {
    const all = await this.getAll('sensors');
    if (all.length > keepLast) {
      const toDelete = all.slice(0, all.length - keepLast);
      for (const item of toDelete) {
        await this.delete('sensors', item.id);
      }
    }
  }

  // Métodos específicos para Produção
  async addProductionData(data) {
    return this.add('production', {
      ...data,
      timestamp: Date.now(),
      date: new Date().toISOString().split('T')[0]
    });
  }

  async getRecentProduction(limit = 24) {
    const all = await this.getAll('production');
    return all.slice(-limit);
  }

  async getProductionByDay(days = 7) {
    const all = await this.getAll('production');
    const now = new Date();
    const result = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayData = all.filter(item => {
        const itemDate = item.date || new Date(item.timestamp).toISOString().split('T')[0];
        return itemDate === dateStr;
      });
      
      const totalProduced = dayData.reduce((sum, item) => sum + (item.produced || 0), 0);
      const totalRejected = dayData.reduce((sum, item) => sum + (item.rejected || 0), 0);
      
      result.push({
        date: dateStr,
        produced: totalProduced,
        rejected: totalRejected,
        ncCount: dayData.filter(item => item.ncCount).reduce((sum, item) => sum + (item.ncCount || 0), 0)
      });
    }
    
    return result;
  }

  // Métodos específicos para Auditoria
  async addAuditLog(user, action) {
    return this.add('audit', {
      time: new Date().toISOString(),
      timestamp: Date.now(),
      user,
      action
    });
  }

  async getRecentAuditLogs(limit = 200) {
    const all = await this.getAll('audit');
    return all.slice(-limit).reverse();
  }

  // Métodos específicos para Alertas
  async addAlert(level, message) {
    return this.add('alerts', {
      level,
      message,
      time: new Date().toLocaleTimeString('pt-BR'),
      timestamp: Date.now()
    });
  }

  async getRecentAlerts(limit = 10) {
    const all = await this.getAll('alerts');
    return all.slice(-limit).reverse();
  }

  async clearAlerts() {
    return this.clear('alerts');
  }

  // Métodos específicos para Fila Offline
  async addToOfflineQueue(type, payload) {
    return this.add('offlineQueue', {
      type,
      payload,
      timestamp: Date.now()
    });
  }

  async getOfflineQueue() {
    return this.getAll('offlineQueue');
  }

  async clearOfflineQueue() {
    return this.clear('offlineQueue');
  }

  // Métodos específicos para Não-Conformidades
  async saveNaoConformidade(nc) {
    return this.put('naoConformidades', nc);
  }

  async addNaoConformidade(nc) {
    return this.saveNaoConformidade(nc);
  }

  async getNaoConformidades() {
    return this.getAll('naoConformidades');
  }

  async updateNaoConformidade(id, updates) {
    const nc = await this.get('naoConformidades', id);
    if (nc) {
      const updated = { ...nc, ...updates };
      return this.put('naoConformidades', updated);
    }
  }

  async getNaoConformidadesByStatus(status) {
    const all = await this.getAll('naoConformidades');
    return all.filter(nc => nc.status === status);
  }

  async getNaoConformidadesByDate(startDate, endDate) {
    const all = await this.getAll('naoConformidades');
    return all.filter(nc => {
      const ncDate = new Date(nc.date.split(' ')[0].split('/').reverse().join('-'));
      return ncDate >= startDate && ncDate <= endDate;
    });
  }

  // Métodos específicos para Inspeções
  async addInspection(inspection) {
    return this.put('inspections', inspection);
  }

  async getInspections() {
    return this.getAll('inspections');
  }

  async getInspectionsByDate(date) {
    const all = await this.getAll('inspections');
    return all.filter(insp => insp.date.includes(date));
  }

  // Métodos específicos para Ordens
  async addOrdem(ordem) {
    return this.put('ordens', ordem);
  }

  async getOrdens() {
    return this.getAll('ordens');
  }

  async updateOrdem(id, updates) {
    const ordem = await this.get('ordens', id);
    if (ordem) {
      return this.put('ordens', { ...ordem, ...updates });
    }
  }

  // Métodos específicos para Coletas
  async addColeta(coleta) {
    return this.add('coletas', coleta);
  }

  async getColetas() {
    return this.getAll('coletas');
  }

  // Métodos específicos para Relatórios
  async addRelatorio(relatorio) {
    return this.add('relatorios', relatorio);
  }

  async getRelatorios() {
    return this.getAll('relatorios');
  }

  // NOVOS MÉTODOS PARA SINCRONIZAÇÃO COM DASHBOARD

  // Métodos para estatísticas do dashboard
  async getDashboardStats() {
    const stats = await this.getAll('dashboardStats');
    const result = {};
    
    stats.forEach(stat => {
      result[stat.key] = stat.value;
    });
    
    // Se não houver estatísticas, calcular com base nos dados atuais
    if (Object.keys(result).length === 0) {
      return this.calculateDashboardStats();
    }
    
    return result;
  }

  async updateDashboardMetric(key, value) {
    const stats = await this.getAll('dashboardStats');
    const existing = stats.find(s => s.key === key);
    
    if (existing) {
      return this.put('dashboardStats', { id: existing.id, key, value });
    } else {
      return this.add('dashboardStats', { id: Date.now(), key, value });
    }
  }

  async calculateDashboardStats() {
    const productionData = await this.getProductionByDay(7);
    const inspections = await this.getInspections();
    const naoConformidades = await this.getNaoConformidades();
    const ordens = await this.getOrdens();
    
    // Cálculos básicos
    const totalProduced = productionData.reduce((sum, day) => sum + day.produced, 0);
    const totalRejected = productionData.reduce((sum, day) => sum + day.rejected, 0);
    const totalApproved = totalProduced - totalRejected;
    const approvalRate = totalProduced > 0 ? ((totalApproved / totalProduced) * 100).toFixed(1) : 0;
    
    // Eficiência baseada nas ordens
    const ordensConcluidas = ordens.filter(o => o.status === 'Concluída');
    const efficiency = ordensConcluidas.length > 0 ? 
      ordensConcluidas.reduce((sum, o) => sum + (o.progress || 0), 0) / ordensConcluidas.length : 0;
    
    // NCs do dia
    const today = new Date().toLocaleDateString('pt-BR');
    const ncAbertasHoje = naoConformidades.filter(nc => 
      nc.status !== 'Resolvida' && nc.date.includes(today)
    ).length;
    
    const ncResolvidasHoje = naoConformidades.filter(nc => 
      nc.status === 'Resolvida' && nc.resolvedDate && nc.resolvedDate.includes(today)
    ).length;
    
    // Salvar estatísticas
    const stats = {
      totalProduced,
      totalApproved,
      totalRejected,
      approvalRate: parseFloat(approvalRate),
      efficiency: parseFloat(efficiency.toFixed(1)),
      totalInspected: inspections.reduce((sum, i) => sum + i.approved + i.rejected, 0),
      ncAbertasHoje,
      ncResolvidasHoje,
      totalNC: naoConformidades.length,
      dailyTarget: 5000,
      updatedAt: new Date().toISOString()
    };
    
    // Salvar cada métrica
    for (const [key, value] of Object.entries(stats)) {
      await this.updateDashboardMetric(key, value);
    }
    
    return stats;
  }

  // Métodos para histórico de qualidade
  async getQualityHistory() {
    const history = await this.getAll('qualityHistory');
    if (history.length > 0) {
      // Ordenar por data
      history.sort((a, b) => new Date(a.date) - new Date(b.date));
      
      // Retornar os últimos 7 dias
      const last7 = history.slice(-7);
      
      // Extrair arrays para gráficos
      return {
        approvalRates: last7.map(h => h.approvalRate || 0),
        ncTrends: last7.map(h => h.ncCount || 0),
        resolutionTimes: last7.map(h => h.avgResolutionTime || 24),
        dates: last7.map(h => h.date)
      };
    }
    
    // Se não houver histórico, criar com dados padrão
    return this.createDefaultQualityHistory();
  }

  async saveQualityHistory(history) {
    return this.put('qualityHistory', history);
  }

  async createDefaultQualityHistory() {
    // Criar histórico dos últimos 7 dias com dados realistas
    const history = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      // Valores realistas para uma fábrica de pão de queijo
      const approvalRate = 98.0 + Math.random() * 1.5; // 98-99.5%
      const ncCount = Math.floor(Math.random() * 4) + 2; // 2-5 NCs por dia
      const resolutionTime = 20 + Math.floor(Math.random() * 10); // 20-29 horas
      
      history.push({
        id: `history_${dateStr}`,
        date: dateStr,
        approvalRate: parseFloat(approvalRate.toFixed(1)),
        ncCount,
        avgResolutionTime: resolutionTime,
        totalProduced: Math.floor(Math.random() * 1000) + 4000, // 4000-5000 unidades
        totalRejected: Math.floor(Math.random() * 100) + 10, // 10-110 unidades
        inspectionsCount: Math.floor(Math.random() * 5) + 3 // 3-7 inspeções
      });
    }
    
    // Salvar cada dia
    for (const day of history) {
      await this.put('qualityHistory', day);
    }
    
    return {
      approvalRates: history.map(h => h.approvalRate),
      ncTrends: history.map(h => h.ncCount),
      resolutionTimes: history.map(h => h.avgResolutionTime),
      dates: history.map(h => h.date)
    };
  }

  // Métodos para métricas diárias
  async saveDailyMetrics(metrics) {
    const date = new Date().toISOString().split('T')[0];
    return this.put('dailyMetrics', {
      id: `metrics_${date}`,
      date,
      ...metrics,
      timestamp: Date.now()
    });
  }

  async getDailyMetrics(date) {
    const all = await this.getAll('dailyMetrics');
    return all.find(m => m.date === date);
  }

  async getLast7DaysMetrics() {
    const all = await this.getAll('dailyMetrics');
    // Ordenar por data mais recente
    all.sort((a, b) => new Date(b.date) - new Date(a.date));
    return all.slice(0, 7);
  }

  // Método para limpeza periódica
  async cleanupOldData() {
    const now = Date.now();
    const oneMonthAgo = now - (30 * 24 * 60 * 60 * 1000);
    
    // Limpar dados antigos de sensores
    const sensors = await this.getAll('sensors');
    const oldSensors = sensors.filter(s => s.timestamp < oneMonthAgo);
    for (const sensor of oldSensors) {
      await this.delete('sensors', sensor.id);
    }
    
    // Limpar logs de auditoria antigos
    const audits = await this.getAll('audit');
    const oldAudits = audits.filter(a => a.timestamp < oneMonthAgo);
    for (const audit of oldAudits) {
      await this.delete('audit', audit.id);
    }
    
    // Limpar alertas antigos (mantém apenas 30 dias)
    const alerts = await this.getAll('alerts');
    const oldAlerts = alerts.filter(a => a.timestamp < oneMonthAgo);
    for (const alert of oldAlerts) {
      await this.delete('alerts', alert.id);
    }
    
    console.log(`Limpeza realizada: ${oldSensors.length} sensores, ${oldAudits.length} logs, ${oldAlerts.length} alertas`);
  }

  // Método para backup dos dados
  async exportData() {
    const stores = [
      'config', 'sensors', 'production', 'audit', 'alerts',
      'naoConformidades', 'inspections', 'ordens', 'coletas',
      'relatorios', 'dashboardStats', 'qualityHistory', 'dailyMetrics'
    ];
    
    const backup = {
      timestamp: Date.now(),
      version: DB_VERSION,
      data: {}
    };
    
    for (const store of stores) {
      try {
        backup.data[store] = await this.getAll(store);
      } catch (e) {
        console.warn(`Erro ao exportar store ${store}:`, e);
      }
    }
    
    return backup;
  }

  // Método para restaurar dados
  async importData(backup) {
    // Verificar se o backup é compatível
    if (!backup.data || !backup.timestamp) {
      throw new Error('Backup inválido');
    }
    
    // Limpar dados existentes
    const stores = Object.keys(backup.data);
    for (const store of stores) {
      try {
        await this.clear(store);
      } catch (e) {
        // Store pode não existir ainda
      }
    }
    
    // Importar dados
    for (const [storeName, data] of Object.entries(backup.data)) {
      if (Array.isArray(data)) {
        for (const item of data) {
          try {
            await this.put(storeName, item);
          } catch (e) {
            console.warn(`Erro ao importar item para ${storeName}:`, e);
          }
        }
      }
    }
    
    return true;
  }

  // Inicializar dados padrão
  async initializeDefaultData() {
    // Verificar se já existem dados
    const configs = await this.getAll('config');
    if (configs.length > 0) {
      // Verificar se já temos histórico de qualidade
      const qualityHistory = await this.getAll('qualityHistory');
      if (qualityHistory.length === 0) {
        await this.createDefaultQualityHistory();
      }
      return; // Já inicializado
    }

    // Configurações padrão
    await this.setConfig('dark', false);
    await this.setConfig('selectedLine', 'Linha Pão de Queijo');
    await this.setConfig('sidebarOpen', true);
    await this.setConfig('notificacoes', true);
    await this.setConfig('autoAtualizar', false);
    await this.setConfig('idioma', 'pt-BR');
    await this.setConfig('temaCor', 'verde');
    await this.setConfig('dailyTarget', 5000);
    await this.setConfig('qualityTarget', 98.5);
    await this.setConfig('efficiencyTarget', 95);

    // Não-conformidades padrão (com dados completos)
    const ncs = [
      { 
        id: 'NC-2025-045', 
        type: 'Dimensional', 
        description: 'Diâmetro fora da especificação (45mm vs 40-42mm)', 
        severity: 'Média', 
        status: 'Aberta', 
        date: '06/10/2025 15:30', 
        lote: 'LT-1024', 
        responsible: 'João Silva',
        details: 'Produto com diâmetro de 45mm, fora da especificação de 40-42mm. Afeta aproximadamente 200 unidades do lote.',
        actions: 'Ajustar máquina modeladora e re-treinar operador',
        createdBy: 'Sistema Automático',
        affectedQuantity: 200
      },
      { 
        id: 'NC-2025-044', 
        type: 'Visual', 
        description: 'Coloração irregular em 5% dos produtos', 
        severity: 'Baixa', 
        status: 'Em Análise', 
        date: '06/10/2025 12:15', 
        lote: 'LT-1023', 
        responsible: 'Maria Santos',
        details: 'Variação de cor observada em 75 unidades (5% do lote de 1500 unidades). Provável causa: temperatura do forno.',
        actions: 'Monitorar temperatura do forno e coletar amostras',
        createdBy: 'Inspetor Carlos',
        affectedQuantity: 75
      },
      { 
        id: 'NC-2025-043', 
        type: 'Microbiológico', 
        description: 'Contagem de coliformes acima do limite', 
        severity: 'Alta', 
        status: 'Aberta', 
        date: '05/10/2025 18:45', 
        lote: 'LT-1021', 
        responsible: 'Carlos Oliveira',
        details: 'Contagem de coliformes em 15 UFC/g (limite: 10 UFC/g). Lote de 1200 unidades isolado.',
        actions: 'Isolar lote completo e realizar análise microbiológica completa',
        createdBy: 'Laboratório',
        affectedQuantity: 1200
      },
      { 
        id: 'NC-2025-042', 
        type: 'Embalagem', 
        description: 'Selo de segurança com aderência irregular', 
        severity: 'Média', 
        status: 'Resolvida', 
        date: '05/10/2025 14:20', 
        lote: 'LT-1020', 
        responsible: 'Ana Paula',
        details: 'Selo não adere corretamente em aproximadamente 8% das embalagens. Afeta 96 unidades.',
        actions: 'Substituído rolo de selagem. Realizada inspeção 100% do lote.',
        createdBy: 'Operador Linha 2',
        resolvedDate: '06/10/2025 10:30',
        resolutionTime: 20,
        affectedQuantity: 96
      },
      { 
        id: 'NC-2025-041', 
        type: 'Peso', 
        description: 'Peso médio de 48g (especificação: 50g ±2g)', 
        severity: 'Alta', 
        status: 'Em Análise', 
        date: '04/10/2025 16:00', 
        lote: 'LT-1019', 
        responsible: 'Roberto Costa',
        details: 'Peso médio de 48g em amostra de 30 unidades. Fora da especificação de 50g ±2g.',
        actions: 'Calibrar dosadora e verificar matéria-prima',
        createdBy: 'Sistema Automático',
        affectedQuantity: 1000
      },
      { 
        id: 'NC-2025-040', 
        type: 'Textura', 
        description: 'Textura seca em 3% da produção', 
        severity: 'Baixa', 
        status: 'Resolvida', 
        date: '04/10/2025 11:30', 
        lote: 'LT-1018', 
        responsible: 'Patricia Lima',
        details: '45 unidades com textura seca (3% de 1500). Causa: umidade da massa abaixo do especificado.',
        actions: 'Ajustado sistema de umidificação. Lote reprocessado.',
        createdBy: 'Controle Qualidade',
        resolvedDate: '05/10/2025 09:45',
        resolutionTime: 22,
        affectedQuantity: 45
      },
    ];
    for (const nc of ncs) await this.saveNaoConformidade(nc);

    // Inspeções padrão (com valores realistas)
    const inspections = [
      { id: 'INSP-089', lote: 'LT-1024', date: '06/10/2025 16:00', inspector: 'João Silva', approved: 1450, rejected: 50, result: 'Aprovado com Ressalvas' },
      { id: 'INSP-088', lote: 'LT-1023', date: '06/10/2025 14:00', inspector: 'Maria Santos', approved: 1500, rejected: 0, result: 'Aprovado' },
      { id: 'INSP-087', lote: 'LT-1022', date: '06/10/2025 11:00', inspector: 'Carlos Oliveira', approved: 1480, rejected: 20, result: 'Aprovado' },
      { id: 'INSP-086', lote: 'LT-1021', date: '05/10/2025 17:00', inspector: 'Ana Paula', approved: 1200, rejected: 0, result: 'Aprovado' },
      { id: 'INSP-085', lote: 'LT-1020', date: '05/10/2025 10:00', inspector: 'Roberto Costa', approved: 1400, rejected: 100, result: 'Aprovado com Ressalvas' },
      { id: 'INSP-084', lote: 'LT-1019', date: '04/10/2025 18:00', inspector: 'Patricia Lima', approved: 1490, rejected: 10, result: 'Aprovado' },
    ];
    for (const insp of inspections) await this.addInspection(insp);

    // Ordens padrão
    const ordens = [
      { id: 'OP-2025-089', product: 'Pão de Queijo Tradicional', quantity: 2000, produced: 1450, status: 'Em Produção', priority: 'Alta', startDate: '06/10/2025 08:00', deadline: '06/10/2025 18:00', progress: 72 },
      { id: 'OP-2025-088', product: 'Pão de Queijo Integral', quantity: 1500, produced: 1500, status: 'Concluída', priority: 'Normal', startDate: '05/10/2025 14:00', deadline: '06/10/2025 08:00', progress: 100 },
      { id: 'OP-2025-087', product: 'Pão de Queijo Orgânico', quantity: 1000, produced: 0, status: 'Aguardando', priority: 'Baixa', startDate: '07/10/2025 08:00', deadline: '07/10/2025 16:00', progress: 0 },
      { id: 'OP-2025-086', product: 'Pão de Queijo Tradicional', quantity: 2500, produced: 2500, status: 'Concluída', priority: 'Alta', startDate: '05/10/2025 08:00', deadline: '05/10/2025 18:00', progress: 100 },
      { id: 'OP-2025-085', product: 'Pão de Queijo Recheado', quantity: 1800, produced: 920, status: 'Em Produção', priority: 'Normal', startDate: '06/10/2025 10:00', deadline: '06/10/2025 20:00', progress: 51 },
      { id: 'OP-2025-084', product: 'Pão de Queijo Light', quantity: 1200, produced: 1200, status: 'Concluída', priority: 'Normal', startDate: '04/10/2025 14:00', deadline: '05/10/2025 08:00', progress: 100 },
    ];
    for (const ordem of ordens) await this.addOrdem(ordem);

    // Coletas padrão
    const coletas = [
      { status: 'Concluída', datetime: '06/10/2025 16:53', produced: 63, material: 49.86, efficiency: 3.0 },
      { status: 'Concluída', datetime: '06/10/2025 14:20', produced: 58, material: 46.20, efficiency: 2.8 },
      { status: 'Processando', datetime: '06/10/2025 11:45', produced: 42, material: 33.60, efficiency: 2.5 },
      { status: 'Concluída', datetime: '05/10/2025 18:30', produced: 71, material: 56.80, efficiency: 3.2 },
      { status: 'Concluída', datetime: '05/10/2025 15:10', produced: 65, material: 52.00, efficiency: 3.1 },
      { status: 'Concluída', datetime: '05/10/2025 12:00', produced: 54, material: 43.20, efficiency: 2.9 },
      { status: 'Concluída', datetime: '04/10/2025 17:45', produced: 68, material: 54.40, efficiency: 3.0 },
      { status: 'Concluída', datetime: '04/10/2025 14:30', produced: 59, material: 47.20, efficiency: 2.7 },
    ];
    for (const coleta of coletas) await this.addColeta(coleta);

    // Relatórios padrão
    const relatorios = [
      { nome: "Produção Diária", data: "07/10/2025", tipo: "Produção", status: "Concluído" },
      { nome: "Relatório de Qualidade", data: "06/10/2025", tipo: "Qualidade", status: "Em análise" },
      { nome: "Consumo Energético", data: "05/10/2025", tipo: "Energia", status: "Concluído" },
      { nome: "Eficiência das Linhas", data: "04/10/2025", tipo: "Performance", status: "Concluído" },
    ];
    for (const rel of relatorios) await this.addRelatorio(rel);

    // Criar histórico de qualidade
    await this.createDefaultQualityHistory();
    
    // Calcular e salvar estatísticas iniciais do dashboard
    await this.calculateDashboardStats();

    console.log('Dados padrão inicializados com sucesso!');
  }

  // Método para verificar integridade do banco de dados
  async checkDatabaseHealth() {
    const health = {
      stores: {},
      totalItems: 0,
      lastBackup: null,
      issues: []
    };

    const stores = [
      'config', 'sensors', 'production', 'audit', 'alerts',
      'naoConformidades', 'inspections', 'ordens', 'coletas',
      'relatorios', 'dashboardStats', 'qualityHistory', 'dailyMetrics'
    ];

    for (const store of stores) {
      try {
        const items = await this.getAll(store);
        health.stores[store] = items.length;
        health.totalItems += items.length;
        
        // Verificar problemas comuns
        if (store === 'naoConformidades') {
          const invalidNCs = items.filter(nc => !nc.id || !nc.date);
          if (invalidNCs.length > 0) {
            health.issues.push(`${invalidNCs.length} NCs inválidas na store ${store}`);
          }
        }
      } catch (e) {
        health.issues.push(`Erro ao acessar store ${store}: ${e.message}`);
      }
    }

    return health;
  }

  // Método para resetar banco de dados (apenas para desenvolvimento)
  async resetDatabase() {
    const stores = [
      'config', 'sensors', 'production', 'audit', 'alerts',
      'offlineQueue', 'naoConformidades', 'inspections', 
      'ordens', 'coletas', 'relatorios', 'dashboardStats', 
      'qualityHistory', 'dailyMetrics'
    ];

    for (const store of stores) {
      try {
        await this.clear(store);
      } catch (e) {
        console.warn(`Não foi possível limpar ${store}:`, e);
      }
    }

    console.log('Banco de dados resetado');
    return true;
  }
}

// Instância global do banco de dados
const db = new DivinissimoDatabase();

// Inicializar automaticamente quando a página carregar
window.addEventListener('load', async () => {
  try {
    await db.init();
    console.log('Banco de dados inicializado com sucesso');
    
    // Fazer limpeza periódica (uma vez por dia)
    const lastCleanup = await db.getConfig('lastCleanup');
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    
    if (!lastCleanup || (now - parseInt(lastCleanup)) > oneDay) {
      await db.cleanupOldData();
      await db.setConfig('lastCleanup', now.toString());
    }
  } catch (error) {
    console.error('Erro ao inicializar banco de dados:', error);
  }
});

// Exportar para uso global
window.DivinissimoDatabase = DivinissimoDatabase;
window.db = db;