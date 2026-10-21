import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import Header from '../components/Header';

export default function GroceryPage() {
  const { users } = useAuth();
  const [items, setItems]       = useState([]);
  const [name, setName]         = useState('');
  const [quantity, setQuantity] = useState('');
  const [error, setError]       = useState('');

  const fetchItems = useCallback(async () => {
    try {
      const { items } = await api.groceries.list();
      setItems(items);
    } catch (err) {
      console.error('Failed to load groceries:', err.message);
    }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  // Keep in sync with the other user's changes: poll while the tab is visible,
  // and refetch immediately when the user comes back to the tab
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') fetchItems();
    }, 10000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') fetchItems();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [fetchItems]);

  const getUser = (id) => users.find(u => u.id === id);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setError('');
    try {
      await api.groceries.create({ name, quantity });
      setName('');
      setQuantity('');
      await fetchItems();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleToggle = async (item) => {
    // Optimistic update so the checkbox feels instant
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, completed: item.completed ? 0 : 1 } : i));
    try {
      await api.groceries.update(item.id, { completed: !item.completed });
    } finally {
      await fetchItems();
    }
  };

  const handleDelete = async (id) => {
    await api.groceries.delete(id);
    await fetchItems();
  };

  const completedCount = items.filter(i => i.completed).length;

  const handleClearCompleted = async () => {
    const noun = completedCount === 1 ? 'item' : 'items';
    if (!window.confirm(`Delete ${completedCount} completed ${noun}? This can't be undone.`)) return;
    await api.groceries.clearCompleted();
    await fetchItems();
  };

  const remaining = items.filter(i => !i.completed);
  const done      = items.filter(i => i.completed);

  const renderItem = (item) => {
    const addedBy = getUser(item.created_by);
    return (
      <li key={item.id} className="group flex items-center gap-3 py-3 border-b border-warm-100 last:border-b-0">
        <input
          type="checkbox"
          checked={!!item.completed}
          onChange={() => handleToggle(item)}
          className="w-4 h-4 accent-espresso cursor-pointer flex-shrink-0"
          aria-label={`Mark ${item.name} as ${item.completed ? 'not done' : 'done'}`}
        />
        <div className="flex-1 min-w-0 flex items-baseline gap-2">
          <span className={`text-sm truncate ${item.completed ? 'line-through text-warm-300' : 'text-espresso'}`}>
            {item.name}
          </span>
          {item.quantity && (
            <span className={`text-xs flex-shrink-0 ${item.completed ? 'text-warm-300' : 'text-warm-400'}`}>
              {item.quantity}
            </span>
          )}
        </div>
        {addedBy && (
          <div
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: addedBy.color }}
            title={`Added by ${addedBy.name}`}
          />
        )}
        <button
          onClick={() => handleDelete(item.id)}
          className="text-warm-300 hover:text-espresso transition-colors sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100"
          aria-label={`Delete ${item.name}`}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </li>
    );
  };

  return (
    <div className="min-h-screen bg-paper flex flex-col">
      <Header />

      <div className="flex-1 p-4 max-w-2xl mx-auto w-full">
        <div className="bg-white border border-warm-200 p-5">

          {/* Title row */}
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-serif text-base text-espresso">Grocery List</h2>
            <button
              onClick={handleClearCompleted}
              disabled={completedCount === 0}
              className="text-xs text-warm-400 hover:text-espresso border border-warm-200 hover:border-espresso px-3 py-1.5 transition-colors tracking-wide disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-warm-400 disabled:hover:border-warm-200"
            >
              Clear completed{completedCount > 0 ? ` (${completedCount})` : ''}
            </button>
          </div>

          {/* Add form */}
          <form onSubmit={handleAdd} className="flex items-end gap-3 mb-6">
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Add an item…"
              className="field-input flex-1"
              autoFocus
            />
            <input
              value={quantity}
              onChange={e => setQuantity(e.target.value)}
              placeholder="Qty"
              className="field-input w-20"
            />
            <button
              type="submit"
              disabled={!name.trim()}
              className="text-xs text-paper bg-espresso hover:bg-copper px-4 py-2 transition-colors tracking-wide disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Add
            </button>
          </form>
          {error && <p className="text-xs text-red-600 -mt-4 mb-4">{error}</p>}

          {items.length === 0 ? (
            <div className="py-10 text-center">
              <p className="font-serif text-2xl text-warm-200 mb-3">—</p>
              <p className="text-xs text-warm-400 tracking-wide">The list is empty</p>
            </div>
          ) : (
            <>
              <ul>{remaining.map(renderItem)}</ul>
              {done.length > 0 && (
                <>
                  <p className="font-serif text-xs text-warm-400 italic mt-6 mb-1">Completed</p>
                  <ul>{done.map(renderItem)}</ul>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
