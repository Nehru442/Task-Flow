import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import TaskCard from '../components/TaskCard';
import TaskModal from '../components/TaskModal';
import { useTasks } from '../hooks/useTasks';
import api from '../hooks/useApi';

export default function BoardPage() {
  const { boardId } = useParams();
  const [board, setBoard] = useState(null);
  const [boardLoading, setBoardLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [activeColumn, setActiveColumn] = useState(null);

  const { tasks, loading, notifications, createTask, updateTask, deleteTask, getTasksByColumn } =
    useTasks(boardId);

  useEffect(() => {
    const fetchBoard = async () => {
      try {
        const { data } = await api.get(`/boards/${boardId}`);
        setBoard(data.board);
      } catch (err) {
        console.error(err);
      } finally {
        setBoardLoading(false);
      }
    };
    fetchBoard();
  }, [boardId]);

  const handleOpenCreate = (column) => {
    setEditingTask(null);
    setActiveColumn(column);
    setModalOpen(true);
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    setActiveColumn(task.column);
    setModalOpen(true);
  };

  const handleSave = async (formData) => {
    if (editingTask) {
      await updateTask(editingTask._id, formData);
    } else {
      await createTask({ ...formData, column: activeColumn });
    }
  };

  const handleMoveColumn = async (taskId, newColumn) => {
    await updateTask(taskId, { column: newColumn });
  };

  const handleDelete = async (taskId) => {
    if (window.confirm('Delete this task?')) {
      await deleteTask(taskId);
    }
  };

  if (boardLoading) {
    return (
      <div className="min-h-screen bg-gray-950">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="min-h-screen bg-gray-950">
        <Navbar />
        <div className="text-center py-20">
          <p className="text-gray-400">Board not found.</p>
          <Link to="/dashboard" className="btn-primary mt-4 inline-flex">← Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  const columns = board.columns || ['To Do', 'In Progress', 'Done'];

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <Navbar />

      {/* Board header */}
      <div className="border-b border-gray-800 px-4 py-3">
        <div className="max-w-full mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="text-gray-500 hover:text-white transition-colors text-sm">
              ← Boards
            </Link>
            <span className="text-gray-700">/</span>
            <div
              className="w-3 h-3 rounded-full"
              style={{ background: board.color }}
            />
            <h1 className="font-semibold text-white">{board.title}</h1>
            {board.description && (
              <span className="text-sm text-gray-500 hidden md:block">{board.description}</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">{tasks.length} tasks</span>
            <button
              onClick={() => handleOpenCreate(columns[0])}
              className="btn-primary text-sm"
            >
              + Add Task
            </button>
          </div>
        </div>
      </div>

      {/* Kanban columns */}
      <div className="flex-1 overflow-x-auto px-4 py-4">
        <div className="flex gap-4 h-full" style={{ minWidth: `${columns.length * 300}px` }}>
          {columns.map((column) => {
            const columnTasks = getTasksByColumn(column);
            return (
              <div key={column} className="flex flex-col w-72 shrink-0">
                {/* Column header */}
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-gray-300">{column}</h3>
                    <span className="text-xs bg-gray-800 text-gray-500 px-1.5 py-0.5 rounded-full">
                      {columnTasks.length}
                    </span>
                  </div>
                  <button
                    onClick={() => handleOpenCreate(column)}
                    className="text-gray-600 hover:text-gray-300 transition-colors text-lg leading-none"
                    title="Add task"
                  >
                    +
                  </button>
                </div>

                {/* Tasks */}
                <div className="flex-1 flex flex-col gap-2 overflow-y-auto pr-1">
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="w-5 h-5 border-2 border-gray-600 border-t-gray-400 rounded-full animate-spin" />
                    </div>
                  ) : columnTasks.length === 0 ? (
                    <button
                      onClick={() => handleOpenCreate(column)}
                      className="border border-dashed border-gray-800 hover:border-gray-600 rounded-lg p-4 text-xs text-gray-600 hover:text-gray-400 text-center transition-colors"
                    >
                      + Add a task
                    </button>
                  ) : (
                    columnTasks.map((task) => (
                      <TaskCard
                        key={task._id}
                        task={task}
                        columns={columns}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onMoveColumn={handleMoveColumn}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Task modal */}
      {modalOpen && (
        <TaskModal
          task={editingTask}
          columns={columns}
          onSave={handleSave}
          onClose={() => {
            setModalOpen(false);
            setEditingTask(null);
          }}
        />
      )}

      {/* Real-time notifications */}
      <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-50 pointer-events-none">
        {notifications.map((n) => (
          <div
            key={n.id}
            className="bg-gray-800 border border-gray-700 text-gray-200 text-sm px-4 py-2.5 rounded-xl shadow-lg animate-fade-in max-w-xs"
          >
            <span className="text-brand-400 mr-2">⚡</span>
            {n.msg}
          </div>
        ))}
      </div>
    </div>
  );
}
