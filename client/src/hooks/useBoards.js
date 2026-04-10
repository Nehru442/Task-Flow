import { useState, useEffect, useCallback } from 'react';
import api from './useApi';

export const useBoards = () => {
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBoards = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/boards');
      setBoards(data.boards);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load boards');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBoards();
  }, [fetchBoards]);

  const createBoard = useCallback(async (payload) => {
    const { data } = await api.post('/boards', payload);
    setBoards((prev) => [data.board, ...prev]);
    return data.board;
  }, []);

  const deleteBoard = useCallback(async (boardId) => {
    await api.delete(`/boards/${boardId}`);
    setBoards((prev) => prev.filter((b) => b._id !== boardId));
  }, []);

  return { boards, loading, error, fetchBoards, createBoard, deleteBoard };
};
