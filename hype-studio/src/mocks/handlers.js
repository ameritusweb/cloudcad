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

function mockStaticAnalysis(material, geometry, loads, constraints) {
  // Simplified mock calculations
  const totalForce = loads.reduce((sum, load) => sum + load.magnitude, 0);
  const area = geometry.width * geometry.height;
  const stress = totalForce / area;
  const strain = stress / material.youngsModulus;
  const displacement = strain * geometry.length;

  return {
    maxStress: stress,
    maxDisplacement: displacement,
    stressDistribution: generateMockDistribution(stress, geometry.nodes),
    displacementDistribution: generateMockDistribution(displacement, geometry.nodes),
    factorOfSafety: material.yieldStrength / stress,
  };
}

function mockFatigueAnalysis(material, geometry, loads, constraints) {
  const staticResults = mockStaticAnalysis(material, geometry, loads, constraints);
  const cyclestoFailure = 1e6 * Math.pow((material.fatigueStrength / staticResults.maxStress), material.fatigueExponent);

  return {
    ...staticResults,
    cyclestoFailure,
    damagePerCycle: 1 / cyclestoFailure,
    fatigueLifeDistribution: generateMockDistribution(cyclestoFailure, geometry.nodes),
  };
}

function mockThermalAnalysis(material, geometry, loads, constraints) {
  const maxTemp = loads.reduce((max, load) => Math.max(max, load.temperature), 0);
  const minTemp = constraints.reduce((min, constraint) => Math.min(min, constraint.temperature), maxTemp);
  const tempDiff = maxTemp - minTemp;
  const thermalStress = material.thermalExpansionCoeff * material.youngsModulus * tempDiff;

  return {
    maxTemperature: maxTemp,
    minTemperature: minTemp,
    temperatureDistribution: generateMockDistribution(maxTemp, geometry.nodes),
    thermalStress,
    thermalStressDistribution: generateMockDistribution(thermalStress, geometry.nodes),
    thermalDisplacement: material.thermalExpansionCoeff * tempDiff * geometry.length,
  };
}

function mockDynamicAnalysis(material, geometry, loads, constraints) {
  const staticResults = mockStaticAnalysis(material, geometry, loads, constraints);
  const naturalFrequency = Math.sqrt(material.youngsModulus / material.density) / (2 * geometry.length);
  
  const timeSteps = Array.from({length: 50}, (_, i) => i * 0.1);
  const dynamicResults = timeSteps.map(t => ({
    time: t,
    displacement: staticResults.maxDisplacement * Math.sin(2 * Math.PI * naturalFrequency * t),
    velocity: staticResults.maxDisplacement * 2 * Math.PI * naturalFrequency * Math.cos(2 * Math.PI * naturalFrequency * t),
    acceleration: -staticResults.maxDisplacement * Math.pow(2 * Math.PI * naturalFrequency, 2) * Math.sin(2 * Math.PI * naturalFrequency * t),
  }));

  return {
    staticResults,
    naturalFrequency,
    dynamicResults,
  };
}

function generateMockDistribution(maxValue, nodes) {
  return nodes.map((node, index) => ({
    nodeId: node.id,
    value: maxValue * (1 - index / nodes.length) * (0.8 + 0.4 * Math.random())
  }));
}

export const handlers = [
  http.post('/api/structural-analysis', async ({ request }) => {
    // Read the intercepted request body as JSON.
    const analysisRequest = await request.json()
 
    const { analysisType, material, geometry, loads, constraints } = analysisRequest;

    switch (analysisType) {
      default:
        return HttpResponse.json({ error: 'Invalid analysis type' }, { status: 400 });
      case 'static':
        return HttpResponse.json(mockStaticAnalysis(material, geometry, loads, constraints), { status: 201 });
      case 'fatigue':
        return HttpResponse.json(mockFatigueAnalysis(material, geometry, loads, constraints), { status: 201 });
      case 'thermal':
        return HttpResponse.json(mockThermalAnalysis(material, geometry, loads, constraints), { status: 201 });
      case 'dynamic':
        return HttpResponse.json(mockDynamicAnalysis(material, geometry, loads, constraints), { status: 201 });
    }
  }),
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