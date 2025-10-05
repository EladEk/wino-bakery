import React from 'react';
import AdminKibbutzManagement from '../components/AdminPage/AdminKibbutzManagement';
import { useTranslation } from 'react-i18next';

export default function KibbutzManagementPage() {
  const { t } = useTranslation();

  return (
    <div className="kibbutz-management-page">
      <AdminKibbutzManagement t={t} />
    </div>
  );
}
