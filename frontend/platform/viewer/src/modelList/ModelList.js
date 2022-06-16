/* eslint-disable react/prop-types */
import React from 'react';
import classNames from 'classnames';
import TableSearchFilter from './TableSearchFilter';
import { StudyListLoadingText } from '../../../ui/src/components/studyList/StudyListLoadingText.js';
import './ModelList.styl';

function ModelList(props) {
  const {
    isLoading,
    hasError,
    models,
    sort,
    onSort: handleSort,
    filterValues,
    onFilterChange: handleFilterChange,
    onSelectItem: handleSelectItem,
    studyListDateFilterNumDays,
    displaySize,
  } = props;

  const mediumTableMeta = [
    {
      displayText: 'ModelName',
      fieldName: 'name',
      inputType: 'text',
      size: 200,
    },
    {
      displayText: 'Version',
      fieldName: 'version',
      inputType: 'text',
      size: 100,
    },
    {
      displayText: 'Task',
      fieldName: 'task',
      inputType: 'text',
      size: 200,
    },
    {
      displayText: 'CreatedAt',
      fieldName: 'created_at',
      inputType: 'date-range',
      size: 200,
    },
  ];

  const totalSize = mediumTableMeta
    .map(field => field.size)
    .reduce((prev, next) => prev + next);

  return (
    <table className="modeltable table--striped table--hoverable">
      <colgroup>
        {mediumTableMeta.map((field, i) => {
          const size = field.size;
          const percentWidth = (size / totalSize) * 100.0;

          return <col key={i} style={{ width: `${percentWidth}%` }} />;
        })}
      </colgroup>
      <thead className="table-head">
        <tr className="filters">
          <TableSearchFilter
            meta={mediumTableMeta}
            values={filterValues}
            onSort={handleSort}
            onValueChange={handleFilterChange}
            sortFieldName={sort.fieldName}
            sortDirection={sort.direction}
            studyListDateFilterNumDays={studyListDateFilterNumDays}
          />
        </tr>
      </thead>
      <tbody className="table-body">
        {/* LOADING */}
        {isLoading && (
          <tr className="no-hover">
            <td colSpan={mediumTableMeta.length}>
              <StudyListLoadingText />
            </td>
          </tr>
        )}
        {!isLoading && hasError && (
          <tr className="no-hover">
            <td colSpan={mediumTableMeta.length}>
              <div className="notFound">
                {'There was an error fetching models'}
              </div>
            </td>
          </tr>
        )}
        {/* EMPTY */}
        {!isLoading && !models.length && (
          <tr className="no-hover">
            <td colSpan={mediumTableMeta.length}>
              <div className="notFound">{'No matching results'}</div>
            </td>
          </tr>
        )}
        {!isLoading &&
          models.map((model, index) => (
            <TableRow
              key={`${model.name}-${index}`}
              onClick={name => handleSelectItem(name)}
              name={model.name}
              version={model.version}
              port={model.port || ''}
              created_at={model.created_at}
              task={model.task}
              displaySize={displaySize}
            />
          ))}
      </tbody>
    </table>
  );
}

function TableRow(props) {
  const {
    name,
    version,
    created_at,
    task,
    isHighlighted,
    onClick: handleClick,
  } = props;

  const mediumRowTemplate = (
    <tr
      onClick={() => handleClick(name)}
      className={classNames({ active: isHighlighted })}
    >
      <td
        style={{
          textAlign: 'center',
        }}
      >
        {name}
      </td>
      <td>
        <div
          style={{
            textAlign: 'center',
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <div
            className="hide-xs"
            style={{
              whiteSpace: 'pre-wrap',
              flexGrow: 1,
            }}
          >
            {version}
          </div>
        </div>
      </td>
      <td>
        <div
          style={{
            textAlign: 'center',
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <div
            className="hide-xs"
            style={{
              whiteSpace: 'pre-wrap',
              flexGrow: 1,
            }}
          >
            {task}
          </div>
        </div>
      </td>
      {/* DATE */}
      <td style={{ textAlign: 'center' }}>{created_at}</td>
    </tr>
  );

  return mediumRowTemplate;
}

TableRow.defaultProps = {
  isHighlighted: false,
};

export { ModelList };
