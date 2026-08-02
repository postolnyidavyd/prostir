import { type ChangeEvent } from 'react';
import {
  useForm,
  type FieldValues,
  type Path,
  type Resolver,
  type UseFormProps,
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';

// Обгортка над react-hook-form і валідація zod
//
// z.input/z.output окремо, бо zod схема приводить значення до потрібних і handleSubmit віддає z.output
// показуємо z.input
export function useZodForm<S extends z.ZodType<FieldValues, FieldValues>>(
  schema: S,
  options?: Omit<UseFormProps<z.input<S>, unknown, z.output<S>>, 'resolver'>,
) {
  const form = useForm<z.input<S>, unknown, z.output<S>>({
    resolver: zodResolver(schema) as unknown as Resolver<z.input<S>, unknown, z.output<S>>,
    mode: 'onBlur',
    reValidateMode: 'onBlur',
    ...options,
  });

  const {
    register,
    clearErrors,
    formState: { errors },
  } = form;

  const errorMap = errors as Record<string, { message?: string } | undefined>;

  const field = (name: Path<z.input<S>>) => {
    const registration = register(name);
    return {
      ...registration,
      error: errorMap[name]?.message,
      onChange: (event: ChangeEvent<HTMLInputElement>) => {
        void registration.onChange(event);

        if (errorMap[name]) clearErrors(name);
      },
    };
  };

  return { ...form, field };
}
