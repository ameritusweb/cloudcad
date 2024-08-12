import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const traceServer = 'http://localhost:3000/trace';

export function sendTraceToServer(traceData) {
  const traceId = uuidv4();
  axios.post(traceServer, { traceId, ...traceData })
    .catch(error => console.error('Failed to send trace data:', error));
}