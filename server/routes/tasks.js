const express = require('express');
const Task = require('../models/Task');
const Board = require('../models/Board');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// ─── Helper: check board access ───────────────────────────────────────────────

const getBoardAndCheckAccess = async (boardId, userId) => {
  const board = await Board.findById(boardId);
  if (!board) return null;

  const isOwner = board.owner.toString() === userId.toString();
  const isMember = board.members.some((m) => m.user.toString() === userId.toString());

  return isOwner || isMember ? board : false;
};

// ─── GET /api/boards/:boardId/tasks ──────────────────────────────────────────

router.get('/boards/:boardId/tasks', async (req, res) => {
  try {
    const access = await getBoardAndCheckAccess(req.params.boardId, req.user._id);
    if (access === null) return res.status(404).json({ message: 'Board not found.' });
    if (access === false) return res.status(403).json({ message: 'Access denied.' });

    const tasks = await Task.find({ board: req.params.boardId })
      .populate('assignee', 'name email')
      .populate('createdBy', 'name email')
      .sort({ column: 1, order: 1 });

    res.json({ tasks });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── POST /api/boards/:boardId/tasks ─────────────────────────────────────────

router.post('/boards/:boardId/tasks', async (req, res) => {
  try {
    const access = await getBoardAndCheckAccess(req.params.boardId, req.user._id);
    if (access === null) return res.status(404).json({ message: 'Board not found.' });
    if (access === false) return res.status(403).json({ message: 'Access denied.' });

    const { title, description, column, priority, assignee, dueDate, tags } = req.body;

    if (!title) return res.status(400).json({ message: 'Task title is required.' });

    // Get max order in that column
    const maxOrderTask = await Task.findOne({ board: req.params.boardId, column })
      .sort({ order: -1 });
    const order = maxOrderTask ? maxOrderTask.order + 1 : 0;

    const task = await Task.create({
      title,
      description,
      column: column || access.columns[0],
      priority,
      assignee,
      dueDate,
      tags,
      board: req.params.boardId,
      createdBy: req.user._id,
      order,
    });

    await task.populate('assignee', 'name email');
    await task.populate('createdBy', 'name email');

    // Emit real-time event to board room
    req.io.to(req.params.boardId).emit('task-created', { task });

    res.status(201).json({ task });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── PUT /api/tasks/:id ───────────────────────────────────────────────────────
// Move task to new column, update title, etc.

router.put('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found.' });

    const access = await getBoardAndCheckAccess(task.board, req.user._id);
    if (!access) return res.status(403).json({ message: 'Access denied.' });

    const { title, description, column, priority, assignee, dueDate, order, tags } = req.body;

    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (column !== undefined) task.column = column;
    if (priority !== undefined) task.priority = priority;
    if (assignee !== undefined) task.assignee = assignee;
    if (dueDate !== undefined) task.dueDate = dueDate;
    if (order !== undefined) task.order = order;
    if (tags !== undefined) task.tags = tags;

    await task.save();
    await task.populate('assignee', 'name email');
    await task.populate('createdBy', 'name email');

    // Emit real-time update to ALL users in the board room
    req.io.to(task.board.toString()).emit('task-updated', {
      task,
      updatedBy: { id: req.user._id, name: req.user.name },
    });

    res.json({ task });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── DELETE /api/tasks/:id ────────────────────────────────────────────────────

router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found.' });

    const access = await getBoardAndCheckAccess(task.board, req.user._id);
    if (!access) return res.status(403).json({ message: 'Access denied.' });

    const boardId = task.board.toString();
    const taskId = task._id.toString();

    await task.deleteOne();

    // Notify board room
    req.io.to(boardId).emit('task-deleted', { taskId });

    res.json({ message: 'Task deleted.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
