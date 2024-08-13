"use strict";
function init(modules) {
    const typescript = modules.typescript;
    function create(info) {
        info.project.projectService.logger.info("Create called!");
        // Get a reference to the proxy wrapped language service
        const proxy = Object.create(null);
        for (let k of Object.keys(info.languageService)) {
            const x = info.languageService[k];
            // @ts-expect-error
            proxy[k] = (...args) => x.apply(info.languageService, args);
        }
        // Override the necessary language service methods
        proxy.getCompletionsAtPosition = (fileName, position, options) => {
            const prior = info.languageService.getCompletionsAtPosition(fileName, position, options);
            // Add your custom completions here if needed
            return prior;
        };
        proxy.getQuickInfoAtPosition = (fileName, position) => {
            var _a;
            const logger = info.project.projectService.logger;
            logger.info(`Checking quick info at position: ${position} in file: ${fileName}`);
            const prior = info.languageService.getQuickInfoAtPosition(fileName, position);
            if (prior) {
                logger.info("Found prior quick info.");
            }
            else {
                logger.info("No prior quick info found.");
            }
            const sourceFile = (_a = info.languageService.getProgram()) === null || _a === void 0 ? void 0 : _a.getSourceFile(fileName);
            if (sourceFile) {
                const token = findTokenAtPosition(sourceFile, position);
                if (!token) {
                    logger.info("No token found at position.");
                    return prior;
                }
                token && logger.info(`Token kind: ${typescript.SyntaxKind[token.kind]}`);
                token && logger.info(`Token text: ${token.getText(sourceFile)}`);
                if (token && token.parent) {
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
                                        { text: `Adds tracing to ${decoratorName === "TraceCallback" ? "callbacks" : "effects"}`, kind: "text" }
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
        // Helper function to find the token at a given position
        function findTokenAtPosition(sourceFile, position) {
            function find(node) {
                if (position >= node.getStart(sourceFile) && position < node.getEnd()) {
                    return typescript.forEachChild(node, find) || node;
                }
            }
            return find(sourceFile);
        }
        // Add more overrides as needed
        return proxy;
    }
    return { create };
}
module.exports = init;
//# sourceMappingURL=index.js.map