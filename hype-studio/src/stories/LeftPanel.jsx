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

  const version = useVersioning(['activeView', 'selectedSketchType', 'selectedElementId', 'leftPanelContent', 'groups']);

  const groups = useHypeStudioState('groups', []);
  const ungroupedItems = model.getUngroupedItems();

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

  const handleDrop = useCallback(
    (above, below, draggedItem, targetGroup, within) => {
      model.setState((state) => {
        let updatedGroups = [...state.groups];
  
        // Remove the dragged item from its current position
        const removeItem = (item) => {
          updatedGroups = updatedGroups.map(group => ({
            ...group,
            items: group.items.filter(i => i.id !== item.id),
            subgroups: group.subgroups.map(subgroup => ({
              ...subgroup,
              items: subgroup.items.filter(i => i.id !== item.id)
            }))
          }));
        };
  
        removeItem(draggedItem);
  
        // Add the dragged item to the new location
        if (within) {
          const targetGroupOrSubgroup = findGroupById(updatedGroups, within.id);
          if (targetGroupOrSubgroup) {
            targetGroupOrSubgroup.items.push(draggedItem);
          }
        } else if (above || below) {
          const parent = findParent(updatedGroups, above || below);
          const targetItems = parent ? parent.items : ungroupedItems;
          const index = targetItems.findIndex(i => i.id === (above ? above.id : below.id));
          const insertAt = above ? index : index + 1;
          targetItems.splice(insertAt, 0, draggedItem);
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
        />
      )}
  </div>
  );
});