import { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import { useAuth } from '../../auth/AuthProvider'
import { uploadProfilePicture, deleteProfilePicture, changePassword, updateUser } from '../../services/roleService'
import { getImageUrl } from '../../api/apiClient'
import { FiUpload, FiTrash2, FiEye, FiEyeOff } from 'react-icons/fi'
import { FaSpinner, FaCheck, FaTimes } from 'react-icons/fa'

export default function AdminSettingsTab() {
  const { user, token, refreshMe } = useAuth()
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

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Only JPG, PNG, and WebP formats are allowed')
      return
    }

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
  const handleCropAndUpload = async () => {
    try {
      setLoading(true)
      setError('')

      const croppedBlob = await getCroppedImg(uploadImage, croppedAreaPixels)
      const formData = new FormData()
      formData.append('file', croppedBlob, 'profile.jpg')

      await uploadProfilePicture(token, user.id, formData)
      await refreshMe()

      setSuccess('Profile picture updated successfully')
      setUploadImage(null)
      setShowCropModal(false)
      setSelectedFile(null)

      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to upload picture')
    } finally {
      setLoading(false)
    }
  }

  // Delete profile picture
  const handleDeletePicture = async () => {
    if (!window.confirm('Are you sure you want to delete your profile picture?')) {
      return
    }

    try {
      setLoading(true)
      setError('')
      await deleteProfilePicture(token, user.id)
      await refreshMe()

      setSuccess('Profile picture deleted successfully')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete picture')
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
      await refreshMe()

      setSuccess('Name updated successfully')
      setEditName(false)

      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update name')
    } finally {
      setLoading(false)
    }
  }

  // Change password
  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('All password fields are required')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match')
      return
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters')
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

  if (!user) {
    return <div className="text-center py-8">Loading...</div>
  }

  const hasPassword = user.hasPassword

  return (
    <div className="space-y-6 max-w-2xl">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2 animate-slideDown">
          <FaTimes className="w-5 h-5" />
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 flex items-center gap-2 animate-slideDown">
          <FaCheck className="w-5 h-5" />
          {success}
        </div>
      )}

      {/* Profile Picture Section */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 space-y-6">
        <h2 className="text-xl font-bold text-gray-900">Profile Picture</h2>

        <div className="flex gap-8">
          <div className="flex-shrink-0">
            {user.profilePictureUrl ? (
              <img
                src={getImageUrl(user.profilePictureUrl)}
                alt="Profile"
                className="w-24 h-24 rounded-lg object-cover border border-gray-300"
              />
            ) : (
              <div className="w-24 h-24 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-3xl font-bold border border-gray-300">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="flex-1">
            <div className="space-y-3">
              <label className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
                <FiUpload className="w-4 h-4" />
                Upload Photo
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileSelect}
                  disabled={loading}
                  className="hidden"
                />
              </label>

              {user.profilePictureUrl && (
                <button
                  onClick={handleDeletePicture}
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400"
                >
                  <FiTrash2 className="w-4 h-4" />
                  Delete Photo
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Crop Modal */}
        {showCropModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
              <h3 className="text-lg font-bold text-gray-900">Crop Your Photo</h3>

              <div className="relative w-full h-80 bg-gray-100 rounded-lg overflow-hidden">
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Zoom</label>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.1}
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowCropModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCropAndUpload}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 font-medium flex items-center justify-center gap-2"
                >
                  {loading ? <FaSpinner className="animate-spin" /> : null}
                  Upload
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Profile Information Section */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 space-y-6">
        <h2 className="text-xl font-bold text-gray-900">Profile Information</h2>

        {/* Name */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Name</label>
          {editName ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-gray-900"
              />
              <button
                onClick={handleUpdateName}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setEditName(false)
                  setNewName(user.name)
                }}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-gray-900 font-medium">{user.name}</p>
              <button
                onClick={() => setEditName(true)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
              >
                Edit
              </button>
            </div>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
          <p className="px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900">{user.email}</p>
          <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
        </div>

        {/* Role */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Role</label>
          <p className="px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 font-medium">
            {user.role}
          </p>
          <p className="text-xs text-gray-500 mt-1">Role cannot be changed</p>
        </div>
      </div>

      {/* Password Change Section */}
      {hasPassword && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 space-y-6">
          <h2 className="text-xl font-bold text-gray-900">Password & Security</h2>

          {showPasswordForm ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter your current password"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-gray-900 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-900"
                  >
                    {showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-gray-900 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-900"
                  >
                    {showNewPassword ? <FaEyeOff /> : <FaEye />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-gray-900"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleChangePassword}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 font-medium"
                >
                  {loading ? 'Updating...' : 'Change Password'}
                </button>
                <button
                  onClick={() => {
                    setShowPasswordForm(false)
                    setCurrentPassword('')
                    setNewPassword('')
                    setConfirmPassword('')
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowPasswordForm(true)}
              className="w-full px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Change Password
            </button>
          )}
        </div>
      )}

      <style>{`
        @keyframes slideDown {
          from {
            transform: translateY(-10px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease;
        }
      `}</style>
    </div>
  )
}
