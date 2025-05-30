import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

interface Task {
  _id: string;
  text: string;
  completed: boolean;
  completedBy: string | null;
  completedAt: string | null;
}

export function ReferralTasks({ referralId }: { referralId: string }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newTask, setNewTask] = useState('');
  const [adding, setAdding] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/referrals/${referralId}/tasks`);
      if (!res.ok) throw new Error('Failed to fetch tasks');
      const data = await res.json();
      setTasks(data.tasks || []);
    } catch (err) {
      setError('Could not load tasks.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [referralId]);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    setAdding(true);
    try {
      const res = await fetch(`/api/referrals/${referralId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newTask.trim() }),
      });
      if (!res.ok) throw new Error('Failed to add task');
      setNewTask('');
      fetchTasks();
    } catch (err) {
      setError('Could not add task.');
    } finally {
      setAdding(false);
    }
  };

  const handleToggle = async (task: Task) => {
    setUpdating(task._id);
    try {
      const res = await fetch(`/api/referrals/${referralId}/tasks`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: task._id, completed: !task.completed }),
      });
      if (!res.ok) throw new Error('Failed to update task');
      fetchTasks();
    } catch (err) {
      setError('Could not update task.');
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Tasks Checklist</h3>
      {loading ? (
        <div className="text-muted-foreground">Loading tasks...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : tasks.length === 0 ? (
        <div className="text-muted-foreground">No tasks yet.</div>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
            <div key={task._id} className="flex items-center gap-3 p-2 rounded border bg-gray-50">
              <Checkbox
                checked={task.completed}
                onCheckedChange={() => handleToggle(task)}
                disabled={updating === task._id}
                className="mr-2"
              />
              <span className={task.completed ? 'line-through text-gray-400' : ''}>{task.text}</span>
              {task.completed && task.completedAt && (
                <span className="ml-auto text-xs text-gray-500">Done {new Date(task.completedAt).toLocaleDateString()}</span>
              )}
            </div>
          ))}
        </div>
      )}
      <form onSubmit={handleAddTask} className="flex gap-2">
        <Input
          value={newTask}
          onChange={e => setNewTask(e.target.value)}
          placeholder="Add a new task..."
          disabled={adding}
        />
        <Button type="submit" disabled={adding || !newTask.trim()}>
          {adding ? 'Adding...' : 'Add Task'}
        </Button>
      </form>
    </div>
  );
} 