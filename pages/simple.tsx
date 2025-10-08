import Link from 'next/link';

export default function SimplePage() {
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
      <h1 style={{ fontSize: '48px', marginBottom: '20px' }}>✅ Simple Page Works!</h1>
      <p style={{ fontSize: '18px', textAlign: 'center' }}>
        If you can see this, Next.js 12 routing is working correctly.
      </p>
      <div style={{ marginTop: '20px' }}>
        <Link href="/" style={{ 
          color: 'white', 
          textDecoration: 'underline',
          fontSize: '16px'
        }}>
          ← Go back to home
        </Link>
      </div>
    </div>
  );
}
