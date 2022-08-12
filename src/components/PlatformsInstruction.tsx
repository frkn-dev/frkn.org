import { useState, useRef, useCallback } from "react";

import PlatformNavigation from './PlatformNavigation';
import Instructions from './Instructions/Instructions';

import useWindowDimensions from "../hooks/useDementions";

import getOS from "../utils/getOS";
import scrollToElement from "../utils/scrollToElement";

const MOBILE_BREACKPOINT = 768;

const PlatformsInstruction = () => {
    const { width: screenWidth } = useWindowDimensions();

    const [platform, setPlatform] = useState(getOS());
    const articleRef = useRef<HTMLElement>(null);

    const platformHandler = useCallback((platform: string) => {
        setPlatform(platform);

        if (screenWidth < MOBILE_BREACKPOINT && articleRef.current) {
            scrollToElement(articleRef.current);
        }
    }, [screenWidth]);

    return (
        <>
            <PlatformNavigation
                onSetPlatform={platformHandler}
                activePlatform={platform}
            />
            <Instructions platform={platform} refProps={articleRef} />
        </>
    )
};

export default PlatformsInstruction;
