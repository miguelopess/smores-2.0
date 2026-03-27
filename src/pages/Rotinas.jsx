import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser, isParent } from '@/lib/useCurrentUser';
import { Lock, CalendarDays, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import ScheduledTaskManager from '@/components/parents/ScheduledTaskManager';
import OccasionalTaskManager from '@/components/parents/OccasionalTaskManager';

export default function Rotinas() {
  const { data: user, isLoading: loadingUser } = useCurrentUser();

  const { data: scheduledTasks = [], isLoading } = useQuery({
    queryKey: ['scheduledTasks'],
    queryFn: () => base44.entities.ScheduledTask.list(),
  });

  const { data: occasionalTasks = [], isLoading: loadingOccasional } = useQuery({
    queryKey: ['occasionalTasks'],
    queryFn: () => base44.entities.OccasionalTask.list('-date', 200),
  });

  if (isLoading || loadingUser || loadingOccasional) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!isParent(user)) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-16 flex flex-col items-center text-center">
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
          <Lock className="w-9 h-9 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">Área Restrita</h2>
        <p className="text-sm text-muted-foreground">Este painel é apenas para os pais.</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="flex items-center gap-2 mb-1">
          <CalendarDays className="w-5 h-5 text-primary" />
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Tarefas</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-5">Gere as tarefas de cada filho</p>
      </motion.div>

      <Tabs defaultValue="rotinas" className="w-full">
        <TabsList className="w-full grid grid-cols-2 mb-5 h-11 rounded-xl">
          <TabsTrigger value="rotinas" className="rounded-lg font-semibold">
            📅 Rotinas
          </TabsTrigger>
          <TabsTrigger value="ocasionais" className="rounded-lg font-semibold">
            ✨ Ocasionais
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rotinas">
          <ScheduledTaskManager scheduledTasks={scheduledTasks} />
        </TabsContent>

        <TabsContent value="ocasionais">
          <OccasionalTaskManager occasionalTasks={occasionalTasks} />
        </TabsContent>
      </Tabs>
    </div>
  );
}