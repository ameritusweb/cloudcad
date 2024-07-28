// src/mocks/handlers.js
import { HttpResponse } from 'msw';
import { http } from 'msw';

export const handlers = [
  http.get('/api/example', ({ params }) => {
    const { id } = params;
    return HttpResponse.json({ firstName: id}, { status: 200 })
  })
];
