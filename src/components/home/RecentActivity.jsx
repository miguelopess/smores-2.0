import { COMPLETION_TYPES, PERSON_AVATARS, getTaskIcon } from '@/lib/taskHelpers';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { motion } from 'framer-motion';

export default function RecentActivity({ tasks }) {
  const recent = [...tasks]
    .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
    .slice(0, 8);

  if (recent.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p className="text-sm">Ainda não há tarefas registadas</p>
        <p className="text-xs mt-1">Regista a tua primeira tarefa!</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {recent.map((task, i) => {
        const ct = COMPLETION_TYPES[task.completion_type];
        return (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:border-primary/20 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-xl flex-shrink-0">
              {getTaskIcon(task.task_name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{task.task_name}</p>
              <p className="text-[11px] text-muted-foreground">
                {task.person} · {task.date ? format(new Date(task.date), "d MMM", { locale: pt }) : ''}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className={`text-sm font-bold ${ct?.color || 'text-foreground'}`}>
                +€{(task.value || 0).toFixed(2)}
              </p>
              <p className="text-[10px]">{ct?.emoji}</p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}