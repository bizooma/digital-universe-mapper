import { useState, useCallback, useRef } from "react";
import type { Node, Edge } from "@xyflow/react";

interface HistoryState {
  nodes: Node[];
  edges: Edge[];
}

interface UseUndoRedoOptions {
  maxHistory?: number;
}

interface UseUndoRedoReturn {
  canUndo: boolean;
  canRedo: boolean;
  undo: () => HistoryState | null;
  redo: () => HistoryState | null;
  takeSnapshot: (nodes: Node[], edges: Edge[]) => void;
  reset: (nodes: Node[], edges: Edge[]) => void;
}

export function useUndoRedo({ maxHistory = 50 }: UseUndoRedoOptions = {}): UseUndoRedoReturn {
  const [past, setPast] = useState<HistoryState[]>([]);
  const [future, setFuture] = useState<HistoryState[]>([]);
  const isUndoingRef = useRef(false);

  const canUndo = past.length > 0;
  const canRedo = future.length > 0;

  const takeSnapshot = useCallback(
    (nodes: Node[], edges: Edge[]) => {
      // Don't take snapshot if we're in the middle of undo/redo
      if (isUndoingRef.current) return;

      const newState: HistoryState = {
        nodes: JSON.parse(JSON.stringify(nodes)),
        edges: JSON.parse(JSON.stringify(edges)),
      };

      setPast((prev) => {
        const newPast = [...prev, newState];
        // Limit history size
        if (newPast.length > maxHistory) {
          return newPast.slice(-maxHistory);
        }
        return newPast;
      });

      // Clear future when new action is taken
      setFuture([]);
    },
    [maxHistory]
  );

  const undo = useCallback((): HistoryState | null => {
    if (past.length === 0) return null;

    isUndoingRef.current = true;

    const previous = past[past.length - 1];
    const newPast = past.slice(0, -1);

    setPast(newPast);

    // We need the current state to push to future, which will be handled by the caller
    setTimeout(() => {
      isUndoingRef.current = false;
    }, 0);

    return previous;
  }, [past]);

  const redo = useCallback((): HistoryState | null => {
    if (future.length === 0) return null;

    isUndoingRef.current = true;

    const next = future[future.length - 1];
    const newFuture = future.slice(0, -1);

    setFuture(newFuture);

    setTimeout(() => {
      isUndoingRef.current = false;
    }, 0);

    return next;
  }, [future]);

  const reset = useCallback((nodes: Node[], edges: Edge[]) => {
    setPast([]);
    setFuture([]);
    // Take initial snapshot
    takeSnapshot(nodes, edges);
  }, [takeSnapshot]);

  // Enhanced undo that properly manages future stack
  const enhancedUndo = useCallback((): HistoryState | null => {
    if (past.length < 2) return null; // Need at least 2 states: one to restore, one as "current"

    isUndoingRef.current = true;

    const current = past[past.length - 1];
    const previous = past[past.length - 2];
    const newPast = past.slice(0, -1);

    setPast(newPast);
    setFuture((prev) => [...prev, current]);

    setTimeout(() => {
      isUndoingRef.current = false;
    }, 0);

    return previous;
  }, [past]);

  const enhancedRedo = useCallback((): HistoryState | null => {
    if (future.length === 0) return null;

    isUndoingRef.current = true;

    const next = future[future.length - 1];
    const newFuture = future.slice(0, -1);

    setPast((prev) => [...prev, next]);
    setFuture(newFuture);

    setTimeout(() => {
      isUndoingRef.current = false;
    }, 0);

    return next;
  }, [future]);

  return {
    canUndo: past.length > 1, // Need at least 2 states to undo
    canRedo,
    undo: enhancedUndo,
    redo: enhancedRedo,
    takeSnapshot,
    reset,
  };
}
