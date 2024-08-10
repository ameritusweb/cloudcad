import React, { useState } from 'react';
import { FaCaretDown, FaCaretRight, FaCircle, FaSquare, FaPlus, FaEdit } from 'react-icons/fa';
import { useHypeStudioModel } from '../contexts/HypeStudioContext';

export const HierarchyItem = ({
  item,
  onSelect,
  selectedId,
  onDrop,
  draggedItem,
  setDraggedItem,
  onAddSubgroup,
  onRenameGroup,
  isUngrouped = false,
}) => {
  const model = useHypeStudioModel();
  const [expanded, setExpanded] = useState(false);
  const [dropTarget, setDropTarget] = useState({ above: null, below: null, within: null });
  const [isEditing, setIsEditing] = useState(false);
  const [groupName, setGroupName] = useState(item.name);

  const hasChildren = item.items && item.items.length > 0;
  const isSelected = selectedId === item.id;

  const handleExpandCollapse = () => setExpanded(!expanded);
  const handleSelect = () => onSelect(item.id);

  const handleDragStart = (e) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', item.id);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    const { clientY } = e;
    const itemElement = e.target.closest('li');
    const itemRect = itemElement?.getBoundingClientRect();

    resetDropTargetStyles();

    if (itemRect) {
      const middleY = (itemRect.top + itemRect.bottom) / 2;

      if (clientY < middleY) {
        setDropTarget({ above: item, below: null, within: null });
        itemElement.style.boxShadow = '0px -4px 8px rgba(0, 0, 0, 0.2)';
      } else {
        setDropTarget({ above: null, below: item, within: null });
        itemElement.style.boxShadow = '0px 4px 8px rgba(0, 0, 0, 0.2)';
      }
    } else if (hasChildren) {
      setDropTarget({ above: null, below: null, within: item });
      itemElement.style.border = '2px dashed #000';
    }
  };

  const handleDragLeave = () => {
    resetDropTargetStyles();
    setDropTarget({ above: null, below: null, within: null });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    onDrop(dropTarget.above, dropTarget.below, draggedItem, item, dropTarget.within);
    resetDropTargetStyles();
  };

  const resetDropTargetStyles = () => {
    document.querySelectorAll('li').forEach((li) => {
      li.style.boxShadow = 'none';
    });
    document.querySelectorAll('ul').forEach((ul) => {
      ul.style.border = 'none';
    });
  };

  const handleRename = () => {
    setIsEditing(true);
  };

  const handleRenameSubmit = (e) => {
    e.preventDefault();
    onRenameGroup(item.id, groupName);
    setIsEditing(false);
  };

  return (
    <li
      draggable={!isUngrouped}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`py-2 cursor-pointer ${isSelected ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
    >
      <div className="inline-flex items-center">
        {hasChildren && (
          <span onClick={handleExpandCollapse} className="mr-2 cursor-pointer">
            {expanded ? <FaCaretDown /> : <FaCaretRight />}
          </span>
        )}
        {!isUngrouped && (
          <>
            {isEditing ? (
              <form onSubmit={handleRenameSubmit}>
                <input
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                />
                <button type="submit" className="ml-2 text-sm text-blue-500 hover:text-blue-700">
                  Save
                </button>
              </form>
            ) : (
              <>
                <span className="mr-2">{item.name}</span>
                <FaEdit onClick={handleRename} className="ml-auto cursor-pointer text-gray-600 hover:text-gray-800" />
              </>
            )}
          </>
        )}
        {isUngrouped && (
          <>
            {item.type === 'circle' || item.type === 'cylinder' ? <FaCircle className="mr-2" /> : <FaSquare className="mr-2" />}
            {model.getDefaultShapeName(item.id)}
          </>
        )}
        {!isUngrouped && (
          <button onClick={() => onAddSubgroup(item.id)} className="ml-2 text-sm text-blue-500 hover:text-blue-700">
            <FaPlus /> Add Subgroup
          </button>
        )}
      </div>
      {expanded && hasChildren && (
        <ul className="pl-4">
          {item.items.map((child) => (
            <HierarchyItem
              key={child.id}
              item={child}
              onSelect={onSelect}
              selectedId={selectedId}
              onDrop={onDrop}
              draggedItem={draggedItem}
              setDraggedItem={setDraggedItem}
              onAddSubgroup={onAddSubgroup}
              onRenameGroup={onRenameGroup}
            />
          ))}
        </ul>
      )}
    </li>
  );
};
