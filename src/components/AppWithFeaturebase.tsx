import { FeaturebaseProvider } from 'featurebase-js/react';
import App from '../App';

const DEFAULT_FEATUREBASE_APP_ID = '6a60928825dbb0ae9df349c2';
const featurebaseAppId = import.meta.env.VITE_FEATUREBASE_APP_ID || DEFAULT_FEATUREBASE_APP_ID;

export default function AppWithFeaturebase() {
  return (
    <FeaturebaseProvider appId={featurebaseAppId}>
      <App />
    </FeaturebaseProvider>
  );
}
