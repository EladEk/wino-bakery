import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useWorkshops } from '../../hooks/useWorkshops';
import './WorkshopTemplates.css';

export default function WorkshopTemplates() {
  const { t } = useTranslation();
  const { templates, createTemplate, updateTemplate, deleteTemplate, loading } = useWorkshops();
  
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    duration: '',
    materials: '',
    requirements: ''
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
      if (editingTemplate) {
        await updateTemplate(editingTemplate.id, formData);
        setEditingTemplate(null);
      } else {
        await createTemplate(formData);
      }
      
      setFormData({
        name: '',
        description: '',
        price: '',
        duration: '',
        materials: '',
        requirements: ''
      });
      setShowForm(false);
    } catch (error) {
      console.error('Error saving template:', error);
    }
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name || '',
      description: template.description || '',
      price: template.price || '',
      duration: template.duration || '',
      materials: template.materials || '',
      requirements: template.requirements || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (templateId) => {
    if (window.confirm(t('confirmDeleteTemplate'))) {
      try {
        await deleteTemplate(templateId);
      } catch (error) {
        console.error('Error deleting template:', error);
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingTemplate(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      duration: '',
      materials: '',
      requirements: ''
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
    <div className="workshop-templates">
      <div className="templates-header">
        <h2>{t('workshopTemplates')}</h2>
        <button
          className="create-template-btn"
          onClick={() => setShowForm(true)}
        >
          + {t('createTemplate')}
        </button>
      </div>

      {showForm && (
        <div className="template-form-overlay">
          <div className="template-form">
            <h3>{editingTemplate ? t('editTemplate') : t('createTemplate')}</h3>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">{t('workshopName')}:</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder={t('enterWorkshopName')}
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">{t('workshopDescription')}:</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows="4"
                  placeholder={t('enterWorkshopDescription')}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="price">{t('workshopPrice')} (₪):</label>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    required
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="duration">{t('workshopDuration')} (שעות):</label>
                  <input
                    type="number"
                    id="duration"
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    min="0.5"
                    step="0.5"
                    placeholder="2"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="materials">{t('requiredMaterials')}:</label>
                <textarea
                  id="materials"
                  name="materials"
                  value={formData.materials}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder={t('enterRequiredMaterials')}
                />
              </div>

              <div className="form-group">
                <label htmlFor="requirements">{t('participantRequirements')}:</label>
                <textarea
                  id="requirements"
                  name="requirements"
                  value={formData.requirements}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder={t('enterParticipantRequirements')}
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="workshop-save-btn">
                  {editingTemplate ? t('updateTemplate') : t('createTemplate')}
                </button>
                <button type="button" onClick={handleCancel} className="workshop-cancel-btn">
                  {t('Cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="templates-grid">
        {templates.length === 0 ? (
          <div className="no-templates">
            <h3>{t('noWorkshopTemplates')}</h3>
            <p>{t('createFirstTemplate')}</p>
          </div>
        ) : (
          templates.map(template => (
            <div key={template.id} className="template-card">
              <div className="template-header">
                <h3 className="template-name">{template.name}</h3>
                <div className="template-price">₪{template.price}</div>
              </div>
              
              <div className="template-content">
                <p className="template-description">{template.description}</p>
                
                <div className="template-details">
                  {template.duration && (
                    <div className="detail-item">
                      <span className="detail-label">⏱️ {t('duration')}:</span>
                      <span className="detail-value">{template.duration} {t('hours')}</span>
                    </div>
                  )}
                  
                  {template.materials && (
                    <div className="detail-item">
                      <span className="detail-label">📦 {t('materials')}:</span>
                      <span className="detail-value">{template.materials}</span>
                    </div>
                  )}
                  
                  {template.requirements && (
                    <div className="detail-item">
                      <span className="detail-label">📋 {t('requirements')}:</span>
                      <span className="detail-value">{template.requirements}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="template-actions">
                <button
                  className="edit-btn"
                  onClick={() => handleEdit(template)}
                >
                  {t('Edit')}
                </button>
                <button
                  className="delete-btn"
                  onClick={() => handleDelete(template.id)}
                >
                  {t('Delete')}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
