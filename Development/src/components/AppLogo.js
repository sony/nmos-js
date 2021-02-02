import AppLogoAsset from '../assets/sea-lion.png';

const AppLogoStyle = {
    border: '1px solid lightgray',
    borderRadius: '50%',
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
