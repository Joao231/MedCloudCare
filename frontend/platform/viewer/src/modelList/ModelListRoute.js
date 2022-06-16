/* eslint-disable react/no-unescaped-entities */
import React, { useState, useEffect, useContext } from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';
import { ModelList } from './ModelList';
import { TablePagination } from './TablePagination';
import { useDebounce, useMedia, withModal } from '@ohif/ui';
import moment from 'moment';
import AppContext from '../context/AppContext';
import axiosInstance from 'axios';
import ModelContent from './ModelContent';
import ModelContentNoEdit from './ModelContentNoEdit';

function ModelListRoute(props) {
  const {
    title,
    group,
    history,
    user,
    modal: { show, hide },
  } = props;
  const [sort, setSort] = useState({
    fieldName: 'name',
    direction: 'desc',
  });
  const [filterValues, setFilterValues] = useState({
    modelDateTo: null,
    modelDateFrom: null,
    name: '',
    version: '',
    task: '',
    group: group,
  });
  const [models, setModels] = useState([]);

  const [searchStatus, setSearchStatus] = useState({
    isSearchingForModels: false,
    error: null,
  });
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [pageNumber, setPageNumber] = useState(0);
  const appContext = useContext(AppContext);
  const displaySize = useMedia(
    [
      '(min-width: 1750px)',
      '(min-width: 1000px) and (max-width: 1749px)',
      '(max-width: 999px)',
    ],
    ['large', 'medium', 'small'],
    'medium'
  );

  const debouncedSort = useDebounce(sort, 200);
  const debouncedFilters = useDebounce(filterValues, 250);
  const { appConfig = {} } = appContext;

  useEffect(() => {
    const fetchModels = async () => {
      try {
        setSearchStatus({ error: null, isSearchingForModels: true });

        const response = await getModelList(
          user,
          debouncedFilters,
          debouncedSort,
          rowsPerPage
        );

        setModels(response);
        setSearchStatus({ error: null, isSearchingForModels: false });
      } catch (error) {
        setSearchStatus({ error: true, isFetching: false });
      }
    };

    fetchModels();
  }, [
    debouncedFilters,
    debouncedSort,
    rowsPerPage,
    pageNumber,
    displaySize,
    user,
  ]);

  if (searchStatus.error) {
    return <div>Error: {JSON.stringify(searchStatus.error)}</div>;
  } else if (models === []) {
    return <div>Loading...</div>;
  }

  function handleSort(fieldName) {
    let sortFieldName = fieldName;
    let sortDirection = 'asc';

    if (fieldName === sort.fieldName) {
      if (sort.direction === 'asc') {
        sortDirection = 'desc';
      } else {
        sortFieldName = null;
        sortDirection = null;
      }
    }

    setSort({
      fieldName: sortFieldName,
      direction: sortDirection,
    });
  }

  function handleFilterChange(fieldName, value) {
    setFilterValues(state => {
      return {
        ...state,
        [fieldName]: value,
      };
    });
  }

  function onClose() {
    hide();
  }

  async function modelInfo(name) {
    let url = `/api/model/?user=${user.email}&name=${name}`;

    const response = await axiosInstance
      .get(url, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `JWT ${localStorage.getItem('access')}`,
        },
      })
      .then(res => {
        return res;
      })
      .catch(error => {
        return error.response;
      });

    let info = response.data;

    console.log(info);

    let modelOwner = info[0]['user'];
    let userPermissionsOnModel = info[0]['user_permissions'];

    if (
      modelOwner === user.email ||
      userPermissionsOnModel.includes('Edit Models')
    ) {
      show({
        content: ModelContent,
        contentProps: {
          info,
          onClose,
          history,
        },
        title: `${name}`,
      });
    } else {
      show({
        content: ModelContentNoEdit,
        contentProps: {
          info,
          onClose,
          history,
        },
        title: `${name}`,
      });
    }
  }

  return (
    <>
      <div className="model-list-header">
        <div className="header">
          {title ? (
            <h1 style={{ fontWeight: 300, fontSize: '22px' }}>
              {title}{' '}
              <b>
                <i>{group}</i>
              </b>
            </h1>
          ) : (
            <h1 style={{ fontWeight: 300, fontSize: '22px' }}>
              <b>{user.email}</b>'s ModelList
            </h1>
          )}
        </div>
        <div className="actions">
          <span className="model-count">{models.length}</span>
        </div>
      </div>
      <div className="table-head-background" />
      <div className="model-list-container">
        <ModelList
          isLoading={searchStatus.isSearchingForModels}
          hasError={searchStatus.error === true}
          models={models}
          onSelectItem={name => {
            modelInfo(name);
          }}
          // Table Header
          sort={sort}
          onSort={handleSort}
          filterValues={filterValues}
          onFilterChange={handleFilterChange}
          modelListDateFilterNumDays={appConfig.studyListDateFilterNumDays}
          displaySize={displaySize}
        />
        {/* PAGINATION FOOTER */}
        <TablePagination
          currentPage={pageNumber}
          nextPageFunc={() => setPageNumber(pageNumber + 1)}
          prevPageFunc={() => setPageNumber(pageNumber - 1)}
          onRowsPerPageChange={Rows => setRowsPerPage(Rows)}
          rowsPerPage={rowsPerPage}
          recordCount={models.length}
        />
      </div>
    </>
  );
}

