/* eslint-disable react/no-unescaped-entities */
import React, { useState, useEffect, useContext } from 'react';
import PropTypes from 'prop-types';
import OHIF from '@ohif/core';
import { withRouter } from 'react-router-dom';
import {
  StudyList,
  PageToolbar,
  TablePagination,
  useDebounce,
  useMedia,
} from '@ohif/ui';
import ConnectedHeader from '../connectedComponents/ConnectedHeader.js';
import * as RoutesUtil from '../routes/routesUtil';
import moment from 'moment';
import ConnectedDicomFilesUploader from '../googleCloud/ConnectedDicomFilesUploader';
import AppContext from '../context/AppContext';
import axiosInstance from 'axios';

function StudyListRoute(props) {
  const { history, server, studyListFunctionsEnabled, user } = props;

  const [sort, setSort] = useState({
    fieldName: 'PatientName',
    direction: 'desc',
  });
  const [filterValues, setFilterValues] = useState({
    studyDateTo: null,
    studyDateFrom: null,
    PatientName: '',
    PatientID: '',
    AccessionNumber: '',
    StudyDate: '',
    modalities: '',
    StudyDescription: '',
    patientNameOrId: '',
    accessionOrModalityOrDescription: '',
    allFields: '',
  });
  const [studies, setStudies] = useState([]);

  const [searchStatus, setSearchStatus] = useState({
    isSearchingForStudies: false,
    error: null,
  });
  const [activeModalId, setActiveModalId] = useState(null);
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
    'small'
  );

  const debouncedSort = useDebounce(sort, 200);
  const debouncedFilters = useDebounce(filterValues, 250);

  const { appConfig = {} } = appContext;

  useEffect(() => {
    const fetchStudies = async () => {
      try {
        setSearchStatus({ error: null, isSearchingForStudies: true });

        const response = await getStudyList(
          user,
          props.group,
          server,
          debouncedFilters,
          debouncedSort,
          rowsPerPage,
          pageNumber,
          displaySize
        );

        setStudies(response);
        setSearchStatus({ error: null, isSearchingForStudies: false });
      } catch (error) {
        setSearchStatus({ error: true, isFetching: false });
      }
    };

    if (server) {
      fetchStudies();
    }
  }, [
    debouncedFilters,
    debouncedSort,
    rowsPerPage,
    pageNumber,
    displaySize,
    server,
    user,
    props.group,
  ]);

  if (searchStatus.error) {
    return <div>Error: {JSON.stringify(searchStatus.error)}</div>;
  } else if (studies === [] && !activeModalId) {
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

  return (
    <>
      <ConnectedDicomFilesUploader
        isOpen={activeModalId === 'DicomFilesUploader'}
        onClose={() => setActiveModalId(null)}
      />

      <ConnectedHeader useLargeLogo={true}></ConnectedHeader>

      <div className="study-list-header">
        <div className="header">
          {props.group ? (
            <h1 style={{ fontWeight: 300, fontSize: '22px' }}>
              <b>{props.group}</b>'s StudyList
            </h1>
          ) : (
            <h1 style={{ fontWeight: 300, fontSize: '22px' }}>
              <b>{user.email}</b>'s StudyList
            </h1>
          )}
        </div>
        <div className="actions">
          {!props.group && studyListFunctionsEnabled && (
            <PageToolbar
              onImport={() => setActiveModalId('DicomFilesUploader')}
            />
          )}
          <span className="study-count">{studies.length}</span>
        </div>
      </div>
      <div className="table-head-background" />
      <div className="study-list-container">
        <StudyList
          isLoading={searchStatus.isSearchingForStudies}
          hasError={searchStatus.error === true}
          // Rows
          studies={studies}
          onSelectItem={studyInstanceUID => {
            const viewerPath = RoutesUtil.parseViewerPath(appConfig, server, {
              studyInstanceUIDs: studyInstanceUID,
            });
            history.push({
              pathname: viewerPath,
            });
          }}
          // Table Header
          sort={sort}
          onSort={handleSort}
          filterValues={filterValues}
          onFilterChange={handleFilterChange}
          studyListDateFilterNumDays={appConfig.studyListDateFilterNumDays}
          displaySize={displaySize}
        />
        {/* PAGINATION FOOTER */}
        <TablePagination
          currentPage={pageNumber}
          nextPageFunc={() => setPageNumber(pageNumber + 1)}
          prevPageFunc={() => setPageNumber(pageNumber - 1)}
          onRowsPerPageChange={Rows => setRowsPerPage(Rows)}
          rowsPerPage={rowsPerPage}
          recordCount={studies.length}
        />
      </div>
    </>
  );
}

