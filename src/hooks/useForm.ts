// 폼 관리 커스텀 훅

import { useState, useCallback } from 'react';
import { validateRequired, validateEmail, validateUrl, validateDateRange, validateMinLength, validateMaxLength } from '@/utils/validation';

export interface FormState<T> {
  data: T;
  errors: Record<string, string>;
  isSubmitting: boolean;
  isDirty: boolean;
}

export interface UseFormOptions<T> {
  initialData: T;
  validationRules?: Partial<Record<keyof T, (value: unknown) => string | null>>;
  onSubmit?: (data: T) => Promise<void> | void;
}

export function useForm<T extends Record<string, unknown>>({
  initialData,
  validationRules = {},
  onSubmit
}: UseFormOptions<T>) {
  const [formState, setFormState] = useState<FormState<T>>({
    data: initialData,
    errors: {},
    isSubmitting: false,
    isDirty: false
  });

  const updateField = useCallback((field: keyof T, value: unknown) => {
    setFormState(prev => ({
      ...prev,
      data: { ...prev.data, [field]: value },
      isDirty: true,
      errors: { ...prev.errors, [field]: '' } // 필드 업데이트 시 해당 에러 제거
    }));
  }, []);

  const updateFields = useCallback((updates: Partial<T>) => {
    setFormState(prev => ({
      ...prev,
      data: { ...prev.data, ...updates },
      isDirty: true
    }));
  }, []);

  const setError = useCallback((field: keyof T, message: string) => {
    setFormState(prev => ({
      ...prev,
      errors: { ...prev.errors, [field]: message }
    }));
  }, []);

  const setErrors = useCallback((errors: Record<string, string>) => {
    setFormState(prev => ({
      ...prev,
      errors
    }));
  }, []);

  const clearErrors = useCallback(() => {
    setFormState(prev => ({
      ...prev,
      errors: {}
    }));
  }, []);

  const validateField = useCallback((field: keyof T, value: unknown): string | null => {
    const rule = validationRules[field];
    if (rule) {
      return rule(value);
    }
    return null;
  }, [validationRules]);

  const validateForm = useCallback((): boolean => {
    const errors: Record<string, string> = {};
    let isValid = true;

    Object.keys(formState.data).forEach(field => {
      const value = formState.data[field as keyof T];
      const error = validateField(field as keyof T, value);
      if (error) {
        errors[field] = error;
        isValid = false;
      }
    });

    setErrors(errors);
    return isValid;
  }, [formState.data, validateField, setErrors]);

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    if (!validateForm()) {
      return false;
    }

    if (onSubmit) {
      setFormState(prev => ({ ...prev, isSubmitting: true }));
      try {
        await onSubmit(formState.data);
        setFormState(prev => ({ ...prev, isDirty: false }));
        return true;
      } catch {
        // Form submission error
        return false;
      } finally {
        setFormState(prev => ({ ...prev, isSubmitting: false }));
      }
    }

    return true;
  }, [validateForm, onSubmit, formState.data]);

  const reset = useCallback(() => {
    setFormState({
      data: initialData,
      errors: {},
      isSubmitting: false,
      isDirty: false
    });
  }, [initialData]);

  return {
    data: formState.data,
    errors: formState.errors,
    isSubmitting: formState.isSubmitting,
    isDirty: formState.isDirty,
    updateField,
    updateFields,
    setError,
    setErrors,
    clearErrors,
    validateField,
    validateForm,
    handleSubmit,
    reset
  };
}

// 공통 검증 규칙들
export const commonValidationRules = {
  required: (value: unknown) => validateRequired(value as string, '이 필드'),
  email: (value: unknown) => validateEmail(value as string),
  url: (value: unknown) => validateUrl(value as string),
  minLength: (min: number) => (value: unknown) => validateMinLength(value as string, min, '이 필드'),
  maxLength: (max: number) => (value: unknown) => validateMaxLength(value as string, max, '이 필드'),
  dateRange: (startField: string, endField: string) => (value: unknown, allData: Record<string, unknown>) => 
    validateDateRange(allData[startField] as string, allData[endField] as string)
};
