import ts from "typescript";

const transformer: ts.TransformerFactory<ts.SourceFile> = (context: ts.TransformationContext) => {
  return (sourceFile: ts.SourceFile): ts.SourceFile => {
    if (!sourceFile.fileName.includes("stories")) {
      return sourceFile;
    }
    
    let lastTraceDecorator: { type: 'TraceEffect' | 'TraceCallback', config: ts.Expression } | null = null;

    const visitor = (node: ts.Node): ts.Node | undefined => {
      if (ts.isExpressionStatement(node)) {
        const traceInfo = getTraceInfo(node.expression);
        if (traceInfo) {
          lastTraceDecorator = traceInfo;
          return undefined; // Remove the decorator
        }
        lastTraceDecorator = null;
        return node;
      }

      if (ts.isVariableStatement(node) && lastTraceDecorator) {
        console.log('Found VariableStatement following a trace decorator');
        const declaration = node.declarationList.declarations[0];
        
        if (ts.isVariableDeclaration(declaration) && declaration.initializer) {
          
          if (ts.isArrowFunction(declaration.initializer)) {
            
            // Transform the node
            const newNode = transformTraceExpression(node, lastTraceDecorator.type, lastTraceDecorator.config, declaration.initializer);
            lastTraceDecorator = null; // Reset for the next iteration
            return newNode;
          }
        }
      }

      lastTraceDecorator = null; // Reset if not immediately followed by a relevant VariableStatement
      return ts.visitEachChild(node, visitor, context);
    };

    return ts.visitNode(sourceFile, visitor) as ts.SourceFile;
  };
};

function getTraceInfo(expression: ts.Expression): { type: 'TraceEffect' | 'TraceCallback', config: ts.Expression } | null {
  if (ts.isPrefixUnaryExpression(expression) &&
      expression.operator === ts.SyntaxKind.ExclamationToken &&
      ts.isPrefixUnaryExpression(expression.operand) &&
      expression.operand.operator === ts.SyntaxKind.ExclamationToken &&
      ts.isPrefixUnaryExpression(expression.operand.operand) &&
      expression.operand.operand.operator === ts.SyntaxKind.ExclamationToken) {
    
    const callExpression = expression.operand.operand.operand;
    if (ts.isCallExpression(callExpression) && ts.isIdentifier(callExpression.expression)) {
      const traceName = callExpression.expression.text;
      if (traceName === 'TraceEffect' || traceName === 'TraceCallback') {
        return {
          type: traceName,
          config: callExpression.arguments[0]
        };
      }
    }
  }
  return null;
}

function transformTraceExpression(
  variableStatement: ts.VariableStatement, 
  traceType: 'TraceEffect' | 'TraceCallback',
  configArg: ts.Expression,
  originalFunction: ts.ArrowFunction
): ts.VariableStatement {
  const declaration = variableStatement.declarationList.declarations[0] as ts.VariableDeclaration;

  let newInitializer: ts.Expression;
  let depsArray: ts.Expression | undefined;

  if (ts.isObjectLiteralExpression(configArg)) {
    const depsProperty = configArg.properties.find(prop => 
      ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name) && prop.name.text === "deps"
    );

    if (depsProperty && ts.isPropertyAssignment(depsProperty) && ts.isArrayLiteralExpression(depsProperty.initializer)) {
      depsArray = depsProperty.initializer;
    }
  }

  if (!depsArray) {
    throw new Error("Expected the configuration object to have a 'deps' array.");
  }

  const traceCall = ts.factory.createCallExpression(
    ts.factory.createIdentifier(traceType === 'TraceEffect' ? 'traceEffect' : 'traceCallback'),
    undefined,
    [originalFunction, configArg]
  );

  const wrappedFunction = ts.factory.createArrowFunction(
    undefined,
    undefined,
    [],
    undefined,
    ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
    traceCall
  );

  newInitializer = ts.factory.createCallExpression(
    ts.factory.createIdentifier(traceType === 'TraceEffect' ? 'useEffect' : 'useCallback'),
    undefined,
    [wrappedFunction, depsArray]
  );

  const newDeclaration = ts.factory.updateVariableDeclaration(
    declaration,
    declaration.name,
    declaration.exclamationToken,
    declaration.type,
    newInitializer
  );

  return ts.factory.updateVariableStatement(
    variableStatement,
    variableStatement.modifiers,
    ts.factory.updateVariableDeclarationList(variableStatement.declarationList, [newDeclaration])
  );
}

export default transformer;