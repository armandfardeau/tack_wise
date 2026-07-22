import { useFeedbackWidget } from 'featurebase-js/react';
import type { Theme } from '../types';

interface FeaturebaseFeedbackHostProps {
  theme: Theme;
}

export default function FeaturebaseFeedbackHost({ theme }: FeaturebaseFeedbackHostProps) {
  useFeedbackWidget({
    theme,
    metadata: {
      source: 'tack-wise',
    },
  });

  return null;
}
