import React, { useState, useEffect } from 'react';
import './SplashScreen.css';

const STATUS_MESSAGES = [
    "Initializing AI Workspace...",
    "Loading AI Prediction Engine...",
    "Connecting Biomaterial Knowledge Base...",
    "Preparing Personalized Dashboard...",
    "Loading Research Environment...",
    "Finalizing Workspace..."
];

// Total splash visible duration in ms before fade-out begins
const SPLASH_DURATION = 2800;
// Hold duration at 100% before fading out
const HOLD_DURATION = 400;
// Fade-out animation duration (must match CSS transition)
const FADE_DURATION = 600;
// How long each status message shows
const MSG_INTERVAL = (SPLASH_DURATION) / STATUS_MESSAGES.length;

const SplashScreen = ({ onDone }) => {
    const [msgIndex, setMsgIndex] = useState(0);
    const [msgVisible, setMsgVisible] = useState(true);
    const [fadingOut, setFadingOut] = useState(false);

    // Cycle through status messages
    useEffect(() => {
        if (msgIndex >= STATUS_MESSAGES.length - 1) return;

        const timer = setTimeout(() => {
            // Fade out current message
            setMsgVisible(false);
            setTimeout(() => {
                setMsgIndex((i) => i + 1);
                setMsgVisible(true);
            }, 200);
        }, MSG_INTERVAL);

        return () => clearTimeout(timer);
    }, [msgIndex]);

    // Trigger fade-out and call onDone
    useEffect(() => {
        const fadeTimer = setTimeout(() => {
            setFadingOut(true);
            setTimeout(() => {
                if (onDone) onDone();
            }, FADE_DURATION);
        }, SPLASH_DURATION + HOLD_DURATION);

        return () => clearTimeout(fadeTimer);
    }, [onDone]);

    return (
        <div className={`splash-screen ${fadingOut ? 'splash-fadeout' : ''}`}>

            {/* Scientific subtle background */}
            <div className="init-bg"></div>



            {/* Center content */}
            <div className="splash-center">
                {/* Brand name */}
                <h1 className="splash-brand">BioInkAI</h1>
                <p className="splash-subtitle">Premium Research Workspace</p>

                {/* Animated progress bar container */}
                <div className="modern-progress-container">
                    <div 
                        className="modern-progress-bar"
                        style={{ animationDuration: `${SPLASH_DURATION}ms` }}
                    ></div>
                </div>

                {/* Status message */}
                <div className="splash-status-wrap">
                    <p className={`splash-status ${msgVisible ? 'status-in' : 'status-out'}`}>
                        {STATUS_MESSAGES[msgIndex]}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SplashScreen;
