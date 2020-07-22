import React, { useState, useEffect } from 'react';
import { Transition } from 'react-transition-group';
import Checkbox from '@leafygreen-ui/checkbox';
import IconButton from '@leafygreen-ui/icon-button';
import Icon from '@leafygreen-ui/icon';
import { isComponentType } from '@leafygreen-ui/lib';
import { css, cx } from '@leafygreen-ui/emotion';
import { uiColors } from '@leafygreen-ui/palette';
import { useTableContext, Types, DataType } from './TableContext';
import Cell, { tdInnerDiv } from './Cell';

const rowStyle = css`
  border-top: 1px solid ${uiColors.gray.light2};
  color: ${uiColors.gray.dark2};

  & > td > ${tdInnerDiv.selector} {
    height: 40px;
    overflow: hidden;
    transition: all 150ms ease-in-out;
  }
`;

const altColor = css`
  &:nth-of-type(even) {
    background-color: ${uiColors.gray.light3};
  }
`;

const iconButtonMargin = css`
  margin-right: 4px;
`;

const disabledStyle = css`
  background-color: ${uiColors.gray.light2};
  color: ${uiColors.gray.base};
  cursor: not-allowed;
  border-top: 1px solid ${uiColors.gray.light1};
  border-bottom: 1px solid ${uiColors.gray.light1};
`;

const displayFlex = css`
  display: flex;
  align-items: center;
`;

const truncation = css`
  max-width: 100px;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
`;

const transitionStyles = {
  default: css`
    transition: border 150ms ease-in-out;
    border-top-color: transparent;

    & > td {
      padding-top: 0px;
      padding-bottom: 0px;
    }

    & > td > ${tdInnerDiv.selector} {
      max-height: 0;
    }
  `,

  entered: css`
    border-top-color: ${uiColors.gray.light2};

    & > td > ${tdInnerDiv.selector} {
      max-height: 40px;
    }
  `,
};

const styleMap = {
  left: [DataType.String, DataType.Weight, DataType.ZipCode, DataType.Date],
  right: [DataType.Number, DataType.Quantity],
} as const;

function styleColumn(index: string, dataType: DataType) {
  let justify = 'flex-end';

  if (styleMap.left.includes(dataType)) {
    justify = 'flex-start';
  } else if (styleMap.right.includes(dataType)) {
    justify = 'flex-end';
  }

  return css`
    & td:nth-child(${index}) > div {
      justify-content: ${justify};
    }
  `;
}

function getIndentLevelStyle(indentLevel: number) {
  return css`
    & > td:nth-child(2) {
      padding-left: ${8 + indentLevel * 16}px;
    }
  `;
}

function generateIndexRef() {
  return Math.random().toString(36).substring(2);
}

interface RowProps extends React.ComponentPropsWithoutRef<'tr'> {
  expanded?: boolean;
  disabled?: boolean;
  indentLevel?: number;
  isParentExpanded?: boolean;
}

