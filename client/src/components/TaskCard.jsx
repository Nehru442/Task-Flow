const PRIORITY_COLORS = {
  high: 'bg-red-500/20 text-red-400 border-red-500/30',
  medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  low: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
};

export default function TaskCard({ task, onEdit, onDelete, onMoveColumn, columns }) {
  const dueDate = task.dueDate ? new Date(task.dueDate) : null;
  const isOverdue = dueDate && dueDate < new Date();

  const currentColIndex = columns.indexOf(task.column);

  return (
    <div className="group bg-gray-800 hover:bg-gray-750 border border-gray-700 hover:border-gray-600 rounded-lg p-3 cursor-pointer transition-all duration-150 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-gray-100 leading-snug flex-1">{task.title}</p>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            onClick={() => onEdit(task)}
            className="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
            title="Edit task"
          >
            ✎
          </button>
          <button
            onClick={() => onDelete(task._id)}
            className="p-1 rounded hover:bg-red-900/50 text-gray-400 hover:text-red-400 transition-colors"
            title="Delete task"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Description */}
      {task.description && (
        <p className="text-xs text-gray-500 mt-1.5 line-clamp-2">{task.description}</p>
      )}

      {/* Tags */}
      {task.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {task.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs bg-gray-700 text-gray-400 px-1.5 py-0.5 rounded-md"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-gray-700/50">
        <div className="flex items-center gap-2">
          {/* Priority */}
          <span
            className={`text-xs px-1.5 py-0.5 rounded border font-medium ${PRIORITY_COLORS[task.priority]}`}
          >
            {task.priority}
          </span>

          {/* Due date */}
          {dueDate && (
            <span className={`text-xs ${isOverdue ? 'text-red-400' : 'text-gray-500'}`}>
              {isOverdue ? '⚠ ' : ''}
              {dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
        </div>

        {/* Move column buttons */}
        <div className="flex gap-1">
          {currentColIndex > 0 && (
            <button
              onClick={() => onMoveColumn(task._id, columns[currentColIndex - 1])}
              className="text-xs text-gray-500 hover:text-white px-1 py-0.5 rounded hover:bg-gray-700 transition-colors"
              title={`Move to ${columns[currentColIndex - 1]}`}
            >
              ←
            </button>
          )}
          {currentColIndex < columns.length - 1 && (
            <button
              onClick={() => onMoveColumn(task._id, columns[currentColIndex + 1])}
              className="text-xs text-gray-500 hover:text-white px-1 py-0.5 rounded hover:bg-gray-700 transition-colors"
              title={`Move to ${columns[currentColIndex + 1]}`}
            >
              →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
