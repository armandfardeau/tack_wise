import { FeaturebaseProvider } from 'featurebase-js/react';
import App from '../App';

const featurebaseAppId = import.meta.env.VITE_FEATUREBASE_APP_ID;

export default function AppWithFeaturebase() {
  if (!featurebaseAppId) return <App />;

  return (
    <FeaturebaseProvider appId={featurebaseAppId} messenger={false}>
      <App />
    </FeaturebaseProvider>
  );
}
