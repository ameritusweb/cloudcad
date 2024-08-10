import React, { useCallback, memo, useState, useMemo } from 'react';
import { FaSquare, FaCircle, FaCube, FaGripLines, FaVectorSquare, FaPlus } from 'react-icons/fa';
import { useHypeStudioModel, useHypeStudioEngines } from '../contexts/HypeStudioContext';
import { useHypeStudioState } from '../hooks/useHypeStudioState';
import { useVersioning } from '../hooks/useVersioning';
import { SettingsView } from './SettingsView';
import { ShapeCreator } from './ShapeCreator';
import { CustomPlanesView } from './CustomPlanesView';
import { HierarchyView } from './HierarchyView';

export const LeftPanel = memo(() => {

  const model = useHypeStudioModel();
  const { getTempEngine, getTempScene } = useHypeStudioEngines();
  const activeView = useHypeStudioState('activeView', 'List View');
  const selectedSketchType = useHypeStudioState('selectedSketchType', null);
  const selectedElementId = useHypeStudioState('selectedElementId', null);
  const selectedElement = useHypeStudioState('selectedElement', null);
  const elements = useHypeStudioState('elements', {});
  const content = useHypeStudioState('leftPanelContent', []);

  const version = useVersioning(['activeView', 'selectedSketchType', 'selectedElementId', 'leftPanelContent', 'groups', 'elements']);

  const groups = useHypeStudioState('groups', []);
  const ungroupedItems = model.getUngroupedItems();

  // Helper to find a group or subgroup by ID
const findGroupById = (groups, id) => {
  for (let group of groups) {
    if (group.id === id) return group;
    for (let subgroup of group.subgroups) {
      const found = findGroupById([subgroup], id);
      if (found) return found;
    }
  }
  return null;
};

// Helper to find the parent group of a given item
const findParentGroupOrSubgroup = (groups, item) => {
  for (let group of groups) {
    if (group.items.some(i => i.id === item.id)) return group;
    for (let subgroup of group.subgroups) {
      if (subgroup.items.some(i => i.id === item.id)) return subgroup;
    }
  }
  return null;
};

const handleDrop = useCallback(
  (above, below, draggedItem, targetGroup, within) => {
    const ungrouped = model.getUngroupedItems();
    model.setState((state) => {
      let updatedGroups = [...state.groups];

      // Function to remove an item from its current location
      const removeItem = (itemId) => {
        let removedItem = null;
      
        // Helper function to find and remove an item from a list
        const removeFromList = (list) => {
          const index = list.findIndex(item => item.id === itemId);
          if (index !== -1) {
            removedItem = list[index];
            return list.slice(0, index).concat(list.slice(index + 1));
          }
          return list;
        };
      
        // Remove from groups and subgroups
        updatedGroups = updatedGroups.map(group => ({
          ...group,
          items: removeFromList(group.items),
          subgroups: group.subgroups.map(subgroup => ({
            ...subgroup,
            items: removeFromList(subgroup.items)
          }))
        }));
      
        return removedItem;
      };      

      // First, remove the dragged item from its original location
      const removedItem = removeItem(draggedItem.id) || ungrouped.find(item => item.id === draggedItem.id);

      // Next, add the dragged item to the new location
      if (within) {
        // Add within a target group or subgroup
        const targetGroupOrSubgroup = findGroupById(updatedGroups, within.id);
        if (targetGroupOrSubgroup) {
          targetGroupOrSubgroup.items.push(removedItem);
        }
      } else if (above || below) {
        // Reorder within a group/subgroup
        const parent = findParentGroupOrSubgroup(updatedGroups, above || below);
        const targetItems = parent ? parent.items : null;

        if (targetItems) {
          const index = targetItems.findIndex(i => i.id === (above ? above.id : below.id));
          const insertAt = above ? index : index + 1;
          targetItems.splice(insertAt, 0, removedItem);
        }
      } else {
        // If there's no specific target, the item is implicitly ungrouped
        // Do nothing here since ungroupedItems are calculated dynamically
      }

      return {
        ...state,
        groups: updatedGroups
      };
    });
  },
  [model]
);

  const handleSelect = useCallback(
    (id) => {
      model.selectElement(id);
    },
    [model]
  );

  const handleAddGroup = useCallback(() => {
    model.setState((state) => {
      const newGroupId = `group_${Date.now()}`;
      return {
        ...state,
        groups: [
          ...state.groups,
          {
            id: newGroupId,
            name: `New Group`,
            items: [],
            subgroups: [],
          },
        ],
      };
    });
  }, [model]);

  const handleAddSubgroup = useCallback((parentGroupId) => {
    model.setState((state) => {
      const newSubgroupId = `subgroup_${Date.now()}`;
      const updatedGroups = state.groups.map((group) => {
        if (group.id === parentGroupId) {
          return {
            ...group,
            subgroups: [
              ...group.subgroups,
              {
                id: newSubgroupId,
                name: `New Subgroup`,
                items: [],
                subgroups: [],
              },
            ],
          };
        }
        return group;
      });
      return {
        ...state,
        groups: updatedGroups,
      };
    });
  }, [model]);

  const handleRenameGroup = useCallback((groupId, newName) => {
    model.setState((state) => {
      const updatedGroups = state.groups.map((group) => {
        if (group.id === groupId) {
          return { ...group, name: newName };
        }
        return group;
      });
      return {
        ...state,
        groups: updatedGroups,
      };
    });
  }, [model]);

  const handleDeleteGroup = useCallback((path) => {
    model.setState((state) => {
      const updatedGroups = [...state.groups];
      let currentLevel = updatedGroups;
  
      // Traverse the path to find the parent array of the item to be deleted
      for (let i = 0; i < path.length - 1; i++) {
        const id = path[i];
        const foundGroup = currentLevel.find((group) => group.id === id);
        if (foundGroup) {
          currentLevel = foundGroup.subgroups;
        } else {
          return state; // If the group isn't found, return the current state
        }
      }
  
      // Find the index of the item to be deleted
      const idToDelete = path[path.length - 1];
      const indexToDelete = currentLevel.findIndex((group) => group.id === idToDelete);
  
      if (indexToDelete !== -1) {
        currentLevel.splice(indexToDelete, 1); // Remove the item at the found index
      }
  
      return {
        ...state,
        groups: updatedGroups,
      };
    });
  }, [model]);  

  const handleSketchTypeSelect = useCallback((type) => {
    model.setState(state => ({ ...state, selectedSketchType: type }));
  }, [model]);

  const handleListItemSelect = useCallback((id) => {
    model.selectElement(id);
  }, [model]);

  const handleCreateShape = useCallback((shapeData) => {
    model.createTessellatedShape(getTempScene(), shapeData);
  }, [model]);

  const renderSelectionInfo = () => {
    if (!selectedElement) return null;

    return (
      <div className="mt-4">
        <h3 className="font-bold mb-2">Selection Info</h3>
        <p>Type: {selectedElement.type}</p>
        {selectedElement.type === 'edge' && <FaGripLines className="mt-2" size={24} />}
        {selectedElement.type === 'face' && <FaVectorSquare className="mt-2" size={24} />}
        {selectedElement.type === 'mesh' && (
          <p>Shape: {elements.shapes[selectedElement.meshId]?.type}</p>
        )}
      </div>
    );
  };

  return (<div id={`left-panel-${version}`} className="w-48 bg-white p-2 overflow-y-auto">
    <h2 className="font-bold mb-2">{activeView}</h2>
    {activeView === 'Custom Planes View' && <CustomPlanesView />}
    {activeView === 'Settings View' && <SettingsView />}
    {activeView === 'Shape Tool View' && (
        <>
        <ShapeCreator onCreateShape={handleCreateShape} />
        {renderSelectionInfo()}
      </>
      )}
    {activeView === 'Sketch View' && (
      <ul>
        <li 
          onClick={() => handleSketchTypeSelect('circle')} 
          className={`py-2 px-1 cursor-pointer hover:bg-gray-100 flex items-center ${selectedSketchType === 'circle' ? 'bg-blue-100' : ''}`}
        >
          <FaCircle className="mr-2" />
          Circle
        </li>
        <li 
          onClick={() => handleSketchTypeSelect('rectangle')} 
          className={`py-2 px-1 cursor-pointer hover:bg-gray-100 flex items-center ${selectedSketchType === 'rectangle' ? 'bg-blue-100' : ''}`}
        >
          <FaSquare className="mr-2" />
          Rectangle
        </li>
      </ul>
    )}
    {activeView === 'List View' && (
        <HierarchyView
          items={elements}
          groups={groups}
          ungroupedItems={ungroupedItems}
          selectedId={selectedElementId}
          onSelect={handleSelect}
          onDrop={handleDrop}
          onAddGroup={handleAddGroup}
          onAddSubgroup={handleAddSubgroup}
          onRenameGroup={handleRenameGroup}
          onDeleteGroup={handleDeleteGroup}
        />
      )}
  </div>
  );
});