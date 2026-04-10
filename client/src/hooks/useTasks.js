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

  const addNotification = useCallback((msg) => {
    const id = ++notifIdRef.current;
    setNotifications((prev) => [...prev, { id, msg }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 3500);
  }, []);

  // Fetch tasks on mount
  useEffect(() => {
    if (!boardId) return;
    const fetch = async () => {
      try {
        const { data } = await api.get(`/tasks/boards/${boardId}/tasks`);
        setTasks(data.tasks);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [boardId]);

  // Socket.io: join board room and listen for events
  useEffect(() => {
    if (!socket || !boardId || !user) return;

    socket.emit('join-board', { boardId, userName: user.name });

    socket.on('task-created', ({ task }) => {
      setTasks((prev) => [...prev, task]);
      addNotification(`New task added: "${task.title}"`);
    });

    socket.on('task-updated', ({ task, updatedBy }) => {
      setTasks((prev) => prev.map((t) => (t._id === task._id ? task : t)));
      if (updatedBy?.id !== user.id) {
        addNotification(`${updatedBy?.name || 'Someone'} moved "${task.title}" → ${task.column}`);
      }
    });

    socket.on('task-deleted', ({ taskId }) => {
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
    });

    socket.on('user-joined', ({ userName }) => {
      addNotification(`${userName} joined the board`);
    });

    return () => {
      socket.emit('leave-board', { boardId, userName: user.name });
      socket.off('task-created');
      socket.off('task-updated');
      socket.off('task-deleted');
      socket.off('user-joined');
    };
  }, [socket, boardId, user, addNotification]);

  const createTask = useCallback(
    async (payload) => {
      const { data } = await api.post(`/tasks/boards/${boardId}/tasks`, payload);
      // Note: socket will also fire task-created, but we don't double-add
      // because the socket event is emitted to OTHER users in the room only
      setTasks((prev) => [...prev, data.task]);
      return data.task;
    },
    [boardId]
  );

  const updateTask = useCallback(async (taskId, payload) => {
    const { data } = await api.put(`/tasks/${taskId}`, payload);
    setTasks((prev) => prev.map((t) => (t._id === taskId ? data.task : t)));
    return data.task;
  }, []);

  const deleteTask = useCallback(async (taskId) => {
    await api.delete(`/tasks/${taskId}`);
    setTasks((prev) => prev.filter((t) => t._id !== taskId));
  }, []);

  const getTasksByColumn = useCallback(
    (column) => tasks.filter((t) => t.column === column).sort((a, b) => a.order - b.order),
    [tasks]
  );

  return { tasks, loading, notifications, createTask, updateTask, deleteTask, getTasksByColumn };
};
