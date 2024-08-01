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

HypeStudio uses a unique state management approach based on EnhancedZenObservable, which allows for fine-grained state updates and subscriptions without unnecessary prop drilling.

### EnhancedZenObservable

EnhancedZenObservable is a custom state management solution that provides reactive state updates with granular control.

Key Features:
- Nested state structure
- Fine-grained subscriptions
- Diff-based updates
- Built-in undo/redo functionality

### Function Overview

The following grid outlines the main functions available in EnhancedZenObservable and the HypeStudio context:

| Class/Context | Function | Description |
|---------------|----------|-------------|
| EnhancedZenObservable | constructor(initialState) | Initializes the observable with the given initial state |
| | setState(updater, recordHistory) | Updates the state and optionally records the change in history |
| | getState(key) | Retrieves the current state or a specific part of the state |
| | subscribe(key, callback, useDiff) | Subscribes to changes in a specific part of the state |
| | undo() | Reverts the state to the previous entry in history |
| | redo() | Applies the next state in the redo history |
| | computeDiff(oldObj, newObj) | Calculates the difference between two state objects |
| | applyDiff(diff, currentState, prefix) | Applies a calculated diff to the current state |
| | notifyObservers(key, value, diff) | Notifies observers of state changes |
| | toJSON() | Serializes the current state to JSON |
| | fromJSON(json) | Deserializes JSON data into the state |
| HypeStudio Context | createSketch(sketchData) | Creates a new sketch and adds it to the state |
| | getSketchById(id) | Retrieves a specific sketch by its ID |
| | updateSketch(id, updates) | Updates an existing sketch |
| | setProjectName(name) | Sets the project name |
| | addElement(type, element) | Adds a new element to the state |
| | updateElement(type, id, updates) | Updates an existing element |
| | deleteElement(type, id) | Deletes an element from the state |
| | selectElement(elementId) | Sets the currently selected element |
| | setCustomProperty(elementId, propertyName, value) | Sets a custom property for an element |
| | getCustomProperty(elementId, propertyName) | Retrieves a custom property of an element |
| | validateCustomProperty(propertyName, value) | Validates a custom property |
| | addToHistory(action) | Adds an action to the undo/redo history |
| | undo() | Undoes the last action |
| | redo() | Redoes the last undone action |
| | notifyUpdate() | Notifies the system of updates (implemented in provider) |
| | toJSON() | Serializes the current project state to JSON |
| | fromJSON(json) | Deserializes JSON data into the project state |

This grid provides a quick reference for the main functions available in the state management system. Developers should familiarize themselves with these functions to effectively work with the HypeStudio state.

### Updating State

To update the state, use the `setState` method on the model:

```javascript
model.setState(state => ({
  ...state,
  someProperty: newValue
}));
```

For nested updates:

```javascript
model.setState(state => ({
  ...state,
  nested: {
    ...state.nested,
    property: newValue
  }
}));
```

### Retrieving State

To access the state, use the `getState` method:

```javascript
const value = model.getState('someProperty');
```

For nested properties:

```javascript
const nestedValue = model.getState('nested.property');
```

### Subscribing to State Changes

Components can subscribe to specific parts of the state using the `subscribe` method on the model:

```javascript
const subscription = modelRef.current.subscribe('someProperty', (newValue) => {
  // Handle the new value
});
```

For example, to subscribe to changes in control mode:

```javascript
const controlModeSubscription = modelRef.current.subscribe('controlMode', (newControlMode) => 
  updateCameraControls(camera, newControlMode, canvas)
);
```

For nested properties:

```javascript
const planeStatesSubscription = modelRef.current.subscribe('planeStates', (newPlaneStates) => 
  updatePlaneVisibility(planesRef.current, newPlaneStates, (plane) => updateCameraForPlane(camera, plane))
);
```

Remember to unsubscribe when the component unmounts:

```javascript
useEffect(() => {
  // Set up subscriptions

  return () => {
    controlModeSubscription.unsubscribe();
    planeStatesSubscription.unsubscribe();
    // Unsubscribe from other subscriptions
  };
}, []);
```

### Using useHypeStudioState Hook

