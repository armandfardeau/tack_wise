import { FeaturebaseProvider, useFeedbackWidget } from 'featurebase-js/react';
import App from '../App';

const DEFAULT_FEATUREBASE_APP_ID = '6a60928825dbb0ae9df349c2';
const featurebaseAppId = import.meta.env.VITE_FEATUREBASE_APP_ID || DEFAULT_FEATUREBASE_APP_ID;
const FEEDBACK_WIDGET_CONFIG = {
  theme: 'light',
  placement: 'bottom-right',
  locale: 'en',
} as const;

function FeaturebaseFeedbackWidget() {
  useFeedbackWidget(FEEDBACK_WIDGET_CONFIG);
  return null;
}

export default function AppWithFeaturebase() {
  return (
    <FeaturebaseProvider appId={featurebaseAppId}>
      <FeaturebaseFeedbackWidget />
      <App />
    </FeaturebaseProvider>
  );
}
