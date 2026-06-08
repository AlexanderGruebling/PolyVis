export function timeFormat(t) {
    const h = Math.floor(t / 3600);
    const m = Math.floor((t % 3600) / 60);
    return `${h}:${m.toString().padStart(2, '0')}`;
}
