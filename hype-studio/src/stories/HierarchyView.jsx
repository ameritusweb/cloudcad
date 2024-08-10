import React, { useState } from 'react';
import { FaPlus } from 'react-icons/fa';
import { HierarchyItem } from './HierarchyItem';

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
}) => {
  const [draggedItem, setDraggedItem] = useState(null);

  return (
    <div>
      <button onClick={onAddGroup} className="inline-flex items-center text-sm text-blue-500 hover:text-blue-700 mb-2">
        <FaPlus /> <span className="pl-1">Add Group</span>
      </button>
      <ul>
        {groups.map((group) => (
          <HierarchyItem
            key={group.id}
            item={group}
            onSelect={onSelect}
            selectedId={selectedId}
            onDrop={onDrop}
            draggedItem={draggedItem}
            setDraggedItem={setDraggedItem}
            onAddSubgroup={onAddSubgroup}
            onRenameGroup={onRenameGroup}
          />
        ))}
        <li>
          <strong>Ungrouped Items</strong>
          <ul className="pl-4">
            {ungroupedItems.map((item) => (
              <HierarchyItem
                key={item.id}
                item={item}
                onSelect={onSelect}
                selectedId={selectedId}
                onDrop={onDrop}
                draggedItem={draggedItem}
                setDraggedItem={setDraggedItem}
                isUngrouped
              />
            ))}
          </ul>
        </li>
      </ul>
    </div>
  );
};
