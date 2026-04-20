import { useState, useEffect, useCallback, useRef } from 'react';
import api from './useApi';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

export const useTasks = (boardId) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);

  const { socket } = useSocket();
  const { user } = useAuth();

  const notifIdRef = useRef(0);

  // ─── Notifications ─────────────────────────────────────────────
  const addNotification = useCallback((msg) => {
    const id = ++notifIdRef.current;

    setNotifications((prev) => [...prev, { id, msg }]);

    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 3500);
  }, []);

  // ─── Fetch Tasks ───────────────────────────────────────────────
  useEffect(() => {
    if (!boardId) return;

    const fetchTasks = async () => {
      try {
        const res = await api.get(`/tasks/boards/${boardId}/tasks`);
        setTasks(res.data.tasks || []);
      } catch (err) {
        console.error('Fetch tasks error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [boardId]);

  // ─── Socket Events ─────────────────────────────────────────────
  useEffect(() => {
    if (!socket || !boardId || !user) return;

    socket.emit('join-board', { boardId, userName: user.name });

    // ✅ TASK CREATED
    const onTaskCreated = ({ task }) => {
      setTasks((prev) => {
        const exists = prev.find((t) => t._id === task._id);
        if (exists) return prev; // prevent duplicate
        return [...prev, task];
      });

      addNotification(`New task added: "${task.title}"`);
    };

    // ✅ TASK UPDATED
    const onTaskUpdated = ({ task, updatedBy }) => {
      setTasks((prev) =>
        prev.map((t) => (t._id === task._id ? task : t))
      );

      if (updatedBy?.id !== user?.id) {
        addNotification(
          `${updatedBy?.name || 'Someone'} moved "${task.title}" → ${task.column}`
        );
      }
    };

    // ✅ TASK DELETED
    const onTaskDeleted = ({ taskId }) => {
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
    };

    // ✅ USER JOINED
    const onUserJoined = ({ userName }) => {
      addNotification(`${userName} joined the board`);
    };

    // Register events
    socket.on('task-created', onTaskCreated);
    socket.on('task-updated', onTaskUpdated);
    socket.on('task-deleted', onTaskDeleted);
    socket.on('user-joined', onUserJoined);

    // Cleanup
    return () => {
      socket.emit('leave-board', { boardId, userName: user.name });

      socket.off('task-created', onTaskCreated);
      socket.off('task-updated', onTaskUpdated);
      socket.off('task-deleted', onTaskDeleted);
      socket.off('user-joined', onUserJoined);
    };
  }, [socket, boardId, user, addNotification]);

  // ─── CREATE TASK ───────────────────────────────────────────────
  const createTask = useCallback(async (payload) => {
    const res = await api.post(`/tasks/boards/${boardId}/tasks`, payload);

    const newTask = res.data.task;

    // ⚠️ Prevent duplicate (API + socket)
    setTasks((prev) => {
      const exists = prev.find((t) => t._id === newTask._id);
      if (exists) return prev;
      return [...prev, newTask];
    });

    return newTask;
  }, [boardId]);

  // ─── UPDATE TASK ───────────────────────────────────────────────
  const updateTask = useCallback(async (taskId, payload) => {
    const res = await api.put(`/tasks/${taskId}`, payload);

    const updatedTask = res.data.task;

    setTasks((prev) =>
      prev.map((t) => (t._id === taskId ? updatedTask : t))
    );

    return updatedTask;
  }, []);

  // ─── DELETE TASK ───────────────────────────────────────────────
  const deleteTask = useCallback(async (taskId) => {
    await api.delete(`/tasks/${taskId}`);

    setTasks((prev) => prev.filter((t) => t._id !== taskId));
  }, []);

  // ─── FILTER BY COLUMN ──────────────────────────────────────────
  const getTasksByColumn = useCallback(
    (column) => {
      return tasks
        .filter((t) => t.column === column)
        .sort((a, b) => a.order - b.order);
    },
    [tasks]
  );

  return {
    tasks,
    loading,
    notifications,
    createTask,
    updateTask,
    deleteTask,
    getTasksByColumn,
  };
};