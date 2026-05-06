import {useCallback, useEffect, useRef} from "react";
import {useBoolean} from "usehooks-ts";
import * as Tone from "tone";
import {startAmbience} from "@/domain/playSineWave.ts";

export const useAudioStart = () => {
    const getCtx = () => Tone.getContext().rawContext;

    const loading = useBoolean();
    const started = useBoolean(
        getCtx().state === "running"
    );

    const start = useCallback(async () => {
        loading.setTrue();
        await Tone.start();
        const player = new Tone.Player({
            url: "/sfx/enter.mp3",
            autostart: true,
            onstop: () => {
                loading.setFalse();
                started.setTrue();
                startAmbience();
                player.dispose();
            },
        }).toDestination();
    }, [loading, started]);

    const hasInit = useRef(false);
    useEffect(() => {
        const ctx = getCtx();
        const handler = () => {
            if (hasInit.current) return;
            hasInit.current = true;
            started.setValue(ctx.state === "running");
        };
        ctx.addEventListener("statechange", handler);
        return () => ctx.removeEventListener("statechange", handler);
    }, [started]);

    return [started.value, start, loading.value] as const;
};
