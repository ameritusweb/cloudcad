import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/project', () => {
    return HttpResponse.json({
      name: 'My Project',
      dimensions: '20mm x 40mm x 60mm'
    }, { status: 200 });
  }),

  http.get('/api/list-view', () => {
    return HttpResponse.json(
      ['Sketch1', 'Sketch2', 'Fillet1', 'Sketch3'],
      { status: 200 }
    );
  }),

  http.get('/api/sketch-view', () => {
    return HttpResponse.json(
      ['New Sketch', 'Edit Sketch', 'Delete Sketch'],
      { status: 200 }
    );
  }),

  http.get('/api/extrude-view', () => {
    return HttpResponse.json(
      ['Extrude1', 'Extrude2', 'New Extrude'],
      { status: 200 }
    );
  }),

  http.get('/api/import-export-view', () => {
    return HttpResponse.json(
      ['Import CAD', 'Export STL', 'Export OBJ'],
      { status: 200 }
    );
  }),

  http.get('/api/fillet-chamfer-view', () => {
    return HttpResponse.json(
      ['Fillet1', 'Chamfer1', 'New Fillet/Chamfer'],
      { status: 200 }
    );
  }),

  http.get('/api/dimension-tool-view', () => {
    return HttpResponse.json(
      ['Dimension1', 'Dimension2', 'Add Dimension'],
      { status: 200 }
    );
  }),
];