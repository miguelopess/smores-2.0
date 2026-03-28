import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ScheduledTaskService } from '@/api/entities';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { PEOPLE, PERSON_AVATARS, COMMON_TASKS, TASK_ICONS } from '@/lib/taskHelpers';

const DAYS = [
  { key: 'monday', label: 'Seg' },
  { key: 'tuesday', label: 'Ter' },
  { key: 'wednesday', label: 'Qua' },
  { key: 'thursday', label: 'Qui' },
  { key: 'friday', label: 'Sex' },
  { key: 'saturday', label: 'Sáb' },
  { key: 'sunday', label: 'Dom' },
];

const DAYS_FULL = {
  monday: 'Segunda', tuesday: 'Terça', wednesday: 'Quarta',
  thursday: 'Quinta', friday: 'Sexta', saturday: 'Sábado', sunday: 'Domingo',
};

export default function ScheduledTaskManager({ scheduledTasks }) {
  const queryClient = useQueryClient();
  const [selectedPerson, setSelectedPerson] = useState(PEOPLE[0]);
  const [form, setForm] = useState({
    task_name: '',
    custom_task: '',
    days_of_week: [],
    end_time: '',
  });
  const [showCustom, setShowCustom] = useState(false);

  const createMutation = useMutation({
    mutationFn: (data) => ScheduledTaskService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduledTasks'] });
      setForm({ task_name: '', custom_task: '', days_of_week: [], end_time: '' });
      setShowCustom(false);
      toast.success('Tarefa diária criada!');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => ScheduledTaskService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduledTasks'] });
      toast.success('Tarefa removida');
    },
  });

  const toggleDay = (day) => {
    setForm(f => ({
      ...f,
      days_of_week: f.days_of_week.includes(day)
        ? f.days_of_week.filter(d => d !== day)
        : [...f.days_of_week, day],
    }));
  };

  const handleSubmit = () => {
    const taskName = form.task_name === 'custom' ? form.custom_task : form.task_name;
    if (!taskName || form.days_of_week.length === 0) {
      toast.error('Preenche a tarefa e seleciona pelo menos um dia!');
      return;
    }
    createMutation.mutate({
      person: selectedPerson,
      task_name: taskName,
      days_of_week: form.days_of_week,
      start_time: null,
      end_time: form.end_time || null,
    });
  };

  const personSchedule = scheduledTasks.filter(t => t.person === selectedPerson);

  return (
    <div className="space-y-4">
      {/* Person selector */}
      <div className="flex gap-2">
        {PEOPLE.map(p => (
          <button
            key={p}
            onClick={() => setSelectedPerson(p)}
            className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl border-2 transition-all ${
              selectedPerson === p ? 'border-primary bg-primary/5' : 'border-border'
            }`}
          >
            <span className="text-xl">{PERSON_AVATARS[p]}</span>
            <span className="text-xs font-semibold">{p}</span>
          </button>
        ))}
      </div>

      {/* Add form */}
      <Card className="p-4 space-y-3">
        <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nova tarefa diária para {selectedPerson}
        </h4>

        {/* Task name */}
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">Tarefa</Label>
          <div className="grid grid-cols-3 gap-1.5 mb-2">
            {COMMON_TASKS.slice(0, 9).map(task => (
              <button
                key={task}
                onClick={() => { setForm(f => ({ ...f, task_name: task })); setShowCustom(false); }}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-center transition-all ${
                  form.task_name === task ? 'border-primary bg-primary/5' : 'border-border'
                }`}
              >
                <span className="text-lg">{TASK_ICONS[task] || '✅'}</span>
                <span className="text-[9px] font-medium leading-tight">{task}</span>
              </button>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-1.5 mb-2">
            {COMMON_TASKS.slice(9, 18).map(task => (
              <button
                key={task}
                onClick={() => { setForm(f => ({ ...f, task_name: task })); setShowCustom(false); }}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-center transition-all ${
                  form.task_name === task ? 'border-primary bg-primary/5' : 'border-border'
                }`}
              >
                <span className="text-lg">{TASK_ICONS[task] || '✅'}</span>
                <span className="text-[9px] font-medium leading-tight">{task}</span>
              </button>
            ))}
          </div>
          <button
            onClick={() => { setShowCustom(true); setForm(f => ({ ...f, task_name: 'custom' })); }}
            className={`w-full p-2 rounded-xl border text-xs text-muted-foreground transition-all ${
              form.task_name === 'custom' ? 'border-primary bg-primary/5' : 'border-dashed border-border'
            }`}
          >
            + Outra tarefa
          </button>
          {showCustom && (
            <Input
              className="mt-2 h-10 rounded-xl"
              placeholder="Nome da tarefa..."
              value={form.custom_task}
              onChange={e => setForm(f => ({ ...f, custom_task: e.target.value }))}
            />
          )}
        </div>

        {/* Days */}
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">Dias da semana</Label>
          <div className="flex gap-1">
            {DAYS.map(d => (
              <button
                key={d.key}
                onClick={() => toggleDay(d.key)}
                className={`flex-1 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                  form.days_of_week.includes(d.key)
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Time */}
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block flex items-center gap-1">
            <Clock className="w-3 h-3" /> Até que horas? (opcional)
          </Label>
          <Input
            type="time"
            value={form.end_time}
            onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))}
            className="h-10 rounded-xl"
          />
        </div>

        <Button
          onClick={handleSubmit}
          disabled={createMutation.isPending}
          className="w-full h-10 rounded-xl font-semibold"
        >
          Adicionar Tarefa Diária
        </Button>
      </Card>

      {/* Existing schedule */}
      <div className="space-y-2">
        <h4 className="text-sm font-bold text-foreground">
          📅 Rotina de {selectedPerson} ({personSchedule.length} tarefas)
        </h4>
        {personSchedule.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">Sem tarefas diárias definidas</p>
        ) : (
          personSchedule.map(task => (
            <Card key={task.id} className="p-3 flex items-center gap-3">
              <span className="text-xl">{TASK_ICONS[task.task_name] || '✅'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{task.task_name}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {task.days_of_week?.map(d => (
                    <span key={d} className="text-[9px] bg-muted px-1.5 py-0.5 rounded-full text-muted-foreground">
                      {DAYS_FULL[d]}
                    </span>
                  ))}
                </div>
                {task.end_time && (
                  <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {`Até às ${task.end_time}`}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => deleteMutation.mutate(task.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}