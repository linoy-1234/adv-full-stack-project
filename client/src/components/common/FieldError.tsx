interface FieldErrorProps {
  id?: string;
  message?: string;
  className?: string;
}

export const invalidFieldClass =
  "border-red-400 focus:border-red-400 focus:ring-red-300";

export default function FieldError({
  id,
  message,
  className = "",
}: FieldErrorProps) {
  if (!message) return null;

  return (
    <p
      id={id}
      role="alert"
      className={`mt-1 text-xs text-red-600 ${className}`}
    >
      {message}
    </p>
  );
}
