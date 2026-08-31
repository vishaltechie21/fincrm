/**
 * useEntityForm — Generic ERP Form Hook
 *
 * Replaces page-specific useCompanyForm / useContactForm with one configurable hook.
 *
 * Usage:
 *   const form = useEntityForm({
 *     initialState: { name: '', city: '' },
 *     validationFn: (data) => ({ name: 'Required' }),  // returns errors object
 *   });
 *
 * Returns:
 *   formData, errors, isDirty,
 *   handleChange(e), handleSelectChange(name, value),
 *   resetForm(), loadEntity(obj),
 *   validate() → boolean,
 *   setErrors, setFormData, setIsDirty
 */

import { useState, useCallback } from 'react';

export const useEntityForm = ({ initialState = {}, validationFn = () => ({}) }) => {
  const [formData, setFormData] = useState({ ...initialState });
  const [errors, setErrors] = useState({});
  const [isDirty, setIsDirty] = useState(false);

  /** Handle native input/select/textarea change event */
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setIsDirty(true);
    // Clear field-level error as user types
    setErrors(prev => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }, []);

  /** Handle programmatic select change (SearchableSelect, custom components) */
  const handleSelectChange = useCallback((name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    setIsDirty(true);
    setErrors(prev => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }, []);

  /** Reset form to initial state */
  const resetForm = useCallback(() => {
    setFormData({ ...initialState });
    setErrors({});
    setIsDirty(false);
  }, [initialState]);

  /**
   * Load an entity into the form (e.g. from a table row click).
   * Maps all keys in initialState from the entity object.
   */
  const loadEntity = useCallback((entity) => {
    const next = {};
    Object.keys(initialState).forEach(key => {
      next[key] = entity[key] ?? '';
    });
    setFormData(next);
    setErrors({});
    setIsDirty(false);
  }, [initialState]);

  /** Run validation and return true if valid */
  const validate = useCallback(() => {
    const errs = validationFn(formData);
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [formData, validationFn]);

  return {
    formData,
    errors,
    isDirty,
    handleChange,
    handleSelectChange,
    resetForm,
    loadEntity,
    validate,
    setErrors,
    setFormData,
    setIsDirty,
  };
};
