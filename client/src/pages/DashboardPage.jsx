import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useBoards } from '../hooks/useBoards';
import { useAuth } from '../context/AuthContext';

const COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444'];

export default function DashboardPage() {
  const { boards, loading, createBoard, deleteBoard } = useBoards();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showNew, setShowNew] = useState(false);
  const [newBoard, setNewBoard] = useState({ title: '', description: '', color: COLORS[0] });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setCreating(true);
    try {
      const board = await createBoard(newBoard);
      setShowNew(false);
      setNewBoard({ title: '', description: '', color: COLORS[0] });
      navigate(`/board/${board._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create board');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">My Boards</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {user?.plan === 'free'
                ? `${boards.length}/3 boards used · Free plan`
                : 'Pro plan · Unlimited boards'}
            </p>
          </div>
          <button onClick={() => setShowNew(true)} className="btn-primary">
            + New Board
          </button>
        </div>

        {/* Boards grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : boards.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🗂</div>
            <h3 className="text-lg font-medium text-gray-300 mb-2">No boards yet</h3>
            <p className="text-gray-500 text-sm mb-6">Create your first board to get started</p>
            <button onClick={() => setShowNew(true)} className="btn-primary">
              Create a board
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {boards.map((board) => (
              <BoardCard
                key={board._id}
                board={board}
                onDelete={deleteBoard}
                onClick={() => navigate(`/board/${board._id}`)}
              />
            ))}
          </div>
        )}
      </main>

      {/* New Board Modal */}
      {showNew && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-800">
              <h2 className="font-semibold text-white">New Board</h2>
              <button onClick={() => setShowNew(false)} className="text-gray-500 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreate} className="p-5 space-y-4">
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                  {error}
                  {error.includes('Upgrade') && (
                    <Link to="/pricing" className="ml-2 underline text-brand-400">Upgrade →</Link>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Board Name *</label>
                <input
                  className="input"
                  placeholder="e.g. Sprint 24, Marketing Q2..."
                  value={newBoard.title}
                  onChange={(e) => setNewBoard({ ...newBoard, title: e.target.value })}
                  autoFocus
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Description</label>
                <input
                  className="input"
                  placeholder="Optional"
                  value={newBoard.description}
                  onChange={(e) => setNewBoard({ ...newBoard, description: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-2">Color</label>
                <div className="flex gap-2">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewBoard({ ...newBoard, color: c })}
                      style={{ background: c }}
                      className={`w-7 h-7 rounded-full transition-all ${
                        newBoard.color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-900 scale-110' : ''
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowNew(false)} className="btn-ghost flex-1">Cancel</button>
                <button type="submit" disabled={creating || !newBoard.title.trim()} className="btn-primary flex-1">
                  {creating ? 'Creating...' : 'Create Board'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function BoardCard({ board, onClick, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div
      onClick={onClick}
      className="group card hover:border-gray-600 cursor-pointer transition-all duration-150 hover:shadow-lg hover:-translate-y-0.5"
    >
      {/* Color bar */}
      <div
        className="h-1.5 -mx-4 -mt-4 mb-4 rounded-t-xl"
        style={{ background: board.color }}
      />

      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white truncate">{board.title}</h3>
          {board.description && (
            <p className="text-xs text-gray-500 mt-0.5 truncate">{board.description}</p>
          )}
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            setConfirmDelete(true);
          }}
          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-900/40 text-gray-500 hover:text-red-400 transition-all ml-2"
        >
          🗑
        </button>
      </div>

      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-800">
        <span className="text-xs text-gray-500">
          {board.columns?.length || 3} columns
        </span>
        <span className="text-xs text-gray-500">
          {board.members?.length || 0} members
        </span>
        <span className="text-xs text-gray-600 ml-auto">
          {new Date(board.updatedAt).toLocaleDateString()}
        </span>
      </div>

      {/* Delete confirm */}
      {confirmDelete && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="mt-3 pt-3 border-t border-red-800/50"
        >
          <p className="text-xs text-red-400 mb-2">Delete this board and all tasks?</p>
          <div className="flex gap-2">
            <button
              onClick={() => setConfirmDelete(false)}
              className="btn-ghost text-xs py-1 flex-1"
            >
              Cancel
            </button>
            <button
              onClick={() => onDelete(board._id)}
              className="btn-danger text-xs py-1 flex-1"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
