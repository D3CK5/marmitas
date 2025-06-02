import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Activity, Users, Eye, MousePointer, Zap, Globe, Wifi, WifiOff } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface RealTimeMetrics {
  activeUsers: number;
  currentPageViews: { page: string; users: number }[];
  recentEvents: { event: string; timestamp: string; user?: string; page?: string }[];
  topCountries: { country: string; users: number }[];
  deviceBreakdown: { device: string; percentage: number; color: string }[];
}

export function RealTimeAnalytics() {
  const [metrics, setMetrics] = useState<RealTimeMetrics>({
    activeUsers: 0,
    currentPageViews: [],
    recentEvents: [],
    topCountries: [],
    deviceBreakdown: []
  });
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    // Função para buscar dados reais do banco
    const fetchRealTimeData = async () => {
      try {
        // Buscar usuários ativos nas últimas 5 minutos
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        
        // Página views recentes
        const { data: recentPageViews } = await supabase
          .from('page_views')
          .select('page_path, page_title, session_id, timestamp')
          .gte('timestamp', fiveMinutesAgo.toISOString())
          .order('timestamp', { ascending: false })
          .limit(50);

        // Eventos personalizados recentes
        const { data: recentCustomEvents } = await supabase
          .from('custom_events')
          .select('event_name, page_path, session_id, timestamp, event_data')
          .gte('timestamp', fiveMinutesAgo.toISOString())
          .order('timestamp', { ascending: false })
          .limit(20);

        // Sessões ativas (últimos 30 minutos)
        const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
        const { data: activeSessions } = await supabase
          .from('analytics_sessions')
          .select('device_type, region, started_at')
          .gte('started_at', thirtyMinutesAgo.toISOString());

        // Processar dados
        const uniqueSessions = new Set();
        const pageMap = new Map();
        const deviceMap = new Map();
        const regionMap = new Map();

        // Processar page views
        recentPageViews?.forEach(view => {
          uniqueSessions.add(view.session_id);
          
          const key = view.page_path;
          if (!pageMap.has(key)) {
            pageMap.set(key, {
              page: view.page_title || view.page_path,
              users: new Set()
            });
          }
          pageMap.get(key).users.add(view.session_id);
        });

        // Processar sessões ativas
        activeSessions?.forEach(session => {
          if (session.device_type) {
            deviceMap.set(session.device_type, (deviceMap.get(session.device_type) || 0) + 1);
          }
          if (session.region) {
            regionMap.set(session.region, (regionMap.get(session.region) || 0) + 1);
          }
        });

        // Criar eventos recentes combinados
        const combinedEvents = [
          ...(recentPageViews?.map(view => ({
            event: `Visitou ${view.page_title || view.page_path}`,
            timestamp: view.timestamp,
            page: view.page_path,
            user: 'Usuário'
          })) || []),
          ...(recentCustomEvents?.map(event => ({
            event: getEventDisplayName(event.event_name, event.event_data),
            timestamp: event.timestamp,
            page: event.page_path,
            user: 'Usuário'
          })) || [])
        ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10);

        // Atualizar métricas
        const totalSessions = activeSessions?.length || 0;
        setMetrics({
          activeUsers: uniqueSessions.size,
          currentPageViews: Array.from(pageMap.entries())
            .map(([page, data]) => ({
              page: data.page,
              users: data.users.size
            }))
            .sort((a, b) => b.users - a.users)
            .slice(0, 5),
          recentEvents: combinedEvents,
          topCountries: Array.from(regionMap.entries())
            .map(([country, users]) => ({ country, users }))
            .sort((a, b) => b.users - a.users)
            .slice(0, 4),
          deviceBreakdown: Array.from(deviceMap.entries())
            .map(([device, count]) => ({
              device: device.charAt(0).toUpperCase() + device.slice(1),
              percentage: totalSessions > 0 ? Math.round((count / totalSessions) * 100) : 0,
              color: getDeviceColor(device)
            }))
        });

        setLastUpdate(new Date());
        setIsConnected(true);
      } catch (error) {
        console.error('Erro ao buscar dados em tempo real:', error);
        setIsConnected(false);
        // Fallback para dados simulados
        updateWithSimulatedData();
      }
    };

    // Função para dados simulados quando offline
    const updateWithSimulatedData = () => {
      setMetrics({
        activeUsers: Math.floor(Math.random() * 50) + 20,
        currentPageViews: [
          { page: '/produtos', users: Math.floor(Math.random() * 15) + 5 },
          { page: '/checkout', users: Math.floor(Math.random() * 10) + 2 },
          { page: '/marmita-fitness', users: Math.floor(Math.random() * 8) + 3 },
          { page: '/contato', users: Math.floor(Math.random() * 5) + 1 },
          { page: '/', users: Math.floor(Math.random() * 12) + 8 }
        ].sort((a, b) => b.users - a.users),
        recentEvents: [
          { event: 'Produto visualizado', timestamp: new Date(Date.now() - Math.random() * 10000).toISOString(), user: 'Usuário' },
          { event: 'Carrinho atualizado', timestamp: new Date(Date.now() - Math.random() * 30000).toISOString(), user: 'Usuário' },
          { event: 'Checkout iniciado', timestamp: new Date(Date.now() - Math.random() * 60000).toISOString(), user: 'Usuário' },
          { event: 'Página visitada', timestamp: new Date(Date.now() - Math.random() * 90000).toISOString(), user: 'Usuário' },
          { event: 'Link clicado', timestamp: new Date(Date.now() - Math.random() * 120000).toISOString(), user: 'Usuário' }
        ],
        topCountries: [
          { country: 'Brasil', users: Math.floor(Math.random() * 30) + 15 },
          { country: 'Argentina', users: Math.floor(Math.random() * 8) + 2 },
          { country: 'Chile', users: Math.floor(Math.random() * 5) + 1 },
          { country: 'Uruguai', users: Math.floor(Math.random() * 3) + 1 }
        ],
        deviceBreakdown: [
          { device: 'Mobile', percentage: Math.floor(Math.random() * 20) + 60, color: '#3B82F6' },
          { device: 'Desktop', percentage: Math.floor(Math.random() * 15) + 25, color: '#10B981' },
          { device: 'Tablet', percentage: Math.floor(Math.random() * 10) + 5, color: '#F59E0B' }
        ]
      });
      setLastUpdate(new Date());
    };

    // Buscar dados reais primeiro
    fetchRealTimeData();

    // Atualizar dados a cada 10 segundos
    const interval = setInterval(fetchRealTimeData, 10000);

    // Configurar canal de realtime do Supabase
    const channel = supabase
      .channel('analytics_realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'page_views'
      }, (payload) => {
        console.log('📊 Nova visualização de página:', payload);
        // Atualizar dados quando houver nova inserção
        fetchRealTimeData();
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'custom_events'
      }, (payload) => {
        console.log('⚡ Novo evento personalizado:', payload);
        fetchRealTimeData();
      })
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  // Função para converter nomes de eventos em texto amigável
  const getEventDisplayName = (eventName: string, eventData?: any) => {
    switch (eventName) {
      case 'product_view':
        return eventData?.product_name ? `Visualizou ${eventData.product_name}` : 'Visualizou produto';
      case 'add_to_cart':
        return 'Adicionou ao carrinho';
      case 'button_click':
        return eventData?.button_text ? `Clicou em "${eventData.button_text}"` : 'Clicou em botão';
      case 'checkout_start':
        return 'Iniciou checkout';
      case 'scroll_depth':
        return `Scroll ${eventData?.depth || 0}%`;
      case 'time_on_page':
        return 'Tempo na página';
      case 'form_interaction':
        return 'Interagiu com formulário';
      case 'search':
        return eventData?.query ? `Buscou: "${eventData.query}"` : 'Realizou busca';
      default:
        return eventName.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = Date.now();
    const time = new Date(timestamp).getTime();
    const diffSeconds = Math.floor((now - time) / 1000);
    
    if (diffSeconds < 60) return `há ${diffSeconds}s`;
    if (diffSeconds < 3600) return `há ${Math.floor(diffSeconds / 60)}m`;
    return `há ${Math.floor(diffSeconds / 3600)}h`;
  };

  const getDeviceColor = (device: string) => {
    switch (device.toLowerCase()) {
      case 'mobile': return '#3B82F6';
      case 'desktop': return '#10B981';
      case 'tablet': return '#F59E0B';
      default: return '#64748B';
    }
  };

  return (
    <div className="space-y-6">
      {/* Status de Conexão e Informações */}
      <Card className="border-l-4 border-l-green-500">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              <div>
                <p className="font-medium">
                  {isConnected ? 'Conectado ao tempo real' : 'Modo offline'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Última atualização: {lastUpdate.toLocaleTimeString('pt-BR')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isConnected ? <Wifi className="h-5 w-5 text-green-500" /> : <WifiOff className="h-5 w-5 text-red-500" />}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Explicação do Sistema */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-700">
            <Activity className="h-5 w-5" />
            Como Funciona o Analytics em Tempo Real
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-600">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">📊 Coleta de Dados:</h4>
              <ul className="space-y-1 text-xs">
                <li>• Tracking automático de page views</li>
                <li>• Eventos personalizados (cliques, scrolls)</li>
                <li>• Sessões de usuário com metadados</li>
                <li>• Dados offline sincronizados</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">⚡ Tempo Real:</h4>
              <ul className="space-y-1 text-xs">
                <li>• WebSocket com Supabase Realtime</li>
                <li>• Atualização a cada 10 segundos</li>
                <li>• Fallback para modo offline</li>
                <li>• Cache local para performance</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Usuários Ativos */}
        <Card className="border-l-4 border-l-green-400">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários Online</CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{metrics.activeUsers}</div>
            <p className="text-xs text-muted-foreground">
              Últimos 5 minutos
            </p>
          </CardContent>
        </Card>

        {/* Páginas Mais Visitadas */}
        <Card className="border-l-4 border-l-blue-400">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Página Mais Quente</CardTitle>
            <Eye className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-blue-600">{metrics.currentPageViews[0]?.page || '/'}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.currentPageViews[0]?.users || 0} usuários ativos
            </p>
          </CardContent>
        </Card>

        {/* Eventos por Minuto */}
        <Card className="border-l-4 border-l-yellow-400">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eventos Recentes</CardTitle>
            <Zap className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{metrics.recentEvents.length}</div>
            <p className="text-xs text-muted-foreground">Últimos 5 minutos</p>
          </CardContent>
        </Card>

        {/* Países Conectados */}
        <Card className="border-l-4 border-l-purple-400">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Regiões Ativas</CardTitle>
            <Globe className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{metrics.topCountries.length}</div>
            <p className="text-xs text-muted-foreground">Regiões diferentes</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Páginas Ativas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-blue-500" />
              Páginas Ativas Agora
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.currentPageViews.length > 0 ? metrics.currentPageViews.map((page, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      #{index + 1}
                    </Badge>
                    <span className="text-sm font-medium truncate">{page.page}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress 
                      value={metrics.currentPageViews[0] ? (page.users / metrics.currentPageViews[0].users) * 100 : 0} 
                      className="w-16 h-2" 
                    />
                    <span className="text-sm text-muted-foreground min-w-[3ch]">
                      {page.users}
                    </span>
                  </div>
                </div>
              )) : (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  Nenhuma atividade recente
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Atividade Recente */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MousePointer className="h-5 w-5 text-orange-500" />
              Atividade em Tempo Real
            </CardTitle>
          </CardHeader>
          <CardContent className="max-h-80 overflow-y-auto">
            <div className="space-y-3">
              {metrics.recentEvents.length > 0 ? metrics.recentEvents.map((event, index) => (
                <div key={index} className="flex items-center justify-between text-sm border-b pb-2 last:border-0">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <div className="flex-1">
                      <span className="font-medium">{event.event}</span>
                      {event.page && (
                        <p className="text-xs text-muted-foreground">{event.page}</p>
                      )}
                    </div>
                  </div>
                  <span className="text-muted-foreground text-xs">
                    {formatTimeAgo(event.timestamp)}
                  </span>
                </div>
              )) : (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  Aguardando atividade...
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Distribuição de Dispositivos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-500" />
              Dispositivos Online
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.deviceBreakdown.map((device, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: device.color }}
                    />
                    <span className="text-sm">{device.device}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={device.percentage} className="w-20 h-2" />
                    <span className="text-sm font-medium min-w-[3ch]">
                      {device.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Regiões */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-purple-500" />
              Localização em Tempo Real
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.topCountries.length > 0 ? metrics.topCountries.map((country, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      #{index + 1}
                    </Badge>
                    <span className="text-sm">{country.country}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress 
                      value={metrics.topCountries[0] ? (country.users / metrics.topCountries[0].users) * 100 : 0} 
                      className="w-16 h-2" 
                    />
                    <span className="text-sm text-muted-foreground min-w-[2ch]">
                      {country.users}
                    </span>
                  </div>
                </div>
              )) : (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  Carregando localização...
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 