import { supabase } from './supabaseClient';

// Helper to parse Base44-style sort field: '-created_date' → { column: 'created_date', ascending: false }
function parseSort(sortField) {
  if (!sortField) return null;
  const descending = sortField.startsWith('-');
  const column = descending ? sortField.slice(1) : sortField;
  return { column, ascending: !descending };
}

export const TaskService = {
  async list(sortField, limit) {
    let query = supabase.from('tasks').select('*');
    const sort = parseSort(sortField);
    if (sort) query = query.order(sort.column, { ascending: sort.ascending });
    if (limit) query = query.limit(limit);
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async create(record) {
    const { data, error } = await supabase.from('tasks').insert(record).select().single();
    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) throw error;
  },
};

export const ScheduledTaskService = {
  async list() {
    const { data, error } = await supabase.from('scheduled_tasks').select('*');
    if (error) throw error;
    return data;
  },

  async create(record) {
    const { data, error } = await supabase.from('scheduled_tasks').insert(record).select().single();
    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabase.from('scheduled_tasks').delete().eq('id', id);
    if (error) throw error;
  },
};

export const OccasionalTaskService = {
  async list(sortField, limit) {
    let query = supabase.from('occasional_tasks').select('*');
    const sort = parseSort(sortField);
    if (sort) query = query.order(sort.column, { ascending: sort.ascending });
    if (limit) query = query.limit(limit);
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async create(record) {
    const { data, error } = await supabase.from('occasional_tasks').insert(record).select().single();
    if (error) throw error;
    return data;
  },

  async update(id, updates) {
    const { data, error } = await supabase.from('occasional_tasks').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabase.from('occasional_tasks').delete().eq('id', id);
    if (error) throw error;
  },
};

export const TaskReminderService = {
  async create(record) {
    const { data, error } = await supabase.from('task_reminders').insert(record).select().single();
    if (error) throw error;
    return data;
  },

  async getByPersonAndDate(person, date) {
    const { data, error } = await supabase
      .from('task_reminders')
      .select('*')
      .eq('person', person)
      .eq('task_date', date);
    if (error) throw error;
    return data;
  },

  async getByDate(date) {
    const { data, error } = await supabase
      .from('task_reminders')
      .select('*')
      .eq('task_date', date);
    if (error) throw error;
    return data;
  },
};
