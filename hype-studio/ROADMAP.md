# HypeStudio Roadmap

Tracks feature completion across the four dev phases defined in README.md.

**Legend:** ✅ Done · 🔶 Partial · ❌ Not started

---

## Phase 1 — Core Functionality

| Feature | Status | Notes |
|---------|--------|-------|
| **List View** | | |
| Hierarchical display of all objects | ✅ | `HierarchyView.jsx`, `HierarchyItem.jsx` with groups/subgroups |
| Select, rename, hide/show, delete objects | ✅ | Context menu with rename/delete/add subgroup |
| Search/filter functionality | ❌ | |
| Visual indicators for object type | ✅ | |
| **Sketch View** | | |
| Tools for basic shapes | ✅ | Circle and rectangle in LeftPanel, preview in BabylonViewport |
| Dimensioning tools | 🔶 | Smart Dimension mode: click sketch → Babylon GUI InputText → type value drives geometry |
| Constraint tools | 🔶 | Auto-inferred horizontal/vertical/coincident; color coding blue→dark |
| Snapping functionality | ✅ | Grid snap (configurable pitch) + endpoint snap + yellow inference alignment lines |
| **Extrude View** | | |
| Extrude sketches with depth and direction | ✅ | ExtrudeView.jsx with depth slider, direction, circle tessellation |
| Extrude selected faces of existing 3D objects | ❌ | |
| Boolean operations | ❌ | |
| Preview of extrusion | ❌ | |
| **Import/Export View** | | |
| Support for common 3D file formats | 🔶 | JSON only; no STEP, IGES, STL, OBJ support |
| Import settings | ❌ | |
| Export settings | ❌ | |
| Batch export functionality | ❌ | |

---

## Phase 2 — Enhanced Functionality

| Feature | Status | Notes |
|---------|--------|-------|
| **List View** | | |
| Context menu for quick actions | ✅ | Rename, delete, add subgroup |
| Bulk operations on multiple selected objects | ❌ | |
| Customizable columns for object properties | ❌ | |
| **Sketch View** | | |
| Sketch validation | ❌ | |
| Automatic constraint inference | ❌ | |
| Import and trace reference images | ❌ | |
| Layer management | ❌ | |
| **Text to Sketch Tool** | | |
| Convert text to editable sketch geometry | 🔶 | `textUtils.js` full pipeline (opentype.js → SVG → Babylon Path2); no UI |
| Support for various font styles and families | 🔶 | Utility supports font loading; no UI |
| Convert text to outlines for further editing | 🔶 | Utility done; no UI |
| Adjust text parameters (size, spacing, line height) | 🔶 | Utility done; no UI |
| **Extrude View** | | |
| Thin-wall extrusion option | ❌ | |
| Path-based extrusion along a 3D curve | ❌ | |
| Real-time update of preview as parameters change | ❌ | |

---

## Phase 3 — Advanced Tools

| Feature | Status | Notes |
|---------|--------|-------|
| **Bend Tool** | | |
| Specify bend angle, radius, and axis | 🔶 | `bendUtils.js` complete; no UI view in LeftPanel |
| Ability to bend selected portions | 🔶 | Utility done; no UI |
| Option for smooth or sharp bends | 🔶 | Utility done; no UI |
| **Twist Tool** | | |
| Control for twist angle and axis | 🔶 | `twistUtils.js` complete with exponent control; no UI view |
| Option to vary twist along length | 🔶 | Utility done; no UI |
| Ability to preserve volume | 🔶 | Utility done; no UI |
| **Slice Tool** | | |
| Planar and non-planar slicing options | 🔶 | `sliceUtils.js` complete with curved plane support; no UI view |
| Multiple slicing planes in single operation | ❌ | |
| Control over slice thickness | 🔶 | Utility done; no UI |
| **Sweep Tool** | | |
| Define 2D profile and 3D path | 🔶 | `sweepUtils.js` complete with rotation/axis/UV; no UI view |
| Options for twist and scale along path | 🔶 | Utility done; no UI |
| Use edges as sweep paths | ❌ | |
| **Ray Tool** | | |
| Create 3D sketches by projecting 2D sketches onto 3D meshes | 🔶 | `projectionUtils.js` complete with ray casting and dimension GUI; no UI view |
| Customizable ray direction for projection | 🔶 | Utility done; no UI |
| Ability to select source sketch and target 3D mesh | 🔶 | Utility done; no UI |
| **Custom Planes View** | | |
| Creation of planes by various methods | ✅ | `CustomPlanesView.jsx` with normal vector input |
| Ability to name and manage planes | ✅ | Letter naming (A–W), delete |
| Visualization of plane boundaries/normal | ✅ | |

---

## Phase 4 — Optimization and Final Touches

| Feature | Status | Notes |
|---------|--------|-------|
| **Settings View** | | |
| Unit system selection | ✅ | `SettingsView.jsx` |
| Autosave and backup settings | ✅ | 30s interval, localStorage |
| Grid and snap settings | ❌ | |
| Performance settings | ❌ | |
| **Pattern View** | | |
| Linear, circular, sketch-driven patterns | ❌ | Toolbar button only |
| Control over instances and spacing | ❌ | |
| Edit source and update all instances | ❌ | |
| **Structural Analysis View** | | |
| Material property settings | ✅ | `StructuralAnalysisPanel.jsx`, `MaterialLibrary.tsx` |
| Load and constraint application tools | ✅ | Load/constraint presets |
| Visualization of results | ✅ | Stress, displacement, FoS, thermal, frequencies |
| Mesh generation and refinement options | ✅ | Tessellation via `tesselationUtils.js` |
| Multiple analysis types | ✅ | Static, fatigue, thermal, dynamic |
| **Shatter Tool** | | |
| Control over fracture patterns and size | ❌ | Toolbar button only |
| Physics-based and artistic modes | ❌ | |
| Option to maintain connections | ❌ | |

---

## Untethered Features (spec'd but not phase-assigned)

| Feature | Status | Notes |
|---------|--------|-------|
| **Crush Tool** | 🔶 | `crushUtils.js` with force/material/elasticity params; no UI view |
| **Point Tool** | 🔶 | `pointExtrusionUtils.js` with vertex manipulation; no UI view |
| **Mirroring View** | ❌ | Toolbar button only; no utility or UI |
| **Formula View** | ❌ | Toolbar button only; no evaluator or UI |

---

## Overall Progress

| Phase | Done | Partial | Not Started |
|-------|------|---------|-------------|
| Phase 1 | 5 | 1 | 10 |
| Phase 2 | 2 | 4 | 9 |
| Phase 3 | 3 | 12 | 2 |
| Phase 4 | 6 | 0 | 6 |
