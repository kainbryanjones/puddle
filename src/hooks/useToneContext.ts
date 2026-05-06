import {useEffect} from "react";
import * as Tone from "tone";
import {useBoolean} from "usehooks-ts";

export const useToneContext = () => {
    const loaded = useBoolean(false);

    useEffect(() => {
        let cancelled = false;
        void Tone.loaded().then(() => {
            if (cancelled) return;
            loaded.setTrue();
        });
        return () => {
            cancelled = true;
        };
    }, [loaded]);

    return loaded.value;
};