StudyListRoute.propTypes = {
  filters: PropTypes.object,
  PatientID: PropTypes.string,
  server: PropTypes.object,
  user: PropTypes.object,
  history: PropTypes.object,
  studyListFunctionsEnabled: PropTypes.bool,
  group: PropTypes.string,
};

StudyListRoute.defaultProps = {
  studyListFunctionsEnabled: true,
  group: '',
};

async function getStudyList(
  user,
  group,
  server,
  filters,
  sort,
  rowsPerPage,
  pageNumber,
  displaySize
) {
  const {
    allFields,
    patientNameOrId,
    accessionOrModalityOrDescription,
  } = filters;
  const sortFieldName = sort.fieldName || 'PatientName';
  const sortDirection = sort.direction || 'desc';

  const mappedFilters = {
    PatientID: filters.PatientID,
    PatientName: filters.PatientName,
    AccessionNumber: filters.AccessionNumber,
    StudyDescription: filters.StudyDescription,
    ModalitiesInStudy: filters.modalities,

    // NEVER CHANGE
    studyDateFrom: filters.studyDateFrom,
    studyDateTo: filters.studyDateTo,
    limit: rowsPerPage,
    offset: pageNumber * rowsPerPage,
    fuzzymatching: server.supportsFuzzyMatching === true,
  };

  const studies = await _fetchStudies(
    user,
    group,
    server,
    mappedFilters,
    displaySize,
    {
      allFields,
      patientNameOrId,
      accessionOrModalityOrDescription,
    }
  );

  // Only the fields we use
  const mappedStudies = studies.map(study => {
    const PatientName =
      typeof study.PatientName === 'string' ? study.PatientName : undefined;

    return {
      AccessionNumber: study.AccessionNumber, // "1"
      modalities: study.modalities, // "SEG\\MR"
      PatientID: study.PatientID, // "NOID"
      PatientName, // "NAME^NONE"
      StudyDate: study.StudyDate, // "Jun 28, 2002"
      StudyDescription: study.StudyDescription, // "BRAIN"
      StudyInstanceUID: study.StudyInstanceUID, // "1.3.6.1.4.1.5962.99.1.3814087073.479799962.1489872804257.3.0"
    };
  });

  // For our smaller displays, map our field name to a single
  // field we can actually sort by.
  const sortFieldNameMapping = {
    allFields: 'PatientName',
    patientNameOrId: 'PatientName',
    accessionOrModalityOrDescription: 'modalities',
  };
  const mappedSortFieldName =
    sortFieldNameMapping[sortFieldName] || sortFieldName;

  const sortedStudies = _sortStudies(
    mappedStudies,
    mappedSortFieldName,
    sortDirection
  );

  // Because we've merged multiple requests, we may have more than
  // our Rows per page. Let's `take` that number from our sorted array.
  // This "might" cause paging issues.
  const numToTake =
    sortedStudies.length < rowsPerPage ? sortedStudies.length : rowsPerPage;
  const result = sortedStudies.slice(0, numToTake);

  return result;
}

/**
 *
 *
 * @param {object[]} studies - Array of studies to sort
 * @param {string} studies.StudyDate - Date in 'MMM DD, YYYY' format
 * @param {string} field - name of properties on study to sort by
 * @param {string} order - 'asc' or 'desc'
 * @returns
 */
