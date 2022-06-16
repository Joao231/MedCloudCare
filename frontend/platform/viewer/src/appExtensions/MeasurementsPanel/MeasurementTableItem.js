import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import { Icon } from '@ohif/ui';
import { TableListItem } from '@ohif/ui';

import './MeasurementTableItem.styl';

class MeasurementTableItem extends Component {
  static propTypes = {
    measurementData: PropTypes.object.isRequired,
    onItemClick: PropTypes.func.isRequired,
    onRelabel: PropTypes.func,
    onDelete: PropTypes.func,
    onEditDescription: PropTypes.func,
    itemClass: PropTypes.string,
    itemIndex: PropTypes.number,
    onMeasurementDelete: PropTypes.func,
    onReport: PropTypes.func,
    canEditStudy: PropTypes.bool,
  };

  constructor(props) {
    super(props);
    this.state = {
      delete: false,
    };
  }

  render() {
    return (
      <React.Fragment>
        <React.Fragment>{this.getTableListItem()}</React.Fragment>
      </React.Fragment>
    );
  }

  getActionButton = (btnLabel, onClickCallback) => {
    return (
      <button key={btnLabel} className="btnAction" onClick={onClickCallback}>
        <span style={{ marginRight: '4px' }}>
          <Icon name="edit" width="14px" height="14px" />
        </span>
        {btnLabel}
      </button>
    );
  };

  measurementDelete = measurement_number => {
    this.props.onMeasurementDelete(measurement_number);

    this.setState({ delete: false });
  };

  getTableListItem = () => {
    const actionButtons = [];

    if (typeof this.props.onRelabel === 'function') {
      const relabelButton = this.getActionButton(
        'Relabel',
        this.onRelabelClick
      );
      if (
        (this.props.measurementData.created_by && this.props.canEditStudy) ||
        !this.props.measurementData.created_by
      ) {
        actionButtons.push(relabelButton);
      }
    }

    if (typeof this.props.onDelete === 'function') {
      const deleteButton = this.getActionButton('Clear', this.onDeleteClick);
      if (!this.props.measurementData.created_by) {
        actionButtons.push(deleteButton);
      }
    }

    if (this.state.delete) {
      return (
        <div style={{ marginTop: '15px' }}>
          <p
            style={{
              backgroundColor: 'transparent',
              color: 'red',
              textAlign: 'center',
            }}
          >
            Are you sure you want do delete this measurement?
          </p>
          <div className="footer">
            <div>
              <div
                onClick={() =>
                  this.setState({
                    delete: false,
                  })
                }
                data-cy="cancel-btn"
                className="btn btn-default"
              >
                {'No'}
              </div>
              <button
                className="btn btn-primary"
                data-cy="save-btn"
                onClick={() =>
                  this.measurementDelete(
                    this.props.measurementData.measurement_number
                  )
                }
              >
                {'Yes'}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <TableListItem
        itemKey={this.props.measurementData.measurementNumber}
        itemClass={`measurementItem ${this.props.itemClass} `}
        itemIndex={this.props.itemIndex}
        onItemClick={this.onItemClick}
      >
        <div>
          <div className="measurementLocation">
            {this.props.measurementData.created_by &&
            this.props.canEditStudy ? (
              <button
                className="btn btn-danger"
                title="Delete Measurement"
                onClick={() => this.setState({ delete: true })}
                style={{
                  float: 'right',
                  borderRadius: '6px',
                  fontSize: '11px',
                }}
              >
                {'x'}
              </button>
            ) : (
              <Fragment></Fragment>
            )}
            {this.props.measurementData.label}{' '}
            {this.props.measurementData.description
              ? `(${this.props.measurementData.description})`
              : ''}
            <p></p>
          </div>
          <div className="djangoData">
            {this.props.measurementData.created_by ? (
              <>
                <p>
                  <i>Created By:</i> {this.props.measurementData.created_by}
                </p>
                <p>
                  <i>Created At:</i> {this.props.measurementData.created_at}
                </p>
                <p>
                  <i>Last Modification By:</i>{' '}
                  {this.props.measurementData.last_modification_by}
                </p>
                <p>
                  <i>Last Modification At:</i>{' '}
                  {this.props.measurementData.last_modification_at}
                </p>
              </>
            ) : null}
          </div>
          <div className="displayTexts">
            {this.props.measurementData.toolType}
            {` `}
            {this.getDataDisplayText()}
          </div>

          <div className="rowActions">
            {actionButtons}
            {this.props.measurementData.created_by ? (
              <button
                key={'Report'}
                className="btnAction"
                onClick={() =>
                  this.props.onReport(
                    this.props.measurementData.measurementNumber,
                    true
                  )
                }
              >
                <span style={{ marginRight: '4px' }}>
                  <Icon name="edit" width="14px" height="14px" />
                </span>
                {'Report'}
              </button>
            ) : (
              <button
                key={'Report'}
                className="btnAction"
                onClick={() =>
                  this.props.onReport(
                    this.props.measurementData.measurementNumber,
                    false
                  )
                }
              >
                <span style={{ marginRight: '4px' }}>
                  <Icon name="edit" width="14px" height="14px" />
                </span>
                {'Report'}
              </button>
            )}
          </div>
        </div>
      </TableListItem>
    );
  };

  onItemClick = event => {
    this.props.onItemClick(event, this.props.measurementData);
  };

  onRelabelClick = event => {
    // Prevent onItemClick from firing
    event.stopPropagation();

    this.props.onRelabel(event, this.props.measurementData);
  };

  onEditDescriptionClick = event => {
    // Prevent onItemClick from firing
    event.stopPropagation();

    this.props.onEditDescription(event, this.props.measurementData);
  };

  onDeleteClick = event => {
    // Prevent onItemClick from firing
    event.stopPropagation();

    this.props.onDelete(event, this.props.measurementData);
  };

  getDataDisplayText = () => {
    return this.props.measurementData.data.map((data, index) => {
      return (
        <div key={`displayText_${index}`} className="measurementDisplayText">
          {data.displayText ? data.displayText : ''}
        </div>
      );
    });
  };
}

const connectedComponent = MeasurementTableItem;
export { connectedComponent as MeasurementTableItem };
export default connectedComponent;
