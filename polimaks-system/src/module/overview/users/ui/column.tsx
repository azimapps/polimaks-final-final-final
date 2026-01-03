import type { TFunction } from 'i18next';
import type { GridColDef } from '@mui/x-data-grid';

interface Props {
  t: TFunction;
}

export const usersColumn = ({ t }: Props): GridColDef<any>[] => [
  {
    field: 'id',
    headerName: 'ID',
    width: 80,
  },
  {
    field: 'fullName',
    headerName: t('table.name'),
    flex: 1,
  },
  {
    field: 'phoneNumber',
    headerName: t('table.phone'),
    width: 150,
  },
  {
    field: 'createdAt',
    headerName: t('table.created_at'),
    width: 180,
    valueFormatter: (params) => {
      if (!params) return '';
      return new Date(params).toLocaleDateString();
    },
  },
  {
    field: 'isPremium',
    headerName: 'Premium',
    width: 120,
    type: 'boolean',
  },
];
