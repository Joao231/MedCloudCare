/* eslint-disable react/prop-types */
import React, { useRef, useState } from 'react';
import { AiOutlineFile, AiOutlineDelete } from 'react-icons/ai';
import { StyledFile } from './TreeFile.style';
import { useTreeContext } from '../state/TreeContext';
import { ActionsWrapper, StyledName } from '../Tree.style.js';
import { PlaceholderInput } from '../TreePlaceholderInput';

import { FILE } from '../state/constants';
import FILE_ICONS from '../FileIcons';

const File = ({ name, id, node }) => {
  const { dispatch, isImparative, onNodeClick, onDelete } = useTreeContext();
  const [isEditing, setEditing] = useState(false);
  const ext = useRef('');

  let splitted = name.split('.');
  ext.current = splitted[splitted.length - 1];

  const commitEditing = name => {
    dispatch({ type: FILE.EDIT, payload: { id, name } });
    setEditing(false);
  };
  const commitDelete = () => {
    if (
      !['main.py', '__init__.py', 'requirements.txt', 'template'].includes(name)
    ) {
      dispatch({ type: FILE.DELETE, payload: { id } });
      onDelete(name);
    }
  };
  const handleNodeClick = React.useCallback(
    e => {
      e.stopPropagation();
      onNodeClick({ node });
    },
    [node, onNodeClick]
  );
  const handleCancel = () => {
    setEditing(false);
  };

  return (
    <StyledFile onClick={handleNodeClick} className="tree__file">
      {isEditing ? (
        <PlaceholderInput
          type="file"
          style={{ padding: '2px 2px' }}
          defaultValue={name}
          onSubmit={commitEditing}
          onCancel={handleCancel}
        />
      ) : (
        <ActionsWrapper>
          <StyledName>
            {FILE_ICONS[ext.current] ? (
              FILE_ICONS[ext.current]
            ) : (
              <AiOutlineFile />
            )}
            &nbsp;&nbsp;{name}
          </StyledName>
          {isImparative && (
            <div className="actions">
              <AiOutlineDelete onClick={commitDelete} />
            </div>
          )}
        </ActionsWrapper>
      )}
    </StyledFile>
  );
};

export { File };
