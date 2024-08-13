import ts from "typescript";

const transformer: ts.TransformerFactory<ts.SourceFile> = (context: ts.TransformationContext) => {
  return (sourceFile: ts.SourceFile): ts.SourceFile => {
    if (!sourceFile.fileName.includes("stories")) {
      return sourceFile;
    }
    console.log(`Processing file: ${sourceFile.fileName}`);
    
    let lastTraceDecorator: ts.ExpressionStatement | null = null;

    const visitor = (node: ts.Node): ts.Node => {
      console.log(`Visiting node of kind: ${ts.SyntaxKind[node.kind]}`);

      if (ts.isExpressionStatement(node)) {
        if (isTraceExpression(node.expression)) {
          lastTraceDecorator = node;
          return undefined as unknown as ts.Node;  // Remove the decorator
        }
        return node;
      }

      if (ts.isVariableStatement(node) && lastTraceDecorator) {
        console.log('Found VariableStatement following a trace decorator');
        const declaration = node.declarationList.declarations[0];
        
        if (ts.isVariableDeclaration(declaration) && declaration.initializer) {
          console.log('Found VariableDeclaration with initializer');
          
          if (ts.isArrowFunction(declaration.initializer)) {
            console.log('Initializer is ArrowFunction');
            
            const traceCallExpression = getInnermostCallExpression(lastTraceDecorator.expression);
            if (traceCallExpression) {
              console.log('Found matching trace expression');
              const traceName = getTraceName(traceCallExpression);
              console.log(`Trace name: ${traceName}`);

              // Transform the node
              const newNode = transformTraceExpression(node, traceCallExpression, declaration.initializer);
              lastTraceDecorator = null; // Reset for the next iteration
              return newNode;
            }
          }
        }
      }

      lastTraceDecorator = null; // Reset if not immediately followed by a relevant VariableStatement
      return ts.visitEachChild(node, visitor, context);
    };

    return ts.visitNode(sourceFile, visitor) as ts.SourceFile;
  };
};

function isTraceExpression(expression: ts.Expression): boolean {
  return getInnermostCallExpression(expression) !== null;
}

function getInnermostCallExpression(expression: ts.Expression): ts.CallExpression | null {
  let currentNode: ts.Expression | undefined = expression;

  while (ts.isPrefixUnaryExpression(currentNode) && currentNode.operator === ts.SyntaxKind.ExclamationToken) {
    currentNode = currentNode.operand;
  }

  if (currentNode && ts.isCallExpression(currentNode)) {
    return currentNode;
  }

  return null;
}

function getTraceName(callExpression: ts.CallExpression): string {
  if (ts.isIdentifier(callExpression.expression)) {
    return callExpression.expression.text;
  }
  return "";
}

function transformTraceExpression(
  variableStatement: ts.VariableStatement, 
  traceCallExpression: ts.CallExpression,
  originalFunction: ts.ArrowFunction
): ts.VariableStatement {
  const declaration = variableStatement.declarationList.declarations[0] as ts.VariableDeclaration;

  const traceArgs = traceCallExpression.arguments;

  const traceName = getTraceName(traceCallExpression);
  let newInitializer: ts.Expression;

  if (traceName === "TraceEffect") {
    const configArg = traceArgs[0];

    const traceEffectCall = ts.factory.createCallExpression(
      ts.factory.createIdentifier('traceEffect'),
      undefined,
      [originalFunction, configArg]
    );

    const useEffectCallback = ts.factory.createArrowFunction(
      undefined,
      undefined,
      [],
      undefined,
      ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
      traceEffectCall
    );

    let depsArray: ts.Expression | undefined = undefined;
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

    newInitializer = ts.factory.createCallExpression(
      ts.factory.createIdentifier('useEffect'),
      undefined,
      [useEffectCallback, depsArray]
    );
  } else if (traceName === "TraceCallback") {
    const configArg = traceArgs[0];

    const traceCallbackCall = ts.factory.createCallExpression(
      ts.factory.createIdentifier('traceCallback'),
      undefined,
      [originalFunction, configArg]
    );

    const useCallbackArrowFunction = ts.factory.createArrowFunction(
      undefined,
      undefined,
      [],
      undefined,
      ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
      traceCallbackCall
    );

    let depsArray: ts.Expression | undefined = undefined;
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

    newInitializer = ts.factory.createCallExpression(
      ts.factory.createIdentifier('useCallback'),
      undefined,
      [useCallbackArrowFunction, depsArray]
    );
  } else {
    return variableStatement;
  }

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