While direct subscriptions are powerful, for React components, we provide a `useHypeStudioState` hook that handles subscriptions and unsubscriptions automatically:

```javascript
const controlMode = useHypeStudioState('controlMode', 'default');
```

This hook is a wrapper around the subscription mechanism and is the preferred method for accessing state in functional components.

### Best Practices for State Subscriptions

1. Use `useHypeStudioState` for React components whenever possible.
2. For non-React code or complex scenarios, use direct subscriptions with `modelRef.current.subscribe`.
3. Always unsubscribe from direct subscriptions when they are no longer needed to prevent memory leaks.
4. Keep subscriptions as granular as possible to minimize unnecessary re-renders.
5. Use the `useVersioning` hook in conjunction with subscriptions to optimize re-renders in complex components.


### Triggering Re-renders with useVersioning

The `useVersioning` hook is used to optimize re-renders based on changes to specific parts of the state:

```javascript
const version = useVersioning(['property1', 'property2']);
```

This hook returns a version number that changes only when the specified properties change, allowing for more controlled re-rendering of components.

### Avoiding Prop Drilling

This state management approach allows components to access and react to state changes without the need for extensive prop drilling. Instead of passing state and update functions through multiple levels of components, each component can directly subscribe to the parts of the state it needs.

Benefits:
1. Reduced complexity in component props
2. Easier refactoring and component reusability
3. More predictable and manageable state updates
4. Improved performance by limiting unnecessary re-renders

### Best Practices

1. Use `useHypeStudioState` for components that need to react to specific state changes.
2. Leverage `useVersioning` to optimize re-renders in complex components.
3. Keep state updates atomic and focused on specific parts of the state.
4. Use the `addToHistory` method when making state changes that should be undoable.
5. Be mindful of the state structure and use nested paths when updating or retrieving nested state.

### Considerations

1. Ensure that subscriptions are set up correctly to avoid missed updates.
2. Be cautious with deeply nested state updates, as they can become complex.
3. When adding new major features, consider how they fit into the existing state structure and update patterns.
4. Regularly review and optimize subscriptions to ensure efficient rendering.

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

### UI Changes and Undo/Redo

Not all UI interactions should trigger undo/redo operations. Here's a guide on what should and shouldn't be included:

#### Should be Undoable

1. Creating, modifying, or deleting sketches
2. Changing object properties (e.g., dimensions, color)
3. Applying operations like extrude, fillet, or chamfer
4. Transformations (move, rotate, scale) of objects

#### Should Not be Undoable

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

4. **State Consistency:** Ensure that the application state remains consistent after undo/redo operations, including derived or calculated properties.

5. **Performance Considerations:** For large or complex changes, consider implementing a lazy undo/redo system that only applies changes when necessary, rather than immediately reverting the entire state.

### Testing Undo/Redo

1. Implement unit tests for individual undo/redo operations.
2. Create integration tests that perform sequences of actions followed by undo/redo operations.
3. Test edge cases, such as undoing to the initial state or redoing to the latest state.
4. Verify that the 3D scene state, property panel, and list view all correctly reflect the state after undo/redo operations.
5. Stress test the undo/redo system with a large number of operations to ensure performance and memory usage remain acceptable.

## Development Guidelines

1. **State Management**: 
   - Always use `model.getState(key)` for accessing state.
   - Use `model.setState(updater)` for updating state.
   - Leverage `useHypeStudioState` hook in components for subscribing to state changes.

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

6. **State Subscriptions**:
   - Use `useHypeStudioState` hook in React components for simple state access and subscription.
   - For complex scenarios or non-React code, use `modelRef.current.subscribe` and ensure proper unsubscription.
   - Keep subscriptions granular to minimize unnecessary updates.

7. **Code Style and Structure**:
   - Follow the established project structure when adding new components or utilities.
   - Use meaningful names for variables, functions, and components.
   - Write clear, concise comments for complex logic.

8. **Error Handling**:
   - Implement try-catch blocks in critical sections, especially those involving 3D operations or state updates.
   - Use error boundaries for handling runtime errors in React components.

9. **Testing**:
   - Write unit tests for utility functions and hooks.
   - Create integration tests for key user flows.
   - Regularly run and update tests as the application evolves.

