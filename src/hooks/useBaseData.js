import { useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { cacheSet } from '../cache';
import { useToast } from './useToast';

export function useBaseData() {
  const { showToast } = useToast();
  const [categories, setCategories] = useState([]);
  const [parties, setParties] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [tags, setTags] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCategories = useCallback(async (userId) => {
    const { data } = await supabase.from('categories').select('*').order('name');
    if (data) { 
      setCategories(data); 
      if (userId) cacheSet(userId, 'categories', data); 
    }
  }, []);

  const fetchParties = useCallback(async (userId) => {
    const { data } = await supabase.from('parties').select('*').order('name');
    if (data) { 
      setParties(data); 
      if (userId) cacheSet(userId, 'parties', data); 
    }
  }, []);

  const fetchTags = useCallback(async (userId) => {
    const { data } = await supabase.from('tags').select('*').order('name');
    if (data) { 
      setTags(data); 
      if (userId) cacheSet(userId, 'tags', data); 
    }
  }, []);

  const fetchAccounts = useCallback(async (userId) => {
    const { data } = await supabase.from('accounts').select('*').order('name');
    if (data) { 
      setAccounts(data); 
      if (userId) cacheSet(userId, 'accounts', data); 
    }
  }, []);

  const fetchAllBaseData = useCallback(async (userId) => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchCategories(userId),
        fetchParties(userId),
        fetchTags(userId),
        fetchAccounts(userId)
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [fetchCategories, fetchParties, fetchTags, fetchAccounts]);

  const handleCreateCategory = useCallback(async (session, payload, editingId = null) => {
    if (!session) return;
    let error;
    if (editingId) {
      ({ error } = await supabase.from('categories').update(payload).eq('id', editingId));
    } else {
      ({ error } = await supabase.from('categories').insert([{ ...payload, user_id: session.user.id }]));
    }
    if (!error) {
      showToast(editingId ? 'Category updated' : 'Category created', 'success');
      fetchCategories(session.user.id);
    } else {
      showToast('Failed to save category', 'error');
    }
    return error;
  }, [fetchCategories, showToast]);

  const handleDeleteCategory = useCallback(async (session, id) => {
    if (!session) return;
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (!error) {
      showToast('Category removed', 'info');
      fetchCategories(session.user.id);
    } else {
      showToast('Failed to remove category', 'error');
    }
  }, [fetchCategories, showToast]);

  const handleCreateParty = useCallback(async (session, name) => {
    if (!session || !name.trim()) return;
    const { error } = await supabase.from('parties').insert([{ user_id: session.user.id, name: name.trim() }]);
    if (!error) {
      showToast('Payee registered', 'success');
      fetchParties(session.user.id);
    } else {
      showToast('Failed to register payee', 'error');
    }
    return error;
  }, [fetchParties, showToast]);

  const handleDeleteParty = useCallback(async (session, id) => {
    if (!session) return;
    const { error } = await supabase.from('parties').delete().eq('id', id);
    if (!error) {
      showToast('Payee removed', 'info');
      fetchParties(session.user.id);
    } else {
      showToast('Failed to remove payee', 'error');
    }
  }, [fetchParties, showToast]);

  const handleCreateTag = useCallback(async (session, name) => {
    if (!session || !name.trim()) return;
    const { error } = await supabase.from('tags').insert([{ user_id: session.user.id, name: name.trim().toLowerCase() }]);
    if (!error) {
      showToast('Tag created', 'success');
      fetchTags(session.user.id);
    } else {
      showToast('Failed to create tag', 'error');
    }
    return error;
  }, [fetchTags, showToast]);

  const handleDeleteTag = useCallback(async (session, id) => {
    if (!session) return;
    const { error } = await supabase.from('tags').delete().eq('id', id);
    if (!error) {
      showToast('Tag removed', 'info');
      fetchTags(session.user.id);
    } else {
      showToast('Failed to remove tag', 'error');
    }
  }, [fetchTags, showToast]);

  const handleCreateAccount = useCallback(async (session, payload) => {
    if (!session) return;
    const base = { ...payload, user_id: session.user.id };
    let { error } = await supabase.from('accounts').insert([base]);
    if (error?.code === '42703') {
      const { type, exclude_from_total, ...legacyBase } = base;
      ({ error } = await supabase.from('accounts').insert([legacyBase]));
    }
    if (!error) {
      showToast('Account created', 'success');
      fetchAccounts(session.user.id);
    } else {
      showToast('Failed to create account', 'error');
    }
    return error;
  }, [fetchAccounts, showToast]);

  const handleDeleteAccount = useCallback(async (session, id) => {
    if (!session) return;
    const { error } = await supabase.from('accounts').delete().eq('id', id);
    if (!error) {
      showToast('Account removed', 'info');
      fetchAccounts(session.user.id);
    } else {
      showToast('Failed to remove account', 'error');
    }
  }, [fetchAccounts, showToast]);

  const handleUpdateAccount = useCallback(async (session, id, payload) => {
    if (!session) return;
    const { error } = await supabase.from('accounts').update(payload).eq('id', id);
    if (!error) {
      showToast('Account updated', 'success');
      fetchAccounts(session.user.id);
    } else {
      showToast('Failed to update account', 'error');
    }
    return error;
  }, [fetchAccounts, showToast]);

  return {
    categories, setCategories,
    parties, setParties,
    accounts, setAccounts,
    tags, setTags,
    isLoading,
    fetchCategories, fetchParties, fetchTags, fetchAccounts, fetchAllBaseData,
    handleCreateCategory, handleDeleteCategory,
    handleCreateParty, handleDeleteParty,
    handleCreateTag, handleDeleteTag,
    handleCreateAccount, handleDeleteAccount, handleUpdateAccount
  };
}
