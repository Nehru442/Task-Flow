const express = require('express');
const Board = require('../models/Board');
const Task = require('../models/Task');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// All board routes are protected
router.use(authMiddleware);

// ─── GET /api/boards ──────────────────────────────────────────────────────────
// Get all boards where user is owner or member

router.get('/', async (req, res) => {
  try {
    const boards = await Board.find({
      $or: [
        { owner: req.user._id },
        { 'members.user': req.user._id },
      ],
    })
      .populate('owner', 'name email')
      .populate('members.user', 'name email')
      .sort({ updatedAt: -1 });

    res.json({ boards });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── POST /api/boards ─────────────────────────────────────────────────────────
// Create a new board (with plan limit check)

router.post('/', async (req, res) => {
  try {
    const { title, description, color } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Board title is required.' });
    }

    // Enforce free plan board limit (3 boards)
    if (req.user.plan === 'free') {
      const boardCount = await Board.countDocuments({ owner: req.user._id });
      if (boardCount >= 3) {
        return res.status(403).json({
          message: 'Free plan allows up to 3 boards. Upgrade to Pro for unlimited boards.',
          code: 'PLAN_LIMIT_REACHED',
        });
      }
    }

    const board = await Board.create({
      title,
      description,
      color: color || '#6366f1',
      owner: req.user._id,
    });

    await board.populate('owner', 'name email');

    res.status(201).json({ board });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── GET /api/boards/:id ──────────────────────────────────────────────────────

router.get('/:id', async (req, res) => {
  try {
    const board = await Board.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('members.user', 'name email');

    if (!board) return res.status(404).json({ message: 'Board not found.' });

    // Check access
    const isOwner = board.owner._id.toString() === req.user._id.toString();
    const isMember = board.members.some(
      (m) => m.user._id.toString() === req.user._id.toString()
    );

    if (!isOwner && !isMember) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    res.json({ board });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── PUT /api/boards/:id ──────────────────────────────────────────────────────

router.put('/:id', async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);
    if (!board) return res.status(404).json({ message: 'Board not found.' });

    if (board.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the board owner can edit it.' });
    }

    const { title, description, color, columns } = req.body;
    if (title) board.title = title;
    if (description !== undefined) board.description = description;
    if (color) board.color = color;
    if (columns) board.columns = columns;

    await board.save();
    await board.populate('owner', 'name email');
    await board.populate('members.user', 'name email');

    res.json({ board });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── POST /api/boards/:id/invite ─────────────────────────────────────────────
// Invite a user by email (Pro feature)

router.post('/:id/invite', async (req, res) => {
  try {
    if (req.user.plan === 'free') {
      return res.status(403).json({
        message: 'Team collaboration requires a Pro plan.',
        code: 'PLAN_LIMIT_REACHED',
      });
    }

    const { email, role = 'editor' } = req.body;
    const board = await Board.findById(req.params.id);

    if (!board) return res.status(404).json({ message: 'Board not found.' });
    if (board.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the owner can invite members.' });
    }

    const invitee = await User.findOne({ email });
    if (!invitee) return res.status(404).json({ message: 'No user found with that email.' });

    const alreadyMember = board.members.some(
      (m) => m.user.toString() === invitee._id.toString()
    );
    if (alreadyMember) {
      return res.status(409).json({ message: 'User is already a board member.' });
    }

    board.members.push({ user: invitee._id, role });
    await board.save();
    await board.populate('members.user', 'name email');

    res.json({ board, message: `${invitee.name} added to the board.` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── DELETE /api/boards/:id ───────────────────────────────────────────────────

router.delete('/:id', async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);
    if (!board) return res.status(404).json({ message: 'Board not found.' });

    if (board.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the owner can delete this board.' });
    }

    // Delete all tasks in this board
    await Task.deleteMany({ board: req.params.id });
    await board.deleteOne();

    res.json({ message: 'Board deleted.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
