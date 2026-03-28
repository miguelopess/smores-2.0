import { useEffect, useRef } from 'react';
import { TaskService } from '@/api/entities';
import { sendPushNotification } from '@/api/supabaseClient';
import { getWeekKey, getCurrentMonthKey } from './taskHelpers';

// Checks the last 7 days for scheduled tasks that were never done and registers them as 'not_done'
export function useMarkMissedTasks({ scheduledTasks, tasks, person, enabled }) {
  const hasRun = useRef(false);

  useEffect(() => {
    // Reset when person changes
    hasRun.current = false;
  }, [person]);

  useEffect(() => {
    if (!enabled || !person || scheduledTasks.length === 0) return;
    if (hasRun.current) return; // Only run once per session
    hasRun.current = true;

    const DAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

    async function checkMissed() {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (let daysBack = 1; daysBack <= 7; daysBack++) {
        const date = new Date(today);
        date.setDate(today.getDate() - daysBack);
        const dateStr = date.toISOString().split('T')[0];
        const dayKey = DAY_KEYS[date.getDay()];

        const myTasksForDay = scheduledTasks.filter(
          t => t.person === person &&
               t.days_of_week?.includes(dayKey) &&
               // Only count as missed if the scheduled task existed before that day
               (!t.created_date || t.created_date.split('T')[0] <= dateStr)
        );

        for (const scheduledTask of myTasksForDay) {
          const alreadyRecorded = tasks.some(
            t => t.person === person && t.task_name === scheduledTask.task_name && t.date === dateStr
          );

          if (!alreadyRecorded) {
            await TaskService.create({
              person,
              task_name: scheduledTask.task_name,
              completion_type: 'not_done',
              value: 0,
              date: dateStr,
              week_key: getWeekKey(date),
              month_key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
            });

            // Notify parents about missed task (only for yesterday)
            if (daysBack === 1) {
              sendPushNotification({
                person: '__parents__',
                title: `❌ Tarefa não feita`,
                body: `${person} não completou: ${scheduledTask.task_name} (${dateStr})`,
                tag: `missed-${person}-${scheduledTask.task_name}-${dateStr}`,
              });
            }
          }
        }
      }
    }

    checkMissed();
  }, [enabled, person, scheduledTasks.length]);
}