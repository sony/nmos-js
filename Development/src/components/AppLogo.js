import AppLogoAsset from '../assets/LOGO_CVE_HD.png';

const AppLogoStyle = {
    padding: '4px',
    margin: '16px',
    maxWidth: '50%',
};

export const AppLogo = ({
    src = AppLogoAsset,
    style = { ...AppLogoStyle },
    ...props
}) => <img src={src} style={style} alt="Logo" {...props} />;

export default AppLogo;
