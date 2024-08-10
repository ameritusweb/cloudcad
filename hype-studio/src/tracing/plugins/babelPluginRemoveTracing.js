export default function removeTracingPlugin() {
    return {
      visitor: {
        CallExpression(path) {
          const { callee } = path.node;
          if (
            callee.name === 'traceEffect' ||
            callee.name === 'traceCallback' ||
            callee.name === 'captureStackTrace' ||
            callee.name === 'measurePerformance'
          ) {
            path.remove();
          }
        },
      },
    };
  };