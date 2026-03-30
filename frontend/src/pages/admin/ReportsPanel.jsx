export default function ReportsPanel() {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h2>📊 Reports & Analytics</h2>
      <p style={{ color: '#666', marginTop: '1rem' }}>
        View comprehensive analytics and reports. Module will include:
      </p>
      <ul style={{ color: '#666', textAlign: 'left', display: 'inline-block', marginTop: '1rem' }}>
        <li>User statistics (breakdown by role, growth trends)</li>
        <li>Resource utilization reports with charts</li>
        <li>Booking trends and approval rates</li>
        <li>System health indicators</li>
        <li>Export reports to CSV/PDF</li>
        <li>Date range filtering for all reports</li>
      </ul>
    </div>
  )
}
