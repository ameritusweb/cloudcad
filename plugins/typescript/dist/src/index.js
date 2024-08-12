"use strict";
function init(modules) {
    const typescript = modules.typescript;
    function create(info) {
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
            console.log(`Checking quick info at position: ${position} in file: ${fileName}`);
            const prior = info.languageService.getQuickInfoAtPosition(fileName, position);
            if (prior) {
                console.log("Found prior quick info:", prior);
            }
            else {
                console.log("No prior quick info found.");
            }
            const sourceFile = info.languageService.getProgram()?.getSourceFile(fileName);
            if (sourceFile) {
                const token = findTokenAtPosition(sourceFile, position);
                if (token && token.parent && typescript.isDecorator(token.parent)) {
                    const decoratorName = token.getText(sourceFile);
                    if (decoratorName === "TraceCallback" || decoratorName === "TraceEffect") {
                        return {
                            kind: typescript.ScriptElementKind.unknown,
                            kindModifiers: typescript.ScriptElementKindModifier.none,
                            textSpan: {
                                start: token.getStart(sourceFile),
                                length: token.getWidth(sourceFile)
                            },
                            displayParts: [
                                { text: "Decorator", kind: "text" },
                                { text: " ", kind: "space" },
                                { text: decoratorName, kind: "functionName" },
                                { text: "\n", kind: "lineBreak" },
                                { text: `Adds tracing to ${decoratorName === "TraceCallback" ? "callbacks" : "effects"}`, kind: "text" }
                            ]
                        };
                    }
                }
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