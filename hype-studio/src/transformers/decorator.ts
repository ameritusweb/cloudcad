import ts from "typescript";

const transformer: ts.TransformerFactory<ts.SourceFile> = (context: ts.TransformationContext) => {
  return (sourceFile: ts.SourceFile): ts.SourceFile => {
    if (!sourceFile.fileName.includes('Controls')) {
      return sourceFile;
    }
    console.log(`Processing file: ${sourceFile.fileName}`);
    
    let lastExpressionStatement: ts.ExpressionStatement | null = null;

    const visitor = (node: ts.Node): ts.Node => {
      console.log(`Visiting node of kind: ${ts.SyntaxKind[node.kind]}`);

      if (ts.isExpressionStatement(node)) {
        lastExpressionStatement = node;
        return node;
      }

      if (ts.isVariableStatement(node) && lastExpressionStatement) {
        console.log('Found VariableStatement preceded by ExpressionStatement');
        const declaration = node.declarationList.declarations[0];
        
        if (ts.isVariableDeclaration(declaration) && declaration.initializer) {
          console.log('Found VariableDeclaration with initializer');
          
          if (ts.isArrowFunction(declaration.initializer)) {
            console.log('Initializer is ArrowFunction');
            
            // Check if the preceding ExpressionStatement matches our !!!TraceCallback pattern
            const traceCallExpression = getInnermostCallExpression(lastExpressionStatement.expression);
            if (traceCallExpression && isTraceExpression(lastExpressionStatement.expression)) {
              console.log('Found matching trace expression');
              const traceName = getTraceName(traceCallExpression);
              console.log(`Trace name: ${traceName}`);

              // Transform the node
              const newNode = transformTraceExpression(node, traceCallExpression, traceName);
              lastExpressionStatement = null; // Reset for the next iteration
              return newNode;
            }
          }
        }
      }

      lastExpressionStatement = null; // Reset if not immediately followed by a relevant VariableStatement
      return ts.visitEachChild(node, visitor, context);
    };

    return ts.visitNode(sourceFile, visitor) as ts.SourceFile;
  };
};

function isTraceExpression(expression: ts.Expression): boolean {
  const callExpression = getInnermostCallExpression(expression);
  return !!callExpression;
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
  traceName: string
): ts.VariableStatement {
  const declaration = variableStatement.declarationList.declarations[0] as ts.VariableDeclaration;
  const initializer = declaration.initializer as ts.ArrowFunction;
  
  let newInitializer: ts.Expression;
  if (traceName === "TraceCallback") {
    newInitializer = createTraceCallbackExpression(initializer, traceCallExpression.arguments);
  } else if (traceName === "TraceEffect") {
    newInitializer = createTraceEffectExpression(initializer, traceCallExpression.arguments);
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

function createTraceCallbackExpression(
  func: ts.ArrowFunction,
  args: ts.NodeArray<ts.Expression>
): ts.CallExpression {
  return ts.factory.createCallExpression(
    ts.factory.createIdentifier('traceUseCallback'),
    undefined,
    [func, ...args]
  );
}

function createTraceEffectExpression(
  func: ts.ArrowFunction,
  args: ts.NodeArray<ts.Expression>
): ts.CallExpression {
  return ts.factory.createCallExpression(
    ts.factory.createIdentifier('traceEffect'),
    undefined,
    [func, ...args]
  );
}

export default transformer;
