import { useState, useEffect } from "react";

export const useIterator = <T extends any[]>(data: T = [] as any as T, delay = 5000): T[number] | undefined => {
    const [items, setItems] = useState(data);

    const [idx, setIdx] = useState<null | number>(0);

    useEffect(() => {
        if (items !== data) { setItems(data); }

        if (!items?.length) { return; }

        const intervalCb = setInterval(() => setIdx(prev => ((++prev)) % items.length), delay);

        return () => clearInterval(intervalCb);
    }, [data]);

    if ([null, undefined].includes(idx) || !items?.length) return undefined;

    return items[idx];
};