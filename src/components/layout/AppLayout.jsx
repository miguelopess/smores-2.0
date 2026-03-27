import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, PlusCircle, Trophy, Shield, LogOut, CalendarDays, BarChart2 } from 'lucide-react';
import { useCurrentUser, isParent } from '@/lib/useCurrentUser';
import { base44 } from '@/api/base44Client';
import { PERSON_AVATARS } from '@/lib/taskHelpers';
import { useQuery } from '@tanstack/react-query';
import NotificationBell from '@/components/notifications/NotificationBell';

export default function AppLayout() {
  const location = useLocation();
  const { data: user } = useCurrentUser();
  const userIsParent = isParent(user);
  const person = user?.linked_name;

  const { data: scheduledTasks = [] } = useQuery({
    queryKey: ['scheduledTasks'],
    queryFn: () => base44.entities.ScheduledTask.list(),
    enabled: !userIsParent && !!person,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list('-created_date', 500),
    enabled: !userIsParent && !!person,
  });

  const { data: occasionalTasks = [] } = useQuery({
    queryKey: ['occasionalTasks'],
    queryFn: () => base44.entities.OccasionalTask.list('-date', 200),
    enabled: !userIsParent && !!person,
  });

  const today = new Date().toISOString().split('T')[0];
  const todayTasks = tasks.filter(t => t.date === today && t.person === person);

  const navItems = [
    { path: '/', icon: Home, label: 'Início' },
    ...(!userIsParent ? [{ path: '/registar', icon: PlusCircle, label: 'Registar' }] : []),
    { path: '/ranking', icon: Trophy, label: 'Ranking' },
    ...(userIsParent ? [
      { path: '/rotinas', icon: CalendarDays, label: 'Tarefas' },
      { path: '/pais', icon: BarChart2, label: 'Relatório' },
    ] : []),
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top header */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">🏠</span>
            <span className="font-extrabold text-foreground tracking-tight">Tarefas de Casa</span>
          </div>
          {user && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-muted rounded-full px-3 py-1">
                <span className="text-sm">
                  {userIsParent ? '👨‍👩‍👧' : (PERSON_AVATARS[user.linked_name] || '👤')}
                </span>
                <span className="text-xs font-semibold text-foreground">
                  {userIsParent ? 'Pais' : (user.linked_name || user.full_name)}
                </span>
              </div>
              {!userIsParent && person && (
                <NotificationBell
                  scheduledTasks={scheduledTasks}
                  todayTasks={todayTasks}
                  person={person}
                  occasionalTasks={occasionalTasks}
                />
              )}
              <button
                onClick={() => base44.auth.logout()}
                className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="flex-1 pb-20">
        <Outlet />
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card/90 backdrop-blur-sm border-t border-border z-50">
        <div className="max-w-lg mx-auto flex justify-around items-center h-16 px-2">
          {navItems.map(({ path, icon: Icon, label }) => {
            const isActive = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'text-primary scale-105'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : ''}`} />
                <span className={`text-[10px] font-medium ${isActive ? 'font-semibold' : ''}`}>
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}