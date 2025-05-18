import { ColumnConfig } from "./column-config";

export const PROJECT_DEFAULT_COLUMNS: ColumnConfig[] = [
  {
    id: 'checkbox',
    name: 'Select',
    visible: true,
    order: 0,
    width: '40px'
  },
  {
    id: 'name',
    name: 'Project Name',
    visible: true,
    order: 1,
    width: '200px'
  },
  {
    id: 'status',
    name: 'Status',
    visible: true,
    order: 2,
    width: '120px'
  },
  {
    id: 'client',
    name: 'Client',
    visible: true,
    order: 3,
    width: '150px'
  },
  {
    id: 'budget',
    name: 'Budget',
    visible: true,
    order: 4,
    width: '120px'
  },
  {
    id: 'start_date',
    name: 'Start Date',
    visible: true,
    order: 5,
    width: '120px'
  },
  {
    id: 'end_date',
    name: 'End Date',
    visible: true,
    order: 6,
    width: '120px'
  },
  {
    id: 'actions',
    name: 'Actions',
    visible: true,
    order: 7,
    width: '100px'
  }
];
