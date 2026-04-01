type ApiError = {
  status: number;
  message: string;
};

const getBaseUrl = () => {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!base) return "http://localhost:4000/api/v1";
  return base.replace(/\/+$/, "");
};

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${getBaseUrl()}${path.startsWith("/") ? "" : "/"}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      if (body?.error) message = String(body.error);
    } catch {}
    const err: ApiError = { status: res.status, message };
    throw err;
  }

  return (await res.json()) as T;
}

