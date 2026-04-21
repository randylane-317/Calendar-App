async function request(method, path, body) {
  const res = await fetch(`/api${path}`, {
    method,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : {},
    credentials: 'include',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export const api = {
  auth: {
    setupStatus: ()     => request('GET',  '/auth/setup-status'),
    register:    (data) => request('POST', '/auth/register', data),
    login:       (data) => request('POST', '/auth/login', data),
    logout:      ()     => request('POST', '/auth/logout'),
    me:          ()     => request('GET',  '/auth/me'),
    users:       ()     => request('GET',  '/auth/users'),
  },
  events: {
    list:   ()         => request('GET',    '/events'),
    create: (data)     => request('POST',   '/events', data),
    update: (id, data) => request('PUT',    `/events/${id}`, data),
    delete: (id)       => request('DELETE', `/events/${id}`),
  },
  push: {
    vapidKey:    ()      => request('GET',    '/push/vapid-public-key'),
    subscribe:   (sub)   => request('POST',   '/push/subscribe', sub),
    unsubscribe: (ep)    => request('DELETE', '/push/unsubscribe', { endpoint: ep }),
  },
};
