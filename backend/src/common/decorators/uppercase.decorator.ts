import { Transform } from 'class-transformer';

export function ToUpperCase(): PropertyDecorator {
  return Transform(({ value }: { value: string }) =>
    typeof value === 'string' ? value.toUpperCase() : value,
  );
}

export function OptionalToUpperCase(): PropertyDecorator {
  return Transform(({ value }: { value: string | undefined }) =>
    typeof value === 'string' ? value.toUpperCase() : value,
  );
}
