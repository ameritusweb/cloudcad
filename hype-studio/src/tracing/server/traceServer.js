import express from 'express';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import cors from 'cors';
import moment from 'moment'; // To format the date

const app = express();
app.use(cors()); // Enable CORS for all routes
app.use(express.json({ limit: '50mb' }));

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure the results directory exists
const resultsDir = join(__dirname, 'results');
await fs.mkdir(resultsDir, { recursive: true });

// Create the trace file path with the date appended to the filename
const currentDate = moment().format('M-D-YYYY');
const traceFileName = `functionTrace-${currentDate}.json`;
const traceFilePath = join(resultsDir, traceFileName);

let traceData = {};

function addTraceToTree(trace) {
  if (!trace.parentTraceId) {
    traceData[trace.traceId] = trace;
  } else {
    let parent = findParentTrace(traceData, trace.parentTraceId);
    if (parent) {
      parent.children = parent.children || [];
      parent.children.push(trace);
    }
  }
}

function findParentTrace(node, parentId) {
  if (node.traceId === parentId) return node;
  if (node.children) {
    for (let child of node.children) {
      let result = findParentTrace(child, parentId);
      if (result) return result;
    }
  }
  return null;
}

app.post('/trace', async (req, res) => {
  const traceInfo = req.body;
  addTraceToTree(traceInfo);
  
  await fs.writeFile(traceFilePath, JSON.stringify(traceData, null, 2));
  
  res.sendStatus(200);
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Trace server listening on port ${PORT}`);
});
