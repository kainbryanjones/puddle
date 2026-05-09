import * as THREE from "three";
import {useFrame} from "@react-three/fiber";
import {useMemo, useRef, type RefObject} from "react";
import env from "@/env.ts";

export const FloorColourTransition = ({
    materialRef,
    queueRef,
}: {
    materialRef: RefObject<THREE.MeshStandardMaterial | null>;
    queueRef: RefObject<string[]>;
}) => {
    const fromColour = useMemo(() => new THREE.Color(), []);
    const toColour = useMemo(() => new THREE.Color(), []);
    const transitionRef = useRef<{startTime: number} | null>(null);

    useFrame(({clock}) => {
        const t = clock.getElapsedTime();
        const material = materialRef.current;
        if (!material) return;

        if (!transitionRef.current && queueRef.current.length > 0) {
            const next = queueRef.current.shift()!;
            fromColour.copy(material.color);
            toColour.set(next);
            transitionRef.current = {startTime: t};
        }

        if (transitionRef.current) {
            const elapsed = t - transitionRef.current.startTime;
            const alpha = Math.min(elapsed / env.VITE_COLOUR_TRANSITION_DURATION, 1);
            material.color.copy(fromColour).lerp(toColour, alpha);
            if (alpha >= 1) {
                transitionRef.current = null;
            }
        }
    });

    return null;
};
