import { useState, useRef, useCallback } from "react";

import PlatformNavigation from './PlatformNavigation';
import Instructions from './Instructions/Instructions';

import useWindowDimensions from "../hooks/useDementions";

import getOS from "../utils/getOS";

const MOBILE_BREACKPOINT = 768;

const PlatformsInstruction = () => {
    const { width: screenWidth } = useWindowDimensions();

    const [platform, setPlatform] = useState<string>(getOS());
    const articleRef = useRef<HTMLElement>(null);

    const platformHandler = useCallback((platform: string) => {
        setPlatform(platform);

        if (screenWidth < MOBILE_BREACKPOINT) {
            scrollCallback();
        }
    }, []);

    function scrollCallback() {
        if (!articleRef.current) throw Error("articleRef is not assigned");
        articleRef.current.scrollIntoView({ behavior: "smooth" });
    }

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
