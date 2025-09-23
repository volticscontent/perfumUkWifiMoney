import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function DebugUTM() {
  const [urlParams, setUrlParams] = useState<string>('');
  const [allParams, setAllParams] = useState<[string, string][]>([]);
  const [windowLocation, setWindowLocation] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    console.log('🔍 [Debug UTM] useEffect executado');
    console.log('🔍 [Debug UTM] router.query:', router.query);
    
    if (typeof window !== 'undefined') {
      console.log('🔍 [Debug UTM] window.location.href:', window.location.href);
      console.log('🔍 [Debug UTM] window.location.search:', window.location.search);
      
      const params = new URLSearchParams(window.location.search);
      console.log('🔍 [Debug UTM] URLSearchParams toString:', params.toString());
      console.log('🔍 [Debug UTM] URLSearchParams entries:', Array.from(params.entries()));
      
      setWindowLocation(window.location.href);
      setUrlParams(params.toString());
      setAllParams(Array.from(params.entries()));
    }
  }, [router.query]);

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Debug UTM Parameters</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>Router Query:</h2>
        <pre>{JSON.stringify(router.query, null, 2)}</pre>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>Window Location:</h2>
        <p>{windowLocation}</p>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>URL Search Params (toString):</h2>
        <p>{urlParams}</p>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>All Parameters:</h2>
        <ul>
          {allParams.map(([key, value], index) => (
            <li key={index}><strong>{key}:</strong> {value}</li>
          ))}
        </ul>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>Specific UTM Tests:</h2>
        <p><strong>utm_campaign:</strong> {router.query.utm_campaign || 'não encontrado'}</p>
        <p><strong>utm_campaing:</strong> {router.query.utm_campaing || 'não encontrado'}</p>
        <p><strong>utm_campain:</strong> {router.query.utm_campain || 'não encontrado'}</p>
      </div>
    </div>
  );
}