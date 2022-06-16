/* eslint-disable react/jsx-key */
/* eslint-disable react/prop-types */
import React, { useState, useEffect } from 'react';
import {
  AiOutlineFileAdd,
  AiOutlineFolder,
  AiOutlineFolderOpen,
} from 'react-icons/ai';

import {
  ActionsWrapper,
  Collapse,
  StyledName,
  VerticalLine,
} from '../Tree.style';
import { StyledFolder } from './TreeFolder.style';

import { FILE, FOLDER } from '../state/constants';
import { useTreeContext } from '../state/TreeContext';
import { PlaceholderInput } from '../TreePlaceholderInput';

const FolderName = ({ isOpen, name, handleClick }) => (
  <StyledName onClick={handleClick}>
    {isOpen ? <AiOutlineFolderOpen /> : <AiOutlineFolder />}
    &nbsp;&nbsp;{name}
  </StyledName>
);

const Folder = ({ id, name, children, node, data }) => {
  const { dispatch, isImparative, onNodeClick, onAdd } = useTreeContext();
  const [isEditing, setEditing] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const [childs, setChilds] = useState([]);

  useEffect(() => {
    setChilds([children]);
  }, [children]);

  const commitFileCreation = name => {
    data.push({
      type: 'file',
      name: name,
    });
    onAdd(name);
    //dispatch({ type: FILE.CREATE, payload: { id, name } });
  };

  const commitFolderEdit = name => {
    dispatch({ type: FOLDER.EDIT, payload: { id, name } });
    setEditing(false);
  };

  const handleCancel = () => {
    setEditing(false);
    setChilds([children]);
  };

  const handleNodeClick = React.useCallback(
    event => {
      event.stopPropagation();
      onNodeClick({ node });
    },
    [node, onNodeClick]
  );

  const handleFileCreation = event => {
    event.stopPropagation();
    setIsOpen(true);
    setChilds([
      ...childs,
      <PlaceholderInput
        type="file"
        onSubmit={commitFileCreation}
        onCancel={handleCancel}
      />,
    ]);
  };

  return (
    <StyledFolder id={id} onClick={handleNodeClick} className="tree__folder">
      <VerticalLine>
        <ActionsWrapper>
          {isEditing ? (
            <PlaceholderInput
              type="folder"
              style={{ paddingLeft: 0 }}
              defaultValue={name}
              onCancel={handleCancel}
              onSubmit={commitFolderEdit}
            />
          ) : (
            <FolderName
              name={name}
              isOpen={isOpen}
              handleClick={() => setIsOpen(!isOpen)}
            />
          )}

          {isImparative && (
            <div className="actions">
              <AiOutlineFileAdd onClick={handleFileCreation} />
            </div>
          )}
        </ActionsWrapper>
        <Collapse className="tree__folder--collapsible" isOpen={isOpen}>
          {childs}
        </Collapse>
      </VerticalLine>
    </StyledFolder>
  );
};

export { Folder, FolderName };
