import React, { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { uploadProfilePicture, deleteProfilePicture, changePassword, updateUser, deleteAccount } from '../services/roleService'
import { getImageUrl } from '../api/apiClient'
import { FiUpload, FiTrash2, FiEye, FiEyeOff } from 'react-icons/fi'
import '../styles/AccountManagement.css'

const AccountManagement = () => {
  const navigate = useNavigate()
  const { user, token, refreshMe, logout } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Profile info state
  const [editName, setEditName] = useState(false)
  const [newName, setNewName] = useState(user?.name || '')

  // Profile picture upload state
  const [uploadImage, setUploadImage] = useState(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)
  const [showCropModal, setShowCropModal] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)

  // Password change state
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  // Handle file selection
  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Only JPG, PNG, and WebP formats are allowed')
      return
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setUploadImage(reader.result)
      setSelectedFile(file)
      setShowCropModal(true)
      setError('')
    }
    reader.readAsDataURL(file)
  }

  // Create cropped image blob
  const getCroppedImg = async (imageSrc, pixelCrop) => {
    const image = new Image()
    image.src = imageSrc

    return new Promise((resolve) => {
      image.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')

        canvas.width = pixelCrop.width
        canvas.height = pixelCrop.height

        ctx.drawImage(
          image,
          pixelCrop.x,
          pixelCrop.y,
          pixelCrop.width,
          pixelCrop.height,
          0,
          0,
          pixelCrop.width,
          pixelCrop.height
        )

        canvas.toBlob((blob) => {
          resolve(blob)
        }, 'image/jpeg')
      }
    })
  }

  // Apply crop and upload
  const handleApplyCrop = async () => {
    if (!uploadImage || !croppedAreaPixels) return

    try {
      setLoading(true)
      setError('')
      const croppedBlob = await getCroppedImg(uploadImage, croppedAreaPixels)
      const croppedFile = new File([croppedBlob], selectedFile.name, { type: 'image/jpeg' })

      const response = await uploadProfilePicture(token, user.id, croppedFile)
      setSuccess('Profile picture updated successfully')
      setShowCropModal(false)
      setUploadImage(null)
      setSelectedFile(null)
      refreshMe()

      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to upload profile picture')
    } finally {
      setLoading(false)
    }
  }

  // Delete profile picture
  const handleDeletePicture = async () => {
    if (!window.confirm('Are you sure you want to delete your profile picture?')) return

    try {
      setLoading(true)
      setError('')
      await deleteProfilePicture(token, user.id)
      setSuccess('Profile picture deleted successfully')
      refreshMe()

      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete profile picture')
    } finally {
      setLoading(false)
    }
  }

  // Update name
  const handleUpdateName = async () => {
    if (!newName.trim()) {
      setError('Name cannot be empty')
      return
    }

    try {
      setLoading(true)
      setError('')
      await updateUser(token, user.id, { name: newName })
      setSuccess('Name updated successfully')
      setEditName(false)
      refreshMe()

      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update name')
    } finally {
      setLoading(false)
    }
  }

  // Change password
  const handleChangePassword = async () => {
    // Validation
    if (!currentPassword) {
      setError('Current password is required')
      return
    }

    if (!newPassword) {
      setError('New password is required')
      return
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    try {
      setLoading(true)
      setError('')
      await changePassword(token, user.id, { currentPassword, newPassword })
      setSuccess('Password changed successfully')
      setShowPasswordForm(false)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')

      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to change password')
    } finally {
      setLoading(false)
    }
  }

  // Delete account
  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure? This action cannot be undone and will permanently delete your account.')) {
      return
    }

    try {
      setLoading(true)
      setError('')
      await deleteAccount(token, user.id)
      setSuccess('Account deleted successfully. Redirecting...')

      // Wait a moment then logout and redirect
      setTimeout(() => {
        logout()
        navigate('/login')
      }, 1500)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete account')
      setLoading(false)
    }
  }

  if (!user) {
    return <div className="account-container">Loading...</div>
  }

  const hasPassword = user.hasPassword

  return (
    <div className="account-container">
      <div className="account-header">
        <h1>Account Settings</h1>
        <p>Manage your personal information and account security</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Profile Picture Section */}
      <div className="account-card">
        <h2>Profile Picture</h2>
        <div className="profile-picture-section">
          <div className="picture-preview">
            {user.profilePictureUrl ? (
              <img src={getImageUrl(user.profilePictureUrl)} alt="Profile" />
            ) : (
              <div className="avatar-placeholder">
                <span>{user.name.charAt(0).toUpperCase()}</span>
              </div>
            )}
          </div>

          <div className="picture-actions">
            <label className="btn-upload">
              <FiUpload /> Upload Photo
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileSelect}
                disabled={loading}
                style={{ display: 'none' }}
              />
            </label>

            {user.profilePictureUrl && (
              <button className="btn-delete" onClick={handleDeletePicture} disabled={loading}>
                <FiTrash2 /> Delete Photo
              </button>
            )}
          </div>

          {showCropModal && (
            <div className="crop-modal">
              <div className="crop-modal-content">
                <h3>Crop Your Photo</h3>
                <div className="crop-container">
                  <Cropper
                    image={uploadImage}
                    crop={crop}
                    zoom={zoom}
                    aspect={1}
                    onCropChange={setCrop}
                    onCropComplete={onCropComplete}
                    onZoomChange={setZoom}
                  />
                </div>

                <div className="crop-controls">
                  <div className="zoom-control">
                    <label>Zoom:</label>
                    <input
                      type="range"
                      min="1"
                      max="3"
                      step="0.1"
                      value={zoom}
                      onChange={(e) => setZoom(parseFloat(e.target.value))}
                    />
                  </div>
                </div>

                <div className="crop-buttons">
                  <button className="btn-cancel" onClick={() => setShowCropModal(false)}>
                    Cancel
                  </button>
                  <button className="btn-apply" onClick={handleApplyCrop} disabled={loading}>
                    {loading ? 'Uploading...' : 'Apply & Upload'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Profile Information Section */}
      <div className="account-card">
        <h2>Profile Information</h2>

        <div className="form-group">
          <label>Name</label>
          {editName ? (
            <div className="edit-field">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                disabled={loading}
              />
              <div className="field-buttons">
                <button className="btn-cancel" onClick={() => setEditName(false)}>
                  Cancel
                </button>
                <button className="btn-primary" onClick={handleUpdateName} disabled={loading}>
                  {loading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          ) : (
            <div className="view-field">
              <span>{user.name}</span>
              <button className="btn-edit" onClick={() => setEditName(true)}>
                Edit
              </button>
            </div>
          )}
        </div>

        <div className="form-group">
          <label>Email</label>
          <div className="view-field">
            <span>{user.email}</span>
            <span className="read-only-badge">Read-only</span>
          </div>
        </div>

        <div className="form-group">
          <label>Role</label>
          <div className="view-field">
            <span className="role-badge">{user.role}</span>
            <span className="read-only-badge">Cannot change</span>
          </div>
        </div>
      </div>

      {/* Password Change Section (only for non-OAuth users) */}
      {hasPassword && (
        <div className="account-card">
          <h2>Security</h2>

          {!showPasswordForm ? (
            <button className="btn-change-password" onClick={() => setShowPasswordForm(true)}>
              Change Password
            </button>
          ) : (
            <div className="password-form">
              <div className="form-group">
                <label>Current Password</label>
                <div className="password-input">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    disabled={loading}
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="toggle-password"
                  >
                    {showCurrentPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>New Password</label>
                <div className="password-input">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={loading}
                    placeholder="Enter new password (min 6 characters)"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="toggle-password"
                  >
                    {showNewPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  placeholder="Confirm new password"
                />
              </div>

              <div className="password-form-buttons">
                <button className="btn-cancel" onClick={() => setShowPasswordForm(false)}>
                  Cancel
                </button>
                <button className="btn-primary" onClick={handleChangePassword} disabled={loading}>
                  {loading ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Danger Zone - Delete Account */}
      <div className="account-card danger-zone">
        <h2>Danger Zone</h2>
        <p className="danger-warning">
          Once you delete your account, there is no going back. Please be certain.
        </p>
        <button
          className="btn-delete-account"
          onClick={handleDeleteAccount}
          disabled={loading}
        >
          {loading ? 'Deleting Account...' : 'Delete Account'}
        </button>
      </div>
    </div>
  )
}

export default AccountManagement
