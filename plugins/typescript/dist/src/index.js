"use strict";
function init(modules) {
    const typescript = modules.typescript;
    function create(info) {
        const logger = info.project.projectService.logger;
        logger.info("Create called!");
        const proxy = Object.create(null);
        for (let k of Object.keys(info.languageService)) {
            const x = info.languageService[k];
            // @ts-expect-error
            proxy[k] = (...args) => x.apply(info.languageService, args);
        }
        proxy.getQuickInfoAtPosition = (fileName, position) => {
            logger.info(`Checking quick info at position: ${position} in file: ${fileName}`);
            const prior = info.languageService.getQuickInfoAtPosition(fileName, position);
            if (prior) {
                logger.info("Found prior quick info.");
            }
            else {
                logger.info("No prior quick info found.");
            }
            const program = info.languageService.getProgram();
            const sourceFile = program === null || program === void 0 ? void 0 : program.getSourceFile(fileName);
            const typeChecker = program === null || program === void 0 ? void 0 : program.getTypeChecker();
            if (!typeChecker) {
                logger.info("No type checker.");
                return prior;
            }
            if (sourceFile) {
                const token = findTokenAtPosition(sourceFile, position);
                if (!token) {
                    logger.info("No token found at position.");
                    return prior;
                }
                logger.info(`Token kind: ${typescript.SyntaxKind[token.kind]}`);
                logger.info(`Token text: ${token.getText(sourceFile)}`);
                if (token.parent) {
                    logger.info(`Parent kind: ${typescript.SyntaxKind[token.parent.kind]}`);
                }
                else {
                    logger.info("Token has no parent.");
                }
                if (typescript.isPrefixUnaryExpression(token) && token.operator === typescript.SyntaxKind.ExclamationToken) {
                    const operand = token.operand;
                    if (typescript.isPrefixUnaryExpression(operand) && operand.operator === typescript.SyntaxKind.ExclamationToken) {
                        const innerOperand = operand.operand;
                        if (typescript.isPrefixUnaryExpression(innerOperand) && innerOperand.operator === typescript.SyntaxKind.ExclamationToken) {
                            const decoratorText = innerOperand.operand.getText(sourceFile);
                            logger.info(`Custom decorator found: ${decoratorText}`);
                            // Extract the decorator name (without arguments)
                            const decoratorName = decoratorText.split('(')[0];
                            if (decoratorName === "TraceCallback" || decoratorName === "TraceEffect") {
                                // Find the associated function
                                const functionNode = findAssociatedFunction(token, logger);
                                const calculatedDeps = functionNode ? calculateDependencies(functionNode, sourceFile, typeChecker, logger) : [];
                                logger.info(`Calculated dependencies: ${calculatedDeps.join(', ')}`);
                                return {
                                    kind: typescript.ScriptElementKind.unknown,
                                    kindModifiers: typescript.ScriptElementKindModifier.none,
                                    textSpan: {
                                        start: token.getStart(sourceFile),
                                        length: token.getWidth(sourceFile)
                                    },
                                    displayParts: [
                                        { text: "Custom Tracing", kind: "text" },
                                        { text: " ", kind: "space" },
                                        { text: decoratorName, kind: "functionName" },
                                        { text: "\n", kind: "lineBreak" },
                                        { text: `Adds tracing to ${decoratorName === "TraceCallback" ? "callbacks" : "effects"}`, kind: "text" },
                                        { text: "\n", kind: "lineBreak" },
                                        { text: "Calculated Dependencies: ", kind: "text" },
                                        { text: calculatedDeps.join(", "), kind: "keyword" }
                                    ]
                                };
                            }
                        }
                    }
                }
                logger.info("Token is not a custom tracing expression.");
            }
            return prior;
        };
        function findTokenAtPosition(sourceFile, position) {
            function find(node) {
                if (position >= node.getStart(sourceFile) && position < node.getEnd()) {
                    return typescript.forEachChild(node, find) || node;
                }
            }
            return find(sourceFile);
        }
        function findAssociatedFunction(node, logger) {
            let current = node;
            while (current && !typescript.isSourceFile(current)) {
                logger.info(`current kind: ${typescript.SyntaxKind[current.kind]}`);
                if (typescript.isVariableStatement(current)) {
                    const declaration = current.declarationList.declarations[0];
                    if (typescript.isVariableDeclaration(declaration) && declaration.initializer) {
                        if (typescript.isArrowFunction(declaration.initializer) || typescript.isFunctionExpression(declaration.initializer)) {
                            logger.info(`Found associated function: ${typescript.SyntaxKind[declaration.initializer.kind]}`);
                            return declaration.initializer;
                        }
                    }
                }
                // Move to the next sibling
                const parent = current.parent;
                if (typescript.isBlock(parent)) {
                    const siblings = parent.statements;
                    const currentIndex = siblings.indexOf(current);
                    if (currentIndex < siblings.length - 1) {
                        current = siblings[currentIndex + 1];
                        continue;
                    }
                }
                // If no next sibling, move up to the parent
                current = parent;
            }
            logger.info("associated function not found.");
            return undefined;
        }
        function calculateDependencies(node, sourceFile, typeChecker, logger) {
            const dependencies = new Set();
            const localDeclarations = new Set();
            // Add function parameters to local declarations
            node.parameters.forEach(param => {
                if (typescript.isIdentifier(param.name)) {
                    localDeclarations.add(param.name.text);
                }
            });
            function visit(node) {
                if (typescript.isIdentifier(node)) {
                    // Only consider top-level identifiers
                    if (node.parent &&
                        (typescript.isPropertyAccessExpression(node.parent) && node.parent.expression === node ||
                            typescript.isCallExpression(node.parent) && node.parent.expression === node)) {
                        const symbol = typeChecker.getSymbolAtLocation(node);
                        if (symbol && !localDeclarations.has(node.text)) {
                            const flags = symbol.flags;
                            const typeflags = typeChecker.getTypeOfSymbol(symbol).flags;
                            logger.info(`Candidate Dependency: ${node.text} (kind: ${typescript.SyntaxKind[node.kind]}, flags: ${typescript.SymbolFlags[flags]}, typeflags: ${typescript.SymbolFlags[typeflags]})`);
                            function hasTypeFlag(flag) {
                                if (!typeflags) {
                                    return false;
                                }
                                return typeflags & flag;
                            }
                            let exclude = hasTypeFlag(typescript.SymbolFlags.Enum)
                                ||
                                    hasTypeFlag(typescript.SymbolFlags.ConstEnum)
                                ||
                                    hasTypeFlag(typescript.SymbolFlags.TypeAlias)
                                ||
                                    hasTypeFlag(typescript.SymbolFlags.FunctionScopedVariable);
                            if (hasTypeFlag(typescript.SymbolFlags.Signature)) {
                                exclude = false;
                            }
                            if (exclude) {
                                return;
                            }
                            // Check if the symbol is declared outside of this function
                            const declarations = symbol.declarations;
                            if (declarations && declarations.length > 0) {
                                const declaration = declarations[0];
                                if (!node.getSourceFile().fileName.includes(declaration.getSourceFile().fileName) ||
                                    declaration.pos < node.getStart() || declaration.end > node.getEnd()) {
                                    logger.info(`Dependency: ${node.text} (kind: ${typescript.SyntaxKind[node.kind]}, flags: ${typescript.SymbolFlags[flags]}, typeflags: ${typescript.SymbolFlags[typeflags]})`);
                                    dependencies.add(node.text);
                                }
                            }
                        }
                    }
                }
                else if (typescript.isVariableDeclaration(node)) {
                    if (typescript.isIdentifier(node.name)) {
                        localDeclarations.add(node.name.text);
                    }
                }
                typescript.forEachChild(node, visit);
            }
            visit(node);
            // Filter out common React-specific identifiers and methods
            const reactSpecificIdentifiers = new Set(['useState', 'useEffect', 'useCallback', 'useMemo', 'useRef', 'useContext', 'setState']);
            return Array.from(dependencies).filter(dep => !reactSpecificIdentifiers.has(dep) || dep.startsWith('use'));
        }
        return proxy;
    }
    return { create };
}
module.exports = init;
//# sourceMappingURL=index.js.map