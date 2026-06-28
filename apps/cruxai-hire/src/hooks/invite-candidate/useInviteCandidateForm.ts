'use client';

import { useState, useCallback } from 'react';

export interface InviteCandidateFormData {
  name: string;
  email: string;
  notes?: string;
}

export function useInviteCandidateForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValid = name.trim() !== '' && email.trim() !== '' && email.includes('@');

  const reset = useCallback(() => {
    setName('');
    setEmail('');
    setNotes('');
    setIsSubmitting(false);
  }, []);

  const getFormData = useCallback((): InviteCandidateFormData => {
    return {
      name: name.trim(),
      email: email.trim(),
      ...(notes.trim() && { notes: notes.trim() }),
    };
  }, [name, email, notes]);

  return {
    name,
    setName,
    email,
    setEmail,
    notes,
    setNotes,
    isSubmitting,
    setIsSubmitting,
    isValid,
    reset,
    getFormData,
  };
}
