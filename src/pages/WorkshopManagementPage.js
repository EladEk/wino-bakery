import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useWorkshops } from '../hooks/useWorkshops';
import './WorkshopManagementPage.css';

// Import sub-components
import WorkshopTemplates from '../components/AdminPage/WorkshopTemplates';
import WorkshopScheduling from '../components/AdminPage/WorkshopScheduling';
import ActiveWorkshops from '../components/AdminPage/ActiveWorkshops';
import WorkshopHistory from '../components/AdminPage/WorkshopHistory';

export default function WorkshopManagementPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('active');
  
  const tabs = [
    { key: 'active', label: t('activeWorkshops'), component: ActiveWorkshops },
    { key: 'templates', label: t('workshopTemplates'), component: WorkshopTemplates },
    { key: 'scheduling', label: t('scheduleWorkshop'), component: WorkshopScheduling },
    { key: 'history', label: t('workshopHistory'), component: WorkshopHistory }
  ];

  const ActiveComponent = tabs.find(tab => tab.key === activeTab)?.component;

  return (
    <div className="workshop-management-page">
      <div className="page-header">
        <h1>{t('workshops')}</h1>
        <p className="page-description">{t('workshopManagementDescription')}</p>
      </div>

      <div className="workshop-tabs">
        {tabs.map(tab => (
          <button
            key={tab.key}
            className={`tab-button ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="tab-content">
        {ActiveComponent && <ActiveComponent />}
      </div>
    </div>
  );
}
