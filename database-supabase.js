// database-supabase.js - Adaptador Supabase
class DivinissimoDatabase {
  constructor() {
    this.supabase = window.supabaseClient;
    this.usuario = null;
    this.listeners = new Map();
  }

  async init() {
    // Carregar usuário da sessão
    const usuarioStr = localStorage.getItem('usuario');
    if (usuarioStr) {
      this.usuario = JSON.parse(usuarioStr);
    }
    console.log('Database Supabase inicializado', this.usuario);
  }

  // ==========================================
  // CONFIGURAÇÕES
  // ==========================================
  async getConfig(key) {
    if (!this.usuario) return null;
    
    const { data, error } = await this.supabase
      .from('configuracoes')
      .select('valor')
      .eq('usuario_id', this.usuario.id)
      .eq('chave', key)
      .single();

    if (error) {
      console.log('Config não encontrada:', key);
      return null;
    }
    
    return data?.valor;
  }

  async setConfig(key, valor) {
    if (!this.usuario) return;

    const { error } = await this.supabase
      .from('configuracoes')
      .upsert({
        usuario_id: this.usuario.id,
        chave: key,
        valor: valor
      }, {
        onConflict: 'usuario_id,chave'
      });

    if (error) {
      console.error('Erro ao salvar config:', error);
    }

    // Notificar listeners
    if (this.listeners.has(key)) {
      this.listeners.get(key).forEach(callback => callback(valor));
    }
  }

  onConfigChange(key, callback) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key).add(callback);
    
    return () => {
      const callbacks = this.listeners.get(key);
      if (callbacks) callbacks.delete(callback);
    };
  }

  // ==========================================
  // COLETAS
  // ==========================================
  async getColetas() {
    const { data, error } = await this.supabase
      .from('coletas')
      .select('*')
      .order('datetime', { ascending: false });

    if (error) {
      console.error('Erro ao buscar coletas:', error);
      return [];
    }

    return data || [];
  }

  async saveColeta(coleta) {
    const { error } = await this.supabase
      .from('coletas')
      .upsert({
        ...coleta,
        usuario_id: this.usuario?.id
      });

    if (error) {
      console.error('Erro ao salvar coleta:', error);
      throw error;
    }
  }

  async deleteColeta(id) {
    const { error } = await this.supabase
      .from('coletas')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao deletar coleta:', error);
      throw error;
    }
  }

  // ==========================================
  // ORDENS
  // ==========================================
  async getOrdens() {
    const { data, error } = await this.supabase
      .from('ordens')
      .select('*')
      .order('criado_em', { ascending: false });

    if (error) {
      console.error('Erro ao buscar ordens:', error);
      return [];
    }

    return data || [];
  }

  async saveOrdem(ordem) {
    const { error } = await this.supabase
      .from('ordens')
      .upsert({
        ...ordem,
        usuario_id: this.usuario?.id
      });

    if (error) {
      console.error('Erro ao salvar ordem:', error);
      throw error;
    }
  }

  // ==========================================
  // NÃO-CONFORMIDADES
  // ==========================================
  async getNaoConformidades() {
    const { data, error } = await this.supabase
      .from('nao_conformidades')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      console.error('Erro ao buscar NCs:', error);
      return [];
    }

    return data || [];
  }

  async saveNaoConformidade(nc) {
    const { error } = await this.supabase
      .from('nao_conformidades')
      .upsert({
        ...nc,
        usuario_id: this.usuario?.id
      });

    if (error) {
      console.error('Erro ao salvar NC:', error);
      throw error;
    }
  }

  // ==========================================
  // FORNECEDORES
  // ==========================================
  async getFornecedores() {
    const { data, error } = await this.supabase
      .from('fornecedores')
      .select('*')
      .order('criado_em', { ascending: false });

    if (error) {
      console.error('Erro ao buscar fornecedores:', error);
      return [];
    }

    return data || [];
  }

  async saveFornecedor(fornecedor) {
    const { error } = await this.supabase
      .from('fornecedores')
      .upsert(fornecedor);

    if (error) {
      console.error('Erro ao salvar fornecedor:', error);
      throw error;
    }
  }

  // ==========================================
  // RELATÓRIOS
  // ==========================================
  async getRelatorios() {
    const { data, error } = await this.supabase
      .from('relatorios')
      .select('*')
      .order('criado_em', { ascending: false });

    if (error) {
      console.error('Erro ao buscar relatórios:', error);
      return [];
    }

    return data || [];
  }

  async saveRelatorio(relatorio) {
    const { error } = await this.supabase
      .from('relatorios')
      .upsert({
        ...relatorio,
        usuario_id: this.usuario?.id
      });

    if (error) {
      console.error('Erro ao salvar relatório:', error);
      throw error;
    }
  }

  // ==========================================
  // AUDIT LOG
  // ==========================================
  async addAuditLog(user, action) {
    const { error } = await this.supabase
      .from('audit_log')
      .insert({
        usuario_id: this.usuario?.id,
        user_name: user,
        action: action
      });

    if (error) {
      console.error('Erro ao salvar audit log:', error);
    }
  }

  async getRecentAuditLogs(limit = 200) {
    const { data, error } = await this.supabase
      .from('audit_log')
      .select('*')
      .order('time', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Erro ao buscar audit logs:', error);
      return [];
    }

    return data || [];
  }
}

// Instância global
window.db = new DivinissimoDatabase();