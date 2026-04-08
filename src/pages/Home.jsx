import { useQuery } from '@tanstack/react-query';
import { TaskService, ScheduledTaskService, OccasionalTaskService } from '@/api/entities';
import { useCurrentUser, isParent } from '@/lib/useCurrentUser';
import { PEOPLE, PERSON_AVATARS, getCurrentWeekKey, getWeekTasks, PENALTIES, countFailures, getLocalDateStr } from '@/lib/taskHelpers';
import PersonCard from '@/components/home/PersonCard';
import WeeklyBonusBanner from '@/components/home/WeeklyBonusBanner';
import RecentActivity from '@/components/home/RecentActivity';
import TodaySchedule from '@/components/home/TodaySchedule';
import { useNotifications } from '@/lib/useNotifications';
import { useMarkMissedTasks } from '@/lib/useMarkMissedTasks';
import { motion } from 'framer-motion';
import { Sparkles, Calendar } from 'lucide-react';

export default function Home() {
  const currentWeek = getCurrentWeekKey();
  const { data: user } = useCurrentUser();
  const userIsParent = isParent(user);
  const person = user?.linked_name;

  const { data: tasks = [], isLoading: isLoadingTasks } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => TaskService.list('-created_date', 500),
  });

  const { data: scheduledTasks = [], isLoading: isLoadingScheduled } = useQuery({
    queryKey: ['scheduledTasks'],
    queryFn: () => ScheduledTaskService.list(),
  });



  const { data: occasionalTasks = [] } = useQuery({
    queryKey: ['occasionalTasks'],
    queryFn: () => OccasionalTaskService.list('-date', 200),
    enabled: !userIsParent && !!person,
  });

  const weekTasks = getWeekTasks(tasks, currentWeek);

  const today = getLocalDateStr();
  const todayTasks = tasks.filter(t => t.date === today);

  useMarkMissedTasks({
    scheduledTasks,
    tasks,
    person: userIsParent ? null : person,
    enabled: !userIsParent && !!person && !isLoadingTasks && !isLoadingScheduled && scheduledTasks.length > 0,
  });

  useNotifications({
    scheduledTasks,
    todayTasks: todayTasks.filter(t => !userIsParent && t.person === person),
    person: userIsParent ? null : person,
    occasionalTasks: userIsParent ? [] : occasionalTasks,
  });

  const isLoading = isLoadingTasks || isLoadingScheduled;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-4">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-5 h-5 text-accent" />
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Tarefas de Casa</h1>
        </div>
        <p className="text-sm text-muted-foreground">Semana {currentWeek.split('-')[2]} de {new Date().toLocaleString('pt-PT', { month: 'long' })} · Sistema Familiar</p>
      </motion.div>

      {/* Today's Schedule for logged-in child */}
      {!userIsParent && person && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-primary" />
            <h2 className="text-base font-bold text-foreground">As tuas tarefas de hoje</h2>
          </div>
          <TodaySchedule
            scheduledTasks={scheduledTasks}
            todayTasks={todayTasks.filter(t => t.person === person)}
            person={person}
            occasionalTasks={occasionalTasks}
          />
        </div>
      )}

      {/* Weekly Bonus */}
      <div className="mb-5">
        <WeeklyBonusBanner tasks={tasks} currentWeek={currentWeek} />
      </div>

      {/* Person Cards */}
      <div className="space-y-3 mb-6">
        {PEOPLE.map((person, i) => (
          <PersonCard
            key={person}
            person={person}
            tasks={tasks}
            weekTasks={weekTasks}
            index={i}
          />
        ))}
      </div>

      {/* Recent Activity */}
      <div className="mb-4">
        <h2 className="text-lg font-bold text-foreground mb-3">Atividade Recente</h2>
        <RecentActivity tasks={tasks} />
      </div>
    </div>
  );
}