const API = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '');
export function makeApi(token) {
  const request = async (path, options = {}) => {
    let res;
    try {
      res = await fetch(`${API}${path}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(options.headers || {})
        }
      });
    } catch (netErr) {
      throw new Error(`Unable to reach backend server (${netErr.message}).`);
    }

    const text = await res.text();
    let data = {};
    try {
      data = JSON.parse(text);
    } catch {
      // Not JSON response
    }

    if (!res.ok) {
      const defaultMsg =
        res.status === 404
          ? 'API route not found. Please restart backend server.'
          : res.status === 413
          ? 'Image file payload is too large.'
          : res.status >= 500
          ? 'Server error. Please check backend.'
          : `Request failed (${res.status})`;
      throw new Error(data.message || defaultMsg);
    }
    return data;
  };
  return {
    get: (p) => request(p),
    post: (p, b) => request(p, { method: 'POST', body: JSON.stringify(b) }),
    put: (p, b) => request(p, { method: 'PUT', body: JSON.stringify(b) }),
    patch: (p, b) => request(p, { method: 'PATCH', body: JSON.stringify(b) }),
    delete: (p) => request(p, { method: 'DELETE' })
  };
}