## Common Pitfalls

1. **Incorrect State Access**: Always use `model.getState(key)` instead of directly accessing properties on the model.

2. **Mesh Selection Issues**: Ensure all selectable meshes are added to `meshesRef` and have unique, consistent IDs.

3. **Reactivity Problems**: If components aren't updating as expected, check that you're using the appropriate subscription method or the `useHypeStudioState` hook.

4. **Performance Issues**: 
   - Profile your application regularly, especially after adding new features. 
   - Look for unnecessary re-renders or expensive computations.
   - Be cautious with complex 3D operations that might block the main thread.

5. **Inconsistent Plane States**: Ensure that plane states (visible, aligned, hidden) are consistently managed across the application.

6. **Memory Leaks**: 
   - Properly dispose of Babylon.js resources (meshes, materials, textures) when they're no longer needed.
   - Clean up event listeners and subscriptions in useEffect cleanup functions.

7. **Undo/Redo Inconsistencies**: Ensure all undoable actions properly restore the entire relevant state, including derived states and 3D scene elements.

8. **Prop Drilling**: Avoid passing props through multiple levels of components. Instead, use the state management system or context where appropriate.

9. **Overuse of Global State**: Not everything needs to be in global state. Use local component state for UI-specific, non-persistent data.

10. **Inconsistent Error Handling**: Establish and follow consistent patterns for error handling across the application.

11. **Forgotten Unsubscriptions**: Always unsubscribe from direct subscriptions in useEffect cleanup functions to prevent memory leaks and unexpected behavior.

## Future Development Considerations

1. **Undo/Redo Enhancements**: 
   - Implement a more robust undo/redo system that can handle complex, interconnected state changes.
   - Consider adding a visual history of actions that users can navigate through.

2. **Collaborative Features**: 
   - Plan for real-time collaboration features, which may require significant changes to the state management system.
   - Consider implementing Operational Transformation or Conflict-free Replicated Data Types (CRDTs) for handling concurrent edits.

3. **Advanced 3D Features**:
   - Implement more complex CAD operations like boolean operations, advanced fillets, and swept surfaces.
   - Consider adding support for assemblies and constraints between parts.

4. **Performance Optimizations**:
   - Implement worker threads for heavy computations to keep the UI responsive.
   - Explore WebAssembly for performance-critical algorithms.

5. **Enhanced UI/UX**:
   - Implement a customizable user interface where users can arrange panels and toolbars.
   - Add support for themes and high-contrast mode for better accessibility.

6. **File Format Support**:
   - Expand import/export capabilities to support more CAD file formats.
   - Implement a plugin system for easy addition of new file format support.

7. **Cloud Integration**:
   - Develop cloud storage and sharing features for projects.
   - Implement version control for CAD models.

8. **Mobile Support**:
   - Optimize the application for tablet use.
   - Consider developing companion mobile apps for viewing or basic editing.

9. **AI/ML Integration**:
   - Explore possibilities for AI-assisted design suggestions.
   - Implement machine learning models for optimizing 3D models based on specified constraints.

10. **VR/AR Support**:
    - Add virtual reality support for immersive 3D modeling.
    - Implement augmented reality features for visualizing designs in real-world contexts.

11. **Extensibility**:
    - Develop a plugin system allowing users or third-party developers to extend the application's functionality.
    - Create an API for programmatic control of the CAD system.

12. **Simulation and Analysis**:
    - Integrate finite element analysis (FEA) capabilities.
    - Add support for kinematic simulations of mechanical assemblies.

Remember to regularly revisit and update these future development considerations as the project evolves and new technologies emerge. Prioritize these considerations based on user feedback, market demands, and overall project goals.

## Conclusion

This documentation provides a comprehensive overview of the HypeStudio application architecture, development practices, and key considerations. As the application evolves, it's crucial to keep this documentation up-to-date and expand on areas that become more complex or require additional explanation.

Remember that good documentation is an ongoing process. Encourage all team members to contribute to and improve this documentation as they work on the project. Regular reviews and updates will ensure that it remains a valuable resource for both new and experienced developers working on HypeStudio.