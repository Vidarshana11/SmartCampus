export default function NotificationsPanel() {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h2>📢 Announcements & Notifications</h2>
      <p style={{ color: '#666', marginTop: '1rem' }}>
        Create and broadcast announcements to users. Module will include:
      </p>
      <ul style={{ color: '#666', textAlign: 'left', display: 'inline-block', marginTop: '1rem' }}>
        <li>Send announcements to all users or specific roles</li>
        <li>Schedule announcements for later</li>
        <li>View announcement history and delivery stats</li>
        <li>System notification categories (SYSTEM, MAINTENANCE, EVENT, ALERT)</li>
      </ul>
    </div>
  )
}
