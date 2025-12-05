// database.js - Sistema de Banco de Dados com IndexedDB e Sincronização Global

const DB_NAME = 'DivinissimoDB';
const DB_VERSION = 1;

class DivinissimoDatabase {
  constructor() {
    this.db = null;
    this.listeners = new Map(); // Para eventos de mudança
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
        }

        // Store para inspeções
        if (!db.objectStoreNames.contains('inspections')) {
          const inspStore = db.createObjectStore('inspections', { keyPath: 'id' });
          inspStore.createIndex('date', 'date', { unique: false });
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
      };
    });
  }

  // Configurar listener para sincronização entre abas/páginas
  setupStorageListener() {
    // Usar BroadcastChannel para comunicação entre abas
    this.broadcastChannel = new BroadcastChannel('divinissimo_sync');
    
    this.broadcastChannel.addEventListener('message', (event) => {
      if (event.data.type === 'config_changed') {
        const { key, value } = event.data;
        // Notificar listeners locais
        if (this.listeners.has(key)) {
          this.listeners.get(key).forEach(callback => callback(value));
        }
      }
    });
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

  // Métodos genéricos para CRUD
  async add(storeName, data) {
    const tx = this.db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    return new Promise((resolve, reject) => {
      const request = store.add(data);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async put(storeName, data) {
    const tx = this.db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    return new Promise((resolve, reject) => {
      const request = store.put(data);
      request.onsuccess = () => resolve(request.result);
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
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async clear(storeName) {
    const tx = this.db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve(request.result);
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
    this.broadcastChannel.postMessage({
      type: 'config_changed',
      key,
      value
    });
    
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
      timestamp: Date.now()
    });
  }

  async getRecentProduction(limit = 24) {
    const all = await this.getAll('production');
    return all.slice(-limit);
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
  async addNaoConformidade(nc) {
    return this.put('naoConformidades', nc);
  }

  async getNaoConformidades() {
    return this.getAll('naoConformidades');
  }

  async updateNaoConformidade(id, updates) {
    const nc = await this.get('naoConformidades', id);
    if (nc) {
      return this.put('naoConformidades', { ...nc, ...updates });
    }
  }

  // Métodos específicos para Inspeções
  async addInspection(inspection) {
    return this.put('inspections', inspection);
  }

  async getInspections() {
    return this.getAll('inspections');
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

  // Inicializar dados padrão
  async initializeDefaultData() {
    // Verificar se já existem dados
    const configs = await this.getAll('config');
    if (configs.length > 0) return; // Já inicializado

    // Configurações padrão
    await this.setConfig('dark', false);
    await this.setConfig('selectedLine', 'Linha Pão de Queijo');
    await this.setConfig('sidebarOpen', true);
    await this.setConfig('notificacoes', true);
    await this.setConfig('autoAtualizar', false);
    await this.setConfig('idioma', 'pt-BR');
    await this.setConfig('temaCor', 'verde');

    // Não-conformidades padrão
    const ncs = [
      { id: 'NC-2025-045', type: 'Dimensional', description: 'Diâmetro fora da especificação', severity: 'Média', status: 'Aberta', date: '06/10/2025 15:30', lote: 'LT-1024', responsible: 'João Silva' },
      { id: 'NC-2025-044', type: 'Visual', description: 'Coloração irregular no produto', severity: 'Baixa', status: 'Em Análise', date: '06/10/2025 12:15', lote: 'LT-1023', responsible: 'Maria Santos' },
      { id: 'NC-2025-043', type: 'Microbiológico', description: 'Contagem elevada de coliformes', severity: 'Alta', status: 'Aberta', date: '05/10/2025 18:45', lote: 'LT-1021', responsible: 'Carlos Oliveira' },
      { id: 'NC-2025-042', type: 'Embalagem', description: 'Selo de segurança com defeito', severity: 'Média', status: 'Resolvida', date: '05/10/2025 14:20', lote: 'LT-1020', responsible: 'Ana Paula' },
      { id: 'NC-2025-041', type: 'Peso', description: 'Peso abaixo do especificado', severity: 'Alta', status: 'Em Análise', date: '04/10/2025 16:00', lote: 'LT-1019', responsible: 'Roberto Costa' },
      { id: 'NC-2025-040', type: 'Textura', description: 'Textura muito seca', severity: 'Baixa', status: 'Resolvida', date: '04/10/2025 11:30', lote: 'LT-1018', responsible: 'Patricia Lima' },
    ];
    for (const nc of ncs) await this.addNaoConformidade(nc);

    // Inspeções padrão
    const inspections = [
      { id: 'INSP-089', lote: 'LT-1024', date: '06/10/2025 16:00', inspector: 'João Silva', approved: 980, rejected: 20, result: 'Aprovado com Ressalvas' },
      { id: 'INSP-088', lote: 'LT-1023', date: '06/10/2025 14:00', inspector: 'Maria Santos', approved: 1500, rejected: 0, result: 'Aprovado' },
      { id: 'INSP-087', lote: 'LT-1022', date: '06/10/2025 11:00', inspector: 'Carlos Oliveira', approved: 950, rejected: 50, result: 'Aprovado com Ressalvas' },
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
  }
}

// Instância global do banco de dados
const db = new DivinissimoDatabase();

// Exportar para uso global
window.DivinissimoDatabase = DivinissimoDatabase;
window.db = db;

