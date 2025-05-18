export interface ColumnConfig {
  id: string;
  name: string;
  visible: boolean;
  order: number;
  width?: string;
}

export const DEFAULT_COLUMNS: ColumnConfig[] = [
  {
    id: 'checkbox',
    name: 'Select',
    visible: true,
    order: 0,
    width: '40px'
  },
  {
    id: 'title',
    name: 'Deal name',
    visible: true,
    order: 1,
    width: '200px'
  },
  {
    id: 'owner',
    name: 'Owner',
    visible: true,
    order: 2,
    width: '100px'
  },
  {
    id: 'stage',
    name: 'Stage',
    visible: true,
    order: 3,
    width: '120px'
  },
  {
    id: 'priority',
    name: 'Priority',
    visible: true,
    order: 4,
    width: '120px'
  },
  {
    id: 'probability',
    name: 'Close probability',
    visible: true,
    order: 5,
    width: '120px'
  },
  {
    id: 'value',
    name: 'Deal value',
    visible: true,
    order: 6,
    width: '100px'
  },
  {
    id: 'phone',
    name: 'Phone',
    visible: true,
    order: 7,
    width: '150px'
  },
  {
    id: 'status',
    name: 'Status',
    visible: false,
    order: 8,
    width: '120px'
  },
  {
    id: 'due_date',
    name: 'Due Date',
    visible: false,
    order: 9,
    width: '120px'
  },
  {
    id: 'assignee',
    name: 'Assignee',
    visible: false,
    order: 10,
    width: '150px'
  },

  {
    id: 'actions',
    name: 'Actions',
    visible: true,
    order: 11,
    width: '100px'
  }
];
