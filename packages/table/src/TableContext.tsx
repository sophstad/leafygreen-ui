import React, {
  createContext,
  useContext,
  useMemo,
  useReducer,
  useEffect,
} from 'react';

const TableTypes = {
  SelectableTable: 'SELECTABLE_TABLE',
  SetColumnInfo: 'SET_COLUMN_INFO',
  SortTableData: 'SORT_TABLE_DATA',
  SetHasNestedRows: 'SET_HAS_NESTED_ROWS',
  SetHasRowSpan: 'SET_HAS_ROW_SPAN',
} as const;

type TableTypes = typeof TableTypes[keyof typeof TableTypes];

export { TableTypes };

interface ActionPayload {
  [TableTypes.SelectableTable]: boolean;
  [TableTypes.SetColumnInfo]: {
    dataType?: DataType;
    index: number;
  };
  [TableTypes.SetHasRowSpan]: boolean;
  [TableTypes.SetHasNestedRows]: boolean;
  [TableTypes.SortTableData]: {
    columnId: number;
    accessorValue: () => string;
    data: Array<unknown>;
  };
}

type ActionMap<A extends Record<string, any>> = {
  [Key in keyof A]: A[Key] extends undefined
    ? {
        type: Key;
      }
    : {
        type: Key;
        payload: A[Key];
      };
};

type Action = ActionMap<ActionPayload>[keyof ActionMap<ActionPayload>];

type Dispatch = (action: Action) => void;

interface Sort {
  columnId?: number;
  direction?: 'asc' | 'desc';
  accessorValue?: () => string;
}

const DataType = {
  Number: 'number',
  Weight: 'weight',
  ZipCode: 'zipCode',
  String: 'string',
  Date: 'date',
} as const;

type DataType = typeof DataType[keyof typeof DataType];

export { DataType };

export interface State {
  sort?: Sort;
  data: Array<any>;
  columnInfo?: Record<number, { dataType?: DataType }>;
  selectable?: boolean;
  hasNestedRows?: boolean;
  hasRowSpan?: boolean;
}

interface TableProviderInterface {
  children: React.ReactNode;
  data: Array<any>;
  selectable: boolean;
}

interface ContextInterface {
  state: State;
  dispatch: Dispatch;
}

const TableContext = createContext<ContextInterface>({
  state: {
    data: [],
  },
  dispatch: () => {},
});

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case TableTypes.SetHasRowSpan:
      return {
        ...state,
        hasRowSpan: action.payload,
      };

    case TableTypes.SetHasNestedRows:
      return {
        ...state,
        hasNestedRows: action.payload,
      };

    case TableTypes.SelectableTable:
      return {
        ...state,
        selectable: action.payload,
      };

    case TableTypes.SetColumnInfo:
      return {
        ...state,
        columnInfo: {
          ...state.columnInfo,
          [action.payload.index]: {
            dataType: action.payload.dataType,
          },
        },
      };

    case TableTypes.SortTableData:
      return {
        ...state,
        sort: {
          columnId: action.payload.columnId,
          direction: state.sort?.direction === 'desc' ? 'asc' : 'desc',
          accessorValue: action.payload.accessorValue,
        },
        data: sortFunction({
          data: action.payload.data,
          direction: state.sort?.direction === 'desc' ? 'asc' : 'desc',
          accessorValue: action.payload.accessorValue,
        }),
      };

    default:
      return { ...state };
  }
}

export function TableProvider({
  children,
  selectable,
  data,
}: TableProviderInterface) {
  const initialState: State = {
    sort: {
      direction: undefined,
    },
    data,
    selectable,
    hasNestedRows: false,
  };

  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    dispatch({
      type: TableTypes.SelectableTable,
      payload: selectable,
    });
  }, [selectable]);

  const contextValue = useMemo(() => {
    return { state, dispatch };
  }, [state, dispatch]);

  return (
    <TableContext.Provider value={contextValue}>
      {children}
    </TableContext.Provider>
  );
}

export function useTableContext() {
  return useContext(TableContext);
}

const alphanumericCollator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: 'base',
});

export const sortFunction = ({
  data,
  accessorValue,
  direction,
}: {
  data: Array<T>;
  accessorValue: (data: T) => string;
  direction: 'asc' | 'desc';
}) => {
  return data.sort((a, b) => {
    const aVal = accessorValue(a);
    const bVal = accessorValue(b);

    if (direction !== 'desc') {
      return alphanumericCollator.compare(aVal, bVal);
    }

    return alphanumericCollator.compare(bVal, aVal);
  });
};
