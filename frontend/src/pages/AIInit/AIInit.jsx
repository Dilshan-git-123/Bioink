import React from 'react';
import { useNavigate } from 'react-router-dom';
import SplashScreen from '../../components/SplashScreen/SplashScreen';

/**
 * AIInit — AI Initialization Screen
 * Triggered after successful login. Reuses the SplashScreen component
 * as a personalized "workspace loading" experience, then navigates to /welcome.
 */
const AIInit = () => {
    const navigate = useNavigate();

    return (
        <SplashScreen onDone={() => navigate('/welcome', { replace: true })} />
    );
};

export default AIInit;
