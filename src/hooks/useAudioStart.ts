import {useCallback} from "react";
import {useBoolean} from "usehooks-ts";
import * as Tone from "tone";
import {startAmbience} from "@/domain/playSineWave.ts";

export const useAudioStart = () => {
    const loading = useBoolean();
    const started = useBoolean();

    const start = useCallback(async () => {
        loading.setTrue();
        await Tone.start();
        const destination = Tone.getDestination();
        const targetDb = destination.volume.value;
        destination.volume.value = -60;
        destination.volume.linearRampTo(targetDb, 10);
        const rampFilter = new Tone.Filter({frequency: 300, type: "lowpass"});
        destination.chain(rampFilter);
        rampFilter.frequency.rampTo(Tone.getContext().sampleRate / 2, 10);
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

    return [started.value, start, loading.value] as const;
};
