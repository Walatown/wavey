// Normalizes thrown values into a JSON-safe shape for API responses.
type ErrorPayload = {
  name?: string;
  message: string;
  code?: string;
  cause?: ErrorPayload;
  errors?: ErrorPayload[];
};

export function toErrorPayload(error: unknown): ErrorPayload {
  if (error instanceof AggregateError) {
    return {
      name: error.name,
      message: error.message,
      errors: error.errors.map((entry) => toErrorPayload(entry)),
    };
  }

  if (error instanceof Error) {
    const details = error as Error & { code?: string; cause?: unknown };

    return {
      name: error.name,
      message: error.message,
      code: details.code,
      cause: details.cause ? toErrorPayload(details.cause) : undefined,
    };
  }

  return {
    message: String(error),
  };
}
