export function getActiveWhaleInstance(state) {
    if (state.activeWhales.length === 0) {
        return null;
    }
    const visible = state.activeWhales.find((entry) => entry.visible);
    if (visible) {
        return visible;
    }
    return state.activeWhales[0] ?? null;
}
export function removeWhaleFromActiveList(state, whaleId) {
    state.activeWhales = state.activeWhales.filter((entry) => entry.id !== whaleId);
}
