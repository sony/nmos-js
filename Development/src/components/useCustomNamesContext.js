import { useContext } from 'react';
import CustomNamesContext from './CustomNamesContext';

export const useCustomNamesContext = () => useContext(CustomNamesContext);
export default useCustomNamesContext;