ModelListRoute.propTypes = {
  filters: PropTypes.object,
  group: PropTypes.string,
  user: PropTypes.object,
  history: PropTypes.object,
  modal: PropTypes.object,
  title: PropTypes.string,
};

ModelListRoute.defaultProps = {
  group: '',
};

export async function getModelList(user, filters, sort, rowsPerPage) {
  const sortFieldName = sort.fieldName || 'name';
  const sortDirection = sort.direction || 'desc';

  const mappedFilters = {
    name: filters.name,
    version: filters.version,
    task: filters.task,
    modelDateFrom: filters.modelDateFrom,
    modelDateTo: filters.modelDateTo,
    group: filters.group,
  };

  const models = await _fetchModels(user, mappedFilters);

  const sortedModels = _sortModels(models, sortFieldName, sortDirection);

  const numToTake =
    sortedModels.length < rowsPerPage ? sortedModels.length : rowsPerPage;
  const result = sortedModels.slice(0, numToTake);

  return result;
}

function _sortModels(models, field, order) {
  const sortedModels = models.map(model => {
    if (!moment(model.created_at, 'MMM DD, YYYY', true).isValid()) {
      model.created_at = moment(model.created_at, 'YYYY-MM-DD').format(
        'MMM DD, YYYY'
      );
    }
    return model;
  });

  sortedModels.sort(function(a, b) {
    let fieldA = a[field];
    let fieldB = b[field];
    if (field === 'created_at') {
      fieldA = moment(fieldA).toISOString();
      fieldB = moment(fieldB).toISOString();
    }

    // Order
    if (order === 'desc') {
      if (fieldA < fieldB) {
        return -1;
      }
      if (fieldA > fieldB) {
        return 1;
      }
      return 0;
    } else {
      if (fieldA > fieldB) {
        return -1;
      }
      if (fieldA < fieldB) {
        return 1;
      }
      return 0;
    }
  });

  return sortedModels;
}

async function _fetchModels(user, filters) {
  let url = `/api/model/?user=${user.email}`;

  Object.keys(filters).forEach(field => {
    if (
      filters[field] !== null &&
      filters[field] !== '' &&
      filters[field] !== undefined
    ) {
      let param = filters[field];
      if (field === 'modelDateTo' || field === 'modelDateFrom') {
        param = moment(param, 'MMM DD, YYYY').format('YYYY-MM-DD');
      }
      url = url + `&${field}=${param}`;
    }
  });

  const response = await axiosInstance
    .get(url, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `JWT ${localStorage.getItem('access')}`,
      },
    })
    .then(res => {
      return res;
    })
    .catch(error => {
      return error.response;
    });

  return response.data;
}

export default withRouter(withModal(ModelListRoute));
