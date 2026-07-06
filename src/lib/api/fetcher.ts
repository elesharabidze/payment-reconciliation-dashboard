/** Client-side JSON fetch helper with typed errors. */

interface ApiError {
  error?: string;
}

export async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const body = (await response.json()) as ApiError;
      if (body.error) message = body.error;
    } catch {
      // response had no JSON body — keep the status-based message
    }
    throw new Error(message);
  }

  return (await response.json()) as T;
}
