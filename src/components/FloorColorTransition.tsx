import * as THREE from "three";
import {useFrame} from "@react-three/fiber";
import {useMemo, useRef, type RefObject} from "react";
import env from "@/env.ts";

export const FloorColorTransition = ({
    materialRef,
    queueRef,
}: {
    materialRef: RefObject<THREE.MeshStandardMaterial | null>;
    queueRef: RefObject<string[]>;
}) => {
    const fromColor = useMemo(() => new THREE.Color(), []);
    const toColor = useMemo(() => new THREE.Color(), []);
    const transitionRef = useRef<{startTime: number} | null>(null);

    useFrame(({clock}) => {
        const t = clock.getElapsedTime();
        const material = materialRef.current;
        if (!material) return;

        if (!transitionRef.current && queueRef.current.length > 0) {
            const next = queueRef.current.shift()!;
            fromColor.copy(material.color);
            toColor.set(next);
            transitionRef.current = {startTime: t};
        }

        if (transitionRef.current) {
            const elapsed = t - transitionRef.current.startTime;
            const alpha = Math.min(elapsed / env.VITE_COLOR_TRANSITION_DURATION, 1);
            material.color.copy(fromColor).lerp(toColor, alpha);
            if (alpha >= 1) {
                transitionRef.current = null;
            }
        }
    });

    return null;
};
