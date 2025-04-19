import { useState } from 'react';
import { useForm as useReactHookForm, UseFormProps, FieldValues, UseFormReturn, SubmitHandler, SubmitErrorHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import useError, { ErrorState } from './useError';

export interface UseFormOptions<TFormValues extends FieldValues, TContext> extends UseFormProps<TFormValues, TContext> {
  schema?: z.ZodType<TFormValues>;
  onSuccess?: (data: TFormValues) => void | Promise<void>;
  onError?: (error: ErrorState) => void;
}

export interface UseFormReturn<TFormValues extends FieldValues, TContext = any> {
  form: UseFormReturn<TFormValues, TContext>;
  isSubmitting: boolean;
  submitError: ErrorState | null;
  clearSubmitError: () => void;
  onSubmit: (
    handler: SubmitHandler<TFormValues>,
    errorHandler?: SubmitErrorHandler<TFormValues>
  ) => (e?: React.BaseSyntheticEvent) => Promise<void>;
}

/**
 * Hook para gerenciar formulários com React Hook Form
 * Integra validação com Zod e gerenciamento de estado de submit
 */
export function useForm<TFormValues extends FieldValues, TContext = any>(
  options: UseFormOptions<TFormValues, TContext> = {}
): UseFormReturn<TFormValues, TContext> {
  const { schema, onSuccess, onError, ...formOptions } = options;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { error: submitError, setError, clearError: clearSubmitError } = useError();

  // Configure resolver se um schema for fornecido
  const resolverOptions = schema
    ? { ...formOptions, resolver: zodResolver(schema) }
    : formOptions;

  // Inicialize o formulário
  const form = useReactHookForm<TFormValues, TContext>(resolverOptions);

  // Wrapper para o manipulador de envio
  const onSubmit = (
    handler: SubmitHandler<TFormValues>,
    errorHandler?: SubmitErrorHandler<TFormValues>
  ) => {
    return async (e?: React.BaseSyntheticEvent) => {
      if (e) {
        e.preventDefault();
      }

      // Limpar erro anterior
      clearSubmitError();
      
      return form.handleSubmit(
        async (data) => {
          try {
            setIsSubmitting(true);
            await handler(data);
            if (onSuccess) {
              await onSuccess(data);
            }
          } catch (error) {
            const errorState: ErrorState = {
              message: error instanceof Error ? error.message : 'Erro ao processar formulário'
            };
            setError(errorState);
            if (onError) {
              onError(errorState);
            }
          } finally {
            setIsSubmitting(false);
          }
        },
        (errors) => {
          if (errorHandler) {
            errorHandler(errors);
          }
        }
      )(e);
    };
  };

  return {
    form,
    isSubmitting,
    submitError,
    clearSubmitError,
    onSubmit
  };
}

export default useForm; 