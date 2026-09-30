import logo from '@mobile/assets/logo.png';

const RATIO = 1200 / 731; // logo.png width / height

/** The dresséy logo (hanger, wordmark, DRESS HOUSE). Sits on the ivory background. */
export function Wordmark({ width = 200 }: { width?: number }) {
  return <img src={logo} width={width} height={Math.round(width / RATIO)} alt="dresséy dress house" className="wordmark" />;
}
