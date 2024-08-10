import React, { useState } from 'react';
import { FaPlus } from 'react-icons/fa';
import { HierarchyItem } from './HierarchyItem';
import { useHypeStudioModel } from '../contexts/HypeStudioContext';

export const HierarchyView = ({
  items,
  groups,
  ungroupedItems,
  selectedId,
  onSelect,
  onDrop,
  onAddGroup,
  onAddSubgroup,
  onRenameGroup,
  onDeleteGroup,
}) => {

    const model = useHypeStudioModel();

  return (
    <div className="w-[18rem]">
      <button onClick={onAddGroup} className="inline-flex items-center text-sm text-blue-500 hover:text-blue-700 mb-2">
        <FaPlus /> <span className="pl-1">Add Group</span>
      </button>
      <ul>
        {groups.map((group) => (
          <HierarchyItem
            isGroup={true}
            key={group.id}
            item={group}
            onSelect={onSelect}
            selectedId={selectedId}
            onDrop={onDrop}
            onAddSubgroup={onAddSubgroup}
            onRenameGroup={onRenameGroup}
            onDeleteGroup={onDeleteGroup}
          />
        ))}
        <li>
          <strong>Ungrouped Items</strong>
          <ul
            className="pl-4"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              onDrop(null, null, model.getState('draggedItem'), null, { id: 'ungrouped' });
            }}
          >
            {ungroupedItems.length === 0 ? (
              <li className="py-2 text-gray-500 italic">Drop items here to ungroup</li>
            ) : (
              ungroupedItems.map((item) => (
                <HierarchyItem
                  isGroup={false}
                  key={item.id}
                  item={item}
                  onSelect={onSelect}
                  selectedId={selectedId}
                  onDrop={onDrop}
                  isUngrouped
                />
              ))
            )}
          </ul>
        </li>
      </ul>
    </div>
  );
};