const Row = React.forwardRef(
  (
    {
      expanded = false,
      disabled = false,
      indentLevel = 0,
      isParentExpanded = true,
      children,
      className,
      ...rest
    }: RowProps,
    ref: React.Ref<any>,
  ) => {
    const {
      state: {
        data,
        columnInfo,
        hasNestedRows,
        hasRowSpan,
        selectable,
        rowState,
      },
      dispatch,
    } = useTableContext();

    const indexRef = React.useRef(generateIndexRef());

    const [isExpanded, setIsExpanded] = useState(expanded);
    const nodeRef = React.useRef(null);
    let hasSeenFirstCell = false;

    useEffect(() => {
      dispatch({
        type: Types.RegisterRow,
        payload: {
          index: indexRef.current,
          checked: false,
          disabled: disabled,
        },
      });
    }, []);

    useEffect(() => {
      dispatch({
        type: Types.RegisterRow,
        payload: {
          index: indexRef.current,
          disabled,
        },
      });
    }, [disabled]);

    useEffect(() => {
      let shouldDispatchHasNestedRows = false;
      let shouldDispatchHasRowSpan = false;

      React.Children.forEach(children, child => {
        if (
          isComponentType(child, 'Row') &&
          !shouldDispatchHasNestedRows &&
          !hasNestedRows
        ) {
          shouldDispatchHasNestedRows = true;
        }

        if (
          isComponentType(child, 'Cell') &&
          child.props.rowSpan > 1 &&
          !hasRowSpan &&
          !shouldDispatchHasRowSpan
        ) {
          shouldDispatchHasRowSpan = true;
        }
      });

      if (shouldDispatchHasNestedRows) {
        dispatch({
          type: Types.SetHasNestedRows,
          payload: true,
        });
      }

      if (shouldDispatchHasRowSpan) {
        dispatch({
          type: Types.SetHasRowSpan,
          payload: true,
        });
      }
    }, [children]);

    // Depending on network speed, will noticeably render columns with incorrect
    // alignment, would rather wait for proper information before rendering
    if (!columnInfo) {
      return null;
    }

    const chevronButton = (
      <IconButton
        onClick={() => setIsExpanded(curr => !curr)}
        aria-label="chevron"
        className={iconButtonMargin}
      >
        <Icon
          aria-label="chevron"
          glyph={isExpanded ? 'ChevronDown' : 'ChevronRight'}
          color={uiColors.gray.dark2}
        />
      </IconButton>
    );

    const renderedChildren: Array<React.ReactElement> = [];
    const nestedRows: Array<React.ReactElement> = [];
    let firstCellIndex: number | undefined;

    React.Children.forEach(children, (child, index) => {
      if (isComponentType(child, 'Row')) {
        nestedRows.push(
          React.cloneElement(child, {
            ref: nodeRef,
            isParentExpanded: isExpanded,
            ['aria-expanded']: isExpanded ? 'true' : 'false',
            indentLevel: indentLevel + 1,
            key: `${indexRef.current}-${indentLevel + 1}`,
          }),
        );
      } else if (isComponentType(child, 'Cell')) {
        if (!hasSeenFirstCell) {
          hasSeenFirstCell = true;
          firstCellIndex = index;
        }

        if (!child.props.children) {
          return null;
        }

        if (disabled) {
          renderedChildren.push(
            React.cloneElement(child, {
              disabled,
              key: `${indexRef.current}-${child.props.children}`,
            }),
          );
        } else {
          renderedChildren.push(
            React.cloneElement(child, {
              children: (
                <span className={truncation}>{child.props.children}</span>
              ),
              key: `${indexRef.current}-${child.props.children}`,
            }),
          );
        }
      }
    });

    if (nestedRows && nestedRows.length > 0) {
      renderedChildren[firstCellIndex] = React.cloneElement(
        renderedChildren[firstCellIndex],
        {
          children: (
            <>
              {chevronButton}
              <span className={truncation}>
                {renderedChildren[firstCellIndex].props.children}
              </span>
            </>
          ),
          className: cx(displayFlex, className),
          key: `${indexRef.current}-${renderedChildren[firstCellIndex].props.children}`,
        },
      );
    }

    const shouldAltRowColor = data && data.length >= 10 && !hasNestedRows;

    const alignmentStyles = Object.entries(
      columnInfo,
    ).map(([key, { dataType }]) => styleColumn(key, dataType!));

    const checkboxProps = {
      onChange: () =>
        dispatch({
          type: Types.ToggleIndividualChecked,
          payload: {
            index: indexRef.current,
            checked: !rowState[indexRef.current].checked,
          },
        }),
      disabled,
      checked: !!rowState[indexRef.current]?.checked,
    };

    return (
      <>
        <tr
          className={cx(
            rowStyle,
            getIndentLevelStyle(indentLevel),
            [...alignmentStyles],
            {
              [altColor]: shouldAltRowColor,
              [disabledStyle]: disabled,
            },
            className,
          )}
          aria-disabled={disabled}
          ref={ref}
          key={indexRef.current}
          {...rest}
        >
          {selectable && (
            <Cell>
              <div
                className={css`
                  display: flex;
                  justify-content: center;
                  align-items: center;
                `}
              >
                <Checkbox {...checkboxProps} />
              </div>
            </Cell>
          )}
          {renderedChildren}
        </tr>

        {nestedRows && (
          <Transition
            in={isExpanded && isParentExpanded}
            timeout={150}
            nodeRef={nodeRef}
          >
            {(state: string) => {
              return (
                <>
                  {nestedRows?.map(element =>
                    React.cloneElement(element, {
                      className: cx(transitionStyles.default, {
                        [transitionStyles.entered]: [
                          'entering',
                          'entered',
                        ].includes(state),
                      }),
                    }),
                  )}
                </>
              );
            }}
          </Transition>
        )}
      </>
    );
  },
);

Row.displayName = 'Row';

export default Row;
