module.exports = function({ types: t }) {
    return {
      visitor: {
        CallExpression(path, state) {
            if (process.env.NODE_ENV === 'development') { 
                    
                if (path.node.callee.property && path.node.callee.property.name === 'subscribe') {
                    console.log('CallExpression encountered:', path.node);
                    console.log('Filename:', state.file.opts.filename);
                    console.log('Length:', path.node.arguments.length);
                    if (path.node.arguments.length === 2) {
                      path.node.arguments.push(t.booleanLiteral(false));
                      path.node.arguments.push(t.stringLiteral(state.file.opts.filename));
                    } else if (path.node.arguments.length === 3) {
                      path.node.arguments.push(t.stringLiteral(state.file.opts.filename));
                    } 
                }
            }
        }
      }
    };
  };