import { useState } from 'react'
import { useStore } from '../store'

export default function ProfilePage() {
  const profile = useStore((s) => s.profile)
  const setProfile = useStore((s) => s.setProfile)
  const [name, setName] = useState(profile.name || '')

  const onAvatar = (e) => {
    const file = e.target.files && e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setProfile({ avatar: reader.result })
    reader.readAsDataURL(file)
  }

  const saveName = () => setProfile({ name: name.trim() })

  return (
    <div className="profile-wrap">
      <div className="profile-card">
        <div className="profile-avatar-wrap">
          {profile.avatar ? (
            <img className="profile-avatar" src={profile.avatar} alt="" />
          ) : (
            <div className="profile-logo">盯</div>
          )}
        </div>
        <div className="profile-app-name">盯一眼</div>
        <div className="profile-app-en">GLANCE</div>

        <div className="profile-divider" />

        <div className="profile-field">
          <label className="profile-label">账号名</label>
          <div className="profile-name-row">
            <input
              className="form-input"
              value={name}
              placeholder="给自己起个名字"
              onChange={(e) => setName(e.target.value)}
            />
            <button className="btn-primary" onClick={saveName}>
              保存
            </button>
          </div>
          <div className="profile-hint">用于首页问候语，例如「晚上好，小明」</div>
        </div>

        <div className="profile-field">
          <label className="profile-label">头像</label>
          <div className="profile-avatar-row">
            <label className="avatar-upload">
              上传头像
              <input type="file" accept="image/*" onChange={onAvatar} hidden />
            </label>
            {profile.avatar && (
              <button
                className="btn-secondary"
                onClick={() => setProfile({ avatar: null })}
              >
                移除头像
              </button>
            )}
          </div>
        </div>

        <div className="profile-divider" />

        <div className="profile-line text-3">版本 1.0.0</div>
        <div className="profile-line">
          <strong>盯一眼 · Yuyuet Mo 出品</strong>
        </div>
      </div>
    </div>
  )
}
