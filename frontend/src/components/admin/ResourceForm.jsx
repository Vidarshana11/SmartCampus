import React, { useState, useEffect } from 'react';
import { FaBuilding, FaMapMarkerAlt, FaUsers, FaInfoCircle, FaSave, FaTimes, FaExclamationTriangle, FaTag } from 'react-icons/fa';
import resourceService from '../../services/resourceService';
import '../../styles/admin/ResourceForm.css';

const ResourceForm = ({ token, resourceId, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'ROOM',
    capacity: 1,
    location: '',
    description: '',
    status: 'ACTIVE'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isEditMode = !!resourceId;

  useEffect(() => {
    if (isEditMode) {
      setLoading(true);
      resourceService.getResourceById(token, resourceId)
        .then(data => {
          setFormData({
            name: data.name || '',
            type: data.type || 'ROOM',
            capacity: data.capacity || 1,
            location: data.location || '',
            description: data.description || '',
            status: data.status || 'ACTIVE'
          });
          setError(null);
        })
        .catch(err => {
          console.error(err);
          setError('Failed to fetch resource details');
        })
        .finally(() => setLoading(false));
    }
  }, [resourceId, isEditMode, token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (isEditMode) {
        await resourceService.updateResource(token, resourceId, formData);
      } else {
        await resourceService.createResource(token, formData);
      }
      onSuccess();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to save resource. Please check the information and try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditMode) {
    return (
      <div className="resource-form-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
        <div className="loading-spinner"></div>
        <span style={{ marginLeft: '1rem', color: '#666' }}>Loading resource details...</span>
      </div>
    );
  }

  return (
    <div className="resource-form-container">
      <div className="resource-form-header">
        <h2>{isEditMode ? 'Edit Resource' : 'Add New Resource'}</h2>
        <p>{isEditMode ? 'Update the details of the existing campus resource' : 'Create a new resource available for bookings and campus use'}</p>
      </div>

      {error && (
        <div className="form-error">
          <FaExclamationTriangle />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">
            <FaBuilding style={{ marginRight: '0.5rem', color: '#003366' }} />
            Resource Name
          </label>
          <input
            required
            type="text"
            name="name"
            placeholder="e.g. Main Auditorium, CS Lab 1"
            value={formData.name}
            onChange={handleChange}
            className="form-control"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">
              <FaTag style={{ marginRight: '0.5rem', color: '#003366' }} />
              Resource Type
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="form-control"
            >
              <option value="ROOM">Room</option>
              <option value="LAB">Lab</option>
              <option value="EQUIPMENT">Equipment</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">
              <FaUsers style={{ marginRight: '0.5rem', color: '#003366' }} />
              Capacity
            </label>
            <input
              required
              type="number"
              min="1"
              name="capacity"
              value={formData.capacity}
              onChange={handleChange}
              className="form-control"
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">
            <FaMapMarkerAlt style={{ marginRight: '0.5rem', color: '#003366' }} />
            Location
          </label>
          <input
            required
            type="text"
            name="location"
            placeholder="e.g. Block B, 2nd Floor"
            value={formData.location}
            onChange={handleChange}
            className="form-control"
          />
        </div>

        <div className="form-group">
          <label className="form-label">
            <FaInfoCircle style={{ marginRight: '0.5rem', color: '#003366' }} />
            Description
          </label>
          <textarea
            name="description"
            placeholder="Describe the resource features and available facilities..."
            value={formData.description}
            onChange={handleChange}
            className="form-control"
            rows="3"
          ></textarea>
        </div>

        {isEditMode && (
          <div className="form-group">
            <label className="form-label">
              <FaInfoCircle style={{ marginRight: '0.5rem', color: '#003366' }} />
              Current Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="form-control"
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="OUT_OF_SERVICE">OUT_OF_SERVICE</option>
              <option value="MAINTENANCE">MAINTENANCE</option>
            </select>
          </div>
        )}

        <div className="form-actions">
          <button type="button" onClick={onCancel} className="btn-cancel" >
            <FaTimes style={{ marginRight: '0.5rem' }} />
            Cancel
          </button>
          <button type="submit" disabled={loading} className="btn-submit">
            {loading ? (
              <>Saving<span className="loading-dots"></span></>
            ) : (
              <>
                <FaSave style={{ marginRight: '0.5rem' }} />
                {isEditMode ? 'Update Resource' : 'Save Resource'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ResourceForm;

