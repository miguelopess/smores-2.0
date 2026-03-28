import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { OccasionalTaskService } from '@/api/entities';
import { Clock, CheckCircle2, Circle, Star } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { TASK_ICONS } from '@/lib/taskHelpers';
import TaskCompleteModal from './TaskCompleteModal';

const DAYS_MAP = {
  monday: 'Segunda', tuesday: 'Terça', wednesday: 'Quarta',
  thursday: 'Quinta', friday: 'Sexta', saturday: 'Sábado', sunday: 'Domingo',
};

function getTodayKey() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
}

function isTaskDone(scheduledTask, todayTasks) {
  return todayTasks.some(t => t.task_name === scheduledTask.task_name);
}

function isOverdue(endTime) {
  if (!endTime) return false;
  const now = new Date();
  const [h, m] = endTime.split(':').map(Number);
  const end = new Date();
  end.setHours(h, m, 0);
  return now > end;
}

function isActive(startTime, endTime) {
  if (!endTime) return true;
  const now = new Date();
  const [eh, em] = endTime.split(':').map(Number);
  const end = new Date(); end.setHours(eh, em, 0);
  return now <= end;
}

export default function TodaySchedule({ scheduledTasks, todayTasks, person, occasionalTasks = [] }) {
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedOccasional, setSelectedOccasional] = useState(null);
  const queryClient = useQueryClient();
  const todayKey = getTodayKey();
  const today = new Date().toISOString().split('T')[0];

  const todaySchedule = scheduledTasks
    .filter(t => t.person === person && t.days_of_week?.includes(todayKey))
    .sort((a, b) => (a.start_time || '00:00').localeCompare(b.start_time || '00:00'));

  const todayOccasional = occasionalTasks
    .filter(t => t.person === person && t.date === today && !t.completed)
    .sort((a, b) => (a.end_time || '99:99').localeCompare(b.end_time || '99:99'));

  const markOccasionalDone = useMutation({
    mutationFn: (id) => OccasionalTaskService.update(id, { completed: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['occasionalTasks'] }),
  });

  const totalAll = todaySchedule.length + todayOccasional.length;
  const doneScheduled = todaySchedule.filter(t => isTaskDone(t, todayTasks)).length;
  const totalDone = doneScheduled; // occasional tasks are filtered out when completed

  if (totalAll === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <p className="text-sm">Sem tarefas agendadas para hoje 🎉</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-muted-foreground">{totalDone}/{totalAll} concluídas</span>
          <div className="flex-1 mx-3 bg-muted rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${totalAll > 0 ? (totalDone / totalAll) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Occasional tasks for today */}
        {todayOccasional.map((task, i) => {
          const overdue = isOverdue(task.end_time);
          return (
            <motion.div
              key={`occ-${task.id}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card
                onClick={() => setSelectedOccasional(task)}
                className={`p-3 flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-all border-accent/40 bg-accent/5 ${
                  overdue ? 'border-destructive/40 bg-destructive/5' : ''
                }`}
              >
                <div className="text-xl flex-shrink-0">{TASK_ICONS[task.task_name] || '✅'}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold text-foreground">{task.task_name}</p>
                    <Star className="w-3 h-3 text-accent fill-accent" />
                  </div>
                  {task.end_time && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <span className="text-[11px] text-muted-foreground">Até às {task.end_time}</span>
                    </div>
                  )}
                  {task.notes && <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{task.notes}</p>}
                </div>
                <div className="flex-shrink-0">
                  {overdue ? (
                    <Badge variant="destructive" className="text-[10px]">Atrasado</Badge>
                  ) : (
                    <Badge className="bg-accent/20 text-accent-foreground border-0 text-[10px]">Especial</Badge>
                  )}
                </div>
              </Card>
            </motion.div>
          );
        })}

        {todaySchedule.map((task, i) => {
          const isDone = isTaskDone(task, todayTasks);
          const overdue = !isDone && isOverdue(task.end_time);
          const active = isActive(task.start_time, task.end_time);

          return (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card
                onClick={() => !isDone && setSelectedTask(task)}
                className={`p-3 flex items-center gap-3 transition-all ${
                  isDone ? 'opacity-60 bg-muted/50' :
                  overdue ? 'border-destructive/40 bg-destructive/5 cursor-pointer active:scale-[0.98]' :
                  active ? 'border-primary/30 bg-primary/5 cursor-pointer active:scale-[0.98]' :
                  'cursor-pointer hover:border-primary/20 active:scale-[0.98]'
                }`}
              >
                <div className="text-xl flex-shrink-0">{TASK_ICONS[task.task_name] || '✅'}</div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${isDone ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                    {task.task_name}
                  </p>
                  {task.end_time && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <span className="text-[11px] text-muted-foreground">Até às {task.end_time}</span>
                    </div>
                  )}
                </div>
                <div className="flex-shrink-0">
                  {isDone ? (
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                  ) : overdue ? (
                    <Badge variant="destructive" className="text-[10px]">Atrasado</Badge>
                  ) : active ? (
                    <Badge className="bg-primary/15 text-primary border-0 text-[10px]">Agora</Badge>
                  ) : (
                    <Circle className="w-5 h-5 text-muted-foreground/40" />
                  )}
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <TaskCompleteModal
        task={selectedTask}
        person={person}
        onClose={() => setSelectedTask(null)}
      />

      {selectedOccasional && (
        <div className="fixed inset-0 bg-black/40 z-40 flex items-end" onClick={() => setSelectedOccasional(null)}>
          <div className="w-full bg-card rounded-t-3xl p-6 pb-24 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-5">
              <span className="text-3xl">{TASK_ICONS[selectedOccasional.task_name] || '✅'}</span>
              <div>
                <h3 className="font-bold text-lg text-foreground">{selectedOccasional.task_name}</h3>
                {selectedOccasional.end_time && (
                  <p className="text-xs text-muted-foreground">Até às {selectedOccasional.end_time}</p>
                )}
                {selectedOccasional.notes && (
                  <p className="text-xs text-muted-foreground">{selectedOccasional.notes}</p>
                )}
              </div>
            </div>
            <button
              disabled={markOccasionalDone.isPending}
              onClick={() => { markOccasionalDone.mutate(selectedOccasional.id); setSelectedOccasional(null); }}
              className="w-full py-3 rounded-2xl bg-primary text-primary-foreground font-bold text-sm disabled:opacity-50"
            >
              ✅ Marcar como concluída
            </button>
            <button
              onClick={() => setSelectedOccasional(null)}
              className="w-full py-3 mt-2 rounded-2xl bg-muted text-muted-foreground font-medium text-sm"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </>
  );
}