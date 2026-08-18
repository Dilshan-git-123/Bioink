import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  FaUserCircle, FaEdit, FaSave, FaTimes, FaCamera,
  FaEnvelope, FaBuilding, FaFlask, FaMapMarkerAlt,
  FaGlobe, FaPhone, FaCalendarAlt, FaTrash, FaBriefcase,
  FaCheckCircle, FaExclamationTriangle
} from 'react-icons/fa';
import { getCurrentUser, updateProfile, uploadAvatar } from '../../services/authService';
import './Profile.css';

const Profile = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fileInputRef = useRef(null);

  const [user, setUser] = useState(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [toast, setToast] = useState(null); // {type:'success'|'error', msg}
  const [form, setForm] = useState({
    name: '', role: '', institution: '', department: '',
    research_interests: '', bio: '', location: '', website: '', phone: ''
  });

  // Load user from backend on mount
  useEffect(() => {
    const load = async () => {
      try {
        const data = await getCurrentUser();
        if (!data) { navigate('/login'); return; }
        setUser(data);
        setForm({
          name: data.name || '',
          role: data.role || '',
          institution: data.institution || '',
          department: data.department || '',
          research_interests: data.research_interests || '',
          bio: data.bio || '',
          location: data.location || '',
          website: data.website || '',
          phone: data.phone || '',
        });
        // Auto-open edit mode if navigated via ?edit=true
        if (searchParams.get('edit') === 'true') setEditing(true);
      } catch (e) {
        showToast('error', 'Could not load profile.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) { showToast('error', 'Name cannot be empty.'); return; }
    setSaving(true);
    try {
      const updated = await updateProfile(form);
      setUser(updated);
      setEditing(false);
      showToast('success', 'Profile saved successfully!');
      // Dispatch custom event so Header re-reads localStorage
      window.dispatchEvent(new Event('profile-updated'));
    } catch (e) {
      showToast('error', e.message || 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setForm({
      name: user.name || '', role: user.role || '',
      institution: user.institution || '', department: user.department || '',
      research_interests: user.research_interests || '', bio: user.bio || '',
      location: user.location || '', website: user.website || '', phone: user.phone || '',
    });
    setEditing(false);
  };

  const handleAvatarClick = () => {
    if (editing) fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
      showToast('error', 'Only JPEG, PNG, GIF, or WebP images are allowed.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showToast('error', 'Image must be smaller than 2 MB.');
      return;
    }
    setAvatarUploading(true);
    try {
      const updated = await uploadAvatar(file);
      setUser(updated);
      showToast('success', 'Profile picture updated!');
      window.dispatchEvent(new Event('profile-updated'));
    } catch (e) {
      showToast('error', e.message || 'Failed to upload image.');
    } finally {
      setAvatarUploading(false);
      e.target.value = '';
    }
  };

  const handleRemoveAvatar = async () => {
    setSaving(true);
    try {
      const updated = await updateProfile({ ...form, profile_picture: null });
      setUser(updated);
      showToast('success', 'Profile picture removed.');
      window.dispatchEvent(new Event('profile-updated'));
    } catch (e) {
      showToast('error', 'Failed to remove picture.');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (iso) => {
    if (!iso) return 'N/A';
    try { return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }); }
    catch { return iso; }
  };

  if (loading) return (
    <div className="profile-loading">
      <div className="profile-spinner" />
      <p>Loading profile…</p>
    </div>
  );

  return (
    <div className="profile-page">

      {/* Toast */}
      {toast && (
        <div className={`profile-toast profile-toast--${toast.type}`}>
          {toast.type === 'success' ? <FaCheckCircle /> : <FaExclamationTriangle />}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Hero / Avatar Header */}
      <div className="profile-hero">
        <div className="profile-hero-bg" />
        <div className="profile-avatar-wrap">
          <div className={`profile-avatar ${editing ? 'profile-avatar--editable' : ''}`} onClick={handleAvatarClick}>
            {avatarUploading ? (
              <div className="profile-avatar-spinner" />
            ) : user?.profile_picture ? (
              <img src={user.profile_picture} alt="Avatar" className="profile-avatar-img" />
            ) : (
              <FaUserCircle className="profile-avatar-icon" />
            )}
            {editing && (
              <div className="profile-avatar-overlay">
                <FaCamera />
                <span>Change Photo</span>
              </div>
            )}
          </div>
          {editing && user?.profile_picture && (
            <button className="profile-remove-avatar-btn" onClick={handleRemoveAvatar} title="Remove photo">
              <FaTrash /> Remove
            </button>
          )}
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" style={{ display: 'none' }} onChange={handleFileChange} />
        </div>

        <div className="profile-hero-info">
          <h1>{user?.name || 'Unnamed User'}</h1>
          <p className="profile-role">{user?.role || 'Researcher'}</p>
          {user?.institution && <p className="profile-institution"><FaBuilding /> {user.institution}</p>}
          {user?.location && <p className="profile-location-small"><FaMapMarkerAlt /> {user.location}</p>}
        </div>

        <div className="profile-hero-actions">
          {!editing ? (
            <button className="profile-edit-btn" onClick={() => setEditing(true)}>
              <FaEdit /> Edit Profile
            </button>
          ) : (
            <div className="profile-edit-actions">
              <button className="profile-save-btn" onClick={handleSave} disabled={saving}>
                <FaSave /> {saving ? 'Saving…' : 'Save Changes'}
              </button>
              <button className="profile-cancel-btn" onClick={handleCancel} disabled={saving}>
                <FaTimes /> Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content Grid */}
      <div className="profile-content-grid">

        {/* Left Column — Personal Info + Bio */}
        <div className="profile-left-col">

          {/* Personal Info Card */}
          <div className="profile-card">
            <h3 className="profile-card-title">Personal Information</h3>
            <div className="profile-fields">

              <div className="profile-field">
                <label><FaUserCircle className="pf-icon" /> Full Name</label>
                {editing ? (
                  <input className="profile-input" name="name" value={form.name} onChange={handleChange} placeholder="Your full name" />
                ) : (
                  <span className="profile-value">{user?.name || <em className="profile-empty">Not set</em>}</span>
                )}
              </div>

              <div className="profile-field">
                <label><FaBriefcase className="pf-icon" /> Professional Role</label>
                {editing ? (
                  <input className="profile-input" name="role" value={form.role} onChange={handleChange} placeholder="e.g. Biomedical Researcher" />
                ) : (
                  <span className="profile-value">{user?.role || <em className="profile-empty">Not set</em>}</span>
                )}
              </div>

              <div className="profile-field">
                <label><FaEnvelope className="pf-icon" /> Email Address</label>
                <span className="profile-value profile-value--readonly">{user?.email}
                  <span className="profile-readonly-badge">Read-only</span>
                </span>
              </div>

              <div className="profile-field">
                <label><FaBuilding className="pf-icon" /> Institution / Organization</label>
                {editing ? (
                  <input className="profile-input" name="institution" value={form.institution} onChange={handleChange} placeholder="e.g. MIT, Johns Hopkins" />
                ) : (
                  <span className="profile-value">{user?.institution || <em className="profile-empty">Not set</em>}</span>
                )}
              </div>

              <div className="profile-field">
                <label><FaFlask className="pf-icon" /> Department</label>
                {editing ? (
                  <input className="profile-input" name="department" value={form.department} onChange={handleChange} placeholder="e.g. Biomedical Engineering" />
                ) : (
                  <span className="profile-value">{user?.department || <em className="profile-empty">Not set</em>}</span>
                )}
              </div>

              <div className="profile-field">
                <label><FaMapMarkerAlt className="pf-icon" /> Location</label>
                {editing ? (
                  <input className="profile-input" name="location" value={form.location} onChange={handleChange} placeholder="e.g. Boston, MA" />
                ) : (
                  <span className="profile-value">{user?.location || <em className="profile-empty">Not set</em>}</span>
                )}
              </div>

              <div className="profile-field">
                <label><FaGlobe className="pf-icon" /> Website / Research Profile</label>
                {editing ? (
                  <input className="profile-input" name="website" value={form.website} onChange={handleChange} placeholder="https://..." />
                ) : (
                  <span className="profile-value">
                    {user?.website
                      ? <a href={user.website} target="_blank" rel="noreferrer">{user.website}</a>
                      : <em className="profile-empty">Not set</em>}
                  </span>
                )}
              </div>

              <div className="profile-field">
                <label><FaPhone className="pf-icon" /> Phone (optional)</label>
                {editing ? (
                  <input className="profile-input" name="phone" value={form.phone} onChange={handleChange} placeholder="+1 000 000 0000" />
                ) : (
                  <span className="profile-value">{user?.phone || <em className="profile-empty">Not set</em>}</span>
                )}
              </div>

            </div>
          </div>

          {/* Account Info */}
          <div className="profile-card profile-card--secondary">
            <h3 className="profile-card-title">Account Information</h3>
            <div className="profile-fields">
              <div className="profile-field">
                <label><FaCalendarAlt className="pf-icon" /> Member Since</label>
                <span className="profile-value">{formatDate(user?.created_at)}</span>
              </div>
              <div className="profile-field">
                <label><FaCalendarAlt className="pf-icon" /> Last Login</label>
                <span className="profile-value">{formatDate(user?.last_login)}</span>
              </div>
              <div className="profile-field">
                <label>Login Provider</label>
                <span className="profile-value profile-provider-badge">
                  {user?.provider || 'Local Account'}
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column — Bio + Research Interests */}
        <div className="profile-right-col">

          <div className="profile-card">
            <h3 className="profile-card-title">About Me</h3>
            {editing ? (
              <textarea
                className="profile-textarea"
                name="bio"
                value={form.bio}
                onChange={handleChange}
                placeholder="Write a short bio about yourself, your background, and your research focus..."
                rows={5}
              />
            ) : (
              <p className="profile-bio-text">
                {user?.bio || <em className="profile-empty">No bio written yet. Click Edit Profile to add one.</em>}
              </p>
            )}
          </div>

          <div className="profile-card">
            <h3 className="profile-card-title">Research Interests</h3>
            {editing ? (
              <textarea
                className="profile-textarea"
                name="research_interests"
                value={form.research_interests}
                onChange={handleChange}
                placeholder="e.g. Bioprinting, Hydrogels, Tissue Engineering, Regenerative Medicine..."
                rows={4}
              />
            ) : (
              <p className="profile-bio-text">
                {user?.research_interests || <em className="profile-empty">No research interests added yet.</em>}
              </p>
            )}
          </div>

          {/* Quick Stats */}
          <div className="profile-card profile-card--stats">
            <h3 className="profile-card-title">Platform Activity</h3>
            <div className="profile-stats-grid">
              <div className="profile-stat">
                <span className="profile-stat-num">—</span>
                <span className="profile-stat-label">Projects</span>
              </div>
              <div className="profile-stat">
                <span className="profile-stat-num">—</span>
                <span className="profile-stat-label">Experiments</span>
              </div>
              <div className="profile-stat">
                <span className="profile-stat-num">—</span>
                <span className="profile-stat-label">Predictions</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Profile;
