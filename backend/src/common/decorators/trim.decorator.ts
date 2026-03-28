import { Transform } from 'class-transformer';

export function Trim(): PropertyDecorator {
  return Transform(({ value }: { value: string }) =>
    typeof value === 'string' ? value.trim() : value,
  );
}

export function OptionalTrim(): PropertyDecorator {
  return Transform(({ value }: { value: string | undefined }) =>
    typeof value === 'string' ? value.trim() : value,
  );
}
