import { useEffect, useState, useRef } from 'react';

export default function CursorFollower() {
    const [isHovering, setIsHovering] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [isTouchDevice, setIsTouchDevice] = useState(false);
    const cursorRef = useRef(null);
    const outerRingRef = useRef(null);
    const rafId = useRef(null);
    const mousePos = useRef({ x: 0, y: 0 });
    const cursorPos = useRef({ x: 0, y: 0 });

    // Detect touch devices
    useEffect(() => {
        const checkTouchDevice = () => {
            return (
                'ontouchstart' in window ||
                navigator.maxTouchPoints > 0 ||
                (navigator.msMaxTouchPoints && navigator.msMaxTouchPoints > 0)
            );
        };
        
        setIsTouchDevice(checkTouchDevice());
    }, []);

    useEffect(() => {
        // Don't initialize cursor follower on touch devices
        if (isTouchDevice) {
            return;
        }
        const updateCursor = () => {
            // Smooth interpolation for cursor following (easing factor)
            cursorPos.current.x += (mousePos.current.x - cursorPos.current.x) * 0.15;
            cursorPos.current.y += (mousePos.current.y - cursorPos.current.y) * 0.15;

            if (cursorRef.current) {
                cursorRef.current.style.transform = `translate(${cursorPos.current.x}px, ${cursorPos.current.y}px)`;
            }
            
            if (outerRingRef.current) {
                outerRingRef.current.style.transform = `translate(${cursorPos.current.x}px, ${cursorPos.current.y}px)`;
            }

            rafId.current = requestAnimationFrame(updateCursor);
        };

        const handleMouseMove = (e) => {
            mousePos.current.x = e.clientX;
            mousePos.current.y = e.clientY;
            
            if (!isVisible) {
                setIsVisible(true);
                cursorPos.current.x = e.clientX;
                cursorPos.current.y = e.clientY;
            }
        };

        const handleMouseLeave = () => {
            setIsVisible(false);
        };

        const handleMouseEnter = () => {
            setIsVisible(true);
        };

        // Check for hoverable elements
        const handleMouseOver = (e) => {
            const target = e.target;
            const computedStyle = window.getComputedStyle(target);
            const isInteractive = 
                target.tagName === 'A' ||
                target.tagName === 'BUTTON' ||
                target.closest('a') ||
                target.closest('button') ||
                target.closest('[role="button"]') ||
                computedStyle.cursor === 'pointer' ||
                target.closest('[class*="group"]'); // Hover on artwork cards
            
            setIsHovering(isInteractive);
        };

        const handleMouseOut = () => {
            setIsHovering(false);
        };

        // Start animation loop
        rafId.current = requestAnimationFrame(updateCursor);

        window.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseenter', handleMouseEnter);
        document.addEventListener('mouseleave', handleMouseLeave);
        document.addEventListener('mouseover', handleMouseOver);
        document.addEventListener('mouseout', handleMouseOut);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseenter', handleMouseEnter);
            document.removeEventListener('mouseleave', handleMouseLeave);
            document.removeEventListener('mouseover', handleMouseOver);
            document.removeEventListener('mouseout', handleMouseOut);
            if (rafId.current) {
                cancelAnimationFrame(rafId.current);
            }
        };
    }, [isVisible, isTouchDevice]);

    // Don't render on touch devices
    if (isTouchDevice) {
        return null;
    }

    return (
        <>
            {/* Main cursor follower */}
            <div
                ref={cursorRef}
                className={`fixed top-0 left-0 pointer-events-none z-[9999] transition-opacity duration-300 ${
                    isVisible ? 'opacity-100' : 'opacity-0'
                }`}
                style={{
                    willChange: 'transform',
                }}
            >
                <div
                    className={`w-8 h-8 rounded-full border-2 border-[#0A0A0A] transition-all duration-300 ${
                        isHovering 
                            ? 'scale-150 bg-[#0A0A0A]/20 border-[#0A0A0A]' 
                            : 'scale-100 bg-transparent'
                    }`}
                    style={{
                        transform: 'translate(-50%, -50%)',
                    }}
                />
            </div>

            {/* Outer ring for more visual effect */}
            <div
                ref={outerRingRef}
                className={`fixed top-0 left-0 pointer-events-none z-[9998] transition-opacity duration-500 ${
                    isVisible ? 'opacity-30' : 'opacity-0'
                }`}
                style={{
                    willChange: 'transform',
                }}
            >
                <div
                    className={`w-12 h-12 rounded-full border border-[#0A0A0A]/20 transition-all duration-500 ${
                        isHovering ? 'scale-200' : 'scale-100'
                    }`}
                    style={{
                        transform: 'translate(-50%, -50%)',
                    }}
                />
            </div>
        </>
    );
}

