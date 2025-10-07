export default function BasicPage() {
  return (
    <div style={{ 
      padding: '40px', 
      color: 'white', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column'
    }}>
      <h1 style={{ fontSize: '48px', marginBottom: '20px' }}>✅ Basic Page Works!</h1>
      <p style={{ fontSize: '18px', textAlign: 'center' }}>
        This page has no imports - testing basic Next.js 12 routing.
      </p>
    </div>
  );
}
