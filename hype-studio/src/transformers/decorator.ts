import ts from "typescript";

function createTraceCallbackExpression(
  func: ts.FunctionExpression | ts.ArrowFunction,
  args: ts.Expression[]
): ts.CallExpression {
  const traceCall = ts.factory.createCallExpression(
    ts.factory.createIdentifier('traceUseCallback'),
    undefined,
    [func, ...args]
  );

  const wrappedFunction = ts.factory.createArrowFunction(
    undefined,
    undefined,
    [
      ts.factory.createParameterDeclaration(
        undefined,
        ts.factory.createToken(ts.SyntaxKind.DotDotDotToken),  // The spread operator
        ts.factory.createIdentifier('args'),  // The parameter name
        undefined,  // Optional token (not needed here)
        undefined,  // Type annotation (if any)
        undefined   // Initializer (if any)
      )
    ],
    undefined,
    ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
    traceCall
  );

  const depsArray = args[0];
  if (!ts.isArrayLiteralExpression(depsArray)) {
    throw new Error("Expected the first argument to TraceCallback to be an array literal.");
  }

  return ts.factory.createCallExpression(
    ts.factory.createIdentifier('useCallback'),
    undefined,
    [wrappedFunction, depsArray]
  );
}

function createTraceEffectExpression(
  func: ts.FunctionExpression | ts.ArrowFunction,
  args: ts.Expression[]
): ts.CallExpression {
  const traceCall = ts.factory.createCallExpression(
    ts.factory.createIdentifier('traceEffect'),
    undefined,
    [func, ...args.slice(1)]
  );

  const wrappedFunction = ts.factory.createArrowFunction(
    undefined,
    undefined,
    [],
    undefined,
    ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
    traceCall
  );

  const depsArray = args[0];
  if (!ts.isArrayLiteralExpression(depsArray)) {
    throw new Error("Expected the first argument to TraceEffect to be an array literal.");
  }

  return ts.factory.createCallExpression(
    ts.factory.createIdentifier('useEffect'),
    undefined,
    [wrappedFunction, depsArray]
  );
}

const transformer: ts.TransformerFactory<ts.SourceFile> = (context: ts.TransformationContext) => {
  return (sourceFile: ts.SourceFile): ts.SourceFile => {
    if (!sourceFile.fileName.includes('Controls')) {
      return sourceFile;
    }
    console.log(`Processing file: ${sourceFile.fileName}`);
    
    const visitor = (node: ts.Node): ts.Node => {
      console.log(`Visiting node of kind: ${ts.SyntaxKind[node.kind]}`);

      if (ts.isVariableStatement(node)) {
        console.log('Found VariableStatement');
        if (node.declarationList.declarations.length === 1) {
          console.log('VariableStatement has exactly one declaration');
          const declaration = node.declarationList.declarations[0];
          
          if (ts.isVariableDeclaration(declaration)) {
            console.log('Found VariableDeclaration');
            if (declaration.initializer) {
              console.log(`VariableDeclaration has initializer: ${ts.SyntaxKind[declaration.initializer.kind]}`);
              if (ts.isPrefixUnaryExpression(declaration.initializer)) {
                console.log('Initializer is PrefixUnaryExpression');
                if (declaration.initializer.operator === ts.SyntaxKind.ExclamationToken) {
                  console.log('Found first exclamation token');
                  const initializer = declaration.initializer;
                  
                  if (ts.isPrefixUnaryExpression(initializer.operand)) {
                    console.log('Found second PrefixUnaryExpression');
                    if (initializer.operand.operator === ts.SyntaxKind.ExclamationToken) {
                      console.log('Found second exclamation token');
                      if (ts.isPrefixUnaryExpression(initializer.operand.operand)) {
                        console.log('Found third PrefixUnaryExpression');
                        if (initializer.operand.operand.operator === ts.SyntaxKind.ExclamationToken) {
                          console.log('Found third exclamation token');
                          const traceCall = initializer.operand.operand.operand;
                          
                          if (ts.isCallExpression(traceCall)) {
                            console.log('Found CallExpression');
                            if (ts.isIdentifier(traceCall.expression)) {
                              const traceName = traceCall.expression.text;
                              console.log(`Found trace call: ${traceName}`);
                              
                              // Your existing transformation logic here
                            } else {
                              console.log('CallExpression does not have an Identifier as expression');
                            }
                          } else {
                            console.log('Third operand is not a CallExpression');
                          }
                        } else {
                          console.log('Third operator is not ExclamationToken');
                        }
                      } else {
                        console.log('Second operand is not a PrefixUnaryExpression');
                      }
                    } else {
                      console.log('Second operator is not ExclamationToken');
                    }
                  } else {
                    console.log('First operand is not a PrefixUnaryExpression');
                  }
                } else {
                  console.log('First operator is not ExclamationToken');
                }
              } else {
                console.log('Initializer is not a PrefixUnaryExpression');
              }
            } else {
              console.log('VariableDeclaration has no initializer');
            }
          } else {
            console.log('Declaration is not a VariableDeclaration');
          }
        } else {
          console.log('VariableStatement has multiple or zero declarations');
        }
      }

      return ts.visitEachChild(node, visitor, context);
    };

    return ts.visitNode(sourceFile, visitor) as ts.SourceFile;
  };
};

  
  export default transformer;