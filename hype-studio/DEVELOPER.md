# HypeStudio Developer Documentation 

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [State Management](#state-management)
3. [Key Components](#key-components)
4. [Utility Functions](#utility-functions)
5. [Hooks](#hooks)
6. [3D Rendering and Interaction](#3d-rendering-and-interaction)
7. [UI Components](#ui-components)
8. [React Patterns and Best Practices](#react-patterns-and-best-practices)
9. [Extending the Application](#extending-the-application)
10. [Performance Considerations](#performance-considerations)
11. [Error Handling and Debugging](#error-handling-and-debugging)
12. [Testing Strategy](#testing-strategy)
13. [Collaboration and Code Quality](#collaboration-and-code-quality)
14. [Accessibility](#accessibility)
15. [Internationalization](#internationalization)
16. [3D Rendering Techniques](#3d-rendering-techniques)
17. [Undo and Redo Functionality](#undo-and-redo-functionality)
18. [Development Guidelines](#development-guidelines)
19. [Common Pitfalls](#common-pitfalls)
20. [Future Development Considerations](#future-development-considerations) 

## Architecture Overview 

HypeStudio is a web-based CAD application built with React and Babylon.js. It uses a custom state management solution based on an enhanced version of Zen Observable. 

## State Management 

The application uses EnhancedZenObservable for state management, providing reactive updates with fine-grained control. 

### Key Concepts:
- **Model Creation**: The `createHypeStudioModel` function initializes the application state and defines core methods.
- **State Access**: Always use `model.getState(key)` to access state properties.
- **State Updates**: Use `model.setState(updater)` to modify state.
- **Subscriptions**: Components can subscribe to specific state changes using `model.subscribe(key, callback)`. 

## Key Components 

### HypeStudio
The main component that orchestrates the entire application.

### BabylonViewport
Handles 3D rendering and user interactions within the 3D space.

### Header, Toolbar, LeftPanel, PropertyPanel
UI components for various controls and information display. 

## Utility Functions 

### babylonUtils.js
Contains utility functions for scene setup, mesh management, and interaction handling.

Key functions:
- `setupMainScene`: Initializes the main 3D scene.
- `setupControlScene`: Sets up the control cube for view manipulation.
- `handleMeshSelection`: Manages selection of meshes in the scene.

### meshUtils.js
Provides functions for creating and manipulating meshes.

Key functions:
- `createSketchMesh`: Creates mesh representations of sketches.
- `highlightMesh` and `unhighlightMesh`: Manage visual feedback for selected meshes.

### sceneUtils.js
Contains utilities for scene manipulation and control.

Key functions:
- `createControlCube`: Creates the control cube for view manipulation.
- `getViewFromNormal`: Converts a normal vector to a view name. 

## Hooks 

### useHypeStudioState
A custom hook for accessing and subscribing to specific parts of the application state.

Usage:
```javascript
const value = useHypeStudioState(key, defaultValue);
```

### usePointerEvents
Manages pointer events for the 3D scene.

### useVersioning
Tracks version changes of specific state properties for optimized rendering. 

## 3D Rendering and Interaction 

### Babylon.js Integration
The application uses Babylon.js for 3D rendering. Key aspects include:
- Scene setup in `BabylonViewport`
- Mesh creation and management in `meshUtils.js`
- Interaction handling in `BabylonViewport` and `babylonUtils.js`

### Control Modes
The application supports different control modes (zoom, pan, rotate) managed by the `BabylonControls` component. 

## UI Components 

### Toolbar
Manages different view modes (List View, Sketch View, etc.).

### LeftPanel
Displays content based on the current view mode.

### PropertyPanel
Shows and allows editing of properties for the selected element. 

## React Patterns and Best Practices 

### Props vs State Subscriptions
- Use props for passing data and callbacks down the component tree.
- Use state subscriptions (via `useHypeStudioState`) when a component needs to react to global state changes.
- Prefer props for localized or component-specific data.
- Use state subscriptions for data that is shared across multiple components or represents global application state.

### useState vs useRef
- Use `useState` for values that should trigger a re-render when changed.
- Use `useRef` for values that should persist across renders but shouldn't cause re-renders when changed.
- Common `useRef` use cases: storing DOM elements, keeping previous values, or any mutable value that doesn't require the component to update.

### useCallback
- Use `useCallback` to memoize functions, especially when passing them as props to child components.
- Particularly useful for event handlers and functions passed to pure components.
- Always include all variables from the outer scope that the callback uses in the dependency array.

### React.memo
- Use `React.memo` for components that often receive the same props and render frequently.
- Avoid using `React.memo` on components that almost always render with different props.
- Consider using custom comparison functions with `React.memo` for complex prop structures. 

## Extending the Application 

### Adding New Sketch Types
1. Update the `createSketchMesh` function in `meshUtils.js` to handle the new sketch type.
2. Add a new case in the `renderSketchProperties` function in `PropertyPanel` component.
3. Update the `LeftPanel` component to include an option for creating the new sketch type.
4. Modify the `handleSketchCreate` function in `BabylonViewport` to handle the new sketch type.
5. Update the initial state in `HypeStudioContext` if necessary.

### Adding New Properties to the Property Panel
1. Update the `renderPropertyInput` function in `PropertyPanel` to handle the new property type.
2. Modify the `setCustomProperty` method in the model to validate and store the new property.
3. Update relevant mesh creation and update functions to apply the new property.

### Adding New Tools to the Toolbar
1. Add a new icon and label for the tool in the `Toolbar` component.
2. Create a new handler function for the tool in the `HypeStudio` main component.
3. Update the `activeView` state to include the new tool's view.
4. Modify the `LeftPanel` and `BabylonViewport` components to handle the new tool's functionality.

### Extending the Initial State
1. Update the `initialHypeStudioState` object in `HypeStudioContext.js`.
2. Modify the `createHypeStudioModel` function to include methods for managing the new state.
3. Update relevant components to use and display the new state properties.

### When to Update the Context
- Update context when changes affect multiple components or the global application state.
- Use `model.setState` for updates that should trigger re-renders in subscribed components.
- Prefer local state (useState) for changes that only affect a single component. 

## Performance Considerations 

### Optimizing Renders
- Use the React DevTools profiler to identify unnecessary re-renders.
- Leverage `useCallback` and `React.memo` strategically to prevent unnecessary re-renders.
- Consider using `useMemo` for expensive computations that don't need to be recalculated on every render.

### Managing Large Datasets
- Implement virtualization for long lists (e.g., in the LeftPanel) using libraries like `react-window`.
- Consider pagination or infinite scrolling for very large sets of sketches or models.

### 3D Performance
- Use level of detail (LOD) techniques for complex 3D models.
- Implement frustum culling to avoid rendering off-screen objects.
- Optimize mesh geometries and materials for better rendering performance. 

## Error Handling and Debugging 

### Error Boundaries
- Implement React Error Boundaries to catch and handle errors gracefully.
- Use error boundaries particularly around the 3D viewport and complex UI components.

### Logging
- Implement a consistent logging strategy across the application.
- Consider using a logging library that supports different log levels for development and production.

### Debugging 3D Issues
- Use Babylon.js Inspector for debugging scene, camera, and mesh issues.
- Implement debug rendering modes (e.g., wireframe) for complex geometries. 

## Testing Strategy 

### Unit Tests
- Write unit tests for utility functions, particularly in `babylonUtils.js` and `meshUtils.js`.
- Use Jest for testing pure JavaScript functions.

### Component Tests
- Use React Testing Library for testing React components.
- Focus on testing component behavior rather than implementation details.

### Integration Tests
- Implement integration tests for key user flows (e.g., creating a sketch, modifying properties).
- Consider using Cypress for end-to-end testing of critical application paths.

### 3D Rendering Tests
- Implement visual regression tests for 3D rendered output.
- Consider using tools like Percy or Applitools for visual testing. 

## Collaboration and Code Quality 

### Code Review Process
- Establish a code review checklist that includes performance, accessibility, and testing considerations.
- Use static analysis tools (e.g., ESLint) to catch common issues before code review.

### Documentation
- Keep this developer documentation up-to-date with each significant change or feature addition.
- Use JSDoc comments for functions and components to provide inline documentation.

### Version Control
- Use descriptive commit messages that explain the why, not just the what.
- Consider using conventional commits for easier changelog generation. 

## Accessibility 

### Keyboard Navigation
- Ensure all interactive elements are keyboard accessible.
- Implement focus management, especially when opening/closing dialogs or panels.

### Screen Reader Support
- Use appropriate ARIA attributes to enhance screen reader navigation and comprehension.
- Test regularly with screen readers to ensure the application remains accessible as new features are added. 

## Internationalization 

### Text Externalization
- Use a translation library (e.g., react-i18next) for managing translated strings.
- Avoid hardcoding text strings in components.

### RTL Support
- Design UI components with right-to-left (RTL) languages in mind.
- Test the application in RTL mode to ensure proper layout and functionality. 

## 3D Rendering Techniques 

### Backface Culling

Backface culling is a technique used to improve rendering performance by not drawing the back faces of polygons. In HypeStudio, use backface culling judiciously:

- **When to use:**
  1. For solid, opaque objects where the interior is never visible.
  2. In performance-critical scenes with many complex objects.

- **When not to use:**
  1. For transparent or translucent objects.
  2. For objects that may be viewed from the inside (e.g., room interiors).
  3. For double-sided objects like thin planes or leaves.

- **Implementation:**
  ```javascript
  const material = new BABYLON.StandardMaterial("myMaterial", scene);
  material.backFaceCulling = true; // Enable backface culling
  ```

- **Considerations:**
  - Test thoroughly after enabling backface culling to ensure no visual artifacts are introduced.
  - For objects that need to be viewed from both sides, consider duplicating the mesh and inverting the normals of the duplicate, rather than disabling backface culling. 

## Undo and Redo Functionality 

The EnhancedZenObservable implements undo and redo functionality using a command pattern and state history.

### How it works

1. **State History:** The EnhancedZenObservable maintains a history of state changes.
2. **Undo:** Reverts the state to the previous entry in the history.
3. **Redo:** Applies the next state in the history, if available.

### Implementation Details

```javascript
model.undo = function() {
  if (this.currentIndex > 0) {
    this.currentIndex--;
    this.setState(() => this.history[this.currentIndex], false);
  }
};

model.redo = function() {
  if (this.currentIndex < this.history.length - 1) {
    this.currentIndex++;
    this.setState(() => this.history[this.currentIndex], false);
  }
};
```

### Best Practices

1. Use the `addToHistory` method when making state changes that should be undoable.
2. Batch related changes into a single history entry to ensure logical undo/redo operations.
3. Be cautious with changes that affect the 3D scene structure; ensure these can be properly undone and redone.

## UI Changes and Undo/Redo

Not all UI interactions should trigger undo/redo operations. Here's a guide on what should and shouldn't be included:

### Should be Undoable

1. Creating, modifying, or deleting sketches
2. Changing object properties (e.g., dimensions, color)
3. Applying operations like extrude, fillet, or chamfer
4. Transformations (move, rotate, scale) of objects

### Should Not be Undoable

1. Camera movements or zoom level changes
2. Toggling visibility of UI panels
3. Switching between different view modes (e.g., sketch view, list view)
4. Temporary UI states (e.g., hover effects, expanded/collapsed states of panels)

### Implementation Guidelines

1. For undoable actions:
   ```javascript
   model.addToHistory(() => {
     // Perform the action
     return () => {
       // Undo the action
     };
   });
   ```

2. For non-undoable UI changes, use local component state or a separate part of the global state that isn't tracked in the undo history.

3. When implementing new features, consider their undo/redo implications and discuss with the team if unsure.

### Handling Complex Undo/Redo Scenarios

1. **Dependent Changes:** When one change necessitates others, ensure all related changes are bundled into a single undo/redo operation.

2. **Resource Management:** For operations that create or delete resources (e.g., textures, meshes), ensure proper cleanup in both undo and redo operations to prevent memory leaks.

3. **Conflict Resolution:** Implement a strategy to handle conflicts that may arise when undoing/redoing operations that affect the same objects or properties.

## Testing Undo/Redo

1. Implement unit tests for individual undo/redo operations.
2. Create integration tests that perform sequences of actions followed by undo/redo operations.
3. Test edge cases, such as undoing to the initial state or redoing to the latest state.
4. Verify that the 3D scene state, property panel, and list view all correctly reflect the state after undo/redo operations. 

## Development Guidelines 

1. **State Management**: 
   - Use `model.getState(key)` for accessing state.
   - Use `model.setState(updater)` for updating state.
   - Leverage `useHypeStudioState` hook in components.

2. **Mesh Management**:
   - Always add new meshes to `meshesRef` in `BabylonViewport`.
   - Use consistent naming conventions for meshes and their corresponding state objects.

3. **Performance Optimization**:
   - Use React.memo for components that don't need frequent re-renders.
   - Leverage `useVersioning` hook for optimized rendering based on state changes.

4. **3D Interactions**:
   - Implement new interactions in `BabylonViewport` and `babylonUtils.js`.
   - Consider different control modes when adding new interaction features.

5. **UI Updates**:
   - Ensure UI components (LeftPanel, PropertyPanel) are updated when the 3D scene changes.
   - Use the `updateLeftPanelContent` method to keep the LeftPanel in sync with the scene. 

## Common Pitfalls 

1. **Incorrect State Access**: Always use `model.getState(key)` instead of directly accessing properties on the model.

2. **Mesh Selection Issues**: Ensure all selectable meshes are added to `meshesRef` and have unique, consistent IDs.

3. **Reactivity Problems**: If components aren't updating as expected, check that you're using the appropriate subscription method or the `