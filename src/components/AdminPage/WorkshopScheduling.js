import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useWorkshops } from '../../hooks/useWorkshops';
import './WorkshopScheduling.css';

export default function WorkshopScheduling() {
  const { t } = useTranslation();
  const { templates, createActiveWorkshop, loading } = useWorkshops();
  
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    templateId: '',
    date: '',
    time: '',
    maxParticipants: '',
    location: '',
    notes: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const selectedTemplate = templates.find(t => t.id === formData.templateId);
      if (!selectedTemplate) {
        alert(t('pleaseSelectTemplate'));
        return;
      }

      // Combine date and time to a single ISO datetime (stored in UTC)
      let startAt = null;
      if (formData.date && formData.time) {
        const localDateTime = new Date(`${formData.date}T${formData.time}:00`);
        startAt = localDateTime.toISOString();
      }

      const workshopData = {
        templateId: formData.templateId,
        name: selectedTemplate.name,
        description: selectedTemplate.description,
        price: selectedTemplate.price,
        duration: selectedTemplate.duration,
        materials: selectedTemplate.materials,
        requirements: selectedTemplate.requirements,
        date: formData.date,
        time: formData.time,
        startAt,
        maxParticipants: parseInt(formData.maxParticipants),
        location: formData.location,
        notes: formData.notes,
        status: 'active'
      };

      await createActiveWorkshop(workshopData);
      
      setFormData({
        templateId: '',
        date: '',
        time: '',
        maxParticipants: '',
        location: '',
        notes: ''
      });
      setShowForm(false);
    } catch (error) {
      console.error('Error creating workshop:', error);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setFormData({
      templateId: '',
      date: '',
      time: '',
      maxParticipants: '',
      location: '',
      notes: ''
    });
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>{t('Loading')}...</p>
      </div>
    );
  }

  return (
    <div className="workshop-scheduling">
      <div className="scheduling-header">
        <h2>{t('scheduleWorkshop')}</h2>
        <button
          className="schedule-workshop-btn"
          onClick={() => setShowForm(true)}
          disabled={templates.length === 0}
        >
          + {t('scheduleNewWorkshop')}
        </button>
      </div>

      {templates.length === 0 ? (
        <div className="no-templates-message">
          <h3>{t('noTemplatesAvailable')}</h3>
          <p>{t('createTemplateFirst')}</p>
        </div>
      ) : (
        <>
          {showForm && (
            <div className="scheduling-form-overlay">
              <div className="scheduling-form">
                <h3>{t('scheduleNewWorkshop')}</h3>
                
                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label htmlFor="templateId">{t('selectTemplate')}:</label>
                    <select
                      id="templateId"
                      name="templateId"
                      value={formData.templateId}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">{t('chooseTemplate')}</option>
                      {templates.map(template => (
                        <option key={template.id} value={template.id}>
                          {template.name} - ₪{template.price}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="date">{t('workshopDate')}:</label>
                      <input
                        type="date"
                        id="date"
                        name="date"
                        value={formData.date}
                        onChange={handleInputChange}
                        required
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="time">{t('workshopTime')}:</label>
                      <input
                        type="time"
                        id="time"
                        name="time"
                        value={formData.time}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="maxParticipants">{t('maxParticipants')}:</label>
                      <input
                        type="number"
                        id="maxParticipants"
                        name="maxParticipants"
                        value={formData.maxParticipants}
                        onChange={handleInputChange}
                        required
                        min="1"
                        max="100"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="location">{t('workshopLocation')}:</label>
                      <input
                        type="text"
                        id="location"
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        placeholder={t('enterLocation')}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="notes">{t('additionalNotes')}:</label>
                    <textarea
                      id="notes"
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      rows="3"
                      placeholder={t('enterAdditionalNotes')}
                    />
                  </div>

                  <div className="form-actions">
                    <button type="submit" className="schedule-save-btn">
                      {t('scheduleWorkshop')}
                    </button>
                    <button type="button" onClick={handleCancel} className="schedule-cancel-btn">
                      {t('Cancel')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className="templates-preview">
            <h3>{t('availableTemplates')}</h3>
            <div className="templates-list">
              {templates.map(template => (
                <div key={template.id} className="template-preview-card">
                  <h4>{template.name}</h4>
                  <p className="template-price">₪{template.price}</p>
                  <p className="template-description">{template.description}</p>
                  {template.duration && (
                    <p className="template-duration">{t('duration')}: {template.duration} {t('hours')}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
