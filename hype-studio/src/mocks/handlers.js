import { http, HttpResponse } from 'msw';

// In-memory storage for imported files
let importedFiles = [
  {
    id: '1',
    name: 'example.svg',
    type: 'image/svg+xml',
    content: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" stroke="black" fill="none"/></svg>'
  },
  {
    id: '2',
    name: 'example.dxf',
    type: 'application/dxf',
    content: `0
SECTION
2
ENTITIES
0
LINE
8
0
10
10
20
10
11
90
21
90
0
LINE
8
0
10
10
20
90
11
90
21
10
0
ENDSEC
0
EOF`
  }
];

export const handlers = [
  // Handler for uploading a file
  http.post('/api/upload-file', async ({ request }) => {
    const file = await request.json();
    const newFile = {
      id: String(importedFiles.length + 1),
      ...file
    };
    importedFiles.push(newFile);
    return HttpResponse.json(newFile, { status: 200 });
  }),

  // Handler for retrieving all imported files
  http.get('/api/imported-files', ({request, cookies, params}) => {
    console.log(request);
    return HttpResponse.json(importedFiles, { status: 200, headers: {
      'Cache-Control': 'no-cache', // Set the header here
    } });
  }),

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