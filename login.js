const { useState, useEffect } = React;

function LoginPage() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [lembrar, setLembrar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [dark, setDark] = useState(false);
  const [dbReady, setDbReady] = useState(false);

  // Aplicar classes CSS externas quando o componente montar
  useEffect(() => {
    // Aplica as classes CSS do arquivo externo
    const applyExternalStyles = () => {
      const mainContainer = document.getElementById('root');
      const loginContainer = document.querySelector('.login-container');
      
      if (mainContainer) {
        mainContainer.classList.add('container-login');
        mainContainer.style.display = 'flex';
        mainContainer.style.flexDirection = 'column';
        mainContainer.style.justifyContent = 'flex-start';
      }
      
      if (loginContainer) {
        loginContainer.classList.add('login-container');
        loginContainer.style.margin = '0';
        loginContainer.style.padding = '0';
        loginContainer.style.height = 'auto';
        loginContainer.style.minHeight = 'unset';
      }
    };

    // Aplica os estilos após o render inicial
    setTimeout(applyExternalStyles, 10);
    
    // Re-aplica quando houver mudanças no DOM
    const observer = new MutationObserver(applyExternalStyles);
    observer.observe(document.body, { childList: true, subtree: true });
    
    return () => observer.disconnect();
  }, []);

  // Inicializar banco de dados e tema
  useEffect(() => {
    const initDB = async () => {
      try {
        if (window.db) {
          await window.db.init();
          await window.db.initializeDefaultData();
          
          // Carregar tema salvo
          const darkMode = await window.db.getConfig('dark');
          if (darkMode !== null) {
            setDark(darkMode);
            if (darkMode) {
              document.documentElement.classList.add('dark');
            } else {
              document.documentElement.classList.remove('dark');
            }
          }
          
          // Escutar mudanças de tema de outras páginas
          const unsubscribe = window.db.onConfigChange('dark', (newValue) => {
            console.log('Tema mudou para:', newValue ? 'escuro' : 'claro');
            setDark(newValue);
            if (newValue) {
              document.documentElement.classList.add('dark');
            } else {
              document.documentElement.classList.remove('dark');
            }
          });
          
          setDbReady(true);
          
          // Cleanup
          return () => unsubscribe();
        }
        setDbReady(true);
      } catch (error) {
        console.error('Erro ao inicializar banco de dados:', error);
        setDbReady(true);
        
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
          setDark(true);
          document.documentElement.classList.add('dark');
        }
      }
    };
    
    initDB();
  }, []);

  // Salvar tema quando mudar
  useEffect(() => {
    if (dbReady && window.db) {
      window.db.setConfig('dark', dark);
    } else {
      if (dark) {
        localStorage.setItem('theme', 'dark');
      } else {
        localStorage.setItem('theme', 'light');
      }
    }
  }, [dark, dbReady]);

  const toggleDark = () => {
    setDark(prev => !prev);
  };

  const validarEmail = (email) => {
    const regex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    return regex.test(email);
  };

  const handleLogin = async (e) => {
  e.preventDefault();
  setErro('');

  if (!email || !senha) {
    setErro('Por favor, preencha todos os campos');
    return;
  }

  if (!validarEmail(email)) {
    setErro('Email inválido');
    return;
  }

  setLoading(true);

  try {
    // Autenticar com Supabase
    const { data: usuario, error } = await window.supabaseClient
      .from('usuarios')
      .select('*')
      .eq('email', email)
      .eq('ativo', true)
      .single();

    if (error || !usuario) {
      setErro('Email ou senha incorretos');
      setLoading(false);
      return;
    }

    // NOTA: Em produção, use hash de senha (bcrypt)
    // Por enquanto, validação simplificada
    const senhasValidas = {
      'admin@divinissimo.com.br': 'admin123',
      'supervisor@divinissimo.com.br': 'super123',
      'operador@divinissimo.com.br': 'oper123',
      'qualidade@divinissimo.com.br': 'quali123'
    };

    if (senhasValidas[email] !== senha) {
      setErro('Email ou senha incorretos');
      setLoading(false);
      return;
    }

    // Salvar sessão
    const sessao = {
      id: usuario.id,
      email: usuario.email,
      nome: usuario.nome,
      perfil: usuario.perfil,
      timestamp: new Date().toISOString()
    };
    
    localStorage.setItem('usuario', JSON.stringify(sessao));
    
    if (lembrar) {
      localStorage.setItem('lembrar', 'true');
      localStorage.setItem('email', email);
    }

    // Registrar audit log
    await window.supabaseClient
      .from('audit_log')
      .insert({
        usuario_id: usuario.id,
        user_name: usuario.nome,
        action: `Login realizado - ${usuario.perfil}`,
        ip_address: await fetch('https://api.ipify.org?format=json')
          .then(r => r.json())
          .then(d => d.ip)
          .catch(() => 'N/A')
      });

    window.location.href = 'index.html';
    
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    setErro('Erro ao conectar com o servidor');
    setLoading(false);
  }
};

  useEffect(() => {
    const lembrarAtivo = localStorage.getItem('lembrar');
    const emailSalvo = localStorage.getItem('email');
    if (lembrarAtivo && emailSalvo) {
      setEmail(emailSalvo);
      setLembrar(true);
    }
  }, []);

  return (
    <div className={`login-container flex items-center justify-center w-full transition-colors duration-300 ${
      dark 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
        : 'bg-gradient-to-br from-green-50 via-white to-green-100'
    }`} style={{ minHeight: '100vh', height: 'auto' }}>
      
      {/* Elementos decorativos de fundo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-20 left-10 w-72 h-72 rounded-full blur-3xl opacity-20 animate-float ${
          dark ? 'bg-green-500' : 'bg-green-400'
        }`}></div>
        <div className={`absolute bottom-20 right-10 w-96 h-96 rounded-full blur-3xl opacity-20 animate-float ${
          dark ? 'bg-blue-500' : 'bg-blue-400'
        }`} style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Container principal */}
      <div className="relative z-10 w-full max-w-md px-6 py-8 animate-fade-in">
        
        {/* Card de login */}
        <div className={`rounded-2xl shadow-2xl overflow-hidden ${
          dark ? 'bg-gray-800 border border-gray-700' : 'bg-white'
        }`}>
          
          {/* Header */}
          <div className={`p-8 text-center relative ${
            dark ? 'bg-gradient-to-br from-gray-700 to-gray-800' : 'bg-gradient-to-br from-green-500 to-green-600'
          }`}>
            <div className="absolute top-4 right-4">
              <button
                onClick={toggleDark}
                className="p-2 rounded-lg bg-white bg-opacity-20 hover:bg-opacity-30 transition-all"
              >
                {dark ? '☀️' : '🌙'}
              </button>
            </div>
            
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white bg-opacity-20 backdrop-blur-sm mb-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-white to-green-100 flex items-center justify-center text-3xl font-bold text-green-600 shadow-lg">
                DV
              </div>
            </div>
            
            <h1 className="text-3xl font-bold text-white mb-2">Diviníssimo</h1>
            <p className="text-green-100 text-sm">Sistema de Coleta de Dados de Produção</p>
          </div>

          {/* Formulário */}
          <form onSubmit={handleLogin} className="p-8 space-y-6">
            <div>
              <h2 className={`text-2xl font-bold mb-6 ${dark ? 'text-white' : 'text-gray-800'}`}>
                Bem-vindo de volta
              </h2>
            </div>

            {erro && (
              <div className="p-4 rounded-lg bg-red-100 dark:bg-red-900 dark:bg-opacity-30 border border-red-300 dark:border-red-700 animate-fade-in">
                <div className="flex items-center gap-2">
                  <span className="text-red-600 dark:text-red-400">⚠️</span>
                  <p className="text-sm text-red-800 dark:text-red-300">{erro}</p>
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${dark ? 'text-gray-300' : 'text-gray-700'}`}>
                Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className={`w-full px-4 py-3 rounded-lg border-2 transition-all focus:outline-none focus:ring-2 focus:ring-green-500 ${
                    dark 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                  disabled={loading}
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xl">
                  📧
                </span>
              </div>
            </div>

            {/* Senha */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${dark ? 'text-gray-300' : 'text-gray-700'}`}>
                Senha
              </label>
              <div className="relative">
                <input
                  type={mostrarSenha ? 'text' : 'password'}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full px-4 py-3 rounded-lg border-2 transition-all focus:outline-none focus:ring-2 focus:ring-green-500 ${
                    dark 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xl hover:scale-110 transition-transform"
                >
                  {mostrarSenha ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            {/* Lembrar / Esqueci senha */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={lembrar}
                  onChange={(e) => setLembrar(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                  disabled={loading}
                />
                <span className={`text-sm ${dark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Lembrar-me
                </span>
              </label>
              <button
                type="button"
                onClick={() => alert('Funcionalidade de recuperação de senha em desenvolvimento')}
                className="text-sm text-green-600 dark:text-green-400 hover:underline transition-colors"
                disabled={loading}
              >
                Esqueci minha senha
              </button>
            </div>

            {/* Botão de login */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-lg font-semibold text-white shadow-lg transition-all ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Entrando...
                </span>
              ) : (
                'Entrar'
              )}
            </button>

            {/* Separador */}
            <div className="relative my-6">
              <div className={`absolute inset-0 flex items-center ${dark ? 'text-gray-600' : 'text-gray-300'}`}>
                <div className="w-full border-t"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className={`px-4 ${dark ? 'bg-gray-800 text-gray-400' : 'bg-white text-gray-500'}`}>
                  Usuários de demonstração
                </span>
              </div>
            </div>

            {/* Lista de usuários demo */}
            <div className={`p-4 rounded-lg space-y-2 text-xs ${dark ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <div className={dark ? 'text-gray-300' : 'text-gray-600'}>
                <p className="font-semibold mb-2">👤 Teste com estas contas:</p>
                <div className="space-y-1 ml-4">
                  <p>• admin@divinissimo.com.br / admin123</p>
                  <p>• supervisor@divinissimo.com.br / super123</p>
                  <p>• operador@divinissimo.com.br / oper123</p>
                  <p>• qualidade@divinissimo.com.br / quali123</p>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className={`text-center mt-6 text-sm ${dark ? 'text-gray-400' : 'text-gray-600'}`}>
          <p>© 2025 Diviníssimo • Protótipo v4</p>
          <p className="mt-2">Sistema de Gestão de Produção de Pão de Queijo</p>
        </div>
      </div>
    </div>
  );
}

// Renderizar
const container = document.getElementById('root');
if (container) {
  container.innerHTML = '';
  
  // Aplica as classes CSS do arquivo externo imediatamente
  container.classList.add('container-login');
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.justifyContent = 'flex-start';
  container.style.height = 'auto';
  container.style.minHeight = '100vh';
  container.style.margin = '0';
  container.style.padding = '0';
  
  if (ReactDOM.createRoot) {
    ReactDOM.createRoot(container).render(<LoginPage />);
  } else {
    ReactDOM.render(<LoginPage />, container);
  }
  
  // Força a aplicação das classes após o render
  setTimeout(() => {
    const loginContainer = document.querySelector('.login-container');
    if (loginContainer) {
      loginContainer.classList.add('login-container');
      loginContainer.style.margin = '0';
      loginContainer.style.padding = '0';
      loginContainer.style.height = 'auto';
      loginContainer.style.minHeight = 'unset';
    }
  }, 50);
} else {
  console.warn('Elemento #root não encontrado. Crie <div id="root"></div> no HTML.');
}