function _sortStudies(studies, field, order) {
  // Make sure our StudyDate is in a valid format and create copy of studies array
  const sortedStudies = studies.map(study => {
    if (!moment(study.StudyDate, 'MMM DD, YYYY', true).isValid()) {
      study.StudyDate = moment(study.StudyDate, 'YYYYMMDD').format(
        'MMM DD, YYYY'
      );
    }
    return study;
  });

  // Sort by field
  sortedStudies.sort(function(a, b) {
    let fieldA = a[field];
    let fieldB = b[field];
    if (field === 'StudyDate') {
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

  return sortedStudies;
}

/**
 * We're forced to do this because DICOMWeb does not support "AND|OR" searches
 * across multiple fields. This allows us to make multiple requests, remove
 * duplicates, and return the result set as if it were supported
 *
 * @param {object} server
 * @param {Object} filters
 * @param {string} displaySize - small, medium, or large
 * @param {string} multi.allFields
 * @param {string} multi.patientNameOrId
 * @param {string} multi.accessionOrModalityOrDescription
 */
async function _fetchStudies(
  user,
  group,
  server,
  filters,
  displaySize,
  { allFields, patientNameOrId, accessionOrModalityOrDescription }
) {
  let queryFiltersArray = [filters];

  if (displaySize === 'small') {
    const firstSet = _getQueryFiltersForValue(
      filters,
      [
        'PatientID',
        'PatientName',
        'AccessionNumber',
        'StudyDescription',
        'ModalitiesInStudy',
      ],
      allFields
    );

    if (firstSet.length) {
      queryFiltersArray = firstSet;
    }
  } else if (displaySize === 'medium') {
    const firstSet = _getQueryFiltersForValue(
      filters,
      ['PatientID', 'PatientName'],
      patientNameOrId
    );

    const secondSet = _getQueryFiltersForValue(
      filters,
      ['AccessionNumber', 'StudyDescription', 'ModalitiesInStudy'],
      accessionOrModalityOrDescription
    );

    if (firstSet.length || secondSet.length) {
      queryFiltersArray = firstSet.concat(secondSet);
    }
  }

  const queryPromises = [];

  queryFiltersArray.forEach(filter => {
    const searchStudiesPromise = OHIF.studies.searchStudies(server, filter);
    queryPromises.push(searchStudiesPromise);
  });

  const lotsOfStudies = await Promise.all(queryPromises);
  const studies = [];
  const allowedUIDs = [];

  if (group !== '') {
    const config = {
      headers: {
        Authorization: `JWT ${localStorage.getItem('access')}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    };
    const res = await axiosInstance.get(
      `/api/view_studies?groupName=${group}&user=${
        user['email']
      }`,
      config
    );
    if (res.data.Studies === "You don't belong to this group!") {
      alert("You don't belong to this group!");
    } else {
      let studiesIDs = Object.keys(res.data.Studies);

      lotsOfStudies.forEach(arrayOfStudies => {
        if (arrayOfStudies) {
          arrayOfStudies.forEach(study => {
            if (
              !studies.some(
                s => s.StudyInstanceUID === study.StudyInstanceUID
              ) &&
              studiesIDs.includes(study.StudyInstanceUID) &&
              study.modalities !== 'SR'
            ) {
              study['user_permissions'] =
                res.data.Studies[study.StudyInstanceUID]['user_permissions'];
              study['user'] = res.data.Studies[study.StudyInstanceUID]['user'];
              studies.push(study);
              allowedUIDs.push(study['StudyInstanceUID']);
            }
          });
        }
      });
    }
  } else {
    const accessStudies = await axiosInstance
      .get(`/api/image/?user=${user.email}`, {
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

    let allowedStudies = [];
    let info = {};

    accessStudies.data.forEach(study => {
      info[study['study_uid']] = {
        user: study['user'],
        user_permissions: study['user_permissions'],
      };
      allowedStudies.push(study['study_uid']);
    });

    // Flatten and dedupe
    lotsOfStudies.forEach(arrayOfStudies => {
      if (arrayOfStudies) {
        arrayOfStudies.forEach(study => {
          if (
            !studies.some(s => s.StudyInstanceUID === study.StudyInstanceUID) &&
            allowedStudies.includes(study.StudyInstanceUID) &&
            study.modalities !== 'SR'
          ) {
            study['user_permissions'] =
              info[study.StudyInstanceUID]['user_permissions'];
            study['user'] = info[study.StudyInstanceUID]['user'];
            studies.push(study);
            allowedUIDs.push(study['StudyInstanceUID']);
          }
        });
      }
    });
  }

  const studiesAccessControl = localStorage.getItem('studyAccessControl');
  const studiesEditControl = localStorage.getItem('studyEditControl');

  if (!studiesEditControl) {
    let content = {};
    studies.forEach(function(study) {
      let studyUID = study['StudyInstanceUID'];
      if (
        localStorage.getItem('HealthProfessional_Authenticated') &&
        !study['user_permissions'].includes('Edit Studies') &&
        study['user'] !== user['email']
      ) {
        content[studyUID] = -1;
      } else {
        content[studyUID] = 0;
      }
    });
    localStorage.setItem('studyEditControl', JSON.stringify(content));
  } else {
    let studiesMap = JSON.parse(studiesEditControl);
    let studiesMapKeys = Object.keys(studiesMap);

    studies.forEach(function(study) {
      let studyUID = study['StudyInstanceUID'];
      if (!studiesMapKeys.includes(studyUID)) {
        if (
          localStorage.getItem('HealthProfessional_Authenticated') &&
          !study['user_permissions'].includes('Edit Studies') &&
          study['user'] !== user['email']
        ) {
          studiesMap[studyUID] = -1;
        } else {
          studiesMap[studyUID] = 0;
        }
      }
    });
    studiesMapKeys.forEach(function(key) {
      if (!allowedUIDs.includes(key)) {
        delete studiesMap[key];
      }
    });
    localStorage.setItem('studyEditControl', JSON.stringify(studiesMap));
  }

  if (!studiesAccessControl) {
    let content = {};
    studies.forEach(function(study) {
      let studyUID = study['StudyInstanceUID'];
      if (
        localStorage.getItem('HealthProfessional_Authenticated') &&
        !study['user_permissions'].includes('View Studies Metadata') &&
        study['user'] !== user['email']
      ) {
        content[studyUID] = -1;
      } else {
        content[studyUID] = 0;
      }
    });
    localStorage.setItem('studyAccessControl', JSON.stringify(content));
  } else {
    let studiesMap = JSON.parse(studiesAccessControl);
    let studiesMapKeys = Object.keys(studiesMap);

    studies.forEach(function(study) {
      let studyUID = study['StudyInstanceUID'];
      if (!studiesMapKeys.includes(studyUID)) {
        if (
          localStorage.getItem('HealthProfessional_Authenticated') &&
          !study['user_permissions'].includes('View Studies Metadata') &&
          study['user'] !== user['email']
        ) {
          studiesMap[studyUID] = -1;
        } else {
          studiesMap[studyUID] = 0;
        }
      }
    });
    studiesMapKeys.forEach(function(key) {
      if (!allowedUIDs.includes(key)) {
        delete studiesMap[key];
      }
    });
    localStorage.setItem('studyAccessControl', JSON.stringify(studiesMap));
  }

  return studies;
}

function _getQueryFiltersForValue(filters, fields, value) {
  const queryFilters = [];

  if (value === '' || !value) {
    return queryFilters;
  }

  fields.forEach(field => {
    const filter = Object.assign(
      {
        PatientID: '',
        PatientName: '',
        AccessionNumber: '',
        StudyDescription: '',
        ModalitiesInStudy: '',
      },
      filters
    );

    filter[field] = value;
    queryFilters.push(filter);
  });

  return queryFilters;
}

export default withRouter(StudyListRoute);
