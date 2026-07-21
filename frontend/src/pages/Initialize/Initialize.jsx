import React from 'react';
import { useNavigate } from 'react-router-dom';
import SplashScreen from '../../components/SplashScreen/SplashScreen';

const Initialize = () => {
    const navigate = useNavigate();
    return <SplashScreen onDone={() => navigate('/welcome')} />;
};

export default Initialize;
