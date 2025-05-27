import { ColumnConfig } from "./column-config";

export interface TaskColumnConfig extends ColumnConfig {
  dataType?: 'text' | 'number' | 'date' | 'select' | 'boolean';
  selectOptions?: string[];
  key?: string; // Field key for sorting and data access
}

export const TASK_DEFAULT_COLUMNS: TaskColumnConfig[] = [
  // Checkbox column (visible by default for table view)
  {
    id: 'checkbox',
    name: 'Select',
    key: 'checkbox',
    label: 'Select',
    visible: true,
    order: 0,
    width: '48px',
    sortable: false
  },
  {
    id: 'title',
    name: 'Task',
    key: 'title',
    label: 'Task',
    visible: true,
    order: 1,
    width: 'auto',
    sortable: true,
    dataType: 'text'
  },
  {
    id: 'status',
    name: 'Status',
    key: 'status',
    label: 'Status',
    visible: true,
    order: 2,
    width: '120px',
    sortable: true,
    dataType: 'select',
    selectOptions: ['not_started', 'pending', 'in_progress', 'in_review', 'completed', 'done']
  },
  {
    id: 'priority',
    name: 'Priority',
    key: 'priority',
    label: 'Priority',
    visible: true,
    order: 3,
    width: '100px',
    sortable: true,
    dataType: 'select',
    selectOptions: ['low', 'medium', 'high']
  },
  {
    id: 'assignee',
    name: 'Assignee',
    key: 'assignee',
    label: 'Assignee',
    visible: true,
    order: 4,
    width: '160px',
    sortable: true
  },
  {
    id: 'due_date',
    name: 'Due Date',
    key: 'due_date',
    label: 'Due Date',
    visible: true,
    order: 5,
    width: '120px',
    sortable: true,
    dataType: 'date'
  },
  {
    id: 'progress',
    name: 'Progress',
    key: 'progress',
    label: 'Progress',
    visible: true,
    order: 6,
    width: '140px',
    sortable: true,
    dataType: 'number'
  },
  {
    id: 'budget',
    name: 'Budget',
    key: 'budget',
    label: 'Budget',
    visible: true,
    order: 7,
    width: '100px',
    sortable: true,
    dataType: 'number'
  },
  // Optional columns (hidden by default for minimal interface)
  {
    id: 'description',
    name: 'Description',
    key: 'description',
    label: 'Description',
    visible: false,
    order: 8,
    width: '200px',
    sortable: false,
    dataType: 'text'
  },
  {
    id: 'created_at',
    name: 'Created',
    key: 'created_at',
    label: 'Created',
    visible: false,
    order: 9,
    width: '120px',
    sortable: true,
    dataType: 'date'
  },
  {
    id: 'project',
    name: 'Project',
    key: 'project',
    label: 'Project',
    visible: false,
    order: 10,
    width: '140px',
    sortable: true
  },
  {
    id: 'actions',
    name: '',
    key: 'actions',
    label: 'Actions',
    visible: true,
    order: 999,
    width: '80px',
    sortable: false
  }
];
