import React, { useState, useRef, useEffect } from 'react';
import { FaCaretDown, FaCaretRight, FaCircle, FaSquare, FaPlus, FaEdit, FaEllipsisH, FaTrash } from 'react-icons/fa';
import { useHypeStudioModel } from '../contexts/HypeStudioContext';

export const HierarchyItem = ({
  isGroup,
  item,
  onSelect,
  selectedId,
  onDrop,
  onAddSubgroup,
  onRenameGroup,
  onDeleteGroup,
  isUngrouped = false,
  path = [], // Pass down the current path
}) => {
  const model = useHypeStudioModel();
  const [expanded, setExpanded] = useState(false);
  const [dropTarget, setDropTarget] = useState({ above: null, below: null, within: null });
  const [isEditing, setIsEditing] = useState(false);
  const [groupName, setGroupName] = useState(item.name);
  const [showOptions, setShowOptions] = useState(false);

  const menuRef = useRef(null);
  const showOptionsTimeout = useRef(null);

  const hasChildren = item.items && item.items.length > 0;
  const hasSubgroups = item.subgroups && item.subgroups.length > 0;
  const isSelected = selectedId === item.id;

  const handleExpandCollapse = () => setExpanded(!expanded);
  const handleSelect = () => onSelect(item.id);

  const handleDragStart = (e) => {
    model.setDraggedItem({ id: item.id });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', item.id);
    e.stopPropagation();
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    const { clientY } = e;
    const itemElement = e.target.closest('li');
    const itemRect = itemElement?.getBoundingClientRect();

    resetDropTargetStyles();

    if (isGroup) {
        setDropTarget({ above: null, below: null, within: item });
        itemElement.style.border = '2px dashed #000';
    } // else if (itemRect) {
    //     const middleY = (itemRect.top + itemRect.bottom) / 2;

    //       if (clientY < middleY) {
    //         setDropTarget({ above: item, below: null, within: null });
    //         itemElement.style.boxShadow = '0px -4px 8px rgba(0, 0, 0, 0.2)';
    //       } else {
    //         setDropTarget({ above: null, below: item, within: null });
    //         itemElement.style.boxShadow = '0px 4px 8px rgba(0, 0, 0, 0.2)';
    //       }
    // }
    // if (itemRect) {
    //   const middleY = (itemRect.top + itemRect.bottom) / 2;

    //   if (clientY < middleY) {
    //     setDropTarget({ above: item, below: null, within: null });
    //     itemElement.style.boxShadow = '0px -4px 8px rgba(0, 0, 0, 0.2)';
    //   } else {
    //     setDropTarget({ above: null, below: item, within: null });
    //     itemElement.style.boxShadow = '0px 4px 8px rgba(0, 0, 0, 0.2)';
    //   }
    // } else if (hasChildren) {
    //  setDropTarget({ above: null, below: null, within: item });
    //  itemElement.style.border = '2px dashed #000';
    // }
  };

  const handleDragLeave = () => {
    resetDropTargetStyles();
    setDropTarget({ above: null, below: null, within: null });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (dropTarget.above || dropTarget.below || dropTarget.within) {
        const draggedItem = model.getState('draggedItem');
        if (draggedItem.id === dropTarget.within.id)
        {
            resetDropTargetStyles();
            return;
        }
        onDrop(dropTarget.above, dropTarget.below, draggedItem, item, dropTarget.within);
    }
    resetDropTargetStyles();
  };

  const resetDropTargetStyles = () => {
    document.querySelectorAll('li').forEach((li) => {
      li.style.boxShadow = 'none';
      li.style.border = 'none';
    });
    document.querySelectorAll('ul').forEach((ul) => {
      ul.style.border = 'none';
    });
  };

  const handleRename = () => {
    setIsEditing(true);
  };

  const handleDelete = () => {
    // Pass the full path to the delete handler
    const fullPath = [...path, item.id];
    onDeleteGroup(fullPath);
  };

  const handleRenameSubmit = (e) => {
    e.preventDefault();
    onRenameGroup(item.id, groupName);
    setIsEditing(false);
  };

  const handleMouseEnter = () => {
    clearTimeout(showOptionsTimeout.current);
    showOptionsTimeout.current = setTimeout(() => {
      setShowOptions(true);
    }, 200); // Delay of 200ms before showing the dropdown
  };

  const handleMouseLeave = () => {
    clearTimeout(showOptionsTimeout.current);
    setShowOptions(false);
  };

  const getShapeNameUi = () => {
    return <>
            {item.type === 'circle' || item.type === 'cylinder' ? <FaCircle className="mr-2" /> : <FaSquare className="mr-2" />}
            {model.getDefaultShapeName(item.id)}
    </>
  }

  return (
    <li
      draggable
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`py-2 cursor-pointer ${isSelected ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
    >
      <div className="flex items-center">
        {(hasChildren || hasSubgroups) && (
          <span onClick={handleExpandCollapse} className="mr-2 cursor-pointer">
            {expanded ? <FaCaretDown /> : <FaCaretRight />}
          </span>
        )}
        {!isUngrouped && (
          <div className="flex-grow flex items-center">
            {isEditing ? (
              <form onSubmit={handleRenameSubmit} className="flex flex-col items-start">
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
                {isGroup ? (<span className="mr-2">{groupName}</span>) : (getShapeNameUi())}
                <div
                  className="relative pb-[0.5rem] pt-[0.5rem]"
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                >
                  <FaEllipsisH className="ml-2 cursor-pointer text-gray-600 hover:text-gray-800" />
                  {showOptions && (
                    <div
                      ref={menuRef}
                      className="absolute right-[-4.5rem] mt-2 py-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10"
                    >
                      <button
                        onClick={handleRename}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                      >
                        <FaEdit className="mr-2" /> Rename
                      </button>
                      <button
                        onClick={handleDelete}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                      >
                        <FaTrash className="mr-2" /> Delete
                      </button>
                      <button
                        onClick={() => onAddSubgroup(item.id)}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                      >
                        <FaPlus className="mr-2" /> Add Subgroup
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
        {isUngrouped && (
          getShapeNameUi()
        )}
      </div>
      {expanded && hasChildren && (
        <ul className="pl-4">
          {item.items.map((child) => (
            <HierarchyItem
              isGroup={false}
              key={child.id}
              item={child}
              onSelect={onSelect}
              selectedId={selectedId}
              onDrop={onDrop}
              onAddSubgroup={onAddSubgroup}
              onRenameGroup={onRenameGroup}
              onDeleteGroup={onDeleteGroup}
              path={[...path, item.id]} // Pass the path down to children
            />
          ))}
        </ul>
      )}
      {expanded && hasSubgroups && (
        <ul className="pl-4">
          {item.subgroups.map((group) => (
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
              path={[...path, item.id]} // Pass the path down to subgroups
            />
          ))}
        </ul>
      )}
    </li>
  );
};
