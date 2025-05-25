import { ColumnConfig } from "./column-config";

export const PROJECT_DEFAULT_COLUMNS: ColumnConfig[] = [
  {
    id: 'name',
    name: 'Project Name',
    key: 'name',
    label: 'Project Name',
    visible: true,
    order: 0,
    width: '200px',
    sortable: true
  },
  {
    id: 'status',
    name: 'Status',
    key: 'status',
    label: 'Status',
    visible: true,
    order: 1,
    width: '120px',
    sortable: true
  },
  {
    id: 'client_name',
    name: 'Client',
    key: 'client_name',
    label: 'Client',
    visible: true,
    order: 2,
    width: '150px',
    sortable: true
  },
  {
    id: 'budget',
    name: 'Budget',
    key: 'budget',
    label: 'Budget',
    visible: true,
    order: 3,
    width: '120px',
    sortable: true
  },
  {
    id: 'start_date',
    name: 'Start Date',
    key: 'start_date',
    label: 'Start Date',
    visible: true,
    order: 4,
    width: '120px',
    sortable: true
  },
  {
    id: 'end_date',
    name: 'End Date',
    key: 'end_date',
    label: 'End Date',
    visible: true,
    order: 5,
    width: '120px',
    sortable: true
  },
  {
    id: 'description',
    name: 'Description',
    key: 'description',
    label: 'Description',
    visible: false,
    order: 6,
    width: '200px',
    sortable: false
  }
];
