import { Image } from 'react-native';

const logo = require('../../assets/logo.png');
const RATIO = 1200 / 731; // logo.png width / height

/** The dresséy logo (hanger, wordmark, DRESS HOUSE). Sits on the ivory background. */
export function Wordmark({ width = 200 }: { width?: number }) {
  return <Image source={logo} style={{ width, height: width / RATIO }} resizeMode="contain" accessibilityLabel="dresséy dress house" />;
}
